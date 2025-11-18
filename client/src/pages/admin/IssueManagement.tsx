import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService, { IssueData } from '@/services/adminService';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';

const IssueManagement: React.FC = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<IssueData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState<IssueData | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    year: new Date().getFullYear(),
    page: 1,
    limit: 10
  });

  // New issue form
  const [newIssue, setNewIssue] = useState({
    volume: new Date().getFullYear() - 2019, // Assuming journal started in 2020
    issue: 1,
    year: new Date().getFullYear(),
    title: '',
    description: ''
  });

  useEffect(() => {
    loadIssues();
  }, [filters]);

  const loadIssues = async () => {
    setLoading(true);
    try {
      const { issues: issueData, pagination: paginationData } = await adminService.getAllIssues(filters);
      setIssues(issueData);
      setPagination(paginationData);
    } catch (error) {
      console.error('Failed to load issues:', error);
      setMessage({ text: 'Failed to load issues', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createIssue(newIssue);
      setMessage({ text: 'Issue created successfully', type: 'success' });
      setShowCreateModal(false);
      setNewIssue({
        volume: new Date().getFullYear() - 2019,
        issue: 1,
        year: new Date().getFullYear(),
        title: '',
        description: ''
      });
      loadIssues();
    } catch (error) {
      console.error('Failed to create issue:', error);
      setMessage({ text: 'Failed to create issue', type: 'error' });
    }
  };

  const handleUpdateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIssue) return;

    try {
      await adminService.updateIssue(editingIssue.id, editingIssue);
      setMessage({ text: 'Issue updated successfully', type: 'success' });
      setShowEditModal(false);
      setEditingIssue(null);
      loadIssues();
    } catch (error) {
      console.error('Failed to update issue:', error);
      setMessage({ text: 'Failed to update issue', type: 'error' });
    }
  };

  const handlePublishIssue = async (issueId: string) => {
    if (!confirm('Are you sure you want to publish this issue? This action cannot be undone.')) {
      return;
    }
    try {
      await adminService.publishIssue(issueId);
      setMessage({ text: 'Issue published successfully', type: 'success' });
      loadIssues();
    } catch (error) {
      console.error('Failed to publish issue:', error);
      setMessage({ text: 'Failed to publish issue', type: 'error' });
    }
  };

  const handleArchiveIssue = async (issueId: string) => {
    if (!confirm('Are you sure you want to archive this issue?')) {
      return;
    }
    try {
      await adminService.archiveIssue(issueId);
      setMessage({ text: 'Issue archived successfully', type: 'success' });
      loadIssues();
    } catch (error) {
      console.error('Failed to archive issue:', error);
      setMessage({ text: 'Failed to archive issue', type: 'error' });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'success';
      case 'DRAFT': return 'warning';
      case 'ARCHIVED': return 'secondary';
      default: return 'secondary';
    }
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 2020; year--) {
      years.push(year);
    }
    return years;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Issue Management</h1>
          <p className="text-secondary-600 mt-1">Manage journal volumes and issues</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Create New Issue
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

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Year
              </label>
              <select
                value={filters.year}
                onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value), page: 1 }))}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Years</option>
                {generateYearOptions().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
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

      {/* Issues Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-secondary-600 mt-2">Loading issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-secondary-600">No issues found.</p>
          </div>
        ) : (
          issues.map((issue) => (
            <div key={issue.id} className="card">
              <div className="card-body">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900">
                      Volume {issue.volume}, Issue {issue.issue}
                    </h3>
                    <p className="text-sm text-secondary-600">{issue.year}</p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(issue.status)}>
                    {issue.status}
                  </Badge>
                </div>

                <h4 className="font-medium text-secondary-900 mb-2">{issue.title}</h4>
                
                {issue.description && (
                  <p className="text-sm text-secondary-600 mb-3 line-clamp-2">
                    {issue.description}
                  </p>
                )}

                <div className="text-sm text-secondary-600 mb-4">
                  <div className="flex justify-between">
                    <span>Articles:</span>
                    <span className="font-medium">{issue.articles.length}</span>
                  </div>
                  {issue.publishedDate && (
                    <div className="flex justify-between">
                      <span>Published:</span>
                      <span className="font-medium">
                        {new Date(issue.publishedDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setEditingIssue(issue);
                      setShowEditModal(true);
                    }}
                    className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors"
                  >
                    Edit
                  </button>
                  
                  {issue.status === 'DRAFT' && (
                    <button
                      onClick={() => handlePublishIssue(issue.id)}
                      className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-colors"
                    >
                      Publish
                    </button>
                  )}
                  
                  {issue.status === 'PUBLISHED' && (
                    <button
                      onClick={() => handleArchiveIssue(issue.id)}
                      className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
                    >
                      Archive
                    </button>
                  )}
                  
                  <button
                    onClick={() => navigate(`/admin/issues/${issue.id}/articles`)}
                    className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 transition-colors"
                  >
                    Manage Articles
                  </button>
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

      {/* Create Issue Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Create New Issue</h2>
            <form onSubmit={handleCreateIssue}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Volume
                    </label>
                    <input
                      type="number"
                      value={newIssue.volume}
                      onChange={(e) => setNewIssue(prev => ({ ...prev, volume: parseInt(e.target.value) }))}
                      min="1"
                      required
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Issue
                    </label>
                    <input
                      type="number"
                      value={newIssue.issue}
                      onChange={(e) => setNewIssue(prev => ({ ...prev, issue: parseInt(e.target.value) }))}
                      min="1"
                      required
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Year
                  </label>
                  <select
                    value={newIssue.year}
                    onChange={(e) => setNewIssue(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {generateYearOptions().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newIssue.title}
                    onChange={(e) => setNewIssue(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newIssue.description}
                    onChange={(e) => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-secondary-600 hover:text-secondary-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Create Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Issue Modal */}
      {showEditModal && editingIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Edit Issue</h2>
            <form onSubmit={handleUpdateIssue}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Volume
                    </label>
                    <input
                      type="number"
                      value={editingIssue.volume}
                      onChange={(e) => setEditingIssue(prev => prev ? { ...prev, volume: parseInt(e.target.value) } : null)}
                      min="1"
                      required
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Issue
                    </label>
                    <input
                      type="number"
                      value={editingIssue.issue}
                      onChange={(e) => setEditingIssue(prev => prev ? { ...prev, issue: parseInt(e.target.value) } : null)}
                      min="1"
                      required
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Year
                  </label>
                  <select
                    value={editingIssue.year}
                    onChange={(e) => setEditingIssue(prev => prev ? { ...prev, year: parseInt(e.target.value) } : null)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {generateYearOptions().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editingIssue.title}
                    onChange={(e) => setEditingIssue(prev => prev ? { ...prev, title: e.target.value } : null)}
                    required
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingIssue.description || ''}
                    onChange={(e) => setEditingIssue(prev => prev ? { ...prev, description: e.target.value } : null)}
                    rows={3}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingIssue(null);
                  }}
                  className="px-4 py-2 text-secondary-600 hover:text-secondary-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Update Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueManagement;