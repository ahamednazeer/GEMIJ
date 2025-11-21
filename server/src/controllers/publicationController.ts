import { Response } from 'express';
import { PrismaClient, PublicationDestination } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { z } from 'zod';

const prisma = new PrismaClient();

// Get all submissions ready to publish (ACCEPTED + PAID)
export const getReadyToPublish = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const submissions = await prisma.submission.findMany({
            where: {
                status: 'ACCEPTED',
                payments: {
                    some: {
                        status: 'PAID'
                    }
                }
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
                coAuthors: true,
                files: true,
                payments: {
                    where: {
                        status: 'PAID'
                    }
                },
                timeline: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
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
                }
            },
            orderBy: {
                acceptedAt: 'desc'
            }
        });

        return res.json({
            success: true,
            data: submissions
        });
    } catch (error) {
        console.error('Get ready to publish error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Get available publication destinations (issues, conferences)
export const getPublicationDestinations = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const [currentIssue, allIssues, activeConferences] = await Promise.all([
            prisma.issue.findFirst({
                where: { isCurrent: true }
            }),
            prisma.issue.findMany({
                orderBy: [
                    { volume: 'desc' },
                    { number: 'desc' }
                ]
            }),
            prisma.conference.findMany({
                where: { isActive: true },
                orderBy: { year: 'desc' }
            })
        ]);

        return res.json({
            success: true,
            data: {
                currentIssue,
                allIssues,
                conferences: activeConferences
            }
        });
    } catch (error) {
        console.error('Get publication destinations error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

const publicationSchema = z.object({
    destination: z.enum(['CURRENT_ISSUE', 'PAST_ISSUE', 'CONFERENCE', 'ONLINE_FIRST']),
    issueId: z.string().optional(),
    conferenceId: z.string().optional(),
    pages: z.string().optional(),

    // Metadata
    title: z.string().optional(),
    abstract: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    manuscriptType: z.string().optional(),
    authors: z.array(z.object({
        id: z.string().optional(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
        affiliation: z.string().optional(),
        isCorresponding: z.boolean().optional(),
        order: z.number()
    })).optional(),

    // Publication settings
    settings: z.object({
        showTitle: z.boolean().default(true),
        showAuthors: z.boolean().default(true),
        showAbstract: z.boolean().default(true),
        showKeywords: z.boolean().default(true),
        showPublicationDate: z.boolean().default(true),
        showDOI: z.boolean().default(true),
        showConflicts: z.boolean().default(false),
        showFunding: z.boolean().default(false),
        showHistory: z.boolean().default(false),
        showReferences: z.boolean().default(false),
        showOrcid: z.boolean().default(false),
        enablePdfDownload: z.boolean().default(true),
        pdfWatermark: z.string().optional(),
        showInlinePdf: z.boolean().default(false),
        showInTOC: z.boolean().default(true),
        showSequenceNo: z.boolean().default(true),
        showPageNumbers: z.boolean().default(true),
        addToSearchIndex: z.boolean().default(true),
        includeInSitemap: z.boolean().default(true),
        includeInOAIPMH: z.boolean().default(true),
        includeInRSS: z.boolean().default(true),
        enableGoogleScholar: z.boolean().default(true),
        embargoUntil: z.string().optional(),

        // SEO & Metadata
        metaDescription: z.string().optional(),
        canonicalUrl: z.string().optional(),
        ogImage: z.string().optional(),

        // Additional Visibility
        showViews: z.boolean().default(true),
        showDownloads: z.boolean().default(true),
        isPrivate: z.boolean().default(false)
    }),

    // Publication options
    scheduledPublishAt: z.string().optional(),
    publishImmediately: z.boolean().default(true),
    requiresApproval: z.boolean().default(false),
    showOnHomepage: z.boolean().default(false),
    featuredArticle: z.boolean().default(false),

    // Citation
    articleNumber: z.string().optional()
});

// Publish article
export const publishArticle = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const validatedData = publicationSchema.parse(req.body);

        // Get submission
        const submission = await prisma.submission.findUnique({
            where: { id },
            include: {
                author: true,
                coAuthors: true,
                files: true,
                payments: true,
                editorAssignments: {
                    include: {
                        editor: true
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

        // Verify submission is ready to publish
        if (submission.status !== 'ACCEPTED') {
            return res.status(400).json({
                success: false,
                error: 'Submission must be in ACCEPTED status'
            });
        }

        const paidPayment = submission.payments.find(p => p.status === 'PAID');
        if (!paidPayment) {
            return res.status(400).json({
                success: false,
                error: 'Payment must be completed before publishing'
            });
        }

        // Generate DOI if not exists
        let doi = submission.doi;
        if (!doi) {
            // Simple DOI generation - in production, integrate with CrossRef API
            const year = new Date().getFullYear();
            const uniqueId = submission.id.slice(0, 8);
            doi = `10.XXXX/journal.${year}.${uniqueId}`;
        }

        // Determine volume and issue based on destination
        let volume = submission.volume;
        let issue = submission.issue;
        let conferenceId = submission.conferenceId;
        let issueIdForArticle: string | undefined;

        if (validatedData.destination === 'CURRENT_ISSUE' || validatedData.destination === 'PAST_ISSUE') {
            if (!validatedData.issueId) {
                return res.status(400).json({
                    success: false,
                    error: 'Issue ID is required for issue publication'
                });
            }

            const selectedIssue = await prisma.issue.findUnique({
                where: { id: validatedData.issueId }
            });

            if (!selectedIssue) {
                return res.status(404).json({
                    success: false,
                    error: 'Issue not found'
                });
            }

            volume = selectedIssue.volume;
            issue = selectedIssue.number;
            issueIdForArticle = selectedIssue.id;
        } else if (validatedData.destination === 'CONFERENCE') {
            if (!validatedData.conferenceId) {
                return res.status(400).json({
                    success: false,
                    error: 'Conference ID is required for conference publication'
                });
            }

            const conference = await prisma.conference.findUnique({
                where: { id: validatedData.conferenceId }
            });

            if (!conference) {
                return res.status(404).json({
                    success: false,
                    error: 'Conference not found'
                });
            }

            conferenceId = validatedData.conferenceId;
        }

        // Find main PDF file
        const mainFile = submission.files.find(f => f.fileType === 'application/pdf') || submission.files[0];
        const pdfPath = mainFile ? mainFile.filePath : '';

        // Construct authors JSON
        const authorsList = [
            {
                firstName: submission.author.firstName,
                lastName: submission.author.lastName,
                affiliation: submission.author.affiliation,
                email: submission.author.email,
                isCorresponding: true,
                order: 0
            },
            ...submission.coAuthors.map((ca, index) => ({
                firstName: ca.firstName,
                lastName: ca.lastName,
                affiliation: ca.affiliation,
                email: ca.email,
                isCorresponding: ca.isCorresponding,
                order: index + 1
            }))
        ];

        // Update submission and create publication settings
        const updatedSubmission = await prisma.submission.update({
            where: { id },
            data: {
                status: 'PUBLISHED',
                publishedAt: validatedData.publishImmediately ? new Date() : undefined,
                scheduledPublishAt: validatedData.scheduledPublishAt ? new Date(validatedData.scheduledPublishAt) : undefined,
                doi,
                volume,
                issue,
                pages: validatedData.pages,
                articleNumber: validatedData.articleNumber,
                publicationDestination: validatedData.destination as PublicationDestination,
                conferenceId,
                onlineFirst: validatedData.destination === 'ONLINE_FIRST',
                featuredArticle: validatedData.featuredArticle,
                showOnHomepage: validatedData.showOnHomepage,
                requiresApproval: validatedData.requiresApproval,

                // Update metadata if provided
                title: validatedData.title || undefined,
                abstract: validatedData.abstract || undefined,
                keywords: validatedData.keywords || undefined,
                manuscriptType: validatedData.manuscriptType || undefined,

                publicationSettings: {
                    upsert: {
                        create: {
                            ...validatedData.settings,
                            embargoUntil: validatedData.settings.embargoUntil ? new Date(validatedData.settings.embargoUntil) : undefined
                        },
                        update: {
                            ...validatedData.settings,
                            embargoUntil: validatedData.settings.embargoUntil ? new Date(validatedData.settings.embargoUntil) : undefined
                        }
                    }
                }
            },
            include: {
                author: true,
                publicationSettings: true,
                conference: true
            }
        });

        // Create or update Article record for public site
        if (issueIdForArticle) {
            await prisma.article.upsert({
                where: { doi },
                create: {
                    title: validatedData.title || submission.title,
                    abstract: validatedData.abstract || submission.abstract,
                    keywords: validatedData.keywords || submission.keywords,
                    authors: authorsList,
                    doi,
                    pages: validatedData.pages || '',
                    pdfPath,
                    publishedAt: new Date(),
                    issueId: issueIdForArticle
                },
                update: {
                    title: validatedData.title || submission.title,
                    abstract: validatedData.abstract || submission.abstract,
                    keywords: validatedData.keywords || submission.keywords,
                    authors: authorsList,
                    pages: validatedData.pages || '',
                    pdfPath,
                    issueId: issueIdForArticle
                }
            });
        }

        // Handle author updates if provided
        if (validatedData.authors && validatedData.authors.length > 0) {
            // This is complex because authors can be the main User or CoAuthors
            // For simplicity in this iteration, we'll update CoAuthors. 
            // Updating the main author (User) might have side effects on login etc.
            // We will assume the main author is the first one and just update their name if needed, 
            // but usually we shouldn't change User table from here.
            // A better approach for a real journal is to have an 'AuthorSnapshot' for the article.
            // For now, we will skip deep author updates to avoid breaking the User model, 
            // but we can update CoAuthors.

            // TODO: Implement full author management (reordering, editing)
        }

        // Create timeline event
        const performingUser = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: { firstName: true, lastName: true }
        });

        await prisma.submissionTimeline.create({
            data: {
                submissionId: id,
                event: 'ARTICLE_PUBLISHED',
                fromStatus: 'ACCEPTED',
                toStatus: 'PUBLISHED',
                description: `Article published to ${validatedData.destination.replace('_', ' ')}`,
                performedBy: performingUser ? `${performingUser.firstName} ${performingUser.lastName}` : 'Admin'
            }
        });

        // Send notification to author
        await prisma.notification.create({
            data: {
                userId: submission.authorId,
                type: 'ARTICLE_PUBLISHED',
                title: 'Your Article Has Been Published',
                message: `Congratulations! Your article "${submission.title}" has been published. DOI: ${doi}`,
                submissionId: id
            }
        });

        // Send notification to editors
        if (submission.editorAssignments.length > 0) {
            await prisma.notification.createMany({
                data: submission.editorAssignments.map(assignment => ({
                    userId: assignment.editorId,
                    type: 'ARTICLE_PUBLISHED',
                    title: 'Article Published',
                    message: `The article "${submission.title}" has been published.`,
                    submissionId: id
                }))
            });
        }

        // Send email notification to all authors
        try {
            const { EmailService } = await import('../services/emailService');
            await EmailService.sendPublicationNotification(id);
        } catch (emailError) {
            console.error('Failed to send publication email:', emailError);
            // Don't fail the publication if email fails
        }

        // Regenerate feeds (sitemap, RSS, OAI-PMH)
        try {
            const { FeedService } = await import('../services/feedService');
            await FeedService.regenerateAllFeeds();
        } catch (feedError) {
            console.error('Failed to regenerate feeds:', feedError);
            // Don't fail the publication if feed regeneration fails
        }

        // TODO: Register DOI with CrossRef

        return res.json({
            success: true,
            data: updatedSubmission,
            message: 'Article published successfully'
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors
            });
        }

        console.error('Publish article error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Get publication preview
export const getPublicationPreview = async (req: AuthenticatedRequest, res: Response) => {
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
                        affiliation: true,
                        orcid: true
                    }
                },
                coAuthors: true,
                files: true
            }
        });

        if (!submission) {
            return res.status(404).json({
                success: false,
                error: 'Submission not found'
            });
        }

        // Generate preview URL
        const previewUrl = `/article/${submission.id}`;

        return res.json({
            success: true,
            data: {
                submission,
                previewUrl,
                doi: submission.doi || `10.XXXX/journal.${new Date().getFullYear()}.${submission.id.slice(0, 8)}`
            }
        });
    } catch (error) {
        console.error('Get publication preview error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Unpublish article (rollback)
export const unpublishArticle = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;

        const submission = await prisma.submission.findUnique({
            where: { id },
            include: {
                publicationSettings: true
            }
        });

        if (!submission) {
            return res.status(404).json({
                success: false,
                error: 'Submission not found'
            });
        }

        if (submission.status !== 'PUBLISHED') {
            return res.status(400).json({
                success: false,
                error: 'Submission is not published'
            });
        }

        // Delete publication settings and revert status
        await prisma.submission.update({
            where: { id },
            data: {
                status: 'ACCEPTED',
                publishedAt: null,
                publicationDestination: null,
                onlineFirst: false,
                featuredArticle: false,
                showOnHomepage: false,
                publicationSettings: {
                    delete: true
                }
            }
        });

        // Create timeline event
        const performingUser = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: { firstName: true, lastName: true }
        });

        await prisma.submissionTimeline.create({
            data: {
                submissionId: id,
                event: 'ARTICLE_UNPUBLISHED',
                fromStatus: 'PUBLISHED',
                toStatus: 'ACCEPTED',
                description: 'Article unpublished by admin',
                performedBy: performingUser ? `${performingUser.firstName} ${performingUser.lastName}` : 'Admin'
            }
        });

        return res.json({
            success: true,
            message: 'Article unpublished successfully'
        });
    } catch (error) {
        console.error('Unpublish article error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
