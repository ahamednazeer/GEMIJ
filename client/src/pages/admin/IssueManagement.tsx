import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, BookOpen, Calendar } from 'lucide-react';
import issueService, { Issue } from '../../services/issueService';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';

const IssueManagement: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    volume: '',
    number: '',
    title: '',
    description: '',
    year: new Date().getFullYear().toString(),
    publishedAt: '',
    isCurrent: false
  });

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const response = await issueService.getIssues();
      setIssues(response.data || []);
    } catch (error) {
      console.error('Failed to load issues:', error);
      setMessage({ text: 'Failed to load issues', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (issue?: Issue) => {
    if (issue) {
      setEditingIssue(issue);
      setFormData({
        volume: issue.volume.toString(),
        number: issue.number.toString(),
        title: issue.title || '',
        description: issue.description || '',
        year: issue.year.toString(),
        publishedAt: issue.publishedAt ? new Date(issue.publishedAt).toISOString().slice(0, 10) : '',
        isCurrent: issue.isCurrent
      });
    } else {
      setEditingIssue(null);
      setFormData({
        volume: '',
        number: '',
        title: '',
        description: '',
        year: new Date().getFullYear().toString(),
        publishedAt: '',
        isCurrent: false
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        volume: parseInt(formData.volume),
        number: parseInt(formData.number),
        title: formData.title,
        description: formData.description,
        year: parseInt(formData.year),
        publishedAt: formData.publishedAt || undefined,
        isCurrent: formData.isCurrent
      };

      if (editingIssue) {
        await issueService.updateIssue(editingIssue.id, data);
        setMessage({ text: 'Issue updated successfully', type: 'success' });
      } else {
        await issueService.createIssue(data);
        setMessage({ text: 'Issue created successfully', type: 'success' });
      }

      setModalOpen(false);
      loadIssues();
    } catch (error: any) {
      console.error('Failed to save issue:', error);
      setMessage({
        text: error.response?.data?.error || 'Failed to save issue',
        type: 'error'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this issue?')) return;

    try {
      await issueService.deleteIssue(id);
      setMessage({ text: 'Issue deleted successfully', type: 'success' });
      loadIssues();
    } catch (error: any) {
      console.error('Failed to delete issue:', error);
      setMessage({
        text: error.response?.data?.error || 'Failed to delete issue',
        type: 'error'
      });
    }
  };

  const handleSetCurrent = async (id: string) => {
    try {
      await issueService.setCurrentIssue(id);
      setMessage({ text: 'Current issue updated', type: 'success' });
      loadIssues();
    } catch (error) {
      console.error('Failed to set current issue:', error);
      setMessage({ text: 'Failed to update current issue', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Issue Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage journal issues and volumes
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Issue
          </button>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={message.type} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading issues...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className={`bg-white rounded-xl shadow-sm border-2 transition-all ${issue.isCurrent ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-transparent hover:border-gray-200'
                  }`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <BookOpen className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Vol. {issue.volume}, No. {issue.number}
                        </h3>
                        <div className="text-sm text-gray-500">
                          {issue.year}
                        </div>
                      </div>
                    </div>
                    {issue.isCurrent && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        Current Issue
                      </span>
                    )}
                  </div>

                  {issue.title && (
                    <p className="text-gray-900 font-medium mb-2">{issue.title}</p>
                  )}

                  {issue.description && (
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                      {issue.description}
                    </p>
                  )}

                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      {issue.publishedAt
                        ? new Date(issue.publishedAt).toLocaleDateString()
                        : 'Not published'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenModal(issue)}
                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Edit Issue"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(issue.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete Issue"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {!issue.isCurrent && (
                      <button
                        onClick={() => handleSetCurrent(issue.id)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Set as Current
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingIssue ? 'Edit Issue' : 'Create New Issue'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Volume *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.volume}
                  onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year *
                </label>
                <input
                  type="number"
                  required
                  min="1900"
                  max="2100"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title (Optional)
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Special Issue on AI"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Publication Date
              </label>
              <input
                type="date"
                value={formData.publishedAt}
                onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isCurrent"
                checked={formData.isCurrent}
                onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isCurrent" className="ml-2 block text-sm text-gray-900">
                Set as Current Issue
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                {editingIssue ? 'Update Issue' : 'Create Issue'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default IssueManagement;