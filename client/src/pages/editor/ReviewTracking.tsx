import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { editorService } from '@/services/editorService';
import { Submission, Review, ReviewStatus } from '@/types';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';

const ReviewTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [reminderMessage, setReminderMessage] = useState('');
  const [extensionData, setExtensionData] = useState<{[key: string]: { newDate: string; reason: string }}>({});
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    } else {
      loadAllSubmissions();
    }
  }, [id]);

  const loadAllSubmissions = async () => {
    try {
      const { submissions } = await editorService.getSubmissionsForEditor({ limit: 50 });
      setSubmissions(submissions);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      setMessage({ text: 'Failed to load submissions', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [submissionData, reviewsData] = await Promise.all([
        editorService.getSubmissionForEditor(id!),
        editorService.getReviewsForSubmission(id!)
      ]);
      
      setSubmission(submissionData);
      setReviews(reviewsData);
      
      // Initialize extension data
      const defaultExtensions: {[key: string]: { newDate: string; reason: string }} = {};
      reviewsData.forEach(review => {
        const currentDate = new Date(review.dueDate);
        currentDate.setDate(currentDate.getDate() + 14); // Default 2 weeks extension
        defaultExtensions[review.id] = {
          newDate: currentDate.toISOString().split('T')[0],
          reason: 'Additional time requested for thorough review'
        };
      });
      setExtensionData(defaultExtensions);
      
    } catch (error) {
      console.error('Failed to load data:', error);
      setMessage({ text: 'Failed to load submission or reviews', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async (reviewId: string) => {
    setProcessing(reviewId);
    try {
      await editorService.sendReviewerReminder(reviewId, reminderMessage);
      setMessage({ text: 'Reminder sent successfully', type: 'success' });
      setReminderMessage('');
      // Reload data to update reminder count
      await loadData();
    } catch (error) {
      console.error('Failed to send reminder:', error);
      setMessage({ text: 'Failed to send reminder', type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const extendDeadline = async (reviewId: string) => {
    const extension = extensionData[reviewId];
    if (!extension.newDate || !extension.reason.trim()) {
      setMessage({ text: 'Please provide new date and reason for extension', type: 'error' });
      return;
    }

    setProcessing(reviewId);
    try {
      await editorService.extendReviewDeadline(reviewId, extension.newDate, extension.reason);
      setMessage({ text: 'Deadline extended successfully', type: 'success' });
      // Reload data to show updated deadline
      await loadData();
    } catch (error) {
      console.error('Failed to extend deadline:', error);
      setMessage({ text: 'Failed to extend deadline', type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const removeReviewer = async (reviewId: string, reason: string) => {
    if (!reason.trim()) {
      setMessage({ text: 'Please provide a reason for removing the reviewer', type: 'error' });
      return;
    }

    setProcessing(reviewId);
    try {
      await editorService.removeReviewer(id!, reviewId, reason);
      setMessage({ text: 'Reviewer removed successfully', type: 'success' });
      // Reload data to update the list
      await loadData();
    } catch (error) {
      console.error('Failed to remove reviewer:', error);
      setMessage({ text: 'Failed to remove reviewer', type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const updateExtensionData = (reviewId: string, field: 'newDate' | 'reason', value: string) => {
    setExtensionData(prev => ({
      ...prev,
      [reviewId]: {
        ...prev[reviewId],
        [field]: value
      }
    }));
  };

  const getReviewStatusBadgeVariant = (status: ReviewStatus, isOverdue: boolean) => {
    if (isOverdue) return 'error';
    switch (status) {
      case ReviewStatus.PENDING:
        return 'warning';
      case ReviewStatus.IN_PROGRESS:
        return 'info';
      case ReviewStatus.COMPLETED:
        return 'success';
      case ReviewStatus.DECLINED:
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatReviewStatus = (status: ReviewStatus, isOverdue: boolean) => {
    if (isOverdue) return 'Overdue';
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const isReviewOverdue = (dueDate: string, status: ReviewStatus) => {
    return status !== ReviewStatus.COMPLETED && new Date(dueDate) < new Date();
  };

  const getDaysRemaining = (dueDate: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getCompletedReviews = () => reviews.filter(r => r.status === ReviewStatus.COMPLETED);
  const getPendingReviews = () => reviews.filter(r => r.status !== ReviewStatus.COMPLETED);
  const getOverdueReviews = () => reviews.filter(r => isReviewOverdue(r.dueDate, r.status));

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-secondary-600 mt-2">Loading review data...</p>
        </div>
      </div>
    );
  }

  if (!id && submissions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">Submissions</h1>
          <p className="text-secondary-600 mt-2">Select a submission to track reviews</p>
        </div>
        <Alert variant="info" title="No Submissions">
          No submissions found for review tracking.
        </Alert>
      </div>
    );
  }

  if (!id && submissions.length > 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">Submissions</h1>
          <p className="text-secondary-600 mt-2">Select a submission to track reviews</p>
        </div>
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div key={sub.id} className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/editor/submission/${sub.id}/reviews`)}>
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-secondary-900">{sub.title}</h3>
                    <p className="text-sm text-secondary-600 mt-1">Author: {sub.author.firstName} {sub.author.lastName}</p>
                    <p className="text-sm text-secondary-600">Status: {sub.status}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/editor/submission/${sub.id}/reviews`);
                    }}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                  >
                    Track Reviews
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="error" title="Error">
          Submission not found
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">Review Tracking</h1>
        <p className="text-secondary-600 mt-2">
          Monitor and manage reviews for: <span className="font-medium">{submission.title}</span>
        </p>
      </div>

      {/* Review Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">{reviews.length}</div>
            <p className="text-secondary-600">Total Reviews</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">{getCompletedReviews().length}</div>
            <p className="text-secondary-600">Completed</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-2">{getPendingReviews().length}</div>
            <p className="text-secondary-600">Pending</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-red-600 mb-2">{getOverdueReviews().length}</div>
            <p className="text-secondary-600">Overdue</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => navigate(`/editor/submission/${id}/assign-reviewers`)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
        >
          Add More Reviewers
        </button>
        {getCompletedReviews().length >= 2 && (
          <button
            onClick={() => navigate(`/editor/submission/${id}/decision`)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Make Editorial Decision
          </button>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-8">
              <p className="text-secondary-600 mb-4">No reviewers assigned yet.</p>
              <button
                onClick={() => navigate(`/editor/submission/${id}/assign-reviewers`)}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                Assign Reviewers
              </button>
            </div>
          </div>
        ) : (
          reviews.map((review) => {
            const overdue = isReviewOverdue(review.dueDate, review.status);
            const daysRemaining = getDaysRemaining(review.dueDate);
            
            return (
              <div key={review.id} className="card">
                <div className="card-body">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-secondary-900">
                        {review.reviewer.firstName} {review.reviewer.lastName}
                      </h3>
                      <p className="text-secondary-600">{review.reviewer.email}</p>
                      {review.reviewer.affiliation && (
                        <p className="text-secondary-600 text-sm">{review.reviewer.affiliation}</p>
                      )}
                    </div>
                    <Badge variant={getReviewStatusBadgeVariant(review.status, overdue)}>
                      {formatReviewStatus(review.status, overdue)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <span className="font-medium text-secondary-700">Invited:</span>
                      <p className="text-secondary-900">{new Date(review.invitedAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="font-medium text-secondary-700">Due Date:</span>
                      <p className={`${overdue ? 'text-red-600' : daysRemaining <= 3 ? 'text-yellow-600' : 'text-secondary-900'}`}>
                        {new Date(review.dueDate).toLocaleDateString()}
                        {review.status !== ReviewStatus.COMPLETED && (
                          <span className="ml-2">
                            ({overdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`})
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-secondary-700">Reminders Sent:</span>
                      <p className="text-secondary-900">{review.remindersSent}</p>
                    </div>
                  </div>

                  {review.status === ReviewStatus.COMPLETED && (
                    <div className="bg-green-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium text-green-900 mb-2">Review Completed</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-green-700">Submitted:</span>
                          <p className="text-green-900">{review.submittedAt ? new Date(review.submittedAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-green-700">Recommendation:</span>
                          <p className="text-green-900">{review.recommendation || 'Not specified'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/editor/review/${review.id}`)}
                        className="mt-2 text-sm text-green-600 hover:text-green-800"
                      >
                        View Full Review →
                      </button>
                    </div>
                  )}

                  {review.status !== ReviewStatus.COMPLETED && review.status !== ReviewStatus.DECLINED && (
                    <div className="space-y-4">
                      {/* Send Reminder */}
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-medium text-yellow-900 mb-2">Send Reminder</h4>
                        <div className="space-y-2">
                          <textarea
                            value={reminderMessage}
                            onChange={(e) => setReminderMessage(e.target.value)}
                            placeholder="Optional custom message for the reminder..."
                            rows={2}
                            className="w-full border border-yellow-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                          <button
                            onClick={() => sendReminder(review.id)}
                            disabled={processing === review.id}
                            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50"
                          >
                            {processing === review.id ? 'Sending...' : 'Send Reminder'}
                          </button>
                        </div>
                      </div>

                      {/* Extend Deadline */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Extend Deadline</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1">New Due Date</label>
                            <input
                              type="date"
                              value={extensionData[review.id]?.newDate || ''}
                              onChange={(e) => updateExtensionData(review.id, 'newDate', e.target.value)}
                              className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1">Reason</label>
                            <input
                              type="text"
                              value={extensionData[review.id]?.reason || ''}
                              onChange={(e) => updateExtensionData(review.id, 'reason', e.target.value)}
                              placeholder="Reason for extension..."
                              className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => extendDeadline(review.id)}
                          disabled={processing === review.id}
                          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {processing === review.id ? 'Extending...' : 'Extend Deadline'}
                        </button>
                      </div>

                      {/* Remove Reviewer */}
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-medium text-red-900 mb-2">Remove Reviewer</h4>
                        <p className="text-sm text-red-700 mb-2">
                          Use this option if the reviewer is unresponsive or unable to complete the review.
                        </p>
                        <button
                          onClick={() => {
                            const reason = prompt('Please provide a reason for removing this reviewer:');
                            if (reason) removeReviewer(review.id, reason);
                          }}
                          disabled={processing === review.id}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                          {processing === review.id ? 'Removing...' : 'Remove Reviewer'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReviewTracking;