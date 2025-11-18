import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import Stripe from 'stripe';

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

    if (submission.status !== 'ACCEPTED') {
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
    const currency = process.env.APC_CURRENCY || 'USD';

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

    const payment = await prisma.payment.create({
      data: {
        amount,
        currency,
        status: 'PENDING',
        stripePaymentId: paymentIntent.id,
        userId: req.user!.id,
        submissionId
      }
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.id,
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
          include: { submission: true }
        });

        if (payment) {
          await prisma.submission.update({
            where: { id: payment.submissionId },
            data: { status: 'ACCEPTED' }
          });
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