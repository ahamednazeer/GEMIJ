import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { reviewService } from '@/services/reviewService';
import { Review } from '@/types';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';

const ReviewInvitation: React.FC = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if this is from an email link
  const fromEmail = searchParams.get('from') === 'email';

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
      setError(error.response?.data?.error || 'Failed to load review invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (accept: boolean) => {
    setResponding(true);
    setError(null);

    try {
      await reviewService.respondToInvitation(reviewId!, accept);
      
      if (accept) {
        setSuccess('Review invitation accepted! You can now access the manuscript and begin your review.');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setSuccess('Review invitation declined. Thank you for your response.');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Response error:', error);
      setError(error.response?.data?.error || 'Failed to respond to invitation. Please try again.');
    } finally {
      setResponding(false);
    }
  };

  const formatDeadline = (date: string) => {
    const deadline = new Date(date);
    const now = new Date();
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      formatted: deadline.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      daysLeft,
      isOverdue: daysLeft < 0
    };
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-secondary-600 mt-2">Loading review invitation...</p>
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

  if (!review) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="error" title="Review Not Found">
          The review invitation could not be found.
        </Alert>
        <Button onClick={() => navigate('/dashboard')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const deadline = formatDeadline(review.dueDate);
  const hasResponded = review.status !== 'PENDING';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        {!fromEmail && (
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
        )}
        
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Review Invitation
        </h1>
        <p className="text-secondary-600">
          You have been invited to review a manuscript
        </p>
      </div>

      {error && (
        <Alert variant="error" title="Error" className="mb-6">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" title="Success" className="mb-6">
          {success}
        </Alert>
      )}

      {/* Invitation Status */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Invitation Status</h2>
            <Badge variant={hasResponded ? 'success' : 'warning'}>
              {review.status === 'PENDING' ? 'Awaiting Response' : 
               review.status === 'IN_PROGRESS' ? 'Accepted' : 
               review.status === 'DECLINED' ? 'Declined' : 
               review.status === 'COMPLETED' ? 'Completed' : review.status}
            </Badge>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-secondary-700">Invited On</label>
              <p className="text-secondary-900">
                {new Date(review.invitedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700">Review Deadline</label>
              <p className={`text-secondary-900 ${deadline.isOverdue ? 'text-red-600' : ''}`}>
                {deadline.formatted}
                <span className="text-sm text-secondary-600 block">
                  {deadline.isOverdue ? 
                    `${Math.abs(deadline.daysLeft)} days overdue` : 
                    `${deadline.daysLeft} days remaining`
                  }
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700">Reminders Sent</label>
              <p className="text-secondary-900">{review.remindersSent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Manuscript Details */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Manuscript Information</h2>
        </div>
        <div className="card-body">
          <h3 className="font-medium text-secondary-900 mb-3">{review.submission.title}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-secondary-700">Manuscript Type</label>
              <p className="text-secondary-900">{review.submission.manuscriptType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700">Submitted</label>
              <p className="text-secondary-900">
                {review.submission.submittedAt ? 
                  new Date(review.submission.submittedAt).toLocaleDateString() : 
                  'N/A'
                }
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700">Review Type</label>
              <p className="text-secondary-900">
                {review.submission.isDoubleBlind ? 'Double-blind' : 'Single-blind'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700">Keywords</label>
              <p className="text-secondary-900">{review.submission.keywords.join(', ')}</p>
            </div>
          </div>

          {/* Authors (only shown if not double-blind) */}
          {!review.submission.isDoubleBlind && review.submission.author && (
            <div className="mb-4">
              <label className="text-sm font-medium text-secondary-700">Authors</label>
              <div className="mt-1">
                <p className="text-secondary-900">
                  {review.submission.author.firstName} {review.submission.author.lastName}
                  {review.submission.author.affiliation && (
                    <span className="text-secondary-600"> - {review.submission.author.affiliation}</span>
                  )}
                </p>
                {review.submission.coAuthors.map((author, index) => (
                  <p key={index} className="text-secondary-900">
                    {author.firstName} {author.lastName}
                    {author.affiliation && (
                      <span className="text-secondary-600"> - {author.affiliation}</span>
                    )}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Abstract */}
          <div>
            <label className="text-sm font-medium text-secondary-700">Abstract</label>
            <p className="text-secondary-900 mt-1 leading-relaxed">{review.submission.abstract}</p>
          </div>
        </div>
      </div>

      {/* Review Guidelines */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Review Guidelines</h2>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-secondary-900 mb-2">What to Evaluate:</h3>
              <ul className="text-secondary-700 space-y-1 ml-4">
                <li>• Technical quality and methodological rigor</li>
                <li>• Originality and significance of contribution</li>
                <li>• Clarity of presentation and organization</li>
                <li>• Adequacy of literature review and citations</li>
                <li>• Appropriateness of conclusions</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-secondary-900 mb-2">Review Process:</h3>
              <ul className="text-secondary-700 space-y-1 ml-4">
                <li>• Download and carefully read the manuscript</li>
                <li>• Complete the review form with detailed comments</li>
                <li>• Provide constructive feedback for authors</li>
                <li>• Make a recommendation (Accept/Minor Revision/Major Revision/Reject)</li>
                <li>• Submit your review by the deadline</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Time Commitment</h3>
              <p className="text-blue-800 text-sm">
                Most reviews take 2-4 hours to complete thoroughly. Please ensure you have adequate time 
                to provide a quality review before accepting this invitation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Response Actions */}
      {!hasResponded && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Your Response</h2>
          </div>
          <div className="card-body">
            <p className="text-secondary-700 mb-6">
              Please respond to this review invitation. If you accept, you will be able to download 
              the manuscript and access the review form.
            </p>
            
            <div className="flex space-x-4">
              <Button
                onClick={() => handleResponse(true)}
                disabled={responding}
                className="flex-1 md:flex-none"
              >
                {responding ? 'Processing...' : 'Accept Invitation'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleResponse(false)}
                disabled={responding}
                className="flex-1 md:flex-none"
              >
                {responding ? 'Processing...' : 'Decline Invitation'}
              </Button>
            </div>
            
            <p className="text-sm text-secondary-500 mt-4">
              By accepting, you agree to complete the review by the deadline and maintain confidentiality.
            </p>
          </div>
        </div>
      )}

      {/* Already Responded */}
      {hasResponded && (
        <div className="card">
          <div className="card-body text-center">
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              {review.status === 'IN_PROGRESS' ? 'Invitation Accepted' : 
               review.status === 'DECLINED' ? 'Invitation Declined' :
               review.status === 'COMPLETED' ? 'Review Completed' : 'Response Recorded'}
            </h3>
            <p className="text-secondary-600 mb-4">
              {review.status === 'IN_PROGRESS' ? 
                'You can now access the manuscript and begin your review.' :
               review.status === 'DECLINED' ? 
                'Thank you for your response. The editor has been notified.' :
               review.status === 'COMPLETED' ?
                'Your review has been submitted successfully.' :
                'Your response has been recorded.'}
            </p>
            
            {review.status === 'IN_PROGRESS' && (
              <Button onClick={() => navigate(`/review/${reviewId}`)}>
                Start Review
              </Button>
            )}
            
            {review.status === 'COMPLETED' && (
              <div className="space-x-4">
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/review/${reviewId}`)}
                >
                  View Review
                </Button>
                <Button 
                  onClick={() => navigate('/dashboard')}
                >
                  Back to Dashboard
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewInvitation;