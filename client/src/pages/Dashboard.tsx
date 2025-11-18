import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { submissionService } from '@/services/submissionService';
import { Submission, SubmissionStatus } from '@/types';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
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
      
      case 'reviewer':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  Pending Reviews
                </h3>
                <p className="text-secondary-600 mb-4">
                  Manuscripts awaiting your review
                </p>
                <div className="text-2xl font-bold text-primary-600 mb-2">3</div>
                <button className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors">
                  View Reviews
                </button>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  Review History
                </h3>
                <p className="text-secondary-600 mb-4">
                  Your completed reviews
                </p>
                <div className="text-2xl font-bold text-secondary-600 mb-2">12</div>
                <button className="w-full bg-secondary-600 text-white py-2 px-4 rounded-md hover:bg-secondary-700 transition-colors">
                  View History
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'editor':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  New Submissions
                </h3>
                <div className="text-2xl font-bold text-blue-600 mb-2">5</div>
                <p className="text-secondary-600">Awaiting assignment</p>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  Under Review
                </h3>
                <div className="text-2xl font-bold text-yellow-600 mb-2">8</div>
                <p className="text-secondary-600">In peer review</p>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  Pending Decision
                </h3>
                <div className="text-2xl font-bold text-orange-600 mb-2">3</div>
                <p className="text-secondary-600">Awaiting editorial decision</p>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  Ready to Publish
                </h3>
                <div className="text-2xl font-bold text-green-600 mb-2">2</div>
                <p className="text-secondary-600">Accepted manuscripts</p>
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