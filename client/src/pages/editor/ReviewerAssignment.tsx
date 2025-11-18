import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { editorService } from '@/services/editorService';
import { Submission, User, Review } from '@/types';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';

const ReviewerAssignment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [availableReviewers, setAvailableReviewers] = useState<User[]>([]);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [invitationData, setInvitationData] = useState<{[key: string]: { dueDate: string; message: string }}>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expertiseFilter, setExpertiseFilter] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const [submissionData, reviewersData] = await Promise.all([
        editorService.getSubmissionForEditor(id!),
        editorService.getAvailableReviewers(id!, { excludeConflicts: true })
      ]);
      
      setSubmission(submissionData);
      setAvailableReviewers(reviewersData);
      
      // Initialize invitation data with default values
      const defaultInvitations: {[key: string]: { dueDate: string; message: string }} = {};
      reviewersData.forEach(reviewer => {
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + 21); // 3 weeks from now
        defaultInvitations[reviewer.id] = {
          dueDate: defaultDueDate.toISOString().split('T')[0],
          message: `Dear ${reviewer.firstName} ${reviewer.lastName},\n\nWe would like to invite you to review the manuscript titled "${submissionData.title}" for our journal.\n\nPlease let us know if you can complete this review by the specified deadline.\n\nBest regards,\nEditorial Team`
        };
      });
      setInvitationData(defaultInvitations);
      
    } catch (error) {
      console.error('Failed to load data:', error);
      setMessage({ text: 'Failed to load submission or reviewers', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewerSelection = (reviewerId: string) => {
    setSelectedReviewers(prev => 
      prev.includes(reviewerId) 
        ? prev.filter(id => id !== reviewerId)
        : [...prev, reviewerId]
    );
  };

  const updateInvitationData = (reviewerId: string, field: 'dueDate' | 'message', value: string) => {
    setInvitationData(prev => ({
      ...prev,
      [reviewerId]: {
        ...prev[reviewerId],
        [field]: value
      }
    }));
  };

  const sendInvitations = async () => {
    if (selectedReviewers.length === 0) {
      setMessage({ text: 'Please select at least one reviewer', type: 'error' });
      return;
    }

    setProcessing(true);
    try {
      const invitationPromises = selectedReviewers.map(reviewerId => {
        const dateStr = invitationData[reviewerId].dueDate;
        const isoDateTime = `${dateStr}T23:59:59Z`;
        return editorService.inviteReviewer(id!, {
          reviewerId,
          dueDate: isoDateTime,
          message: invitationData[reviewerId].message
        });
      });

      await Promise.all(invitationPromises);
      
      setMessage({ 
        text: `Successfully sent ${selectedReviewers.length} reviewer invitation(s)`, 
        type: 'success' 
      });
      
      setTimeout(() => {
        navigate(`/editor/submission/${id}/reviews`);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to send invitations:', error);
      setMessage({ text: 'Failed to send reviewer invitations', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const filteredReviewers = availableReviewers.filter(reviewer => {
    const matchesSearch = searchTerm === '' || 
      `${reviewer.firstName} ${reviewer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reviewer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reviewer.affiliation?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesExpertise = expertiseFilter === '' || 
      reviewer.bio?.toLowerCase().includes(expertiseFilter.toLowerCase());
    
    return matchesSearch && matchesExpertise;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-secondary-600 mt-2">Loading reviewers...</p>
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
        <h1 className="text-3xl font-bold text-secondary-900">Assign Reviewers</h1>
        <p className="text-secondary-600 mt-2">
          Select and invite reviewers for: <span className="font-medium">{submission.title}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submission Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-secondary-900">Submission Summary</h2>
            </div>
            <div className="card-body space-y-3">
              <div>
                <span className="text-sm font-medium text-secondary-700">Author:</span>
                <p className="text-sm text-secondary-900">{submission.author.firstName} {submission.author.lastName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-secondary-700">Type:</span>
                <p className="text-sm text-secondary-900">{submission.manuscriptType}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-secondary-700">Keywords:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {submission.keywords.slice(0, 5).map((keyword, index) => (
                    <span key={index} className="bg-secondary-100 text-secondary-700 px-2 py-1 rounded text-xs">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-secondary-700">Review Type:</span>
                <p className="text-sm text-secondary-900">{submission.isDoubleBlind ? 'Double-blind' : 'Single-blind'}</p>
              </div>
              
              {selectedReviewers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-secondary-200">
                  <span className="text-sm font-medium text-secondary-700">Selected Reviewers:</span>
                  <p className="text-lg font-bold text-primary-600">{selectedReviewers.length}</p>
                  <button
                    onClick={sendInvitations}
                    disabled={processing}
                    className="w-full mt-3 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Sending...' : `Send ${selectedReviewers.length} Invitation(s)`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviewer Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Filters */}
          <div className="card">
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Search Reviewers
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Name, email, or affiliation..."
                    className="w-full border border-secondary-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Filter by Expertise
                  </label>
                  <input
                    type="text"
                    value={expertiseFilter}
                    onChange={(e) => setExpertiseFilter(e.target.value)}
                    placeholder="Research area or keyword..."
                    className="w-full border border-secondary-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Available Reviewers */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-secondary-900">
                Available Reviewers ({filteredReviewers.length})
              </h2>
            </div>
            <div className="card-body">
              {filteredReviewers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-secondary-600">No reviewers found matching your criteria.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviewers.map((reviewer) => {
                    const isSelected = selectedReviewers.includes(reviewer.id);
                    return (
                      <div key={reviewer.id} className={`border rounded-lg p-4 ${isSelected ? 'border-primary-300 bg-primary-50' : 'border-secondary-200'}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleReviewerSelection(reviewer.id)}
                                className="mr-3"
                              />
                              <h3 className="font-medium text-secondary-900">
                                {reviewer.firstName} {reviewer.lastName}
                              </h3>
                              {reviewer.title && (
                                <span className="ml-2 text-sm text-secondary-600">({reviewer.title})</span>
                              )}
                            </div>
                            <div className="text-sm text-secondary-600 space-y-1">
                              <p><span className="font-medium">Email:</span> {reviewer.email}</p>
                              {reviewer.affiliation && (
                                <p><span className="font-medium">Affiliation:</span> {reviewer.affiliation}</p>
                              )}
                              {reviewer.country && (
                                <p><span className="font-medium">Country:</span> {reviewer.country}</p>
                              )}
                              {reviewer.bio && (
                                <p><span className="font-medium">Expertise:</span> {reviewer.bio}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="mt-4 pt-4 border-t border-primary-200 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">
                                  Review Deadline
                                </label>
                                <input
                                  type="date"
                                  value={invitationData[reviewer.id]?.dueDate || ''}
                                  onChange={(e) => updateInvitationData(reviewer.id, 'dueDate', e.target.value)}
                                  className="w-full border border-secondary-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Invitation Message
                              </label>
                              <textarea
                                value={invitationData[reviewer.id]?.message || ''}
                                onChange={(e) => updateInvitationData(reviewer.id, 'message', e.target.value)}
                                rows={4}
                                className="w-full border border-secondary-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Personalized invitation message..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewerAssignment;