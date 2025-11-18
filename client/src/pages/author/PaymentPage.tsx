import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submissionService } from '@/services/submissionService';
import { paymentService } from '@/services/paymentService';
import { Submission, Payment } from '@/types';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';

const PaymentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // APC fee configuration - in a real app, this would come from the backend
  const APC_FEE = 2500; // $25.00 in cents
  const CURRENCY = 'USD';

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const [submissionData, paymentData] = await Promise.all([
        submissionService.getSubmission(id!),
        paymentService.getPaymentStatus(id!)
      ]);
      
      setSubmission(submissionData);
      setPayment(paymentData);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const { clientSecret, paymentIntentId } = await paymentService.createPaymentIntent(
        id!,
        APC_FEE,
        CURRENCY
      );

      // In a real implementation, you would integrate with Stripe Elements here
      // For this demo, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Confirm payment
      const confirmedPayment = await paymentService.confirmPayment(id!, paymentIntentId);
      setPayment(confirmedPayment);
      setSuccess('Payment processed successfully! Your manuscript will now proceed to production.');
      
      // Reload submission to get updated status
      const updatedSubmission = await submissionService.getSubmission(id!);
      setSubmission(updatedSubmission);
    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-secondary-600 mt-2">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (error && !submission) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="error" title="Error">
          {error}
        </Alert>
        <Button onClick={() => navigate('/dashboard')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: CURRENCY
    }).format(amount / 100);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/submission/${id}`)}
          className="mb-4"
        >
          ← Back to Submission
        </Button>
        
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Article Processing Charge (APC)
        </h1>
        <p className="text-secondary-600">
          Complete your payment to proceed with publication
        </p>
      </div>

      {error && (
        <Alert variant="error" title="Payment Error" className="mb-6">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" title="Payment Successful" className="mb-6">
          {success}
        </Alert>
      )}

      {/* Submission Info */}
      {submission && (
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Manuscript Details</h2>
          </div>
          <div className="card-body">
            <h3 className="font-medium text-secondary-900 mb-2">{submission.title}</h3>
            <p className="text-sm text-secondary-600 mb-2">
              Authors: {submission.author.firstName} {submission.author.lastName}
              {submission.coAuthors.length > 0 && (
                <span>, {submission.coAuthors.map(a => `${a.firstName} ${a.lastName}`).join(', ')}</span>
              )}
            </p>
            <p className="text-sm text-secondary-600">
              Accepted: {submission.acceptedAt ? new Date(submission.acceptedAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Payment Status */}
      {payment ? (
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Payment Status</h2>
          </div>
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium">Payment Status:</span>
              <Badge variant={payment.status === 'PAID' ? 'success' : payment.status === 'FAILED' ? 'error' : 'warning'}>
                {payment.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium text-secondary-700">Amount</label>
                <p className="text-secondary-900">{formatAmount(payment.amount)}</p>
              </div>
              <div>
                <label className="font-medium text-secondary-700">Currency</label>
                <p className="text-secondary-900">{payment.currency}</p>
              </div>
              <div>
                <label className="font-medium text-secondary-700">Payment Date</label>
                <p className="text-secondary-900">
                  {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'Pending'}
                </p>
              </div>
              <div>
                <label className="font-medium text-secondary-700">Transaction ID</label>
                <p className="text-secondary-900 font-mono text-xs">
                  {payment.stripePaymentId || 'N/A'}
                </p>
              </div>
            </div>
            
            {payment.status === 'PAID' && (
              <Alert variant="success" title="Payment Complete" className="mt-4">
                Your payment has been processed successfully. Your manuscript will now proceed to production and will be published soon.
              </Alert>
            )}
          </div>
        </div>
      ) : (
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Payment Required</h2>
          </div>
          <div className="card-body">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">Article Processing Charge (APC)</h3>
              <p className="text-blue-800 text-sm mb-3">
                To complete the publication process, an Article Processing Charge (APC) is required. 
                This fee covers the costs of peer review, editorial processing, and open access publication.
              </p>
              <div className="text-2xl font-bold text-blue-900">
                {formatAmount(APC_FEE)}
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-secondary-200 rounded-lg p-4">
                <h4 className="font-medium text-secondary-900 mb-2">What's Included:</h4>
                <ul className="text-sm text-secondary-700 space-y-1">
                  <li>• Professional copyediting and formatting</li>
                  <li>• DOI assignment and registration</li>
                  <li>• Open access publication</li>
                  <li>• Indexing in major databases</li>
                  <li>• Unlimited downloads and sharing</li>
                  <li>• Long-term digital preservation</li>
                </ul>
              </div>

              <div className="border border-secondary-200 rounded-lg p-4">
                <h4 className="font-medium text-secondary-900 mb-2">Payment Information:</h4>
                <ul className="text-sm text-secondary-700 space-y-1">
                  <li>• Secure payment processing via Stripe</li>
                  <li>• Major credit cards accepted</li>
                  <li>• Instant payment confirmation</li>
                  <li>• Receipt provided via email</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Action */}
      {!payment && (
        <div className="card">
          <div className="card-body">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Ready to Proceed with Payment?
              </h3>
              <p className="text-secondary-600 mb-6">
                Click the button below to securely process your APC payment
              </p>
              
              <Button
                onClick={handlePayment}
                disabled={processing}
                size="lg"
                className="px-8"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing Payment...
                  </>
                ) : (
                  `Pay ${formatAmount(APC_FEE)} Now`
                )}
              </Button>
              
              <p className="text-xs text-secondary-500 mt-3">
                Secure payment powered by Stripe
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => navigate(`/submission/${id}`)}
        >
          Back to Submission
        </Button>
        
        {payment?.status === 'PAID' && (
          <Button
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </Button>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;