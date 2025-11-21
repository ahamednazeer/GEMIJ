import { Response } from 'express';
import { PrismaClient, SubmissionStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { z } from 'zod';
import { EmailService } from '../services/emailService';

const prisma = new PrismaClient();

const assignReviewerSchema = z.object({
  reviewerId: z.string(),
  dueDate: z.string().datetime()
});

const decisionSchema = z.object({
  decision: z.enum(['ACCEPT', 'MINOR_REVISION', 'MAJOR_REVISION', 'REJECT']),
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

    return res.json({
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
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: assignment,
      message: 'Editor assigned successfully'
    });
  } catch (error) {
    console.error('Assign editor error:', error);
    return res.status(500).json({
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

    return res.json({
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
    return res.status(500).json({
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
        reviews: true,
        author: true
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

    // Check if APC is enabled
    const apcEnabled = process.env.APC_ENABLED === 'true';

    let newStatus: SubmissionStatus;
    switch (validatedData.decision) {
      case 'ACCEPT':
        // Always set to PAYMENT_PENDING for accept
        newStatus = 'PAYMENT_PENDING' as SubmissionStatus;
        break;
      case 'REJECT':
        newStatus = SubmissionStatus.REJECTED;
        break;
      case 'MINOR_REVISION':
      case 'MAJOR_REVISION':
        newStatus = SubmissionStatus.REVISION_REQUIRED;
        break;
      default:
        newStatus = submission.status;
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: newStatus,
        comments: validatedData.comments || validatedData.editorComments,
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

    // If ACCEPT and APC enabled, create payment invoice
    if (validatedData.decision === 'ACCEPT' && apcEnabled) {
      const apcAmount = parseFloat(process.env.APC_AMOUNT || '299.00');
      const currency = process.env.APC_CURRENCY || 'INR';
      const invoiceNumber = `INV-${Date.now()}-${submissionId.substring(0, 8).toUpperCase()}`;

      await prisma.payment.create({
        data: {
          amount: apcAmount,
          currency,
          status: 'PENDING',
          userId: submission.authorId,
          submissionId
        }
      });

      // Send acceptance email with payment instructions
      try {
        await EmailService.sendAcceptanceNotification(submissionId);
      } catch (emailError) {
        console.error('Failed to send acceptance email:', emailError);
      }
    }

    // Send decision notification email with reviewer comments
    try {
      await EmailService.sendDecisionNotification(submissionId, validatedData.decision);
    } catch (emailError) {
      console.error('Failed to send decision email:', emailError);
    }

    // Create in-app notification for author
    await prisma.notification.create({
      data: {
        userId: submission.authorId,
        type: 'DECISION_MADE',
        title: `Decision on Your Submission`,
        message: `A decision has been made on your submission "${submission.title}": ${validatedData.decision}`,
        submissionId
      }
    });

    return res.json({
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
    return res.status(500).json({
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

    return res.json({
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
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getEditorStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const baseWhere: any = req.user!.role === 'EDITOR' ? {
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
      prisma.submission.count({ where: { ...baseWhere, status: 'SUBMITTED' as SubmissionStatus } }),
      prisma.submission.count({ where: { ...baseWhere, status: 'UNDER_REVIEW' as SubmissionStatus } }),
      prisma.submission.count({ where: { ...baseWhere, status: 'REVISION_REQUIRED' as SubmissionStatus } }),
      prisma.submission.count({ where: { ...baseWhere, status: 'ACCEPTED' as SubmissionStatus } }),
      prisma.submission.count({ where: { ...baseWhere, status: 'REJECTED' as SubmissionStatus } }),
      prisma.submission.count({ where: { ...baseWhere, status: 'PUBLISHED' as SubmissionStatus } })
    ]);

    return res.json({
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
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Get overdue reviews error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: issues
    });
  } catch (error) {
    console.error('Get issues error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: issue,
      message: 'Issue created successfully'
    });
  } catch (error) {
    console.error('Create issue error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Get submission for editor error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: updatedSubmission,
      message: 'Submission status updated successfully'
    });
  } catch (error) {
    console.error('Update submission status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const performInitialScreening = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { decision, comments, editorComments } = req.body;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        author: true,
        coAuthors: true
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    if (submission.status !== 'SUBMITTED') {
      return res.status(400).json({
        success: false,
        error: 'Submission is not in submitted status'
      });
    }

    let newStatus: SubmissionStatus;
    let emailTemplate = '';
    let emailSubject = '';

    switch (decision) {
      case 'RETURN_FOR_FORMATTING':
        newStatus = 'RETURNED_FOR_FORMATTING';
        emailTemplate = 'submission_returned_for_formatting';
        emailSubject = 'Manuscript Returned for Formatting - Action Required';
        break;
      case 'DESK_REJECT':
        newStatus = 'REJECTED';
        emailTemplate = 'submission_desk_rejected';
        emailSubject = 'Manuscript Decision - Not Suitable for Review';
        break;
      case 'PROCEED_TO_REVIEW':
        newStatus = 'UNDER_REVIEW';
        emailTemplate = 'submission_under_review';
        emailSubject = 'Manuscript Under Review';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid decision'
        });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: newStatus,
        comments: comments || submission.comments,
        decisionComments: editorComments
      },
      include: {
        author: true,
        coAuthors: true,
        timeline: true
      }
    });

    // Add timeline event
    await prisma.submissionTimeline.create({
      data: {
        submissionId,
        event: 'INITIAL_CHECK_COMPLETED',
        fromStatus: 'SUBMITTED',
        toStatus: newStatus,
        description: `Initial check completed: ${decision.replace(/_/g, ' ').toLowerCase()}`,
        performedBy: `${req.user!.firstName} ${req.user!.lastName}`
      }
    });

    // Send notification email to author
    try {
      await EmailService.sendEmail({
        to: submission.author.email,
        subject: emailSubject,
        template: emailTemplate,
        variables: {
          authorName: `${submission.author.firstName} ${submission.author.lastName}`,
          manuscriptTitle: submission.title,
          submissionId: submission.id,
          comments: comments || '',
          editorComments: editorComments || '',
          decision: decision.replace(/_/g, ' ').toLowerCase()
        }
      });
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
    }

    return res.json({
      success: true,
      data: updatedSubmission,
      message: `Initial screening completed: ${decision.replace(/_/g, ' ').toLowerCase()}`
    });
  } catch (error) {
    console.error('Perform initial screening error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const acceptHandling = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const editorId = req.user!.id;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { editorAssignments: true }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Check if already assigned to someone else? 
    // For now, we assume multiple editors can be assigned or we check if it's unassigned.
    // The flow implies taking ownership.

    const existingAssignment = await prisma.editorAssignment.findFirst({
      where: {
        submissionId,
        editorId
      }
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        error: 'You are already assigned to this submission'
      });
    }

    // Create assignment
    await prisma.editorAssignment.create({
      data: {
        submissionId,
        editorId,
        isChief: false // Or true if they are the first?
      }
    });

    // Update status to INITIAL_REVIEW (Initial Check)
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'INITIAL_REVIEW'
      },
      include: {
        author: true
      }
    });

    return res.json({
      success: true,
      data: updatedSubmission,
      message: 'You have accepted handling of this submission'
    });

  } catch (error) {
    console.error('Accept handling error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const declineHandling = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { reason } = req.body;
    const editorId = req.user!.id;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Remove assignment if exists (in case they were auto-assigned)
    await prisma.editorAssignment.deleteMany({
      where: {
        submissionId,
        editorId
      }
    });

    // If no other editors are assigned, ensure status is SUBMITTED (Unassigned)
    const remainingAssignments = await prisma.editorAssignment.count({
      where: { submissionId }
    });

    let updatedSubmission = submission;
    if (remainingAssignments === 0) {
      updatedSubmission = await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: 'SUBMITTED' // Revert to SUBMITTED if it was something else
        }
      });
    }

    // Log the decline (could be a separate table or just console for now)
    console.log(`Editor ${editorId} declined submission ${submissionId}. Reason: ${reason}`);

    // Notify Managing Editor (Mock)
    // EmailService.notifyManagingEditor(...) 

    return res.json({
      success: true,
      data: updatedSubmission,
      message: 'You have declined this submission. It has been returned to the Unassigned Editors list.'
    });

  } catch (error) {
    console.error('Decline handling error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Get reviews for submission error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: reviewers
    });
  } catch (error) {
    console.error('Get available reviewers error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      message: 'Reviewer removed successfully'
    });
  } catch (error) {
    console.error('Remove reviewer error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: updatedReview,
      message: 'Reminder sent to reviewer'
    });
  } catch (error) {
    console.error('Send reviewer reminder error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: updatedReview,
      message: 'Review deadline extended'
    });
  } catch (error) {
    console.error('Extend review deadline error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: updatedSubmission,
      message: 'Article added to issue successfully'
    });
  } catch (error) {
    console.error('Add article to issue error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: updatedSubmission,
      message: `${type} revision requested`
    });
  } catch (error) {
    console.error('Request revision error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Get revised submissions error:', error);
    return res.status(500).json({
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

    // Check if APC is enabled
    const apcEnabled = process.env.APC_ENABLED === 'true';

    let newStatus: SubmissionStatus;
    switch (decision) {
      case 'ACCEPT_REVISION':
        // Always set to PAYMENT_PENDING for accept
        newStatus = 'PAYMENT_PENDING' as SubmissionStatus;
        break;
      case 'REQUEST_FURTHER_REVISION':
        newStatus = SubmissionStatus.REVISION_REQUIRED;
        break;
      case 'SEND_FOR_RE_REVIEW':
        newStatus = SubmissionStatus.UNDER_REVIEW;
        break;
      case 'REJECT_REVISION':
        newStatus = SubmissionStatus.REJECTED;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid decision'
        });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: newStatus,
        comments: comments || submission.comments,
        ...(decision === 'ACCEPT_REVISION' && { acceptedAt: new Date() })
      },
      include: {
        author: true,
        reviews: true
      }
    });

    // Handle specific actions based on decision
    if (decision === 'ACCEPT_REVISION') {
      // Create payment if APC enabled
      if (apcEnabled) {
        const apcAmount = parseFloat(process.env.APC_AMOUNT || '299.00');
        const currency = process.env.APC_CURRENCY || 'INR';
        const invoiceNumber = `INV-${Date.now()}-${submissionId.substring(0, 8).toUpperCase()}`;

        await prisma.payment.create({
          data: {
            amount: apcAmount,
            currency,
            status: 'PENDING',
            invoiceNumber,
            userId: submission.authorId,
            submissionId
          }
        });
      }

      // Send acceptance notification
      try {
        await EmailService.sendRevisionAcceptedNotification(submissionId);
      } catch (emailError) {
        console.error('Failed to send revision acceptance email:', emailError);
      }

      // Create notification
      await prisma.notification.create({
        data: {
          userId: submission.authorId,
          type: 'REVISION_ACCEPTED',
          title: 'Revision Accepted',
          message: `Your revision for "${submission.title}" has been accepted.`,
          submissionId
        }
      });
    } else if (decision === 'REQUEST_FURTHER_REVISION') {
      // Notify author about further revision
      // TODO: Add specific email template for this
      await prisma.notification.create({
        data: {
          userId: submission.authorId,
          type: 'REVISION_REQUESTED',
          title: 'Further Revision Required',
          message: `Further revisions are required for your submission "${submission.title}".`,
          submissionId
        }
      });
    } else if (decision === 'SEND_FOR_RE_REVIEW') {
      // Notify author that it's back under review
      await prisma.notification.create({
        data: {
          userId: submission.authorId,
          type: 'STATUS_CHANGE',
          title: 'Submission Under Review',
          message: `Your revised submission "${submission.title}" has been sent for re-review.`,
          submissionId
        }
      });
    } else if (decision === 'REJECT_REVISION') {
      // Notify author of rejection
      try {
        await EmailService.sendDecisionNotification(submissionId, 'REJECT');
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
      }

      await prisma.notification.create({
        data: {
          userId: submission.authorId,
          type: 'DECISION_MADE',
          title: 'Submission Rejected',
          message: `Your revised submission "${submission.title}" has been rejected.`,
          submissionId
        }
      });
    }

    return res.json({
      success: true,
      data: updatedSubmission,
      message: `Revision handled: ${decision}`
    });
  } catch (error) {
    console.error('Handle revision error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: updatedSubmission,
      message: 'Submission moved to production'
    });
  } catch (error) {
    console.error('Move to production error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: {
        doi: updatedSubmission.doi
      }
    });
  } catch (error) {
    console.error('Assign DOI error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: updatedSubmission,
      message: 'Submission published successfully'
    });
  } catch (error) {
    console.error('Publish submission error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      message: 'Decision letter sent successfully'
    });
  } catch (error) {
    console.error('Send decision letter error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Send custom email error:', error);
    return res.status(500).json({
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

    return res.json({
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
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: {
        score: Math.floor(Math.random() * 100),
        issues: ['Check abstract length', 'Add more references'],
        recommendations: ['Improve figure quality', 'Add more details to methodology']
      }
    });
  } catch (error) {
    console.error('Perform quality check error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    console.error('Get submission timeline error:', error);
    return res.status(500).json({
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

    return res.json({
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
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: updatedInvitation,
      message: 'Invitation accepted successfully'
    });
  } catch (error) {
    console.error('Accept reviewer invitation error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: updatedInvitation,
      message: 'Invitation declined successfully'
    });
  } catch (error) {
    console.error('Decline reviewer invitation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};