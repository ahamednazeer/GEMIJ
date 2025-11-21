import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import Stripe from 'stripe';
import { TimelineService } from '../services/timelineService';
import { createNotification } from './notificationController';
import { EmailService } from '../services/emailService';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export const createPaymentIntent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        author: true,
        payments: true
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

    if (submission.status !== 'ACCEPTED' && submission.status !== 'PAYMENT_PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Payment can only be made for accepted submissions'
      });
    }

    const existingPayment = submission.payments.find(p => p.status === 'PAID');
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        error: 'Payment already completed for this submission'
      });
    }

    const amount = parseFloat(process.env.APC_AMOUNT || '299.00');
    const currency = process.env.APC_CURRENCY || 'INR';

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata: {
        submissionId: submission.id,
        userId: req.user!.id,
        submissionTitle: submission.title
      },
      description: `APC for "${submission.title}"`
    });

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${submission.id.substring(0, 8).toUpperCase()}`;

    const payment = await prisma.payment.create({
      data: {
        amount,
        currency,
        status: 'PENDING',
        stripePaymentId: paymentIntent.id,
        invoiceNumber,
        userId: req.user!.id,
        submissionId
      }
    });

    // Update submission status to PAYMENT_PENDING if not already
    if (submission.status !== 'PAYMENT_PENDING') {
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'PAYMENT_PENDING' }
      });

      // Add timeline event
      await TimelineService.addStatusChangeEvent(
        submissionId,
        submission.status,
        'PAYMENT_PENDING',
        req.user!.id
      );

      // Create notification
      await createNotification(
        req.user!.id,
        'PAYMENT_PENDING',
        'Payment Required',
        `Your manuscript "${submission.title}" has been accepted. Please complete the payment to proceed with publication.`,
        submissionId
      );
    }

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.id,
        invoiceNumber,
        amount,
        currency
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const confirmPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { paymentIntentId } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        submission: true
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    if (payment.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          paidAt: new Date()
        }
      });

      await prisma.submission.update({
        where: { id: payment.submissionId },
        data: {
          status: 'ACCEPTED'
        }
      });

      res.json({
        success: true,
        data: updatedPayment,
        message: 'Payment confirmed successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Payment not completed'
      });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getPaymentStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;

    const payment = await prisma.payment.findFirst({
      where: {
        submissionId,
        userId: req.user!.id
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'No payment found for this submission'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getPaymentById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        submission: {
          select: {
            id: true,
            title: true,
            author: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Transform to match PaymentData interface expected by frontend
    const formattedPayment = {
      ...payment,
      submissionTitle: payment.submission.title,
      authorName: `${payment.submission.author.firstName} ${payment.submission.author.lastName}`,
      authorEmail: payment.submission.author.email,
      amount: payment.amount.toNumber ? payment.amount.toNumber() : payment.amount
    };

    res.json({
      success: true,
      data: formattedPayment
    });
  } catch (error) {
    console.error('Get payment by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const handleWebhook = async (req: any, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(400).json({
      success: false,
      error: 'Webhook secret not configured'
    });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({
      success: false,
      error: 'Invalid signature'
    });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Update payment status
        await prisma.payment.updateMany({
          where: {
            stripePaymentId: paymentIntent.id,
            status: 'PENDING'
          },
          data: {
            status: 'PAID',
            paidAt: new Date()
          }
        });

        const payment = await prisma.payment.findFirst({
          where: { stripePaymentId: paymentIntent.id },
          include: {
            submission: {
              include: {
                author: true
              }
            },
            user: true
          }
        });

        if (payment) {
          // Auto-publish after payment
          await prisma.submission.update({
            where: { id: payment.submissionId },
            data: {
              status: 'ACCEPTED'
            }
          });

          // Add timeline events
          await TimelineService.addPaymentReceivedEvent(
            payment.submissionId,
            payment.amount.toNumber(),
            payment.currency
          );

          await TimelineService.addStatusChangeEvent(
            payment.submissionId,
            'PAYMENT_PENDING',
            'ACCEPTED'
          );

          // Create notification
          await createNotification(
            payment.userId,
            'PAYMENT_RECEIVED',
            'Payment Received',
            `Your payment for "${payment.submission.title}" has been confirmed. Your article is now ready for final publication steps.`,
            payment.submissionId
          );

          // Send email notification
          try {
            await EmailService.sendPaymentReceivedNotification(payment.submissionId);
          } catch (emailError) {
            console.error('Failed to send publication email:', emailError);
          }
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;

        await prisma.payment.updateMany({
          where: {
            stripePaymentId: failedPayment.id,
            status: 'PENDING'
          },
          data: {
            status: 'FAILED'
          }
        });

        // Notify user of failed payment
        const failedPaymentRecord = await prisma.payment.findFirst({
          where: { stripePaymentId: failedPayment.id },
          include: { submission: true }
        });

        if (failedPaymentRecord) {
          await createNotification(
            failedPaymentRecord.userId,
            'PAYMENT_FAILED',
            'Payment Failed',
            `Payment for "${failedPaymentRecord.submission.title}" failed. Please try again.`,
            failedPaymentRecord.submissionId
          );
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
};

export const getPaymentHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        userId: req.user!.id
      },
      orderBy: { createdAt: 'desc' },
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

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const uploadProof = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { payments: true }
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

    // Check if there is already a pending or paid payment
    let payment = submission.payments.find(p => p.status === 'PENDING');

    const amount = parseFloat(process.env.APC_AMOUNT || '299.00');
    const currency = process.env.APC_CURRENCY || 'INR';
    const invoiceNumber = `INV-${Date.now()}-${submission.id.substring(0, 8).toUpperCase()}`;

    // Get payment method from request body (sent from frontend)
    const paymentMethod = req.body.paymentMethod || 'BANK_TRANSFER';

    if (payment) {
      payment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          proofUrl: req.file.path,
          paymentMethod: paymentMethod,
          // Status remains PENDING until admin verification
        }
      });
    } else {
      payment = await prisma.payment.create({
        data: {
          amount,
          currency,
          status: 'PENDING',
          invoiceNumber,
          userId: req.user!.id,
          submissionId,
          proofUrl: req.file.path,
          paymentMethod: paymentMethod
        }
      });
    }

    // Update submission status to PAYMENT_PENDING if not already
    if (submission.status !== 'PAYMENT_PENDING') {
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'PAYMENT_PENDING' }
      });

      // Add timeline event
      await TimelineService.addStatusChangeEvent(
        submissionId,
        submission.status,
        'PAYMENT_PENDING',
        req.user!.id
      );
    }

    res.json({
      success: true,
      data: payment,
      message: 'Payment proof uploaded successfully. Waiting for verification.'
    });

  } catch (error) {
    console.error('Upload proof error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};