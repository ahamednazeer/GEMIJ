import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { editorService } from '@/services/editorService';
import { Submission, SubmissionStatus } from '@/types';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const ProductionWorkflow: React.FC = () => {
  const navigate = useNavigate();
  const [acceptedSubmissions, setAcceptedSubmissions] = useState<Submission[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [newIssue, setNewIssue] = useState({
    volume: '',
    number: '',
    title: '',
    description: ''
  });
  const [showNewIssueForm, setShowNewIssueForm] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [submissionsData, issuesData] = await Promise.all([
        editorService.getSubmissionsForEditor({ status: SubmissionStatus.ACCEPTED }),
        editorService.getIssues()
      ]);

      setAcceptedSubmissions(submissionsData.submissions);
      setIssues(issuesData);
    } catch (error) {
      console.error('Failed to load production data:', error);
      setMessage({ text: 'Failed to load production data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const assignDOI = async (submissionId: string) => {
    setProcessing(submissionId);
    try {
      const result = await editorService.assignDOI(submissionId);
      setMessage({ text: `DOI assigned: ${result.doi}`, type: 'success' });
      await loadData(); // Reload to show updated data
    } catch (error) {
      console.error('Failed to assign DOI:', error);
      setMessage({ text: 'Failed to assign DOI', type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const moveToProduction = async (submissionId: string, productionData: any) => {
    setProcessing(submissionId);
    try {
      await editorService.moveToProduction(submissionId, productionData);
      setMessage({ text: 'Moved to production successfully', type: 'success' });
      await loadData();
    } catch (error) {
      console.error('Failed to move to production:', error);
      setMessage({ text: 'Failed to move to production', type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const createNewIssue = async () => {
    if (!newIssue.volume || !newIssue.number) {
      setMessage({ text: 'Volume and issue number are required', type: 'error' });
      return;
    }

    setProcessing('new-issue');
    try {
      await editorService.createIssue({
        volume: parseInt(newIssue.volume),
        number: parseInt(newIssue.number),
        title: newIssue.title,
        description: newIssue.description
      });

      setMessage({ text: 'New issue created successfully', type: 'success' });
      setNewIssue({ volume: '', number: '', title: '', description: '' });
      setShowNewIssueForm(false);
      await loadData();
    } catch (error) {
      console.error('Failed to create issue:', error);
      setMessage({ text: 'Failed to create issue', type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const addToIssue = async (issueId: string, submissionId: string) => {
    const pages = prompt('Enter page numbers (e.g., "1-15"):');
    if (!pages) return;

    setProcessing(submissionId);
    try {
      await editorService.addToIssue(issueId, submissionId, pages);
      setMessage({ text: 'Article added to issue successfully', type: 'success' });
      await loadData();
    } catch (error) {
      console.error('Failed to add to issue:', error);
      setMessage({ text: 'Failed to add to issue', type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const publishSubmission = async (submissionId: string, issueId: string) => {
    setProcessing(submissionId);
    try {
      await editorService.publishSubmission(submissionId, issueId);
      setMessage({ text: 'Article published successfully', type: 'success' });
      await loadData();
    } catch (error) {
      console.error('Failed to publish submission:', error);
      setMessage({ text: 'Failed to publish submission', type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedSubmissions.length === 0) {
      setMessage({ text: 'Please select submissions first', type: 'error' });
      return;
    }

    setProcessing('bulk');
    try {
      if (action === 'assign-doi') {
        await Promise.all(selectedSubmissions.map(id => editorService.assignDOI(id)));
        setMessage({ text: `DOI assigned to ${selectedSubmissions.length} submissions`, type: 'success' });
      }

      setSelectedSubmissions([]);
      await loadData();
    } catch (error) {
      console.error('Bulk action failed:', error);
      setMessage({ text: 'Bulk action failed', type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const toggleSubmissionSelection = (submissionId: string) => {
    setSelectedSubmissions(prev =>
      prev.includes(submissionId)
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-secondary-600 mt-2">Loading production data...</p>
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
                Production Workflow
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                Manage accepted manuscripts through production to publication
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

        {/* Production Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">{acceptedSubmissions.length}</div>
              <p className="text-secondary-600">Accepted Articles</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {acceptedSubmissions.filter(s => s.doi).length}
              </div>
              <p className="text-secondary-600">DOI Assigned</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">{issues.length}</div>
              <p className="text-secondary-600">Active Issues</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-orange-600 mb-2">
                {acceptedSubmissions.filter(s => s.status === SubmissionStatus.PUBLISHED).length}
              </div>
              <p className="text-secondary-600">Published</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Accepted Submissions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="card-header">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-secondary-900">
                    Accepted Submissions ({acceptedSubmissions.length})
                  </h2>
                  {selectedSubmissions.length > 0 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleBulkAction('assign-doi')}
                        disabled={processing === 'bulk'}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Assign DOI ({selectedSubmissions.length})
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="card-body">
                {acceptedSubmissions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-secondary-600">No accepted submissions ready for production.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {acceptedSubmissions.map((submission) => (
                      <div key={submission.id} className="border border-secondary-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedSubmissions.includes(submission.id)}
                              onChange={() => toggleSubmissionSelection(submission.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <h3 className="font-medium text-secondary-900 mb-1">
                                {submission.title}
                              </h3>
                              <div className="text-sm text-secondary-600 space-y-1">
                                <p><span className="font-medium">Author:</span> {submission.author.firstName} {submission.author.lastName}</p>
                                <p><span className="font-medium">Accepted:</span> {submission.acceptedAt ? new Date(submission.acceptedAt).toLocaleDateString() : 'N/A'}</p>
                                {submission.doi && (
                                  <p><span className="font-medium">DOI:</span> {submission.doi}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge variant="success">Accepted</Badge>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {!submission.doi && (
                            <button
                              onClick={() => assignDOI(submission.id)}
                              disabled={processing === submission.id}
                              className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 disabled:opacity-50"
                            >
                              {processing === submission.id ? 'Assigning...' : 'Assign DOI'}
                            </button>
                          )}

                          <button
                            onClick={() => navigate(`/editor/submission/${submission.id}/production`)}
                            className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200"
                          >
                            Production Details
                          </button>

                          {submission.doi && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  addToIssue(e.target.value, submission.id);
                                  e.target.value = '';
                                }
                              }}
                              className="text-sm border border-secondary-300 rounded px-2 py-1"
                            >
                              <option value="">Add to Issue...</option>
                              {issues.map(issue => (
                                <option key={issue.id} value={issue.id}>
                                  Vol {issue.volume}, No {issue.number}
                                </option>
                              ))}
                            </select>
                          )}

                          {submission.volume && submission.issue && (
                            <button
                              onClick={() => publishSubmission(submission.id, submission.issue.toString())}
                              disabled={processing === submission.id}
                              className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 disabled:opacity-50"
                            >
                              {processing === submission.id ? 'Publishing...' : 'Publish'}
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

          {/* Issue Management */}
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-secondary-900">Issue Management</h2>
                  <button
                    onClick={() => setShowNewIssueForm(!showNewIssueForm)}
                    className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700"
                  >
                    New Issue
                  </button>
                </div>
              </div>
              <div className="card-body space-y-4">
                {showNewIssueForm && (
                  <div className="bg-primary-50 p-4 rounded-lg space-y-3">
                    <h3 className="font-medium text-primary-900">Create New Issue</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-primary-700 mb-1">Volume</label>
                        <input
                          type="number"
                          value={newIssue.volume}
                          onChange={(e) => setNewIssue({ ...newIssue, volume: e.target.value })}
                          className="w-full border border-primary-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-primary-700 mb-1">Number</label>
                        <input
                          type="number"
                          value={newIssue.number}
                          onChange={(e) => setNewIssue({ ...newIssue, number: e.target.value })}
                          className="w-full border border-primary-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">Title (Optional)</label>
                      <input
                        type="text"
                        value={newIssue.title}
                        onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                        className="w-full border border-primary-300 rounded px-2 py-1 text-sm"
                        placeholder="Special issue title..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">Description (Optional)</label>
                      <textarea
                        value={newIssue.description}
                        onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                        rows={2}
                        className="w-full border border-primary-300 rounded px-2 py-1 text-sm"
                        placeholder="Issue description..."
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={createNewIssue}
                        disabled={processing === 'new-issue'}
                        className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700 disabled:opacity-50"
                      >
                        {processing === 'new-issue' ? 'Creating...' : 'Create'}
                      </button>
                      <button
                        onClick={() => setShowNewIssueForm(false)}
                        className="bg-secondary-200 text-secondary-700 px-3 py-1 rounded text-sm hover:bg-secondary-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {issues.length === 0 ? (
                    <p className="text-secondary-600 text-sm">No issues created yet.</p>
                  ) : (
                    issues.map((issue) => (
                      <div key={issue.id} className="border border-secondary-200 rounded p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium text-secondary-900">
                              Volume {issue.volume}, Issue {issue.number}
                            </h3>
                            {issue.title && (
                              <p className="text-sm text-secondary-600">{issue.title}</p>
                            )}
                          </div>
                          {issue.isCurrent && (
                            <Badge variant="info">Current</Badge>
                          )}
                        </div>
                        <div className="text-sm text-secondary-600 space-y-1">
                          <p><span className="font-medium">Articles:</span> {issue._count?.articles || 0}</p>
                          {issue.publishedAt && (
                            <p><span className="font-medium">Published:</span> {new Date(issue.publishedAt).toLocaleDateString()}</p>
                          )}
                        </div>
                        <button
                          onClick={() => navigate(`/editor/issue/${issue.id}`)}
                          className="mt-2 text-sm text-primary-600 hover:text-primary-800"
                        >
                          Manage Issue →
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Production Guidelines */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-secondary-900">Production Checklist</h3>
              </div>
              <div className="card-body text-sm space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Assign DOI to accepted manuscripts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Review production details and formatting</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Assign articles to appropriate issue</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Publish articles in the issue</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionWorkflow;