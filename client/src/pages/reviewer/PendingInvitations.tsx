import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reviewService } from '@/services/reviewService';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';

interface Invitation {
  id: string;
  status: string;
  invitedAt: string;
  respondedAt?: string;
  responseNotes?: string;
  review: {
    id: string;
    dueDate: string;
    submission: {
      id: string;
      title: string;
      abstract: string;
      status: string;
      author: {
        id: string;
        firstName: string;
        lastName: string;
      };
    };
  };
}

const PendingInvitations: React.FC = () => {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseNotes, setResponseNotes] = useState<{ [key: string]: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const limit = 10;

  useEffect(() => {
    loadInvitations();
  }, [currentPage]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reviewService.getPendingInvitations({
        page: currentPage,
        limit
      });
      setInvitations(data.invitations);
      setPagination(data.pagination);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load invitations');
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    setProcessingId(invitationId);
    setError(null);
    setSuccess(null);

    try {
      await reviewService.acceptInvitation(invitationId, responseNotes[invitationId]);
      setSuccess('Invitation accepted successfully! You can now start your review.');
      setResponseNotes(prev => {
        const updated = { ...prev };
        delete updated[invitationId];
        return updated;
      });
      setTimeout(() => {
        loadInvitations();
      }, 1500);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to accept invitation. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    setProcessingId(invitationId);
    setError(null);
    setSuccess(null);

    try {
      await reviewService.declineInvitation(invitationId, responseNotes[invitationId]);
      setSuccess('Invitation declined. Thank you for your response.');
      setResponseNotes(prev => {
        const updated = { ...prev };
        delete updated[invitationId];
        return updated;
      });
      setTimeout(() => {
        loadInvitations();
      }, 1500);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to decline invitation. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const calculateDaysRemaining = (dueDate: string) => {
    const deadline = new Date(dueDate);
    const now = new Date();
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  if (loading && invitations.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-secondary-600 mt-2">Loading invitations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          ← Back to Dashboard
        </Button>
        
        <h1 className="text-4xl font-bold text-secondary-900 mb-2">
          Review Invitations
        </h1>
        <p className="text-secondary-600">
          Manage your pending review invitations
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

      {invitations.length === 0 ? (
        <div className="card">
          <div className="card-body text-center">
            <p className="text-secondary-600 mb-4">No pending review invitations</p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {invitations.map((invitation) => {
              const daysLeft = calculateDaysRemaining(invitation.review.dueDate);
              const isUrgent = daysLeft <= 7 && daysLeft > 0;
              const isOverdue = daysLeft <= 0;

              return (
                <div key={invitation.id} className="card hover:shadow-lg transition-shadow">
                  <div className="card-header">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-secondary-900">
                          {invitation.review.submission.title}
                        </h3>
                        <p className="text-sm text-secondary-600 mt-1">
                          By {invitation.review.submission.author.firstName} {invitation.review.submission.author.lastName}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {isOverdue && (
                          <Badge variant="error">Overdue</Badge>
                        )}
                        {isUrgent && !isOverdue && (
                          <Badge variant="warning">Due Soon</Badge>
                        )}
                        {!isUrgent && !isOverdue && (
                          <Badge variant="info">Pending</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="mb-4">
                      <p className="text-sm text-secondary-600 mb-2">Abstract:</p>
                      <p className="text-secondary-900 line-clamp-2">
                        {invitation.review.submission.abstract}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-secondary-50 rounded-lg">
                      <div>
                        <p className="text-xs font-medium text-secondary-600">Invited On</p>
                        <p className="text-sm text-secondary-900">
                          {new Date(invitation.invitedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-secondary-600">Due Date</p>
                        <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-secondary-900'}`}>
                          {new Date(invitation.review.dueDate).toLocaleDateString()}
                        </p>
                        <p className={`text-xs ${isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-secondary-600'}`}>
                          {isOverdue 
                            ? `${Math.abs(daysLeft)} days overdue`
                            : `${daysLeft} days remaining`
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-secondary-600">Submission Status</p>
                        <p className="text-sm text-secondary-900">{invitation.review.submission.status}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="text-sm font-medium text-secondary-700 block mb-2">
                        Response Notes (Optional)
                      </label>
                      <textarea
                        value={responseNotes[invitation.id] || ''}
                        onChange={(e) => setResponseNotes(prev => ({
                          ...prev,
                          [invitation.id]: e.target.value
                        }))}
                        placeholder="Add any notes about your acceptance or declination..."
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-900 placeholder-secondary-500"
                        rows={2}
                        disabled={processingId === invitation.id}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleAccept(invitation.id)}
                        disabled={processingId === invitation.id}
                        className="flex-1"
                      >
                        {processingId === invitation.id ? 'Processing...' : 'Accept Invitation'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => handleDecline(invitation.id)}
                        disabled={processingId === invitation.id}
                        className="flex-1"
                      >
                        {processingId === invitation.id ? 'Processing...' : 'Decline Invitation'}
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => navigate(`/review/${invitation.review.id}`)}
                        className="flex-1"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg ${
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'border border-secondary-300 text-secondary-900 hover:bg-secondary-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PendingInvitations;
