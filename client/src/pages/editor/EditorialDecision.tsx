import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { editorService } from '@/services/editorService';
import { Submission, Review, ReviewStatus } from '@/types';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const EditorialDecision: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [decision, setDecision] = useState<'ACCEPT' | 'MINOR_REVISION' | 'MAJOR_REVISION' | 'REJECT' | ''>('');
  const [comments, setComments] = useState('');
  const [confidentialComments, setConfidentialComments] = useState('');
  const [revisionDeadline, setRevisionDeadline] = useState('');
  const [requireReReview, setRequireReReview] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  useEffect(() => {
    // Set default revision deadline when revision is selected
    if (decision === 'MINOR_REVISION' || decision === 'MAJOR_REVISION') {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + (decision === 'MINOR_REVISION' ? 30 : 60));
      setRevisionDeadline(defaultDate.toISOString().split('T')[0]);
    }
  }, [decision]);

  const loadData = async () => {
    try {
      const [submissionData, reviewsData] = await Promise.all([
        editorService.getSubmissionForEditor(id!),
        editorService.getReviewsForSubmission(id!)
      ]);

      setSubmission(submissionData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setMessage({ text: 'Failed to load submission or reviews', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async () => {
    if (!decision || !comments.trim()) {
      setMessage({ text: 'Please select a decision and provide comments', type: 'error' });
      return;
    }

    if ((decision === 'MINOR_REVISION' || decision === 'MAJOR_REVISION') && !revisionDeadline) {
      setMessage({ text: 'Please set a revision deadline', type: 'error' });
      return;
    }

    setProcessing(true);
    try {
      if (decision === 'MINOR_REVISION' || decision === 'MAJOR_REVISION') {
        await editorService.requestRevision(id!, {
          type: decision,
          comments,
          deadline: revisionDeadline,
          requireReReview
        });
      } else {
        await editorService.makeEditorialDecision(id!, {
          decision,
          comments,
          confidentialComments
        });
      }

      setMessage({ text: 'Editorial decision submitted successfully', type: 'success' });
      setTimeout(() => {
        navigate('/editor/submissions');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit decision:', error);
      setMessage({ text: 'Failed to submit editorial decision', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const getRecommendationSummary = () => {
    const completedReviews = reviews.filter(r => r.status === ReviewStatus.COMPLETED);
    const recommendations = completedReviews.map(r => r.recommendation).filter(Boolean);

    const counts = recommendations.reduce((acc, rec) => {
      acc[rec!] = (acc[rec!] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return { completedReviews, recommendations, counts };
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'ACCEPT': return 'text-green-600';
      case 'MINOR_REVISION': return 'text-yellow-600';
      case 'MAJOR_REVISION': return 'text-orange-600';
      case 'REJECT': return 'text-red-600';
      default: return 'text-secondary-600';
    }
  };

  const formatDecision = (decision: string) => {
    return decision.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-secondary-600 mt-2">Loading decision data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="error" title="Error">
            Submission not found
          </Alert>
        </div>
      </div>
    );
  }

  const { completedReviews, recommendations, counts } = getRecommendationSummary();

  if (completedReviews.length === 0) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="warning" title="No Reviews Available">
            No completed reviews are available for this submission yet. Please wait for reviewers to complete their reviews before making an editorial decision.
          </Alert>
          <div className="mt-4">
            <Button
              onClick={() => navigate(`/editor/submission/${id}/reviews`)}
            >
              Track Reviews
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Clean Academic Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-6 -ml-2"
            size="sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
                Editorial Decision
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                Make decision for: <span className="font-medium">{submission.title}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <Alert
            variant={message.type === 'success' ? 'success' : 'error'}
            title={message.type === 'success' ? 'Success' : 'Error'}
            className="mb-6"
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Submission Summary & Reviews */}
          <div className="lg:col-span-2 space-y-6">
            {/* Submission Summary */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-secondary-900">Submission Summary</h2>
              </div>
              <div className="card-body space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium text-secondary-700">Author:</span> {submission.author.firstName} {submission.author.lastName}</div>
                  <div><span className="font-medium text-secondary-700">Type:</span> {submission.manuscriptType}</div>
                  <div><span className="font-medium text-secondary-700">Submitted:</span> {new Date(submission.createdAt).toLocaleDateString()}</div>
                  <div><span className="font-medium text-secondary-700">Review Type:</span> {submission.isDoubleBlind ? 'Double-blind' : 'Single-blind'}</div>
                </div>
                <div>
                  <span className="font-medium text-secondary-700">Keywords:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {submission.keywords.map((keyword, index) => (
                      <span key={index} className="bg-secondary-100 text-secondary-700 px-2 py-1 rounded text-xs">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Review Summary */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-secondary-900">Review Summary</h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{reviews.length}</div>
                    <p className="text-secondary-600">Total Reviews</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{completedReviews.length}</div>
                    <p className="text-secondary-600">Completed</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{reviews.length - completedReviews.length}</div>
                    <p className="text-secondary-600">Pending</p>
                  </div>
                </div>

                {Object.keys(counts).length > 0 && (
                  <div className="bg-secondary-50 p-4 rounded-lg">
                    <h3 className="font-medium text-secondary-900 mb-2">Reviewer Recommendations</h3>
                    <div className="space-y-2">
                      {Object.entries(counts).map(([rec, count]) => (
                        <div key={rec} className="flex justify-between items-center">
                          <span className={`font-medium ${getDecisionColor(rec)}`}>
                            {formatDecision(rec)}
                          </span>
                          <span className="text-secondary-600">{count} reviewer(s)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-4">
              {completedReviews.map((review, index) => (
                <div key={review.id} className="card">
                  <div className="card-header">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-secondary-900">
                        Review {index + 1}
                      </h3>
                      {review.recommendation && (
                        <Badge variant={review.recommendation === 'ACCEPT' ? 'success' :
                          review.recommendation === 'REJECT' ? 'error' : 'warning'}>
                          {formatDecision(review.recommendation)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="card-body space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-secondary-600">
                      <div><span className="font-medium">Reviewer:</span> {submission.isDoubleBlind ? 'Anonymous' : `${review.reviewer.firstName} ${review.reviewer.lastName}`}</div>
                      <div><span className="font-medium">Submitted:</span> {review.submittedAt ? new Date(review.submittedAt).toLocaleDateString() : 'N/A'}</div>
                      {review.rating && (
                        <div><span className="font-medium">Rating:</span> {review.rating}/10</div>
                      )}
                    </div>

                    {review.authorComments && (
                      <div>
                        <h4 className="font-medium text-secondary-900 mb-2">Comments for Author</h4>
                        <div className="bg-secondary-50 p-3 rounded text-sm text-secondary-700 whitespace-pre-wrap">
                          {review.authorComments}
                        </div>
                      </div>
                    )}

                    {review.confidentialComments && (
                      <div>
                        <h4 className="font-medium text-secondary-900 mb-2">Confidential Comments for Editor</h4>
                        <div className="bg-yellow-50 p-3 rounded text-sm text-secondary-700 whitespace-pre-wrap">
                          {review.confidentialComments}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => navigate(`/editor/review/${review.id}`)}
                      className="text-sm text-primary-600 hover:text-primary-800"
                    >
                      View Full Review →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Decision Panel */}
          <div className="space-y-6">
            <div className="card sticky top-4">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-secondary-900">Editorial Decision</h2>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Decision <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={decision}
                    onChange={(e) => setDecision(e.target.value as any)}
                    className="w-full border border-secondary-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select decision...</option>
                    <option value="ACCEPT">Accept</option>
                    <option value="MINOR_REVISION">Minor Revision</option>
                    <option value="MAJOR_REVISION">Major Revision</option>
                    <option value="REJECT">Reject</option>
                  </select>
                </div>

                {(decision === 'MINOR_REVISION' || decision === 'MAJOR_REVISION') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Revision Deadline <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={revisionDeadline}
                        onChange={(e) => setRevisionDeadline(e.target.value)}
                        className="w-full border border-secondary-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={requireReReview}
                          onChange={(e) => setRequireReReview(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm">Require re-review after revision</span>
                      </label>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Comments to Author <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={8}
                    className="w-full border border-secondary-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Provide detailed feedback to the author based on the reviews..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Confidential Comments (Internal)
                  </label>
                  <textarea
                    value={confidentialComments}
                    onChange={(e) => setConfidentialComments(e.target.value)}
                    rows={4}
                    className="w-full border border-secondary-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Internal notes not shared with author..."
                  />
                </div>

                <button
                  onClick={handleDecision}
                  disabled={processing || !decision || !comments.trim()}
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {processing ? 'Submitting Decision...' : 'Submit Editorial Decision'}
                </button>

                <div className="text-xs text-secondary-500 text-center">
                  This decision will be sent to the author and cannot be undone.
                </div>
              </div>
            </div>

            {/* Decision Guidelines */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-secondary-900">Decision Guidelines</h3>
              </div>
              <div className="card-body text-sm space-y-2">
                <div>
                  <span className="font-medium text-green-600">Accept:</span>
                  <p className="text-secondary-600">Manuscript is ready for publication with minimal or no changes.</p>
                </div>
                <div>
                  <span className="font-medium text-yellow-600">Minor Revision:</span>
                  <p className="text-secondary-600">Small changes needed, typically completed within 30 days.</p>
                </div>
                <div>
                  <span className="font-medium text-orange-600">Major Revision:</span>
                  <p className="text-secondary-600">Significant changes required, may need re-review, typically 60 days.</p>
                </div>
                <div>
                  <span className="font-medium text-red-600">Reject:</span>
                  <p className="text-secondary-600">Manuscript does not meet publication standards.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorialDecision;