import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { editorService } from '@/services/editorService';
import { Submission, SubmissionStatus } from '@/types';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';

const SubmissionScreening: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [plagiarismResult, setPlagiarismResult] = useState<any>(null);
  const [qualityResult, setQualityResult] = useState<any>(null);
  const [decision, setDecision] = useState<'PROCEED_TO_REVIEW' | 'REJECT' | ''>('');
  const [comments, setComments] = useState('');
  const [scopeCheck, setScopeCheck] = useState(false);
  const [plagiarismCheck, setPlagiarismCheck] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (id) {
      loadSubmission();
    }
  }, [id]);

  const loadSubmission = async () => {
    try {
      const data = await editorService.getSubmissionForEditor(id!);
      setSubmission(data);
    } catch (error) {
      console.error('Failed to load submission:', error);
      setMessage({ text: 'Failed to load submission', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const runPlagiarismCheck = async () => {
    if (!id) return;
    
    setProcessing(true);
    try {
      const result = await editorService.runPlagiarismCheck(id);
      setPlagiarismResult(result);
      setPlagiarismCheck(true);
      setMessage({ text: 'Plagiarism check completed', type: 'success' });
    } catch (error) {
      console.error('Plagiarism check failed:', error);
      setMessage({ text: 'Plagiarism check failed', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const runQualityCheck = async () => {
    if (!id) return;
    
    setProcessing(true);
    try {
      const result = await editorService.performQualityCheck(id);
      setQualityResult(result);
      setMessage({ text: 'Quality check completed', type: 'success' });
    } catch (error) {
      console.error('Quality check failed:', error);
      setMessage({ text: 'Quality check failed', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleScreeningDecision = async () => {
    if (!id || !decision || !comments.trim()) {
      setMessage({ text: 'Please provide a decision and comments', type: 'error' });
      return;
    }

    setProcessing(true);
    try {
      await editorService.performInitialScreening(id, {
        decision,
        comments,
        plagiarismCheck,
        scopeCheck
      });
      
      setMessage({ text: 'Screening decision submitted successfully', type: 'success' });
      setTimeout(() => {
        navigate('/editor/submissions');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit screening decision:', error);
      setMessage({ text: 'Failed to submit screening decision', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadgeVariant = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.SUBMITTED:
        return 'info';
      case SubmissionStatus.INITIAL_REVIEW:
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const formatStatus = (status: SubmissionStatus) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-secondary-600 mt-2">Loading submission...</p>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">Initial Screening</h1>
            <p className="text-secondary-600 mt-2">
              Review submission for scope, quality, and plagiarism
            </p>
          </div>
          <Badge variant={getStatusBadgeVariant(submission.status)}>
            {formatStatus(submission.status)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submission Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-secondary-900">Submission Details</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <h3 className="text-lg font-medium text-secondary-900 mb-2">{submission.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-secondary-600">
                  <div><span className="font-medium">Author:</span> {submission.author.firstName} {submission.author.lastName}</div>
                  <div><span className="font-medium">Email:</span> {submission.author.email}</div>
                  <div><span className="font-medium">Affiliation:</span> {submission.author.affiliation || 'Not provided'}</div>
                  <div><span className="font-medium">Type:</span> {submission.manuscriptType}</div>
                  <div><span className="font-medium">Submitted:</span> {new Date(submission.createdAt).toLocaleDateString()}</div>
                  <div><span className="font-medium">Blind Review:</span> {submission.isDoubleBlind ? 'Double-blind' : 'Single-blind'}</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-secondary-900 mb-2">Abstract</h4>
                <p className="text-secondary-700 text-sm leading-relaxed">{submission.abstract}</p>
              </div>

              <div>
                <h4 className="font-medium text-secondary-900 mb-2">Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {submission.keywords.map((keyword, index) => (
                    <span key={index} className="bg-secondary-100 text-secondary-700 px-2 py-1 rounded text-sm">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {submission.comments && (
                <div>
                  <h4 className="font-medium text-secondary-900 mb-2">Author Comments</h4>
                  <p className="text-secondary-700 text-sm leading-relaxed">{submission.comments}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-secondary-900 mb-2">Files</h4>
                <div className="space-y-2">
                  {submission.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between bg-secondary-50 p-3 rounded">
                      <div>
                        <span className="font-medium text-secondary-900">{file.originalName}</span>
                        <span className="text-secondary-600 text-sm ml-2">({(file.fileSize / 1024 / 1024).toFixed(2)} MB)</span>
                        {file.description && (
                          <p className="text-secondary-600 text-sm">{file.description}</p>
                        )}
                      </div>
                      <button className="text-primary-600 hover:text-primary-800 text-sm">
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quality Checks */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-secondary-900">Quality Checks</h2>
            </div>
            <div className="card-body space-y-4">
              {/* Plagiarism Check */}
              <div className="border border-secondary-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-secondary-900">Plagiarism Check</h3>
                  <button
                    onClick={runPlagiarismCheck}
                    disabled={processing || plagiarismResult}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Running...' : plagiarismResult ? 'Completed' : 'Run Check'}
                  </button>
                </div>
                
                {plagiarismResult && (
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Similarity Score:</span>
                      <span className={`font-bold ${plagiarismResult.similarity > 20 ? 'text-red-600' : plagiarismResult.similarity > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {plagiarismResult.similarity}%
                      </span>
                    </div>
                    <p className="text-sm text-secondary-600">
                      {plagiarismResult.similarity > 20 ? 'High similarity detected - requires review' :
                       plagiarismResult.similarity > 10 ? 'Moderate similarity - acceptable with review' :
                       'Low similarity - acceptable'}
                    </p>
                  </div>
                )}
              </div>

              {/* Quality Assessment */}
              <div className="border border-secondary-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-secondary-900">Quality Assessment</h3>
                  <button
                    onClick={runQualityCheck}
                    disabled={processing || qualityResult}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Analyzing...' : qualityResult ? 'Completed' : 'Analyze'}
                  </button>
                </div>
                
                {qualityResult && (
                  <div className="bg-purple-50 p-3 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Quality Score:</span>
                      <span className={`font-bold ${qualityResult.score < 60 ? 'text-red-600' : qualityResult.score < 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {qualityResult.score}/100
                      </span>
                    </div>
                    {qualityResult.issues.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-secondary-900 mb-1">Issues Found:</p>
                        <ul className="text-sm text-secondary-600 list-disc list-inside">
                          {qualityResult.issues.map((issue: string, index: number) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Screening Decision */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-secondary-900">Screening Checklist</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={scopeCheck}
                    onChange={(e) => setScopeCheck(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Manuscript fits journal scope</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={plagiarismCheck}
                    onChange={(e) => setPlagiarismCheck(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Plagiarism check completed</span>
                </label>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-secondary-900">Editorial Decision</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Decision
                </label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value as 'PROCEED_TO_REVIEW' | 'REJECT')}
                  className="w-full border border-secondary-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select decision...</option>
                  <option value="PROCEED_TO_REVIEW">Proceed to Peer Review</option>
                  <option value="REJECT">Reject Without Review</option>
                </select>
              </div>

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
                onClick={handleScreeningDecision}
                disabled={processing || !decision || !comments.trim()}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Submitting...' : 'Submit Decision'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionScreening;