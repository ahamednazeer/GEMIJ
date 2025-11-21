import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { z } from 'zod';

const prisma = new PrismaClient();

const issueSchema = z.object({
    volume: z.number().int().positive(),
    number: z.number().int().positive(),
    title: z.string().optional(),
    description: z.string().optional(),
    coverImage: z.string().optional(),
    publishedAt: z.string().optional(),
    isCurrent: z.boolean().default(false)
});

const conferenceSchema = z.object({
    name: z.string().min(1),
    proceedingsNo: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    year: z.number().int(),
    isActive: z.boolean().default(true)
});

// Create new issue
export const createIssue = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const validatedData = issueSchema.parse(req.body);

        // Check if issue already exists
        const existingIssue = await prisma.issue.findUnique({
            where: {
                volume_number: {
                    volume: validatedData.volume,
                    number: validatedData.number
                }
            }
        });

        if (existingIssue) {
            return res.status(400).json({
                success: false,
                error: 'Issue with this volume and number already exists'
            });
        }

        // If setting as current, unset other current issues
        if (validatedData.isCurrent) {
            await prisma.issue.updateMany({
                where: { isCurrent: true },
                data: { isCurrent: false }
            });
        }

        const issue = await prisma.issue.create({
            data: {
                ...validatedData,
                publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : null
            }
        });

        return res.status(201).json({
            success: true,
            data: issue,
            message: 'Issue created successfully'
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors
            });
        }

        console.error('Create issue error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Update issue
export const updateIssue = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const validatedData = issueSchema.partial().parse(req.body);

        const existingIssue = await prisma.issue.findUnique({
            where: { id }
        });

        if (!existingIssue) {
            return res.status(404).json({
                success: false,
                error: 'Issue not found'
            });
        }

        // If setting as current, unset other current issues
        if (validatedData.isCurrent === true) {
            await prisma.issue.updateMany({
                where: {
                    isCurrent: true,
                    id: { not: id }
                },
                data: { isCurrent: false }
            });
        }

        const issue = await prisma.issue.update({
            where: { id },
            data: {
                ...validatedData,
                publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : undefined
            }
        });

        return res.json({
            success: true,
            data: issue,
            message: 'Issue updated successfully'
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors
            });
        }

        console.error('Update issue error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Set current issue
export const setCurrentIssue = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;

        const issue = await prisma.issue.findUnique({
            where: { id }
        });

        if (!issue) {
            return res.status(404).json({
                success: false,
                error: 'Issue not found'
            });
        }

        // Unset all current issues
        await prisma.issue.updateMany({
            where: { isCurrent: true },
            data: { isCurrent: false }
        });

        // Set this issue as current
        const updatedIssue = await prisma.issue.update({
            where: { id },
            data: { isCurrent: true }
        });

        return res.json({
            success: true,
            data: updatedIssue,
            message: 'Current issue set successfully'
        });
    } catch (error) {
        console.error('Set current issue error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Delete issue
export const deleteIssue = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;

        const issue = await prisma.issue.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        articles: true
                    }
                }
            }
        });

        if (!issue) {
            return res.status(404).json({
                success: false,
                error: 'Issue not found'
            });
        }

        if (issue._count.articles > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete issue with published articles'
            });
        }

        await prisma.issue.delete({
            where: { id }
        });

        return res.json({
            success: true,
            message: 'Issue deleted successfully'
        });
    } catch (error) {
        console.error('Delete issue error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Create conference
export const createConference = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const validatedData = conferenceSchema.parse(req.body);

        const conference = await prisma.conference.create({
            data: validatedData
        });

        return res.status(201).json({
            success: true,
            data: conference,
            message: 'Conference created successfully'
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors
            });
        }

        console.error('Create conference error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Update conference
export const updateConference = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const validatedData = conferenceSchema.partial().parse(req.body);

        const existingConference = await prisma.conference.findUnique({
            where: { id }
        });

        if (!existingConference) {
            return res.status(404).json({
                success: false,
                error: 'Conference not found'
            });
        }

        const conference = await prisma.conference.update({
            where: { id },
            data: validatedData
        });

        return res.json({
            success: true,
            data: conference,
            message: 'Conference updated successfully'
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors
            });
        }

        console.error('Update conference error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Get all conferences
export const getConferences = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { isActive } = req.query;

        const where: any = {};
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const conferences = await prisma.conference.findMany({
            where,
            orderBy: { year: 'desc' },
            include: {
                _count: {
                    select: {
                        submissions: true
                    }
                }
            }
        });

        return res.json({
            success: true,
            data: conferences
        });
    } catch (error) {
        console.error('Get conferences error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Delete conference
export const deleteConference = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;

        const conference = await prisma.conference.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        submissions: true
                    }
                }
            }
        });

        if (!conference) {
            return res.status(404).json({
                success: false,
                error: 'Conference not found'
            });
        }

        if (conference._count.submissions > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete conference with published articles. Archive it instead.'
            });
        }

        await prisma.conference.delete({
            where: { id }
        });

        return res.json({
            success: true,
            message: 'Conference deleted successfully'
        });
    } catch (error) {
        console.error('Delete conference error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
