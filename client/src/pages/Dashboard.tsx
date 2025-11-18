import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { submissionService } from '@/services/submissionService';
import { reviewerService } from '@/services/reviewerService';
import { editorService, EditorStats } from '@/services/editorService';
import adminService, { AdminStats } from '@/services/adminService';
import { Submission, SubmissionStatus, Review, ReviewStatus } from '@/types';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editorStats, setEditorStats] = useState<EditorStats | null>(null);
  const [editorSubmissions, setEditorSubmissions] = useState<Submission[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (location.state?.message) {
      setMessage({
        text: location.state.message,
        type: location.state.type || 'success'
      });
      // Clear the message from location state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    if (user?.role === 'AUTHOR') {
      loadSubmissions();
    } else if (user?.role === 'REVIEWER') {
      loadReviews();
    } else if (user?.role === 'EDITOR') {
      loadEditorData();
    } else if (user?.role === 'ADMIN') {
      loadAdminData();
    }
  }, [user]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const { submissions } = await submissionService.getSubmissions();
      setSubmissions(submissions);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    setLoading(true);
    try {
      const reviews = await reviewerService.getReviewInvitations();
      setReviews(reviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEditorData = async () => {
    setLoading(true);
    try {
      console.log('Loading editor data...');
      const [stats, { submissions }] = await Promise.all([
        editorService.getEditorStats(),
        editorService.getSubmissionsForEditor({ limit: 10 })
      ]);
      console.log('Editor stats:', stats);
      console.log('Editor submissions:', submissions);
      setEditorStats(stats);
      setEditorSubmissions(submissions);
    } catch (error) {
      console.error('Failed to load editor data:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const stats = await adminService.getAdminStats();
      setAdminStats(stats);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusBadgeVariant = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.SUBMITTED:
      case SubmissionStatus.INITIAL_REVIEW:
        return 'info';
      case SubmissionStatus.UNDER_REVIEW:
        return 'warning';
      case SubmissionStatus.REVISION_REQUIRED:
        return 'warning';
      case SubmissionStatus.ACCEPTED:
        return 'success';
      case SubmissionStatus.PUBLISHED:
        return 'success';
      case SubmissionStatus.REJECTED:
        return 'error';
      default:
        return 'secondary';
    }
  };

  const formatStatus = (status: SubmissionStatus) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getReviewStatusBadgeVariant = (status: ReviewStatus) => {
    switch (status) {
      case ReviewStatus.PENDING:
        return 'warning';
      case ReviewStatus.IN_PROGRESS:
        return 'info';
      case ReviewStatus.COMPLETED:
        return 'success';
      case ReviewStatus.DECLINED:
        return 'secondary';
      case ReviewStatus.OVERDUE:
        return 'error';
      default:
        return 'secondary';
    }
  };

  const formatReviewStatus = (status: ReviewStatus) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const isReviewOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getRoleSpecificContent = () => {
    switch (user?.role) {
      case 'AUTHOR':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    Submit New Manuscript
                  </h3>
                  <p className="text-secondary-600 mb-4">
                    Start a new submission to the journal
                  </p>
                  <button 
                    onClick={() => navigate('/submit-paper')}
                    className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors"
                  >
                    Submit Manuscript
                  </button>
                </div>
              </div>
              
              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    My Submissions
                  </h3>
                  <p className="text-secondary-600 mb-4">
                    {submissions.length} total submissions
                  </p>
                  <div className="text-2xl font-bold text-primary-600 mb-2">{submissions.length}</div>
                </div>
              </div>
              
              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    Author Guidelines
                  </h3>
                  <p className="text-secondary-600 mb-4">
                    Review submission requirements
                  </p>
                  <button 
                    onClick={() => navigate('/author-guidelines')}
                    className="w-full bg-secondary-600 text-white py-2 px-4 rounded-md hover:bg-secondary-700 transition-colors"
                  >
                    View Guidelines
                  </button>
                </div>
              </div>
            </div>

            {/* Submissions List */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-secondary-900">
                  My Submissions
                </h2>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-secondary-600 mt-2">Loading submissions...</p>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-secondary-600">No submissions yet.</p>
                    <button 
                      onClick={() => navigate('/submit-paper')}
                      className="mt-4 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors"
                    >
                      Submit Your First Manuscript
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="border border-secondary-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-secondary-900 flex-1 mr-4">
                            {submission.title}
                          </h3>
                          <Badge variant={getStatusBadgeVariant(submission.status)}>
                            {formatStatus(submission.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-secondary-600 mb-2">
                          Submitted: {new Date(submission.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-secondary-600 mb-3">
                          Type: {submission.manuscriptType}
                        </p>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => navigate(`/submission/${submission.id}`)}
                            className="text-sm bg-secondary-100 text-secondary-700 px-3 py-1 rounded hover:bg-secondary-200 transition-colors"
                          >
                            View Details
                          </button>
                          {submission.status === SubmissionStatus.REVISION_REQUIRED && (
                            <button 
                              onClick={() => navigate(`/submission/${submission.id}/revise`)}
                              className="text-sm bg-warning-100 text-warning-700 px-3 py-1 rounded hover:bg-warning-200 transition-colors"
                            >
                              Submit Revision
                            </button>
                          )}
                          {submission.status === SubmissionStatus.ACCEPTED && (
                            <button 
                              onClick={() => navigate(`/submission/${submission.id}/payment`)}
                              className="text-sm bg-success-100 text-success-700 px-3 py-1 rounded hover:bg-success-200 transition-colors"
                            >
                              Pay APC Fee
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'REVIEWER':
        const pendingReviews = reviews.filter(r => r.status === ReviewStatus.PENDING || r.status === ReviewStatus.IN_PROGRESS);
        const completedReviews = reviews.filter(r => r.status === ReviewStatus.COMPLETED);
        const overdueReviews = reviews.filter(r => r.status === ReviewStatus.IN_PROGRESS && isReviewOverdue(r.dueDate));
        
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    Pending Reviews
                  </h3>
                  <p className="text-secondary-600 mb-4">
                    Manuscripts awaiting your review
                  </p>
                  <div className="text-2xl font-bold text-primary-600 mb-2">{pendingReviews.length}</div>
                  {overdueReviews.length > 0 && (
                    <p className="text-sm text-red-600 mb-2">
                      {overdueReviews.length} overdue
                    </p>
                  )}
                </div>
              </div>
              
              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    Completed Reviews
                  </h3>
                  <p className="text-secondary-600 mb-4">
                    Your review history
                  </p>
                  <div className="text-2xl font-bold text-success-600 mb-2">{completedReviews.length}</div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    Total Reviews
                  </h3>
                  <p className="text-secondary-600 mb-4">
                    All time review count
                  </p>
                  <div className="text-2xl font-bold text-secondary-600 mb-2">{reviews.length}</div>
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-secondary-900">
                  Review Invitations
                </h2>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-secondary-600 mt-2">Loading reviews...</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-secondary-600">No review invitations yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => {
                      const overdue = review.status === ReviewStatus.IN_PROGRESS && isReviewOverdue(review.dueDate);
                      const daysLeft = Math.ceil((new Date(review.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div key={review.id} className="border border-secondary-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-secondary-900 flex-1 mr-4">
                              {review.submission.title}
                            </h3>
                            <Badge variant={getReviewStatusBadgeVariant(overdue ? ReviewStatus.OVERDUE : review.status)}>
                              {overdue ? 'Overdue' : formatReviewStatus(review.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-secondary-600 mb-2">
                            Invited: {new Date(review.invitedAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-secondary-600 mb-2">
                            Due: {new Date(review.dueDate).toLocaleDateString()}
                            {review.status === ReviewStatus.IN_PROGRESS && (
                              <span className={`ml-2 ${overdue ? 'text-red-600' : daysLeft <= 3 ? 'text-yellow-600' : 'text-secondary-600'}`}>
                                ({overdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`})
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-secondary-600 mb-3">
                            Type: {review.submission.manuscriptType} • {review.submission.isDoubleBlind ? 'Double-blind' : 'Single-blind'}
                          </p>
                          <div className="flex space-x-2">
                            {review.status === ReviewStatus.PENDING && (
                              <button 
                                onClick={() => navigate(`/review-invitation/${review.id}`)}
                                className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded hover:bg-primary-200 transition-colors"
                              >
                                Respond to Invitation
                              </button>
                            )}
                            {review.status === ReviewStatus.IN_PROGRESS && (
                              <button 
                                onClick={() => navigate(`/review/${review.id}`)}
                                className="text-sm bg-info-100 text-info-700 px-3 py-1 rounded hover:bg-info-200 transition-colors"
                              >
                                Continue Review
                              </button>
                            )}
                            {review.status === ReviewStatus.COMPLETED && (
                              <button 
                                onClick={() => navigate(`/review/${review.id}`)}
                                className="text-sm bg-success-100 text-success-700 px-3 py-1 rounded hover:bg-success-200 transition-colors"
                              >
                                View Review
                              </button>
                            )}
                            {review.status === ReviewStatus.COMPLETED && (
                              <button 
                                onClick={() => navigate(`/review/${review.id}/certificate`)}
                                className="text-sm bg-secondary-100 text-secondary-700 px-3 py-1 rounded hover:bg-secondary-200 transition-colors"
                              >
                                Get Certificate
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'EDITOR':
        return (
          <div className="space-y-6">
            {/* Editor Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    New Submissions
                  </h3>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {editorStats?.pendingReview || 0}
                  </div>
                  <p className="text-secondary-600">Awaiting initial review</p>
                  <button 
                    onClick={() => navigate('/editor/submissions?status=SUBMITTED')}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    View all →
                  </button>
                </div>
              </div>
              
              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    Under Review
                  </h3>
                  <div className="text-2xl font-bold text-yellow-600 mb-2">
                    {editorStats?.underReview || 0}
                  </div>
                  <p className="text-secondary-600">In peer review</p>
                  <button 
                    onClick={() => navigate('/editor/submissions?status=UNDER_REVIEW')}
                    className="mt-2 text-sm text-yellow-600 hover:text-yellow-800"
                  >
                    Manage reviews →
                  </button>
                </div>
              </div>
              
              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    Awaiting Decision
                  </h3>
                  <div className="text-2xl font-bold text-orange-600 mb-2">
                    {editorStats?.awaitingDecision || 0}
                  </div>
                  <p className="text-secondary-600">Reviews completed</p>
                  <button 
                    onClick={() => navigate('/editor/decisions')}
                    className="mt-2 text-sm text-orange-600 hover:text-orange-800"
                  >
                    Make decisions →
                  </button>
                </div>
              </div>
              
              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    Accepted
                  </h3>
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {editorStats?.accepted || 0}
                  </div>
                  <p className="text-secondary-600">Ready for production</p>
                  <button 
                    onClick={() => navigate('/editor/production')}
                    className="mt-2 text-sm text-green-600 hover:text-green-800"
                  >
                    Manage production →
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => navigate('/editor/submissions/new')}
                      className="w-full text-left bg-blue-50 text-blue-700 px-3 py-2 rounded hover:bg-blue-100 transition-colors"
                    >
                      Screen New Submissions
                    </button>
                    <button 
                      onClick={() => navigate('/editor/reviewers')}
                      className="w-full text-left bg-purple-50 text-purple-700 px-3 py-2 rounded hover:bg-purple-100 transition-colors"
                    >
                      Manage Reviewers
                    </button>
                    <button 
                      onClick={() => navigate('/editor/issues')}
                      className="w-full text-left bg-green-50 text-green-700 px-3 py-2 rounded hover:bg-green-100 transition-colors"
                    >
                      Manage Issues
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    Overdue Reviews
                  </h3>
                  <div className="text-2xl font-bold text-red-600 mb-2">
                    {/* This would come from overdue reviews API */}
                    0
                  </div>
                  <p className="text-secondary-600 mb-2">Reviews past deadline</p>
                  <button 
                    onClick={() => navigate('/editor/reviews/overdue')}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Send reminders →
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    This Month
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Published:</span>
                      <span className="font-medium">{editorStats?.published || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Rejected:</span>
                      <span className="font-medium">{editorStats?.rejected || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Total:</span>
                      <span className="font-medium">{editorStats?.totalSubmissions || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Submissions */}
            <div className="card">
              <div className="card-header">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-secondary-900">
                    Recent Submissions
                  </h2>
                  <button 
                    onClick={() => navigate('/editor/submissions')}
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    View all submissions →
                  </button>
                </div>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-secondary-600 mt-2">Loading submissions...</p>
                  </div>
                ) : editorSubmissions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-secondary-600">No submissions to review.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {editorSubmissions.map((submission) => (
                      <div key={submission.id} className="border border-secondary-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-secondary-900 flex-1 mr-4">
                            {submission.title}
                          </h3>
                          <Badge variant={getStatusBadgeVariant(submission.status)}>
                            {formatStatus(submission.status)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-secondary-600 mb-3">
                          <div>
                            <span className="font-medium">Author:</span> {submission.author.firstName} {submission.author.lastName}
                          </div>
                          <div>
                            <span className="font-medium">Submitted:</span> {new Date(submission.createdAt).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> {submission.manuscriptType}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => navigate(`/editor/submission/${submission.id}`)}
                            className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded hover:bg-primary-200 transition-colors"
                          >
                            Review Submission
                          </button>
                          {submission.status === SubmissionStatus.SUBMITTED && (
                            <button 
                              onClick={() => navigate(`/editor/submission/${submission.id}/screen`)}
                              className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors"
                            >
                              Initial Screening
                            </button>
                          )}
                          {submission.status === SubmissionStatus.INITIAL_REVIEW && (
                            <button 
                              onClick={() => navigate(`/editor/submission/${submission.id}/assign-reviewers`)}
                              className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 transition-colors"
                            >
                              Assign Reviewers
                            </button>
                          )}
                          {submission.status === SubmissionStatus.UNDER_REVIEW && (
                            <button 
                              onClick={() => navigate(`/editor/submission/${submission.id}/reviews`)}
                              className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200 transition-colors"
                            >
                              Track Reviews
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'ADMIN':
        return (
          <div className="space-y-6">
            {/* Admin Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    Total Users
                  </h3>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {adminStats?.totalUsers || 0}
                  </div>
                  <div className="text-sm text-secondary-600 space-y-1">
                    <div>Authors: {adminStats?.totalAuthors || 0}</div>
                    <div>Editors: {adminStats?.totalEditors || 0}</div>
                    <div>Reviewers: {adminStats?.totalReviewers || 0}</div>
                  </div>
                  <button 
                    onClick={() => navigate('/admin/users')}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Manage users →
                  </button>
                </div>
              </div>
              
              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    Submissions
                  </h3>
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {adminStats?.totalSubmissions || 0}
                  </div>
                  <div className="text-sm text-secondary-600 space-y-1">
                    <div>Pending: {adminStats?.pendingSubmissions || 0}</div>
                    <div>Published: {adminStats?.publishedArticles || 0}</div>
                  </div>
                  <button 
                    onClick={() => navigate('/admin/monitoring')}
                    className="mt-2 text-sm text-green-600 hover:text-green-800"
                  >
                    View analytics →
                  </button>
                </div>
              </div>
              
              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    Revenue
                  </h3>
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    ${adminStats?.totalRevenue?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-secondary-600">
                    Pending: {adminStats?.pendingPayments || 0} payments
                  </div>
                  <button 
                    onClick={() => navigate('/admin/payments')}
                    className="mt-2 text-sm text-purple-600 hover:text-purple-800"
                  >
                    Manage payments →
                  </button>
                </div>
              </div>
              
              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    System Health
                  </h3>
                  <div className={`text-2xl font-bold mb-2 ${
                    adminStats?.systemHealth === 'healthy' ? 'text-green-600' :
                    adminStats?.systemHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {adminStats?.systemHealth === 'healthy' ? '✓' :
                     adminStats?.systemHealth === 'warning' ? '⚠' : '✗'}
                  </div>
                  <div className="text-sm text-secondary-600 capitalize">
                    {adminStats?.systemHealth || 'Unknown'}
                  </div>
                  <button 
                    onClick={() => navigate('/admin/monitoring')}
                    className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    View details →
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    User Management
                  </h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => navigate('/admin/users')}
                      className="w-full text-left bg-blue-50 text-blue-700 px-3 py-2 rounded hover:bg-blue-100 transition-colors"
                    >
                      Manage All Users
                    </button>
                    <button 
                      onClick={() => navigate('/admin/users?role=AUTHOR')}
                      className="w-full text-left bg-green-50 text-green-700 px-3 py-2 rounded hover:bg-green-100 transition-colors"
                    >
                      Manage Authors
                    </button>
                    <button 
                      onClick={() => navigate('/admin/users?role=EDITOR')}
                      className="w-full text-left bg-purple-50 text-purple-700 px-3 py-2 rounded hover:bg-purple-100 transition-colors"
                    >
                      Manage Editors
                    </button>
                    <button 
                      onClick={() => navigate('/admin/users?role=REVIEWER')}
                      className="w-full text-left bg-orange-50 text-orange-700 px-3 py-2 rounded hover:bg-orange-100 transition-colors"
                    >
                      Manage Reviewers
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    System Management
                  </h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => navigate('/admin/settings')}
                      className="w-full text-left bg-gray-50 text-gray-700 px-3 py-2 rounded hover:bg-gray-100 transition-colors"
                    >
                      System Settings
                    </button>
                    <button 
                      onClick={() => navigate('/admin/issues')}
                      className="w-full text-left bg-indigo-50 text-indigo-700 px-3 py-2 rounded hover:bg-indigo-100 transition-colors"
                    >
                      Manage Issues
                    </button>
                    <button 
                      onClick={() => navigate('/admin/monitoring')}
                      className="w-full text-left bg-teal-50 text-teal-700 px-3 py-2 rounded hover:bg-teal-100 transition-colors"
                    >
                      System Monitoring
                    </button>
                    <button 
                      onClick={() => navigate('/admin/reports')}
                      className="w-full text-left bg-pink-50 text-pink-700 px-3 py-2 rounded hover:bg-pink-100 transition-colors"
                    >
                      Generate Reports
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    Financial & Support
                  </h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => navigate('/admin/payments')}
                      className="w-full text-left bg-emerald-50 text-emerald-700 px-3 py-2 rounded hover:bg-emerald-100 transition-colors"
                    >
                      Payment Management
                    </button>
                    <button 
                      onClick={() => navigate('/admin/complaints')}
                      className="w-full text-left bg-red-50 text-red-700 px-3 py-2 rounded hover:bg-red-100 transition-colors"
                    >
                      Handle Complaints
                    </button>
                    <button 
                      onClick={() => navigate('/admin/monitoring')}
                      className="w-full text-left bg-yellow-50 text-yellow-700 px-3 py-2 rounded hover:bg-yellow-100 transition-colors"
                    >
                      System Backup
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* System Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-secondary-900">
                    Recent Activity
                  </h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">New submissions today:</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">Reviews completed:</span>
                      <span className="font-medium">8</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">New user registrations:</span>
                      <span className="font-medium">5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">Payments processed:</span>
                      <span className="font-medium">$2,450</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-secondary-900">
                    Alerts & Notifications
                  </h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div className="text-sm">
                        <div className="font-medium text-red-700">System Backup Overdue</div>
                        <div className="text-secondary-600">Last backup: 3 days ago</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div className="text-sm">
                        <div className="font-medium text-yellow-700">5 Overdue Reviews</div>
                        <div className="text-secondary-600">Require editor attention</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="text-sm">
                        <div className="font-medium text-blue-700">New Complaint Filed</div>
                        <div className="text-secondary-600">Requires investigation</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="card">
            <div className="card-body text-center">
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Welcome to the Journal
              </h3>
              <p className="text-secondary-600">
                Please contact an administrator to set up your account role.
              </p>
            </div>
          </div>
        );
    }
  };

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
        <h1 className="text-3xl font-bold text-secondary-900">
          {getWelcomeMessage()}, {user?.firstName}
        </h1>
        <p className="text-secondary-600 mt-2">
          Welcome to your dashboard. Here's what's happening with your account.
        </p>
      </div>

      {getRoleSpecificContent()}

      <div className="mt-8">
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-secondary-900">
              Recent Activity
            </h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-secondary-700">
                  New issue published: Volume 12, Issue 3
                </span>
                <span className="text-secondary-500 text-sm">2 days ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-secondary-700">
                  System maintenance completed successfully
                </span>
                <span className="text-secondary-500 text-sm">1 week ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-secondary-700">
                  New reviewer guidelines published
                </span>
                <span className="text-secondary-500 text-sm">2 weeks ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;