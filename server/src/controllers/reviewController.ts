import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, ReviewData } from '../types';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import { EmailService } from '../services/emailService';

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

    return res.json({
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
    return res.status(500).json({
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

    return res.json({
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
    return res.status(500).json({
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
        submission: {
          include: {
            editorAssignments: {
              include: {
                editor: true
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

    // Create timeline entry (using correct Prisma model name)
    // Note: The model is SubmissionTimeline but Prisma client uses camelCase
    // We'll skip this for now and add it in a separate update if needed

    // Send thank you email to reviewer asynchronously
    EmailService.sendReviewThankYou(reviewId).catch(err =>
      console.error('Failed to send review thank you email:', err)
    );

    // Send notification to editors asynchronously
    EmailService.sendReviewCompletedNotification(reviewId).catch(err =>
      console.error('Failed to send review completed notification:', err)
    );

    // Create in-app notifications for editors
    const editors = review.submission.editorAssignments.map(ea => ea.editor);
    for (const editor of editors) {
      await prisma.notification.create({
        data: {
          userId: editor.id,
          type: 'REVIEW_COMPLETED',
          title: 'Review Completed',
          message: `A review has been completed for "${review.submission.title}"`,
          submissionId: review.submissionId
        }
      });
    }

    return res.json({
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
    return res.status(500).json({
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
            },
            revisions: {
              include: {
                files: {
                  select: {
                    id: true,
                    filename: true,
                    originalName: true,
                    fileType: true,
                    fileSize: true,
                    uploadedAt: true
                  }
                }
              },
              orderBy: {
                revisionNumber: 'desc'
              }
            },
            editorAssignments: {
              select: {
                editorId: true
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

    // Allow access if user is the reviewer OR an assigned editor OR an admin
    const isReviewer = review.reviewerId === req.user!.id;
    const isAssignedEditor = review.submission.editorAssignments.some(
      assignment => assignment.editorId === req.user!.id
    );
    const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'EDITOR';

    if (!isReviewer && !isAssignedEditor && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Mask author information for reviewers if double-blind
    const shouldMaskAuthors = isReviewer && review.submission.isDoubleBlind;

    const reviewWithMaskedAuthors = {
      ...review,
      submission: {
        ...review.submission,
        author: shouldMaskAuthors ? null : review.submission.author,
        coAuthors: shouldMaskAuthors ? [] : review.submission.coAuthors
      }
    };

    return res.json({
      success: true,
      data: reviewWithMaskedAuthors
    });
  } catch (error) {
    console.error('Get review error:', error);
    return res.status(500).json({
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

    return res.json({
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
    return res.status(500).json({
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
    console.error('Get pending invitations error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: updatedInvitation,
      message: 'Invitation accepted successfully'
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      data: updatedInvitation,
      message: 'Invitation declined successfully'
    });
  } catch (error) {
    console.error('Decline invitation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Additional endpoints for frontend compatibility
export const getPendingReviews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        reviewerId: req.user!.id,
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      },
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
            coAuthors: true
          }
        }
      }
    });

    const reviewsWithMaskedAuthors = reviews.map(review => ({
      ...review,
      submission: {
        ...review.submission,
        author: review.submission.isDoubleBlind ? null : review.submission.author,
        coAuthors: review.submission.isDoubleBlind ? [] : review.submission.coAuthors
      }
    }));

    return res.json({
      success: true,
      data: reviewsWithMaskedAuthors
    });
  } catch (error) {
    console.error('Get pending reviews error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getCompletedReviews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        reviewerId: req.user!.id,
        status: 'COMPLETED'
      },
      orderBy: { submittedAt: 'desc' },
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
            coAuthors: true
          }
        }
      }
    });

    const reviewsWithMaskedAuthors = reviews.map(review => ({
      ...review,
      submission: {
        ...review.submission,
        author: review.submission.isDoubleBlind ? null : review.submission.author,
        coAuthors: review.submission.isDoubleBlind ? [] : review.submission.coAuthors
      }
    }));

    return res.json({
      success: true,
      data: reviewsWithMaskedAuthors
    });
  } catch (error) {
    console.error('Get completed reviews error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getReviewStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [totalReviews, completedReviews, pendingReviews] = await Promise.all([
      prisma.review.count({
        where: { reviewerId: req.user!.id }
      }),
      prisma.review.count({
        where: {
          reviewerId: req.user!.id,
          status: 'COMPLETED'
        }
      }),
      prisma.review.count({
        where: {
          reviewerId: req.user!.id,
          status: {
            in: ['PENDING', 'IN_PROGRESS']
          }
        }
      })
    ]);

    const completedReviewsData = await prisma.review.findMany({
      where: {
        reviewerId: req.user!.id,
        status: 'COMPLETED',
        rating: { not: null }
      },
      select: {
        rating: true
      }
    });

    const averageRating = completedReviewsData.length > 0
      ? completedReviewsData.reduce((sum, r) => sum + (r.rating || 0), 0) / completedReviewsData.length
      : 0;

    return res.json({
      success: true,
      data: {
        totalReviews,
        completedReviews,
        pendingReviews,
        averageRating: Math.round(averageRating * 10) / 10
      }
    });
  } catch (error) {
    console.error('Get review stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getReviewHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        reviewerId: req.user!.id
      },
      orderBy: { invitedAt: 'desc' },
      include: {
        submission: {
          select: {
            id: true,
            title: true,
            status: true,
            submittedAt: true
          }
        }
      }
    });

    return res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Get review history error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const generateCertificate = async (req: AuthenticatedRequest, res: Response) => {
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

    if (review.reviewerId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (review.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'Review must be completed to generate certificate'
      });
    }

    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Reviewer_Certificate_${reviewId}.pdf`);

    doc.pipe(res);

    // Certificate Border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();
    doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80).stroke();

    // Header
    doc.fontSize(30).font('Helvetica-Bold').text('CERTIFICATE OF REVIEWING', {
      align: 'center',
      underline: true
    });
    doc.moveDown();

    // Content
    doc.fontSize(16).font('Helvetica').text('This certificate is awarded to', {
      align: 'center'
    });
    doc.moveDown();

    doc.fontSize(24).font('Helvetica-Bold').text(`${review.reviewer.firstName} ${review.reviewer.lastName}`, {
      align: 'center'
    });
    doc.moveDown();

    doc.fontSize(16).font('Helvetica').text('in recognition of their contribution as a peer reviewer for', {
      align: 'center'
    });
    doc.moveDown();

    doc.fontSize(20).font('Helvetica-Bold').text(process.env.JOURNAL_NAME || 'GEMIJ Journal', {
      align: 'center'
    });
    doc.moveDown();

    doc.fontSize(14).font('Helvetica').text(`Manuscript Title: ${review.submission.title}`, {
      align: 'center'
    });
    doc.moveDown();

    doc.fontSize(14).text(`Date of Review: ${review.submittedAt ? new Date(review.submittedAt).toLocaleDateString() : new Date().toLocaleDateString()}`, {
      align: 'center'
    });
    doc.moveDown(2);

    // Signature (Placeholder)
    doc.fontSize(12).text('_________________________', { align: 'center' });
    doc.text('Editor-in-Chief', { align: 'center' });

    doc.end();
    return res;

  } catch (error) {
    console.error('Generate certificate error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
};