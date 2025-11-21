import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submissionService } from '@/services/submissionService';
import { Submission } from '@/types';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Alert from '@/components/ui/Alert';
import InfoSection from '@/components/ui/InfoSection';
import InfoField from '@/components/ui/InfoField';

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
    <div className="min-h-screen bg-secondary-50">
      {/* Clean Academic Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/submission/${id}`)}
            className="mb-6 -ml-2"
            size="sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Submission
          </Button>
          
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Proof Review
            </h1>
            <p className="text-base text-muted-foreground max-w-3xl">
              Review the final proof of your manuscript before publication. This is your last opportunity to request corrections.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {error && (
          <Alert variant="error" title="Error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Instructions */}
        <Alert variant="warning" title="Final Review Stage" className="mb-6">
          This is your final opportunity to review your manuscript before publication. Please check carefully for any errors or formatting issues. Only minor corrections can be made at this stage; major changes to content are not permitted.
        </Alert>

        <InfoSection
          title="Review Checklist"
          subtitle="What to check before approval"
          className="mb-6"
        >
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Author names and affiliations are correct</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Title and abstract are accurate</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>All figures and tables are properly formatted</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>References are complete and correctly formatted</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>No typographical or grammatical errors</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>All special characters and equations display correctly</span>
            </li>
          </ul>
        </InfoSection>

        {/* Manuscript Info */}
        {submission && (
          <InfoSection
            title="Manuscript Details"
            subtitle="Information about the proof being reviewed"
            className="mb-6"
          >
            <div className="space-y-3">
              <InfoField
                label="Title"
                value={submission.title}
              />
              <InfoField
                label="Authors"
                value={
                  <>
                    {submission.author.firstName} {submission.author.lastName}
                    {submission.coAuthors.length > 0 && (
                      <span>, {submission.coAuthors.map(a => `${a.firstName} ${a.lastName}`).join(', ')}</span>
                    )}
                  </>
                }
              />
              <InfoField
                label="DOI"
                value={submission.doi || 'Will be assigned upon publication'}
              />
            </div>
          </InfoSection>
        )}

        {/* Proof Document */}
        <InfoSection
          title="Proof Document"
          subtitle="Download and review the final formatted version"
          className="mb-6"
        >
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/30">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">Final Proof PDF</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Download and carefully review the final formatted version of your manuscript
            </p>
            <Button variant="outline">
              Download Proof PDF
            </Button>
          </div>
        </InfoSection>

        {/* Comments Section */}
        <InfoSection
          title="Comments & Corrections"
          subtitle="Required if requesting corrections"
          className="mb-6"
        >
          <Textarea
            label="Correction Details"
            rows={6}
            value={comments}
            onChange={(e) => setComments(e.currentTarget.value)}
            placeholder="If you need any corrections, please describe them in detail here. Include page numbers, line numbers, or specific locations where changes are needed..."
            helperText="Be as specific as possible about any corrections needed. Include page and line numbers where applicable."
          />
        </InfoSection>

        {/* Approval Actions */}
        <InfoSection
          title="Proof Approval"
          subtitle="Choose your approval decision"
        >
          <div className="space-y-4">
            <label className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors group">
              <input
                type="radio"
                id="approve"
                name="approval"
                value="approve"
                checked={approved === true}
                onChange={() => setApproved(true)}
                className="mt-1"
                aria-label="Approve for publication"
              />
              <div className="flex-1">
                <div className="font-semibold text-foreground mb-1">Approve for Publication</div>
                <p className="text-sm text-muted-foreground">
                  The proof is correct and ready for publication. No changes needed.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors group">
              <input
                type="radio"
                id="corrections"
                name="approval"
                value="corrections"
                checked={approved === false}
                onChange={() => setApproved(false)}
                className="mt-1"
                aria-label="Request corrections"
              />
              <div className="flex-1">
                <div className="font-semibold text-foreground mb-1">Request Corrections</div>
                <p className="text-sm text-muted-foreground">
                  Minor corrections are needed before publication. Please describe them in the comments above.
                </p>
              </div>
            </label>
          </div>
        </InfoSection>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 mt-6">
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
            loading={submitting}
          >
            {approved === true ? 'Approve for Publication' : 'Request Corrections'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProofReview;