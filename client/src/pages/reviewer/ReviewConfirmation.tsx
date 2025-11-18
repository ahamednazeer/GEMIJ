import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reviewService } from '@/services/reviewService';
import { Review } from '@/types';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';

const ReviewConfirmation: React.FC = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificateDownloading, setCertificateDownloading] = useState(false);

  useEffect(() => {
    if (reviewId) {
      loadReview();
    }
  }, [reviewId]);

  const loadReview = async () => {
    try {
      const data = await reviewService.getReview(reviewId!);
      setReview(data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load review');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async () => {
    setCertificateDownloading(true);
    try {
      const blob = await reviewService.generateCertificate(reviewId!);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `review-certificate-${reviewId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      setError('Failed to download certificate');
    } finally {
      setCertificateDownloading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'ACCEPT':
        return 'success';
      case 'MINOR_REVISION':
        return 'info';
      case 'MAJOR_REVISION':
        return 'warning';
      case 'REJECT':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const formatRecommendation = (recommendation: string) => {
    switch (recommendation) {
      case 'ACCEPT':
        return 'Accept without revision';
      case 'MINOR_REVISION':
        return 'Accept with minor revisions';
      case 'MAJOR_REVISION':
        return 'Major revisions required';
      case 'REJECT':
        return 'Reject';
      default:
        return recommendation;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-secondary-600 mt-2">Loading review...</p>
        </div>
      </div>
    );
  }

  if (error && !review) {
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

  if (!review || review.status !== 'COMPLETED') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="error" title="Review Not Found">
          The completed review could not be found.
        </Alert>
        <Button onClick={() => navigate('/dashboard')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Review Submitted Successfully!
        </h1>
        <p className="text-lg text-secondary-600">
          Thank you for your valuable contribution to the peer review process
        </p>
      </div>

      {error && (
        <Alert variant="error" title="Error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Review Summary */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Review Summary</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-secondary-900 mb-3">{review.submission.title}</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-secondary-700">Submitted On</label>
                  <p className="text-secondary-900">
                    {review.submittedAt ? new Date(review.submittedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-700">Review Duration</label>
                  <p className="text-secondary-900">
                    {review.acceptedAt && review.submittedAt ? 
                      `${Math.ceil((new Date(review.submittedAt).getTime() - new Date(review.acceptedAt).getTime()) / (1000 * 60 * 60 * 24))} days` :
                      'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-secondary-700">Your Recommendation</label>
                  <div className="mt-1">
                    <Badge variant={getRecommendationColor(review.recommendation!)}>
                      {formatRecommendation(review.recommendation!)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-700">Overall Rating</label>
                  <div className="flex items-center mt-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className={`text-lg ${i < (review.rating || 0) ? 'text-yellow-400' : 'text-secondary-300'}`}
                      >
                        ★
                      </span>
                    ))}
                    <span className="ml-2 text-sm text-secondary-600">
                      {review.rating}/5 stars
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What Happens Next */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-xl font-semibold">What Happens Next</h2>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                1
              </div>
              <div>
                <h3 className="font-medium text-secondary-900">Editor Review</h3>
                <p className="text-secondary-700 text-sm">
                  The editor will review your feedback along with other reviewers' comments to make a final decision.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                2
              </div>
              <div>
                <h3 className="font-medium text-secondary-900">Author Notification</h3>
                <p className="text-secondary-700 text-sm">
                  Authors will receive the editorial decision along with anonymized reviewer comments.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                3
              </div>
              <div>
                <h3 className="font-medium text-secondary-900">Follow-up (if needed)</h3>
                <p className="text-secondary-700 text-sm">
                  If revisions are required, you may be invited to review the revised manuscript.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recognition */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Recognition & Certificate</h2>
        </div>
        <div className="card-body">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-900 mb-2">🏆 Thank You for Your Service</h3>
            <p className="text-blue-800 text-sm">
              Your expert review contributes to the advancement of scientific knowledge and helps maintain 
              the quality of academic publishing. Your time and expertise are greatly appreciated.
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-secondary-900 mb-1">Download Review Certificate</h3>
              <p className="text-sm text-secondary-600">
                Get an official certificate recognizing your contribution as a peer reviewer
              </p>
            </div>
            <Button
              onClick={downloadCertificate}
              disabled={certificateDownloading}
              variant="outline"
            >
              {certificateDownloading ? 'Generating...' : 'Download Certificate'}
            </Button>
          </div>
        </div>
      </div>

      {/* Review Details */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Your Review</h2>
        </div>
        <div className="card-body space-y-4">
          {review.authorComments && (
            <div>
              <label className="text-sm font-medium text-secondary-700">Comments for Authors</label>
              <div className="mt-1 p-3 bg-secondary-50 border border-secondary-200 rounded">
                <p className="text-secondary-900 whitespace-pre-wrap">{review.authorComments}</p>
              </div>
            </div>
          )}
          
          {review.confidentialComments && (
            <div>
              <label className="text-sm font-medium text-secondary-700">Confidential Comments to Editor</label>
              <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-secondary-900 whitespace-pre-wrap">{review.confidentialComments}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
        
        <Button
          onClick={() => navigate(`/review/${reviewId}`)}
        >
          View Full Review
        </Button>
      </div>

      {/* Footer Message */}
      <div className="text-center mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-800 text-sm">
          <strong>Review ID:</strong> {reviewId} • 
          <strong> Submitted:</strong> {review.submittedAt ? new Date(review.submittedAt).toLocaleDateString() : 'N/A'}
        </p>
        <p className="text-green-700 text-xs mt-1">
          Keep this information for your records. You can always access your review history from your dashboard.
        </p>
      </div>
    </div>
  );
};

export default ReviewConfirmation;