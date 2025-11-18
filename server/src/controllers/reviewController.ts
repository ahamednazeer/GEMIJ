import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, ReviewData } from '../types';
import { z } from 'zod';

const prisma = new PrismaClient();

const reviewSchema = z.object({
  recommendation: z.enum(['ACCEPT', 'MINOR_REVISION', 'MAJOR_REVISION', 'REJECT']),
  confidentialComments: z.string().optional(),
  authorComments: z.string().min(1),
  rating: z.number().min(1).max(5).optional()
});

const reviewResponseSchema = z.object({
  accept: z.boolean()
});

export const getReviewInvitations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {
      reviewerId: req.user!.id
    };
    
    if (status && status !== 'all') {
      where.status = status;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { invitedAt: 'desc' },
        include: {
          submission: {
            select: {
              id: true,
              title: true,
              abstract: true,
              keywords: true,
              manuscriptType: true,
              isDoubleBlind: true,
              submittedAt: true,
              status: true,
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  affiliation: true
                }
              },
              coAuthors: true,
              files: {
                select: {
                  id: true,
                  filename: true,
                  originalName: true,
                  fileType: true,
                  fileSize: true,
                  isMainFile: true
                }
              }
            }
          }
        }
      }),
      prisma.review.count({ where })
    ]);

    const reviewsWithMaskedAuthors = reviews.map(review => ({
      ...review,
      submission: {
        ...review.submission,
        author: review.submission.isDoubleBlind ? null : review.submission.author,
        coAuthors: review.submission.isDoubleBlind ? [] : review.submission.coAuthors
      }
    }));

    res.json({
      success: true,
      data: reviewsWithMaskedAuthors,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get review invitations error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const respondToInvitation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    const validatedData = reviewResponseSchema.parse(req.body);
    
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review invitation not found'
      });
    }

    if (review.reviewerId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (review.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Review invitation already responded to'
      });
    }

    const newStatus = validatedData.accept ? 'IN_PROGRESS' : 'DECLINED';
    const acceptedAt = validatedData.accept ? new Date() : null;

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        status: newStatus,
        acceptedAt
      },
      include: {
        submission: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedReview,
      message: validatedData.accept ? 'Review invitation accepted' : 'Review invitation declined'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    console.error('Respond to invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const submitReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    const validatedData = reviewSchema.parse(req.body);
    
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        submission: true
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    if (review.reviewerId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (review.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        error: 'Review is not in progress'
      });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...validatedData,
        status: 'COMPLETED',
        submittedAt: new Date()
      },
      include: {
        submission: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    const allReviews = await prisma.review.findMany({
      where: {
        submissionId: review.submissionId
      }
    });

    const completedReviews = allReviews.filter(r => r.status === 'COMPLETED');
    const pendingReviews = allReviews.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS');

    if (completedReviews.length >= 2 || pendingReviews.length === 0) {
      await prisma.submission.update({
        where: { id: review.submissionId },
        data: {
          status: 'UNDER_REVIEW'
        }
      });
    }

    res.json({
      success: true,
      data: updatedReview,
      message: 'Review submitted successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    console.error('Submit review error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        submission: {
          select: {
            id: true,
            title: true,
            abstract: true,
            keywords: true,
            manuscriptType: true,
            isDoubleBlind: true,
            submittedAt: true,
            status: true,
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                affiliation: true
              }
            },
            coAuthors: true,
            files: {
              select: {
                id: true,
                filename: true,
                originalName: true,
                fileType: true,
                fileSize: true,
                isMainFile: true
              }
            }
          }
        }
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    if (review.reviewerId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const reviewWithMaskedAuthors = {
      ...review,
      submission: {
        ...review.submission,
        author: review.submission.isDoubleBlind ? null : review.submission.author,
        coAuthors: review.submission.isDoubleBlind ? [] : review.submission.coAuthors
      }
    };

    res.json({
      success: true,
      data: reviewWithMaskedAuthors
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const updateReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    const validatedData = reviewSchema.partial().parse(req.body);
    
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    if (review.reviewerId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (review.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update completed review'
      });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: validatedData
    });

    res.json({
      success: true,
      data: updatedReview,
      message: 'Review updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getPendingInvitations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reviewerId = req.user!.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [invitations, total] = await Promise.all([
      prisma.reviewerInvitation.findMany({
        where: {
          status: 'PENDING',
          review: {
            reviewerId
          }
        },
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
              }
            }
          }
        }
      }),
      prisma.reviewerInvitation.count({
        where: {
          status: 'PENDING',
          review: {
            reviewerId
          }
        }
      })
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
    console.error('Get pending invitations error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const acceptInvitation = async (req: AuthenticatedRequest, res: Response) => {
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
        error: 'Not authorized to accept this invitation'
      });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Invitation has already been responded to'
      });
    }

    const [updatedInvitation] = await Promise.all([
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
    console.error('Accept invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const declineInvitation = async (req: AuthenticatedRequest, res: Response) => {
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

    const [updatedInvitation] = await Promise.all([
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
    console.error('Decline invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};