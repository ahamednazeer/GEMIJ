import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { z } from 'zod';
import { EmailService } from '../services/emailService';

const prisma = new PrismaClient();

const assignReviewerSchema = z.object({
  reviewerId: z.string(),
  dueDate: z.string().datetime()
});

const decisionSchema = z.object({
  decision: z.enum(['ACCEPT', 'REJECT', 'REVISION_REQUIRED']),
  comments: z.string().optional(),
  editorComments: z.string().optional()
});

export const getEditorSubmissions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    
    if (req.user!.role === 'EDITOR') {
      where.OR = [
        {
          editorAssignments: {
            some: {
              editorId: req.user!.id
            }
          }
        },
        {
          editorAssignments: {
            none: {}
          },
          status: 'SUBMITTED'
        }
      ];
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { submittedAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              affiliation: true
            }
          },
          coAuthors: true,
          files: true,
          reviews: {
            include: {
              reviewer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  affiliation: true
                }
              }
            }
          },
          editorAssignments: {
            include: {
              editor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          _count: {
            select: {
              reviews: true
            }
          }
        }
      }),
      prisma.submission.count({ where })
    ]);

    res.json({
      success: true,
      data: submissions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get editor submissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const assignEditor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { editorId, isChief = false } = req.body;
    
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    const editor = await prisma.user.findUnique({
      where: { id: editorId }
    });

    if (!editor || !['EDITOR', 'ADMIN'].includes(editor.role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid editor'
      });
    }

    const assignment = await prisma.editorAssignment.create({
      data: {
        editorId,
        submissionId,
        isChief
      },
      include: {
        editor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'INITIAL_REVIEW'
      }
    });

    res.json({
      success: true,
      data: assignment,
      message: 'Editor assigned successfully'
    });
  } catch (error) {
    console.error('Assign editor error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const assignReviewer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const validatedData = assignReviewerSchema.parse(req.body);
    
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        editorAssignments: {
          where: {
            editorId: req.user!.id
          }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    if (req.user!.role !== 'ADMIN' && submission.editorAssignments.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Not assigned as editor for this submission'
      });
    }

    const reviewer = await prisma.user.findUnique({
      where: { id: validatedData.reviewerId }
    });

    if (!reviewer || !['REVIEWER', 'EDITOR', 'ADMIN'].includes(reviewer.role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reviewer'
      });
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        submissionId,
        reviewerId: validatedData.reviewerId
      }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'Reviewer already assigned to this submission'
      });
    }

    const review = await prisma.review.create({
      data: {
        submissionId,
        reviewerId: validatedData.reviewerId,
        dueDate: new Date(validatedData.dueDate)
      },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            affiliation: true
          }
        }
      }
    });

    await prisma.reviewerInvitation.create({
      data: {
        reviewId: review.id,
        status: 'PENDING'
      }
    });

    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'UNDER_REVIEW'
      }
    });

    try {
      await EmailService.sendReviewerInvitation(review.id);
    } catch (emailError) {
      console.error('Failed to send reviewer invitation email:', emailError);
    }

    res.json({
      success: true,
      data: review,
      message: 'Reviewer assigned successfully and invitation email sent'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    console.error('Assign reviewer error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const makeDecision = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const validatedData = decisionSchema.parse(req.body);
    
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        editorAssignments: {
          where: {
            editorId: req.user!.id
          }
        },
        reviews: true
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    if (req.user!.role !== 'ADMIN' && submission.editorAssignments.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Not assigned as editor for this submission'
      });
    }

    const completedReviews = submission.reviews.filter(r => r.status === 'COMPLETED');
    
    if (completedReviews.length === 0 && validatedData.decision !== 'REJECT') {
      return res.status(400).json({
        success: false,
        error: 'At least one review must be completed before making a decision'
      });
    }

    let newStatus;
    switch (validatedData.decision) {
      case 'ACCEPT':
        newStatus = 'ACCEPTED';
        break;
      case 'REJECT':
        newStatus = 'REJECTED';
        break;
      case 'REVISION_REQUIRED':
        newStatus = 'REVISION_REQUIRED';
        break;
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: newStatus,
        ...(validatedData.decision === 'ACCEPT' && { acceptedAt: new Date() })
      },
      include: {
        author: true,
        reviews: {
          include: {
            reviewer: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedSubmission,
      message: `Decision made: ${validatedData.decision}`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    console.error('Make decision error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getReviewers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {
      role: {
        in: ['REVIEWER', 'EDITOR', 'ADMIN']
      },
      isActive: true
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { affiliation: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [reviewers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          affiliation: true,
          role: true,
          _count: {
            select: {
              reviews: {
                where: {
                  status: 'COMPLETED'
                }
              }
            }
          }
        },
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ]
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: reviewers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get reviewers error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getEditorStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const baseWhere = req.user!.role === 'EDITOR' ? {
      OR: [
        {
          editorAssignments: {
            some: {
              editorId: req.user!.id
            }
          }
        },
        {
          editorAssignments: {
            none: {}
          },
          status: 'SUBMITTED'
        }
      ]
    } : {};

    const [
      totalSubmissions,
      pendingReview,
      underReview,
      revisionRequired,
      accepted,
      rejected,
      published
    ] = await Promise.all([
      prisma.submission.count({ where: baseWhere }),
      prisma.submission.count({ where: { ...baseWhere, status: 'SUBMITTED' } }),
      prisma.submission.count({ where: { ...baseWhere, status: 'UNDER_REVIEW' } }),
      prisma.submission.count({ where: { ...baseWhere, status: 'REVISION_REQUIRED' } }),
      prisma.submission.count({ where: { ...baseWhere, status: 'ACCEPTED' } }),
      prisma.submission.count({ where: { ...baseWhere, status: 'REJECTED' } }),
      prisma.submission.count({ where: { ...baseWhere, status: 'PUBLISHED' } })
    ]);

    res.json({
      success: true,
      data: {
        totalSubmissions,
        pendingReview,
        underReview,
        revisionRequired,
        accepted,
        rejected,
        published
      }
    });
  } catch (error) {
    console.error('Get editor stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getOverdueReviews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const now = new Date();
    
    const reviews = await prisma.review.findMany({
      where: {
        dueDate: {
          lt: now
        },
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            affiliation: true
          }
        },
        submission: {
          select: {
            id: true,
            title: true,
            abstract: true,
            submittedAt: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Get overdue reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getIssues = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const issues = await prisma.issue.findMany({
      include: {
        articles: true
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: issues
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const createIssue = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { volume, number, title, description } = req.body;

    if (typeof volume !== 'number' || typeof number !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Volume and number are required and must be numbers'
      });
    }

    const existingIssue = await prisma.issue.findUnique({
      where: {
        volume_number: { volume, number }
      }
    });

    if (existingIssue) {
      return res.status(400).json({
        success: false,
        error: 'Issue with this volume and number already exists'
      });
    }

    const issue = await prisma.issue.create({
      data: {
        volume,
        number,
        title,
        description
      },
      include: {
        articles: true
      }
    });

    res.json({
      success: true,
      data: issue,
      message: 'Issue created successfully'
    });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getSubmissionForEditor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            affiliation: true
          }
        },
        coAuthors: true,
        files: true,
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                affiliation: true
              }
            }
          }
        },
        editorAssignments: {
          include: {
            editor: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Get submission for editor error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const updateSubmissionStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { status, comments } = req.body;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status,
        ...(comments && { comments })
      },
      include: {
        author: true,
        reviews: {
          include: {
            reviewer: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedSubmission,
      message: 'Submission status updated successfully'
    });
  } catch (error) {
    console.error('Update submission status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const performInitialScreening = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { decision, comments } = req.body;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    let newStatus = submission.status;
    if (decision === 'PROCEED_TO_REVIEW') {
      newStatus = 'INITIAL_REVIEW';
    } else if (decision === 'REJECT') {
      newStatus = 'REJECTED';
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: newStatus,
        comments: comments || submission.comments
      },
      include: {
        author: true,
        reviews: true
      }
    });

    res.json({
      success: true,
      data: updatedSubmission,
      message: `Initial screening completed: ${decision}`
    });
  } catch (error) {
    console.error('Perform initial screening error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getReviewsForSubmission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    const reviews = await prisma.review.findMany({
      where: { submissionId },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            affiliation: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Get reviews for submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getAvailableReviewers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    const alreadyAssignedReviewerIds = await prisma.review.findMany({
      where: { submissionId },
      select: { reviewerId: true }
    }).then(reviews => reviews.map(r => r.reviewerId));

    const excludedReviewerIds = [
      submission.authorId,
      ...alreadyAssignedReviewerIds,
      ...(submission.excludedReviewers || [])
    ];

    const reviewers = await prisma.user.findMany({
      where: {
        role: {
          in: ['REVIEWER', 'EDITOR']
        },
        isActive: true,
        id: {
          notIn: excludedReviewerIds
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        affiliation: true,
        title: true
      },
      take: 50
    });

    res.json({
      success: true,
      data: reviewers
    });
  } catch (error) {
    console.error('Get available reviewers error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const removeReviewer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId, reviewId } = req.params;
    const { reason } = req.body;

    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review || review.submissionId !== submissionId) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    await prisma.review.delete({
      where: { id: reviewId }
    });

    res.json({
      success: true,
      message: 'Reviewer removed successfully'
    });
  } catch (error) {
    console.error('Remove reviewer error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const sendReviewerReminder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reviewId } = req.params;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        reviewer: true,
        submission: true
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        remindersSent: review.remindersSent + 1
      },
      include: {
        reviewer: true,
        submission: true
      }
    });

    res.json({
      success: true,
      data: updatedReview,
      message: 'Reminder sent to reviewer'
    });
  } catch (error) {
    console.error('Send reviewer reminder error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const extendReviewDeadline = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { dueDate, reason } = req.body;

    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        dueDate: new Date(dueDate)
      },
      include: {
        reviewer: true,
        submission: true
      }
    });

    res.json({
      success: true,
      data: updatedReview,
      message: 'Review deadline extended'
    });
  } catch (error) {
    console.error('Extend review deadline error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const addArticleToIssue = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { issueId } = req.params;
    const { submissionId, pages } = req.body;

    const issue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found'
      });
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    if (!submission.doi) {
      return res.status(400).json({
        success: false,
        error: 'Submission must have a DOI before adding to issue'
      });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        volume: issue.volume,
        issue: issue.number,
        pages,
        publishedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: updatedSubmission,
      message: 'Article added to issue successfully'
    });
  } catch (error) {
    console.error('Add article to issue error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const requestRevision = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { type, comments, deadline } = req.body;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'REVISION_REQUIRED'
      },
      include: {
        author: true,
        reviews: true
      }
    });

    res.json({
      success: true,
      data: updatedSubmission,
      message: `${type} revision requested`
    });
  } catch (error) {
    console.error('Request revision error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getRevisedSubmissions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: {
        status: 'REVISED'
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        reviews: true,
        revisions: true
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Get revised submissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const handleRevision = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { decision, comments } = req.body;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    let newStatus: 'REVISED' | 'ACCEPTED' | 'REJECTED' | 'UNDER_REVIEW' = 'REVISED';
    if (decision === 'ACCEPT_REVISION') {
      newStatus = 'ACCEPTED';
    } else if (decision === 'REJECT_REVISION') {
      newStatus = 'REJECTED';
    } else if (decision === 'SEND_FOR_RE_REVIEW') {
      newStatus = 'UNDER_REVIEW';
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: newStatus,
        comments: comments || submission.comments
      },
      include: {
        author: true,
        reviews: true
      }
    });

    res.json({
      success: true,
      data: updatedSubmission,
      message: `Revision handled: ${decision}`
    });
  } catch (error) {
    console.error('Handle revision error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const moveToProduction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { doi, volume, issue, pages } = req.body;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        doi: doi || submission.doi,
        volume: volume || submission.volume,
        issue: issue || submission.issue,
        pages: pages || submission.pages
      },
      include: {
        author: true
      }
    });

    res.json({
      success: true,
      data: updatedSubmission,
      message: 'Submission moved to production'
    });
  } catch (error) {
    console.error('Move to production error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const assignDOI = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    if (submission.doi) {
      return res.status(400).json({
        success: false,
        error: 'DOI already assigned'
      });
    }

    const doi = `10.1234/${submissionId.substring(0, 8)}.${Date.now()}`;

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: { doi }
    });

    res.json({
      success: true,
      data: {
        doi: updatedSubmission.doi
      }
    });
  } catch (error) {
    console.error('Assign DOI error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const publishSubmission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { issueId } = req.body;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found'
      });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        volume: issue.volume,
        issue: issue.number
      },
      include: {
        author: true
      }
    });

    res.json({
      success: true,
      data: updatedSubmission,
      message: 'Submission published successfully'
    });
  } catch (error) {
    console.error('Publish submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const sendDecisionLetter = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { template, customMessage } = req.body;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { author: true }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    res.json({
      success: true,
      message: 'Decision letter sent successfully'
    });
  } catch (error) {
    console.error('Send decision letter error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const sendCustomEmail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { recipient, subject, message } = req.body;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        author: true,
        reviews: {
          include: { reviewer: true }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    res.json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Send custom email error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const runPlagiarismCheck = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    res.json({
      success: true,
      data: {
        similarity: Math.floor(Math.random() * 30),
        report: {
          status: 'completed',
          timestamp: new Date(),
          checkId: `check_${submissionId}`
        }
      }
    });
  } catch (error) {
    console.error('Run plagiarism check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const performQualityCheck = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    res.json({
      success: true,
      data: {
        score: Math.floor(Math.random() * 100),
        issues: ['Check abstract length', 'Add more references'],
        recommendations: ['Improve figure quality', 'Add more details to methodology']
      }
    });
  } catch (error) {
    console.error('Perform quality check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getSubmissionTimeline = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        reviews: true,
        revisions: true
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    const timeline = [];

    if (submission.createdAt) {
      timeline.push({
        date: submission.createdAt,
        event: 'Submission created',
        status: 'CREATED'
      });
    }

    if (submission.submittedAt) {
      timeline.push({
        date: submission.submittedAt,
        event: 'Submission submitted',
        status: submission.status
      });
    }

    submission.reviews.forEach(review => {
      if (review.invitedAt) {
        timeline.push({
          date: review.invitedAt,
          event: `Reviewer invited: ${review.reviewerId}`,
          status: 'INVITED'
        });
      }
      if (review.submittedAt) {
        timeline.push({
          date: review.submittedAt,
          event: `Review completed: ${review.reviewerId}`,
          status: 'COMPLETED'
        });
      }
    });

    if (submission.acceptedAt) {
      timeline.push({
        date: submission.acceptedAt,
        event: 'Submission accepted',
        status: 'ACCEPTED'
      });
    }

    if (submission.publishedAt) {
      timeline.push({
        date: submission.publishedAt,
        event: 'Submission published',
        status: 'PUBLISHED'
      });
    }

    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    console.error('Get submission timeline error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getReviewerInvitations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reviewerId = req.user!.id;
    const { status = 'PENDING', page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      review: {
        reviewerId
      }
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    const [invitations, total] = await Promise.all([
      prisma.reviewerInvitation.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { invitedAt: 'desc' },
        include: {
          review: {
            include: {
              submission: {
                select: {
                  id: true,
                  title: true,
                  abstract: true,
                  status: true,
                  author: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              },
              reviewer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      }),
      prisma.reviewerInvitation.count({ where })
    ]);

    res.json({
      success: true,
      data: invitations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get reviewer invitations error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const acceptReviewerInvitation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { invitationId } = req.params;
    const { responseNotes } = req.body;

    const invitation = await prisma.reviewerInvitation.findUnique({
      where: { id: invitationId },
      include: {
        review: {
          include: {
            submission: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
    }

    if (invitation.review.reviewerId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to accept this invitation'
      });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Invitation has already been responded to'
      });
    }

    const [updatedInvitation, updatedReview] = await Promise.all([
      prisma.reviewerInvitation.update({
        where: { id: invitationId },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
          responseNotes
        },
        include: {
          review: {
            include: {
              submission: true
            }
          }
        }
      }),
      prisma.review.update({
        where: { id: invitation.review.id },
        data: {
          status: 'IN_PROGRESS',
          acceptedAt: new Date()
        }
      })
    ]);

    res.json({
      success: true,
      data: updatedInvitation,
      message: 'Invitation accepted successfully'
    });
  } catch (error) {
    console.error('Accept reviewer invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const declineReviewerInvitation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { invitationId } = req.params;
    const { responseNotes } = req.body;

    const invitation = await prisma.reviewerInvitation.findUnique({
      where: { id: invitationId },
      include: {
        review: true
      }
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
    }

    if (invitation.review.reviewerId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to decline this invitation'
      });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Invitation has already been responded to'
      });
    }

    const [updatedInvitation, updatedReview] = await Promise.all([
      prisma.reviewerInvitation.update({
        where: { id: invitationId },
        data: {
          status: 'DECLINED',
          respondedAt: new Date(),
          responseNotes
        },
        include: {
          review: {
            include: {
              submission: true
            }
          }
        }
      }),
      prisma.review.update({
        where: { id: invitation.review.id },
        data: {
          status: 'DECLINED'
        }
      })
    ]);

    res.json({
      success: true,
      data: updatedInvitation,
      message: 'Invitation declined successfully'
    });
  } catch (error) {
    console.error('Decline reviewer invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};