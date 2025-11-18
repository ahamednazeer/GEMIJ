import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService, { ComplaintData } from '@/services/adminService';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';

const ComplaintHandling: React.FC = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  const [retractions, setRetractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('complaints');

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    priority: '',
    page: 1,
    limit: 20
  });

  // Resolution form
  const [resolutionForm, setResolutionForm] = useState({
    status: '',
    resolution: '',
    assignedTo: ''
  });

  useEffect(() => {
    if (activeTab === 'complaints') {
      loadComplaints();
    } else if (activeTab === 'retractions') {
      loadRetractions();
    }
  }, [activeTab, filters]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const { complaints: complaintData, pagination: paginationData } = await adminService.getAllComplaints(filters);
      setComplaints(complaintData);
      setPagination(paginationData);
    } catch (error) {
      console.error('Failed to load complaints:', error);
      setMessage({ text: 'Failed to load complaints', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadRetractions = async () => {
    setLoading(true);
    try {
      const retractionsData = await adminService.getRetractions();
      setRetractions(retractionsData);
    } catch (error) {
      console.error('Failed to load retractions:', error);
      setMessage({ text: 'Failed to load retractions', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateComplaintStatus = async (complaintId: string, status: string, resolution?: string) => {
    try {
      await adminService.updateComplaintStatus(complaintId, status, resolution);
      setMessage({ text: 'Complaint status updated successfully', type: 'success' });
      loadComplaints();
    } catch (error) {
      console.error('Failed to update complaint status:', error);
      setMessage({ text: 'Failed to update complaint status', type: 'error' });
    }
  };

  const handleAssignComplaint = async (complaintId: string, assignedTo: string) => {
    try {
      await adminService.assignComplaint(complaintId, assignedTo);
      setMessage({ text: 'Complaint assigned successfully', type: 'success' });
      loadComplaints();
    } catch (error) {
      console.error('Failed to assign complaint:', error);
      setMessage({ text: 'Failed to assign complaint', type: 'error' });
    }
  };

  const handleUpdatePriority = async (complaintId: string, priority: string) => {
    try {
      await adminService.updateComplaintPriority(complaintId, priority);
      setMessage({ text: 'Priority updated successfully', type: 'success' });
      loadComplaints();
    } catch (error) {
      console.error('Failed to update priority:', error);
      setMessage({ text: 'Failed to update priority', type: 'error' });
    }
  };

  const handleAddNote = async (complaintId: string, note: string) => {
    if (!note.trim()) return;
    
    try {
      await adminService.addComplaintNote(complaintId, note);
      setMessage({ text: 'Note added successfully', type: 'success' });
      // Reload complaint details if modal is open
      if (selectedComplaint?.id === complaintId) {
        const updatedComplaint = await adminService.getComplaintById(complaintId);
        setSelectedComplaint(updatedComplaint);
      }
    } catch (error) {
      console.error('Failed to add note:', error);
      setMessage({ text: 'Failed to add note', type: 'error' });
    }
  };

  const handleInitiateRetraction = async () => {
    const submissionId = prompt('Enter the submission ID for retraction:');
    if (!submissionId) return;
    
    const reason = prompt('Enter the reason for retraction:');
    if (!reason) return;

    try {
      await adminService.initiateRetraction(submissionId, reason);
      setMessage({ text: 'Retraction initiated successfully', type: 'success' });
      if (activeTab === 'retractions') {
        loadRetractions();
      }
    } catch (error) {
      console.error('Failed to initiate retraction:', error);
      setMessage({ text: 'Failed to initiate retraction', type: 'error' });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'OPEN': return 'danger';
      case 'INVESTIGATING': return 'warning';
      case 'RESOLVED': return 'success';
      case 'DISMISSED': return 'secondary';
      default: return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'danger';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'PLAGIARISM': return 'danger';
      case 'ETHICS': return 'warning';
      case 'QUALITY': return 'info';
      case 'PROCESS': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Complaint Handling</h1>
          <p className="text-secondary-600 mt-1">Manage complaints and retractions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleInitiateRetraction}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Initiate Retraction
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 text-secondary-600 hover:text-secondary-800"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {message && (
        <Alert
          type={message.type}
          message={message.text}
          onClose={() => setMessage(null)}
          className="mb-6"
        />
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('complaints')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'complaints'
              ? 'bg-primary-100 text-primary-700'
              : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
          }`}
        >
          Complaints ({complaints.length})
        </button>
        <button
          onClick={() => setActiveTab('retractions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'retractions'
              ? 'bg-primary-100 text-primary-700'
              : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
          }`}
        >
          Retractions ({retractions.length})
        </button>
      </div>

      {activeTab === 'complaints' && (
        <>
          {/* Filters */}
          <div className="card mb-6">
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="INVESTIGATING">Investigating</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="DISMISSED">Dismissed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="PLAGIARISM">Plagiarism</option>
                    <option value="ETHICS">Ethics</option>
                    <option value="QUALITY">Quality</option>
                    <option value="PROCESS">Process</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value, page: 1 }))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Priorities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Items per page
                  </label>
                  <select
                    value={filters.limit}
                    onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Complaints List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-secondary-600 mt-2">Loading complaints...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-secondary-600">No complaints found.</p>
              </div>
            ) : (
              complaints.map((complaint) => (
                <div key={complaint.id} className="card">
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                          {complaint.subject}
                        </h3>
                        <div className="flex items-center space-x-3 text-sm text-secondary-600">
                          <span>From: {complaint.complainantName}</span>
                          <span>•</span>
                          <span>{new Date(complaint.createdDate).toLocaleDateString()}</span>
                          {complaint.submissionId && (
                            <>
                              <span>•</span>
                              <span>Submission: {complaint.submissionId.slice(0, 8)}...</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getTypeBadgeVariant(complaint.type)}>
                          {complaint.type}
                        </Badge>
                        <Badge variant={getPriorityBadgeVariant(complaint.priority)}>
                          {complaint.priority}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(complaint.status)}>
                          {complaint.status}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-secondary-700 mb-4 line-clamp-2">
                      {complaint.description}
                    </p>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4 text-sm text-secondary-600">
                        {complaint.assignedTo && (
                          <span>Assigned to: {complaint.assignedTo}</span>
                        )}
                        {complaint.resolvedDate && (
                          <span>Resolved: {new Date(complaint.resolvedDate).toLocaleDateString()}</span>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <select
                          value={complaint.priority}
                          onChange={(e) => handleUpdatePriority(complaint.id, e.target.value)}
                          className="px-2 py-1 border border-secondary-300 rounded text-xs"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                        
                        <select
                          value={complaint.status}
                          onChange={(e) => {
                            if (e.target.value === 'RESOLVED') {
                              const resolution = prompt('Enter resolution details:');
                              if (resolution) {
                                handleUpdateComplaintStatus(complaint.id, e.target.value, resolution);
                              }
                            } else {
                              handleUpdateComplaintStatus(complaint.id, e.target.value);
                            }
                          }}
                          className="px-2 py-1 border border-secondary-300 rounded text-xs"
                        >
                          <option value="OPEN">Open</option>
                          <option value="INVESTIGATING">Investigating</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="DISMISSED">Dismissed</option>
                        </select>
                        
                        <button
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setShowDetailModal(true);
                          }}
                          className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={filters.page === 1}
                  className="px-3 py-1 border border-secondary-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + Math.max(1, filters.page - 2);
                  return (
                    <button
                      key={page}
                      onClick={() => setFilters(prev => ({ ...prev, page }))}
                      className={`px-3 py-1 border rounded text-sm ${
                        page === filters.page
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-secondary-300 hover:bg-secondary-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={filters.page === pagination.totalPages}
                  className="px-3 py-1 border border-secondary-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'retractions' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-secondary-600 mt-2">Loading retractions...</p>
            </div>
          ) : retractions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-secondary-600">No retractions found.</p>
            </div>
          ) : (
            retractions.map((retraction, index) => (
              <div key={index} className="card">
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                        Retraction Notice
                      </h3>
                      <div className="text-sm text-secondary-600 space-y-1">
                        <div>Submission ID: {retraction.submissionId}</div>
                        <div>Initiated: {new Date(retraction.createdDate).toLocaleDateString()}</div>
                        <div>Reason: {retraction.reason}</div>
                      </div>
                    </div>
                    <Badge variant="danger">
                      {retraction.status || 'ACTIVE'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Complaint Detail Modal */}
      {showDetailModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-secondary-900">Complaint Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-secondary-900 mb-1">Subject</h3>
                <p className="text-secondary-700">{selectedComplaint.subject}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-secondary-900 mb-1">Complainant</h3>
                  <p className="text-secondary-700">{selectedComplaint.complainantName}</p>
                  <p className="text-sm text-secondary-600">{selectedComplaint.complainantEmail}</p>
                </div>
                <div>
                  <h3 className="font-medium text-secondary-900 mb-1">Date Filed</h3>
                  <p className="text-secondary-700">
                    {new Date(selectedComplaint.createdDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="font-medium text-secondary-900 mb-1">Type</h3>
                  <Badge variant={getTypeBadgeVariant(selectedComplaint.type)}>
                    {selectedComplaint.type}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-medium text-secondary-900 mb-1">Priority</h3>
                  <Badge variant={getPriorityBadgeVariant(selectedComplaint.priority)}>
                    {selectedComplaint.priority}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-medium text-secondary-900 mb-1">Status</h3>
                  <Badge variant={getStatusBadgeVariant(selectedComplaint.status)}>
                    {selectedComplaint.status}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-secondary-900 mb-1">Description</h3>
                <p className="text-secondary-700 whitespace-pre-wrap">{selectedComplaint.description}</p>
              </div>

              {selectedComplaint.resolution && (
                <div>
                  <h3 className="font-medium text-secondary-900 mb-1">Resolution</h3>
                  <p className="text-secondary-700 whitespace-pre-wrap">{selectedComplaint.resolution}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-medium text-secondary-900 mb-2">Add Note</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter a note..."
                    className="flex-1 px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddNote(selectedComplaint.id, e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      handleAddNote(selectedComplaint.id, input.value);
                      input.value = '';
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Add Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintHandling;