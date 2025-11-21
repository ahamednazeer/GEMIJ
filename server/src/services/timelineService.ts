import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TimelineEventData {
    event: string;
    fromStatus?: string;
    toStatus?: string;
    description: string;
    performedBy?: string;
}

export class TimelineService {
    /**
     * Add a timeline event to a submission
     */
    static async addTimelineEvent(
        submissionId: string,
        eventData: TimelineEventData
    ) {
        try {
            const timelineEvent = await prisma.submissionTimeline.create({
                data: {
                    submissionId,
                    event: eventData.event,
                    fromStatus: eventData.fromStatus,
                    toStatus: eventData.toStatus,
                    description: eventData.description,
                    performedBy: eventData.performedBy
                }
            });

            return timelineEvent;
        } catch (error) {
            console.error('Error adding timeline event:', error);
            throw error;
        }
    }

    /**
     * Get timeline for a submission
     */
    static async getSubmissionTimeline(submissionId: string) {
        try {
            const timeline = await prisma.submissionTimeline.findMany({
                where: {
                    submissionId
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return timeline;
        } catch (error) {
            console.error('Error fetching timeline:', error);
            throw error;
        }
    }

    /**
     * Add status change event
     */
    static async addStatusChangeEvent(
        submissionId: string,
        fromStatus: string,
        toStatus: string,
        performedBy?: string
    ) {
        const description = `Status changed from ${fromStatus.replace(/_/g, ' ')} to ${toStatus.replace(/_/g, ' ')}`;

        return this.addTimelineEvent(submissionId, {
            event: 'STATUS_CHANGE',
            fromStatus,
            toStatus,
            description,
            performedBy
        });
    }

    /**
     * Add review submitted event
     */
    static async addReviewSubmittedEvent(
        submissionId: string,
        reviewerName: string
    ) {
        return this.addTimelineEvent(submissionId, {
            event: 'REVIEW_SUBMITTED',
            description: `Review submitted by ${reviewerName}`
        });
    }

    /**
     * Add payment received event
     */
    static async addPaymentReceivedEvent(
        submissionId: string,
        amount: number,
        currency: string
    ) {
        return this.addTimelineEvent(submissionId, {
            event: 'PAYMENT_RECEIVED',
            description: `Payment of ${currency} ${amount} received`
        });
    }

    /**
     * Add revision submitted event
     */
    static async addRevisionSubmittedEvent(
        submissionId: string,
        revisionNumber: number,
        authorName: string
    ) {
        return this.addTimelineEvent(submissionId, {
            event: 'REVISION_SUBMITTED',
            description: `Revision ${revisionNumber} submitted by ${authorName}`
        });
    }

    /**
     * Add file uploaded event
     */
    static async addFileUploadedEvent(
        submissionId: string,
        fileName: string,
        fileType: string
    ) {
        return this.addTimelineEvent(submissionId, {
            event: 'FILE_UPLOADED',
            description: `${fileType} file uploaded: ${fileName}`
        });
    }

    /**
     * Add editor assigned event
     */
    static async addEditorAssignedEvent(
        submissionId: string,
        editorName: string
    ) {
        return this.addTimelineEvent(submissionId, {
            event: 'EDITOR_ASSIGNED',
            description: `Editor assigned: ${editorName}`
        });
    }

    /**
     * Add reviewer assigned event
     */
    static async addReviewerAssignedEvent(
        submissionId: string,
        reviewerName: string
    ) {
        return this.addTimelineEvent(submissionId, {
            event: 'REVIEWER_ASSIGNED',
            description: `Reviewer assigned: ${reviewerName}`
        });
    }
}
