import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import { PrismaClient } from '@prisma/client';
import { EmailTemplateData } from '../types';

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export class EmailService {
  static async sendEmail(data: EmailTemplateData): Promise<void> {
    try {
      const template = await prisma.emailTemplate.findUnique({
        where: { name: data.template }
      });

      if (!template) {
        throw new Error(`Email template '${data.template}' not found`);
      }

      const compiledSubject = handlebars.compile(template.subject)(data.variables);
      const compiledHtml = handlebars.compile(template.htmlContent)(data.variables);
      const compiledText = template.textContent 
        ? handlebars.compile(template.textContent)(data.variables)
        : undefined;

      await transporter.sendMail({
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: data.to,
        subject: compiledSubject,
        html: compiledHtml,
        text: compiledText
      });

      console.log(`Email sent successfully to ${data.to}`);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  static async sendSubmissionReceived(submissionId: string): Promise<void> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        author: true
      }
    });

    if (!submission) return;

    await this.sendEmail({
      to: submission.author.email,
      subject: 'Submission Received',
      template: 'submission_received',
      variables: {
        authorName: `${submission.author.firstName} ${submission.author.lastName}`,
        submissionTitle: submission.title,
        submissionId: submission.id,
        journalName: process.env.JOURNAL_NAME,
        journalUrl: process.env.JOURNAL_URL
      }
    });
  }

  static async sendReviewerInvitation(reviewId: string): Promise<void> {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        reviewer: true,
        submission: {
          include: {
            author: true
          }
        }
      }
    });

    if (!review) return;

    const reviewUrl = `${process.env.JOURNAL_URL}/reviewer/reviews/${review.id}`;

    await this.sendEmail({
      to: review.reviewer.email,
      subject: 'Review Invitation',
      template: 'reviewer_invitation',
      variables: {
        reviewerName: `${review.reviewer.firstName} ${review.reviewer.lastName}`,
        submissionTitle: review.submission.title,
        submissionAbstract: review.submission.abstract,
        dueDate: review.dueDate.toLocaleDateString(),
        reviewUrl,
        journalName: process.env.JOURNAL_NAME
      }
    });
  }

  static async sendReviewReminder(reviewId: string): Promise<void> {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        reviewer: true,
        submission: true
      }
    });

    if (!review || review.status !== 'IN_PROGRESS') return;

    const reviewUrl = `${process.env.JOURNAL_URL}/reviewer/reviews/${review.id}`;
    const daysUntilDue = Math.ceil((review.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    await this.sendEmail({
      to: review.reviewer.email,
      subject: 'Review Reminder',
      template: 'review_reminder',
      variables: {
        reviewerName: `${review.reviewer.firstName} ${review.reviewer.lastName}`,
        submissionTitle: review.submission.title,
        dueDate: review.dueDate.toLocaleDateString(),
        daysUntilDue,
        reviewUrl,
        journalName: process.env.JOURNAL_NAME
      }
    });

    await prisma.review.update({
      where: { id: reviewId },
      data: {
        remindersSent: review.remindersSent + 1
      }
    });
  }

  static async sendDecisionToAuthor(submissionId: string, decision: string, comments?: string): Promise<void> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        author: true,
        reviews: {
          where: {
            status: 'COMPLETED'
          }
        }
      }
    });

    if (!submission) return;

    const templateName = decision === 'ACCEPTED' ? 'decision_accept' : 
                        decision === 'REJECTED' ? 'decision_reject' : 
                        'decision_revision';

    await this.sendEmail({
      to: submission.author.email,
      subject: `Decision on Your Submission: ${submission.title}`,
      template: templateName,
      variables: {
        authorName: `${submission.author.firstName} ${submission.author.lastName}`,
        submissionTitle: submission.title,
        submissionId: submission.id,
        decision,
        comments: comments || '',
        reviewCount: submission.reviews.length,
        journalName: process.env.JOURNAL_NAME,
        journalUrl: process.env.JOURNAL_URL
      }
    });
  }

  static async sendPaymentRequest(submissionId: string): Promise<void> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        author: true
      }
    });

    if (!submission) return;

    const paymentUrl = `${process.env.JOURNAL_URL}/author/submissions/${submission.id}/payment`;

    await this.sendEmail({
      to: submission.author.email,
      subject: 'Article Processing Charge Payment Required',
      template: 'payment_request',
      variables: {
        authorName: `${submission.author.firstName} ${submission.author.lastName}`,
        submissionTitle: submission.title,
        apcAmount: process.env.APC_AMOUNT,
        currency: process.env.APC_CURRENCY,
        paymentUrl,
        journalName: process.env.JOURNAL_NAME
      }
    });
  }

  static async sendPublicationNotification(submissionId: string): Promise<void> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        author: true,
        coAuthors: true
      }
    });

    if (!submission) return;

    const articleUrl = `${process.env.JOURNAL_URL}/articles/${submission.doi}`;
    
    const allEmails = [
      submission.author.email,
      ...submission.coAuthors.map(ca => ca.email)
    ];

    for (const email of allEmails) {
      await this.sendEmail({
        to: email,
        subject: 'Your Article Has Been Published',
        template: 'publication_notification',
        variables: {
          submissionTitle: submission.title,
          doi: submission.doi,
          articleUrl,
          volume: submission.volume,
          issue: submission.issue,
          pages: submission.pages,
          journalName: process.env.JOURNAL_NAME
        }
      });
    }
  }
}