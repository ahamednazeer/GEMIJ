import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submissionService } from '@/services/submissionService';
import { paymentService } from '@/services/paymentService';
import { publicService } from '@/services/publicService';
import { Submission, Payment } from '@/types';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import InfoSection from '@/components/ui/InfoSection';
import InfoField from '@/components/ui/InfoField';

const PaymentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'UPI'>('BANK_TRANSFER');

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const [submissionData, paymentData, settingsData] = await Promise.all([
        submissionService.getSubmission(id!),
        paymentService.getPaymentStatus(id!).catch(() => null),
        publicService.getPublicSettings()
      ]);

      setSubmission(submissionData);
      setPayment(paymentData);
      setSettings(settingsData);
    } catch (error: any) {
      // Try to load at least submission and settings
      try {
        const [sub, sett] = await Promise.all([
          submissionService.getSubmission(id!),
          publicService.getPublicSettings()
        ]);
        setSubmission(sub);
        setSettings(sett);
      } catch (e) {
        setError('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadProof = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const updatedPayment = await paymentService.uploadProof(id!, selectedFile, paymentMethod);
      setPayment(updatedPayment);
      setSuccess('Payment proof uploaded successfully! An admin will verify your payment shortly.');
      setSelectedFile(null);

      // Reload submission to get updated status
      const updatedSubmission = await submissionService.getSubmission(id!);
      setSubmission(updatedSubmission);
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.response?.data?.error || 'Failed to upload proof. Please try again.');
    } finally {
      setUploading(false);
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
    const currency = settings?.currency || 'INR';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const apcFee = settings?.apcFee || 2500;

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Clean Academic Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/submission/${id}`)}
            className="mb-6 -ml-2"
            size="sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Submission
          </Button>

          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Article Processing Charge
            </h1>
            <p className="text-base text-muted-foreground max-w-3xl">
              Complete your payment via Bank Transfer to proceed with publication.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {error && (
          <Alert variant="error" title="Error" className="mb-6 shadow-lg">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" title="Success" className="mb-6 shadow-lg">
            {success}
          </Alert>
        )}

        {/* Submission Info */}
        {submission && (
          <InfoSection
            title="Manuscript Details"
            subtitle="Your accepted manuscript ready for publication"
            className="mb-6"
          >
            <div className="space-y-4">
              <div>
                <div className="info-label mb-1">Title</div>
                <div className="info-value">{submission.title}</div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <InfoField
                  label="Authors"
                  value={
                    <>
                      {submission.author.firstName} {submission.author.lastName}
                      {submission.coAuthors.length > 0 && (
                        <span>, {submission.coAuthors.map(a => `${a.firstName} ${a.lastName}`).join(', ')}</span>
                      )}
                    </>
                  }
                />
                <InfoField
                  label="Accepted"
                  value={
                    submission.acceptedAt
                      ? new Date(submission.acceptedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                      : 'N/A'
                  }
                />
              </div>
            </div>
          </InfoSection>
        )}

        {/* Payment Methods Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Bank Transfer - Only show if enabled */}
          {settings?.enableBankTransfer !== false && (
            <div className="card">
              <div className="card-header border-b border-border p-4">
                <h3 className="text-lg font-semibold text-foreground">Bank Transfer Details</h3>
              </div>
              <div className="card-body p-6 space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Please transfer the amount of <strong>{formatAmount(apcFee)}</strong> to the following bank account.
                  Include your Submission ID <strong>{submission?.id.slice(0, 8)}</strong> in the reference.
                </p>

                <div className="space-y-3 bg-secondary-50 p-4 rounded-lg border border-secondary-200">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Bank Name:</span>
                    <span className="text-sm font-bold text-foreground">{settings?.bankName || 'Not configured'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Account Name:</span>
                    <span className="text-sm font-bold text-foreground">{settings?.bankAccountName || 'Not configured'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Account Number:</span>
                    <span className="text-sm font-bold text-foreground">{settings?.bankAccountNumber || 'Not configured'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">IFSC Code:</span>
                    <span className="text-sm font-bold text-foreground">{settings?.bankIfsc || 'Not configured'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-secondary-600">Reference:</span>
                    <span className="text-sm font-bold text-primary-600">{submission?.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* UPI Payment - Only show if enabled */}
          {settings?.enableUpi !== false && settings?.upiId && (
            <div className="card">
              <div className="card-header border-b border-border p-4">
                <h3 className="text-lg font-semibold text-foreground">UPI Payment</h3>
              </div>
              <div className="card-body p-6 space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Scan the QR code or use the UPI ID to make payment of <strong>{formatAmount(apcFee)}</strong>.
                </p>

                {settings?.payment_qr_code_url && (
                  <div className="flex justify-center">
                    <div
                      className="w-48 h-48 bg-white p-3 border-2 border-secondary-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors"
                      onClick={() => setShowQrModal(true)}
                      title="Click to view full size"
                    >
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/${settings.payment_qr_code_url}`}
                        alt="UPI QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-200">
                  <p className="text-xs text-muted-foreground mb-2">UPI ID:</p>
                  <p className="text-sm font-bold text-foreground break-all">
                    {settings.upiId}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Click on QR code to view full size
                </p>
              </div>
            </div>
          )}

          {/* Upload Proof Section */}
          <div className="card">
            <div className="card-header border-b border-border p-4">
              <h3 className="text-lg font-semibold text-foreground">Upload Payment Proof</h3>
            </div>
            <div className="card-body p-6">
              {payment && payment.status === 'PAID' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Payment Verified</h3>
                  <p className="text-secondary-600">Your payment has been verified and accepted.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    After making the transfer, please upload a screenshot or PDF of the transaction receipt.
                  </p>

                  {payment?.proofUrl && (
                    <Alert variant="info" title="Proof Uploaded">
                      You have uploaded a proof. It is currently pending verification. You can upload a new one to replace it if needed.
                    </Alert>
                  )}

                  {/* Payment Method Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Select Payment Method Used</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('BANK_TRANSFER')}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${paymentMethod === 'BANK_TRANSFER'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-secondary-200 hover:border-secondary-300'
                          }`}
                      >
                        <div className="flex items-center mb-2">
                          <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <span className="font-semibold text-foreground">Bank Transfer</span>
                        </div>
                        <p className="text-xs text-muted-foreground">NEFT/RTGS/IMPS</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('UPI')}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${paymentMethod === 'UPI'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-secondary-200 hover:border-secondary-300'
                          }`}
                      >
                        <div className="flex items-center mb-2">
                          <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          <span className="font-semibold text-foreground">UPI</span>
                        </div>
                        <p className="text-xs text-muted-foreground">PhonePe/GPay/Paytm</p>
                      </button>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-secondary-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                    <input
                      type="file"
                      id="proof-upload"
                      className="hidden"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="proof-upload" className="cursor-pointer block">
                      {selectedFile ? (
                        <div className="text-primary-600 font-medium">
                          {selectedFile.name}
                        </div>
                      ) : (
                        <>
                          <svg className="mx-auto h-12 w-12 text-secondary-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="mt-1 text-sm text-secondary-600">
                            Click to upload proof (Image or PDF)
                          </p>
                        </>
                      )}
                    </label>
                  </div>

                  <Button
                    onClick={handleUploadProof}
                    disabled={!selectedFile || uploading}
                    loading={uploading}
                    className="w-full"
                  >
                    {uploading ? 'Uploading...' : 'Submit Proof'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
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

      {/* QR Code Modal */}
      {showQrModal && settings?.payment_qr_code_url && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div className="relative max-w-2xl w-full bg-white rounded-lg p-6">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-secondary-400 hover:text-secondary-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-foreground mb-4">UPI QR Code</h3>

            <div className="flex justify-center bg-secondary-50 p-6 rounded-lg">
              <img
                src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/${settings.payment_qr_code_url}`}
                alt="UPI QR Code - Full Size"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>

            <p className="text-sm text-muted-foreground text-center mt-4">
              Scan this QR code with any UPI app to make payment
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;