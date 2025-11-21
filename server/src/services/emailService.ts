import sgMail from '@sendgrid/mail';
import handlebars from 'handlebars';
import { PrismaClient } from '@prisma/client';
import { EmailTemplateData } from '../types';

const prisma = new PrismaClient();

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}


export class EmailService {
  static async sendEmail(data: EmailTemplateData): Promise<void> {
    try {
      // Check if SendGrid is configured
      if (!SENDGRID_API_KEY) {
        console.log(`Email would be sent to ${data.to} with template ${data.template} (SendGrid not configured)`);
        return;
      }
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

      const fromEmail = process.env.FROM_EMAIL || 'gemij@em9745.ahamednazeer.qzz.io';
      const fromName = process.env.FROM_NAME || 'GEMIJ Journal';

      const msg = {
        to: data.to,
        from: {
          email: fromEmail,
          name: fromName
        },
        subject: compiledSubject,
        html: compiledHtml,
        text: compiledText || compiledSubject
      };

      await sgMail.send(msg);

      console.log(`Email sent successfully to ${data.to}`);
    } catch (error: any) {
      console.error('Email sending failed:', error);
      if (error.response) {
        console.error('SendGrid error response:', error.response.body);
      }
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

  static async sendPaymentReceivedNotification(submissionId: string): Promise<void> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        author: true,
        payments: {
          where: { status: 'PAID' },
          orderBy: { paidAt: 'desc' },
          take: 1
        }
      }
    });

    if (!submission) return;

    const payment = submission.payments[0];
    const amount = payment ? payment.amount : process.env.APC_AMOUNT;
    const currency = payment ? payment.currency : process.env.APC_CURRENCY;

    await this.sendEmail({
      to: submission.author.email,
      subject: 'Payment Received - Thank You',
      template: 'payment_received',
      variables: {
        authorName: `${submission.author.firstName} ${submission.author.lastName}`,
        submissionTitle: submission.title,
        amount,
        currency,
        invoiceNumber: payment?.invoiceNumber || 'N/A',
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

  static async sendReviewThankYou(reviewId: string): Promise<void> {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        reviewer: true,
        submission: true
      }
    });

    if (!review) return;

    const certificateUrl = `${process.env.JOURNAL_URL}/reviewer/reviews/${review.id}/certificate`;

    await this.sendEmail({
      to: review.reviewer.email,
      subject: 'Thank You for Your Review',
      template: 'review_thank_you',
      variables: {
        reviewerName: `${review.reviewer.firstName} ${review.reviewer.lastName}`,
        submissionTitle: review.submission.title,
        certificateUrl,
        journalName: process.env.JOURNAL_NAME
      }
    });
  }

  static async sendPasswordResetEmail(to: string, resetUrl: string, userName: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Password Reset Request',
      template: 'password_reset',
      variables: {
        userName,
        resetUrl,
        journalName: process.env.JOURNAL_NAME
      }
    });
  }

  static async sendReviewCompletedNotification(reviewId: string): Promise<void> {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        reviewer: true,
        submission: {
          include: {
            author: true,
            editorAssignments: {
              include: {
                editor: true
              }
            }
          }
        }
      }
    });

    if (!review) return;

    // Send notification to all assigned editors
    const editors = review.submission.editorAssignments.map(ea => ea.editor);

    for (const editor of editors) {
      const submissionUrl = `${process.env.JOURNAL_URL}/editor/submission/${review.submission.id}`;

      await this.sendEmail({
        to: editor.email,
        subject: `Review Completed: ${review.submission.title}`,
        template: 'review_completed',
        variables: {
          editorName: `${editor.firstName} ${editor.lastName}`,
          reviewerName: `${review.reviewer.firstName} ${review.reviewer.lastName}`,
          submissionTitle: review.submission.title,
          submissionId: review.submission.id,
          recommendation: review.recommendation,
          submissionUrl,
          journalName: process.env.JOURNAL_NAME
        }
      });
    }
  }

  static async sendDecisionNotification(submissionId: string, decision: string): Promise<void> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        author: true,
        reviews: {
          where: {
            status: 'COMPLETED'
          },
          include: {
            reviewer: true
          }
        }
      }
    });

    if (!submission) return;

    // Compile all reviewer comments
    const reviewerComments = submission.reviews.map((review, index) => ({
      reviewerNumber: index + 1,
      recommendation: review.recommendation,
      rating: review.rating,
      comments: review.authorComments,
      isDoubleBlind: submission.isDoubleBlind
    }));

    const templateName = decision === 'ACCEPT' ? 'decision_accept' :
      decision === 'REJECT' ? 'decision_reject' :
        'decision_revision';

    const submissionUrl = `${process.env.JOURNAL_URL}/author/submissions/${submission.id}`;

    await this.sendEmail({
      to: submission.author.email,
      subject: `Decision on Your Submission: ${submission.title}`,
      template: templateName,
      variables: {
        authorName: `${submission.author.firstName} ${submission.author.lastName}`,
        submissionTitle: submission.title,
        submissionId: submission.id,
        decision,
        decisionComments: submission.comments || '',
        reviewerComments,
        reviewCount: submission.reviews.length,
        submissionUrl,
        journalName: process.env.JOURNAL_NAME,
        journalUrl: process.env.JOURNAL_URL
      }
    });
  }

  static async sendAcceptanceNotification(submissionId: string): Promise<void> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        author: true,
        payments: true
      }
    });

    if (!submission) return;

    const hasPayment = submission.payments && submission.payments.length > 0;
    const paymentUrl = hasPayment
      ? `${process.env.JOURNAL_URL}/author/submissions/${submission.id}/payment`
      : null;

    await this.sendEmail({
      to: submission.author.email,
      subject: `Congratulations! Your Submission Has Been Accepted`,
      template: 'acceptance_notification',
      variables: {
        authorName: `${submission.author.firstName} ${submission.author.lastName}`,
        submissionTitle: submission.title,
        submissionId: submission.id,
        requiresPayment: hasPayment,
        apcAmount: process.env.APC_AMOUNT,
        currency: process.env.APC_CURRENCY,
        paymentUrl,
        journalName: process.env.JOURNAL_NAME
      }
    });
  }

  static async sendRevisionSubmittedNotification(submissionId: string): Promise<void> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        author: true,
        editorAssignments: {
          include: {
            editor: true
          }
        },
        revisions: {
          orderBy: {
            revisionNumber: 'desc'
          },
          take: 1
        }
      }
    });

    if (!submission) return;

    // Send notification to all assigned editors
    const editors = submission.editorAssignments.map(ea => ea.editor);

    for (const editor of editors) {
      const submissionUrl = `${process.env.JOURNAL_URL}/editor/submission/${submission.id}/revision`;

      await this.sendEmail({
        to: editor.email,
        subject: `Revision Submitted: ${submission.title}`,
        template: 'revision_submitted',
        variables: {
          editorName: `${editor.firstName} ${editor.lastName}`,
          authorName: `${submission.author.firstName} ${submission.author.lastName}`,
          submissionTitle: submission.title,
          submissionId: submission.id,
          revisionNumber: submission.revisions[0]?.revisionNumber || 1,
          submissionUrl,
          journalName: process.env.JOURNAL_NAME
        }
      });
    }
  }

  static async sendRevisionAcceptedNotification(submissionId: string): Promise<void> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        author: true
      }
    });

    if (!submission) return;

    const submissionUrl = `${process.env.JOURNAL_URL}/author/submissions/${submission.id}`;

    await this.sendEmail({
      to: submission.author.email,
      subject: `Your Revision Has Been Accepted`,
      template: 'revision_accepted',
      variables: {
        authorName: `${submission.author.firstName} ${submission.author.lastName}`,
        submissionTitle: submission.title,
        submissionId: submission.id,
        submissionUrl,
        journalName: process.env.JOURNAL_NAME
      }
    });
  }
}