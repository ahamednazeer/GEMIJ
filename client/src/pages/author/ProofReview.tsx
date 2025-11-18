import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submissionService } from '@/services/submissionService';
import { Submission } from '@/types';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Alert from '@/components/ui/Alert';

const ProofReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState<boolean | null>(null);
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (id) {
      loadSubmission();
    }
  }, [id]);

  const loadSubmission = async () => {
    try {
      const data = await submissionService.getSubmission(id!);
      setSubmission(data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load submission');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (isApproved: boolean) => {
    if (isApproved === false && !comments.trim()) {
      setError('Please provide comments explaining what needs to be corrected');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submissionService.approveProof(id!, isApproved, comments);
      
      navigate(`/submission/${id}`, {
        state: {
          message: isApproved 
            ? 'Proof approved successfully! Your article will be published shortly.'
            : 'Proof corrections requested. The production team will make the necessary changes.',
          type: 'success'
        }
      });
    } catch (error: any) {
      console.error('Proof approval error:', error);
      setError(error.response?.data?.error || 'Failed to submit proof approval. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-secondary-600 mt-2">Loading proof...</p>
        </div>
      </div>
    );
  }

  if (error && !submission) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="error" title="Error">
          {error}
        </Alert>
        <Button onClick={() => navigate('/dashboard')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/submission/${id}`)}
          className="mb-4"
        >
          ← Back to Submission
        </Button>
        
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Proof Review
        </h1>
        <p className="text-secondary-600">
          Review the final proof of your manuscript before publication
        </p>
      </div>

      {error && (
        <Alert variant="error" title="Error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Instructions */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Important Instructions</h2>
        </div>
        <div className="card-body">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-yellow-900 mb-2">⚠️ Final Review Stage</h3>
            <p className="text-yellow-800 text-sm">
              This is your final opportunity to review your manuscript before publication. 
              Please check carefully for any errors or formatting issues.
            </p>
          </div>
          
          <div className="space-y-3 text-sm text-secondary-700">
            <h4 className="font-medium text-secondary-900">What to check:</h4>
            <ul className="space-y-1 ml-4">
              <li>• Author names and affiliations are correct</li>
              <li>• Title and abstract are accurate</li>
              <li>• All figures and tables are properly formatted</li>
              <li>• References are complete and correctly formatted</li>
              <li>• No typographical or grammatical errors</li>
              <li>• All special characters and equations display correctly</li>
            </ul>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> Only minor corrections can be made at this stage. 
                Major changes to content are not permitted.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Manuscript Info */}
      {submission && (
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Manuscript Details</h2>
          </div>
          <div className="card-body">
            <h3 className="font-medium text-secondary-900 mb-2">{submission.title}</h3>
            <p className="text-sm text-secondary-600 mb-2">
              Authors: {submission.author.firstName} {submission.author.lastName}
              {submission.coAuthors.length > 0 && (
                <span>, {submission.coAuthors.map(a => `${a.firstName} ${a.lastName}`).join(', ')}</span>
              )}
            </p>
            <p className="text-sm text-secondary-600">
              DOI: {submission.doi || 'Will be assigned upon publication'}
            </p>
          </div>
        </div>
      )}

      {/* Proof Document */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Proof Document</h2>
        </div>
        <div className="card-body">
          <div className="border-2 border-dashed border-secondary-300 rounded-lg p-8 text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">Final Proof PDF</h3>
            <p className="text-secondary-600 mb-4">
              Download and carefully review the final formatted version of your manuscript
            </p>
            <Button variant="outline">
              Download Proof PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Comments & Corrections</h2>
        </div>
        <div className="card-body">
          <Textarea
            label="Comments (Required if requesting corrections)"
            rows={6}
            value={comments}
            onChange={(e) => setComments(e.currentTarget.value)}
            placeholder="If you need any corrections, please describe them in detail here. Include page numbers, line numbers, or specific locations where changes are needed..."
          />
          <p className="text-sm text-secondary-500 mt-2">
            Be as specific as possible about any corrections needed. Include page and line numbers where applicable.
          </p>
        </div>
      </div>

      {/* Approval Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Proof Approval</h2>
        </div>
        <div className="card-body">
          <p className="text-secondary-700 mb-6">
            Please choose one of the following options:
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <input
                type="radio"
                id="approve"
                name="approval"
                value="approve"
                checked={approved === true}
                onChange={() => setApproved(true)}
                className="mt-1"
              />
              <div>
                <label htmlFor="approve" className="font-medium text-secondary-900 cursor-pointer">
                  ✅ Approve for Publication
                </label>
                <p className="text-sm text-secondary-600">
                  The proof is correct and ready for publication. No changes needed.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <input
                type="radio"
                id="corrections"
                name="approval"
                value="corrections"
                checked={approved === false}
                onChange={() => setApproved(false)}
                className="mt-1"
              />
              <div>
                <label htmlFor="corrections" className="font-medium text-secondary-900 cursor-pointer">
                  📝 Request Corrections
                </label>
                <p className="text-sm text-secondary-600">
                  Minor corrections are needed before publication. Please describe them in the comments above.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-4 mt-6">
        <Button
          variant="outline"
          onClick={() => navigate(`/submission/${id}`)}
          disabled={submitting}
        >
          Cancel
        </Button>
        
        <Button
          onClick={() => handleApproval(approved!)}
          disabled={submitting || approved === null}
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : approved === true ? (
            'Approve for Publication'
          ) : (
            'Request Corrections'
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProofReview;