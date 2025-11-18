import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { z } from 'zod';

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
      where.editorAssignments = {
        some: {
          editorId: req.user!.id
        }
      };
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

    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'UNDER_REVIEW'
      }
    });

    res.json({
      success: true,
      data: review,
      message: 'Reviewer assigned successfully'
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