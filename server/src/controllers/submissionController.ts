import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, SubmissionData, PaginationParams } from '../types';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const prisma = new PrismaClient();

const submissionSchema = z.object({
  title: z.string().min(1),
  abstract: z.string().min(1),
  keywords: z.array(z.string()),
  manuscriptType: z.string(),
  isDoubleBlind: z.boolean().optional(),
  suggestedReviewers: z.array(z.string()).optional(),
  excludedReviewers: z.array(z.string()).optional(),
  comments: z.string().optional(),
  coAuthors: z.array(z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    affiliation: z.string().optional(),
    isCorresponding: z.boolean().optional(),
    order: z.number()
  }))
});

export const createSubmission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = submissionSchema.parse(req.body);
    
    const submission = await prisma.submission.create({
      data: {
        ...validatedData,
        authorId: req.user!.id,
        coAuthors: {
          create: validatedData.coAuthors
        }
      },
      include: {
        coAuthors: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: submission,
      message: 'Submission created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    console.error('Create submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getSubmissions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as PaginationParams;
    
    const skip = (page - 1) * limit;
    
    const where = req.user!.role === 'AUTHOR' 
      ? { authorId: req.user!.id }
      : {};

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
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
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getSubmission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const submission = await prisma.submission.findUnique({
      where: { id },
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
        revisions: {
          include: {
            files: true
          },
          orderBy: {
            revisionNumber: 'desc'
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

    if (req.user!.role === 'AUTHOR' && submission.authorId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const updateSubmission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = submissionSchema.partial().parse(req.body);
    
    const existingSubmission = await prisma.submission.findUnique({
      where: { id }
    });

    if (!existingSubmission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    if (req.user!.role === 'AUTHOR' && existingSubmission.authorId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (existingSubmission.status !== 'DRAFT' && existingSubmission.status !== 'REVISION_REQUIRED') {
      return res.status(400).json({
        success: false,
        error: 'Submission cannot be edited in current status'
      });
    }

    const { coAuthors, ...submissionData } = validatedData;
    
    const submission = await prisma.submission.update({
      where: { id },
      data: {
        ...submissionData,
        ...(coAuthors && {
          coAuthors: {
            deleteMany: {},
            create: coAuthors
          }
        })
      },
      include: {
        coAuthors: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: submission,
      message: 'Submission updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    console.error('Update submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const submitForReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        files: true
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    if (submission.authorId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (submission.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: 'Submission is not in draft status'
      });
    }

    if (submission.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one file must be uploaded'
      });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date()
      },
      include: {
        author: true,
        coAuthors: true
      }
    });

    res.json({
      success: true,
      data: updatedSubmission,
      message: 'Submission submitted for review successfully'
    });
  } catch (error) {
    console.error('Submit for review error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const withdrawSubmission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const submission = await prisma.submission.findUnique({
      where: { id }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    if (submission.authorId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (['PUBLISHED', 'WITHDRAWN'].includes(submission.status)) {
      return res.status(400).json({
        success: false,
        error: 'Submission cannot be withdrawn'
      });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        status: 'WITHDRAWN'
      }
    });

    res.json({
      success: true,
      data: updatedSubmission,
      message: 'Submission withdrawn successfully'
    });
  } catch (error) {
    console.error('Withdraw submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};