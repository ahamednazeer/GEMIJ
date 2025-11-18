import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submissionService } from '@/services/submissionService';
import { Submission } from '@/types';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Alert from '@/components/ui/Alert';

const SubmitRevision: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    revisionLetter: '',
    responseToReviewers: ''
  });
  
  const [files, setFiles] = useState<{
    revisedManuscript?: File;
    additionalFiles?: File[];
  }>({});

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (type: 'revisedManuscript' | 'additionalFiles', file: File | File[] | null) => {
    setFiles(prev => ({
      ...prev,
      [type]: type === 'additionalFiles' ? (file as File[] | null) ?? [] : (file as File) ?? undefined
    }));
  };

  const handleSubmit = async () => {
    if (!formData.revisionLetter.trim() || !formData.responseToReviewers.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (!files.revisedManuscript) {
      setError('Please upload the revised manuscript');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Create revision
      const revision = await submissionService.createRevision(id!, {
        revisionLetter: formData.revisionLetter,
        responseToReviewers: formData.responseToReviewers
      });

      // Upload revised manuscript
      await submissionService.uploadRevisionFile(id!, revision.id, files.revisedManuscript, 'revised-manuscript');

      // Upload additional files if any
      if (files.additionalFiles && files.additionalFiles.length > 0) {
        for (const file of files.additionalFiles) {
          await submissionService.uploadRevisionFile(id!, revision.id, file, 'additional');
        }
      }

      // Navigate back to submission details with success message
      navigate(`/submission/${id}`, {
        state: {
          message: 'Revision submitted successfully! The editor will review your changes.',
          type: 'success'
        }
      });
    } catch (error: any) {
      console.error('Revision submission error:', error);
      setError(error.response?.data?.error || 'Failed to submit revision. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-secondary-600 mt-2">Loading submission...</p>
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
          Submit Revision
        </h1>
        <p className="text-secondary-600">
          Address the reviewer comments and submit your revised manuscript
        </p>
      </div>

      {error && (
        <Alert variant="error" title="Submission Error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Original Submission Info */}
      {submission && (
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Original Submission</h2>
          </div>
          <div className="card-body">
            <h3 className="font-medium text-secondary-900 mb-2">{submission.title}</h3>
            <p className="text-sm text-secondary-600">
              Submitted: {new Date(submission.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {/* Reviewer Comments */}
      {submission?.reviews && submission.reviews.length > 0 && (
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Reviewer Comments</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {submission.reviews.map((review, index) => (
                <div key={review.id} className="border border-secondary-200 rounded p-4">
                  <h3 className="font-medium text-secondary-900 mb-2">Review {index + 1}</h3>
                  {review.recommendation && (
                    <div className="mb-3">
                      <label className="text-sm font-medium text-secondary-700">Recommendation</label>
                      <p className="text-secondary-900">{review.recommendation}</p>
                    </div>
                  )}
                  {review.authorComments && (
                    <div>
                      <label className="text-sm font-medium text-secondary-700">Comments</label>
                      <p className="text-secondary-900 mt-1 whitespace-pre-wrap">{review.authorComments}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Revision Form */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Revision Details</h2>
        </div>
        <div className="card-body space-y-6">
          <Textarea
            label="Cover Letter to Editor *"
            rows={6}
            value={formData.revisionLetter}
            onChange={(e) => handleInputChange('revisionLetter', e.currentTarget.value)}
            placeholder="Explain the changes you have made and how you have addressed the editor's concerns..."
            required
          />

          <Textarea
            label="Response to Reviewers *"
            rows={8}
            value={formData.responseToReviewers}
            onChange={(e) => handleInputChange('responseToReviewers', e.currentTarget.value)}
            placeholder="Provide a detailed point-by-point response to each reviewer's comments..."
            required
          />
        </div>
      </div>

      {/* File Upload */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Upload Files</h2>
        </div>
        <div className="card-body space-y-6">
          <div>
            <label className="form-label">Revised Manuscript *</label>
            <input
              type="file"
              className="form-input"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFileChange('revisedManuscript', e.target.files?.[0] || null)}
              required
            />
            <p className="text-sm text-secondary-500 mt-1">
              Upload your revised manuscript with all changes incorporated (PDF, DOC, or DOCX)
            </p>
            {files.revisedManuscript && (
              <p className="text-sm text-success-600 mt-1">
                ✓ {files.revisedManuscript.name}
              </p>
            )}
          </div>

          <div>
            <label className="form-label">Additional Files</label>
            <input
              type="file"
              className="form-input"
              multiple
              accept=".pdf,.doc,.docx,.zip,.rar"
              onChange={(e) => handleFileChange('additionalFiles', Array.from(e.target.files || []))}
            />
            <p className="text-sm text-secondary-500 mt-1">
              Optional: Upload any additional files such as revised figures, supplementary materials, etc.
            </p>
            {files.additionalFiles && files.additionalFiles.length > 0 && (
              <div className="mt-1">
                {files.additionalFiles.map((file, index) => (
                  <p key={index} className="text-sm text-success-600">
                    ✓ {file.name}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/submission/${id}`)}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Submitting Revision...' : 'Submit Revision'}
        </Button>
      </div>
    </div>
  );
};

export default SubmitRevision;