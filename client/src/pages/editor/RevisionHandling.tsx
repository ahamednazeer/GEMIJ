import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { editorService } from '@/services/editorService';
import { Submission, SubmissionStatus } from '@/types';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const RevisionHandling: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [decision, setDecision] = useState<'ACCEPT_REVISION' | 'SEND_FOR_RE_REVIEW' | 'REJECT_REVISION' | ''>('');
  const [comments, setComments] = useState('');
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [availableReviewers, setAvailableReviewers] = useState<any[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const [submissionData, timelineData] = await Promise.all([
        editorService.getSubmissionForEditor(id!),
        editorService.getSubmissionTimeline(id!)
      ]);

      setSubmission(submissionData);
      setTimeline(timelineData);

      // Load available reviewers if needed for re-review
      if (submissionData.status === SubmissionStatus.REVISED) {
        const reviewers = await editorService.getAvailableReviewers(id!, { excludeConflicts: true });
        setAvailableReviewers(reviewers);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setMessage({ text: 'Failed to load revision data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevisionDecision = async () => {
    if (!decision || !comments.trim()) {
      setMessage({ text: 'Please select a decision and provide comments', type: 'error' });
      return;
    }

    if (decision === 'SEND_FOR_RE_REVIEW' && selectedReviewers.length === 0) {
      setMessage({ text: 'Please select reviewers for re-review', type: 'error' });
      return;
    }

    setProcessing(true);
    try {
      await editorService.handleRevision(id!, {
        decision,
        comments,
        reviewerIds: decision === 'SEND_FOR_RE_REVIEW' ? selectedReviewers : undefined
      });

      setMessage({ text: 'Revision decision submitted successfully', type: 'success' });
      setTimeout(() => {
        navigate('/editor/submissions');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit revision decision:', error);
      setMessage({ text: 'Failed to submit revision decision', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadgeVariant = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.REVISED:
        return 'info';
      case SubmissionStatus.REVISION_REQUIRED:
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const formatStatus = (status: SubmissionStatus) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getRevisionFiles = () => {
    return submission?.files.filter(file =>
      file.uploadedAt > (submission.updatedAt || submission.createdAt)
    ) || [];
  };

  const getOriginalFiles = () => {
    return submission?.files.filter(file =>
      file.uploadedAt <= (submission.updatedAt || submission.createdAt)
    ) || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-secondary-600 mt-2">Loading revision data...</p>
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

  if (submission.status !== SubmissionStatus.REVISED) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="warning" title="Not a Revised Submission">
            This submission is not in revised status. Current status: {formatStatus(submission.status)}
          </Alert>
        </div>
      </div>
    );
  }

  const revisionFiles = getRevisionFiles();
  const originalFiles = getOriginalFiles();

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
                Handle Revision
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                Review revised submission: <span className="font-medium">{submission.title}</span>
              </p>
            </div>
            <div className="flex-shrink-0">
              <Badge
                variant={getStatusBadgeVariant(submission.status)}
                className="text-sm px-4 py-1.5"
              >
                {formatStatus(submission.status)}
              </Badge>
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
          {/* Revision Details */}
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
                  <div><span className="font-medium text-secondary-700">Originally Submitted:</span> {new Date(submission.createdAt).toLocaleDateString()}</div>
                  <div><span className="font-medium text-secondary-700">Revised:</span> {new Date(submission.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Author's Response Letter */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-secondary-900">Author's Response to Reviews</h2>
              </div>
              <div className="card-body">
                {submission.comments ? (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="whitespace-pre-wrap text-secondary-700">
                      {submission.comments}
                    </div>
                  </div>
                ) : (
                  <p className="text-secondary-600 italic">No response letter provided by the author.</p>
                )}
              </div>
            </div>

            {/* File Comparison */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-secondary-900">File Comparison</h2>
              </div>
              <div className="card-body space-y-6">
                {/* Revised Files */}
                <div>
                  <h3 className="font-medium text-secondary-900 mb-3 flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    Revised Files ({revisionFiles.length})
                  </h3>
                  {revisionFiles.length === 0 ? (
                    <p className="text-secondary-600 italic">No new files uploaded with revision.</p>
                  ) : (
                    <div className="space-y-2">
                      {revisionFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between bg-green-50 p-3 rounded border-l-4 border-green-500">
                          <div>
                            <span className="font-medium text-secondary-900">{file.originalName}</span>
                            <span className="text-secondary-600 text-sm ml-2">({(file.fileSize / 1024 / 1024).toFixed(2)} MB)</span>
                            <p className="text-secondary-600 text-sm">Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}</p>
                            {file.description && (
                              <p className="text-secondary-600 text-sm">{file.description}</p>
                            )}
                          </div>
                          <button className="text-green-600 hover:text-green-800 text-sm">
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Original Files */}
                <div>
                  <h3 className="font-medium text-secondary-900 mb-3 flex items-center">
                    <span className="w-3 h-3 bg-secondary-400 rounded-full mr-2"></span>
                    Original Files ({originalFiles.length})
                  </h3>
                  <div className="space-y-2">
                    {originalFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between bg-secondary-50 p-3 rounded">
                        <div>
                          <span className="font-medium text-secondary-900">{file.originalName}</span>
                          <span className="text-secondary-600 text-sm ml-2">({(file.fileSize / 1024 / 1024).toFixed(2)} MB)</span>
                          <p className="text-secondary-600 text-sm">Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}</p>
                          {file.description && (
                            <p className="text-secondary-600 text-sm">{file.description}</p>
                          )}
                        </div>
                        <button className="text-secondary-600 hover:text-secondary-800 text-sm">
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Timeline */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-secondary-900">Submission Timeline</h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {timeline.map((event, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-secondary-900">{event.action}</span>
                          <span className="text-secondary-500 text-sm">{new Date(event.timestamp).toLocaleDateString()}</span>
                        </div>
                        {event.details && (
                          <p className="text-secondary-600 text-sm mt-1">{event.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Decision Panel */}
          <div className="space-y-6">
            <div className="card sticky top-4">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-secondary-900">Revision Decision</h2>
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
                    <option value="ACCEPT_REVISION">Accept Revision</option>
                    <option value="SEND_FOR_RE_REVIEW">Send for Re-review</option>
                    <option value="REJECT_REVISION">Reject Revision</option>
                  </select>
                </div>

                {decision === 'SEND_FOR_RE_REVIEW' && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Select Reviewers for Re-review
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableReviewers.map((reviewer) => (
                        <label key={reviewer.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedReviewers.includes(reviewer.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedReviewers([...selectedReviewers, reviewer.id]);
                              } else {
                                setSelectedReviewers(selectedReviewers.filter(id => id !== reviewer.id));
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">
                            {reviewer.firstName} {reviewer.lastName}
                            {reviewer.affiliation && (
                              <span className="text-secondary-600 ml-1">({reviewer.affiliation})</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Comments <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={6}
                    className="w-full border border-secondary-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Provide detailed comments about your decision..."
                  />
                </div>

                <button
                  onClick={handleRevisionDecision}
                  disabled={processing || !decision || !comments.trim()}
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {processing ? 'Submitting...' : 'Submit Decision'}
                </button>
              </div>
            </div>

            {/* Decision Guidelines */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-secondary-900">Decision Guidelines</h3>
              </div>
              <div className="card-body text-sm space-y-3">
                <div>
                  <span className="font-medium text-green-600">Accept Revision:</span>
                  <p className="text-secondary-600">Author has adequately addressed all reviewer concerns. Ready for production.</p>
                </div>
                <div>
                  <span className="font-medium text-blue-600">Send for Re-review:</span>
                  <p className="text-secondary-600">Significant changes made that require reviewer evaluation before final decision.</p>
                </div>
                <div>
                  <span className="font-medium text-red-600">Reject Revision:</span>
                  <p className="text-secondary-600">Author has not adequately addressed reviewer concerns or made insufficient changes.</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-secondary-900">Quick Actions</h3>
              </div>
              <div className="card-body space-y-2">
                <button
                  onClick={() => navigate(`/editor/submission/${id}`)}
                  className="w-full text-left bg-blue-50 text-blue-700 px-3 py-2 rounded hover:bg-blue-100 transition-colors"
                >
                  View Full Submission
                </button>
                <button
                  onClick={() => navigate(`/editor/submission/${id}/reviews`)}
                  className="w-full text-left bg-purple-50 text-purple-700 px-3 py-2 rounded hover:bg-purple-100 transition-colors"
                >
                  View Original Reviews
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevisionHandling;