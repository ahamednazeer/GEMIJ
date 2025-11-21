import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submissionService } from '@/services/submissionService';
import { Submission } from '@/types';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Alert from '@/components/ui/Alert';
import InfoSection from '@/components/ui/InfoSection';

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
      navigate(`/author/submissions/${id}`, {
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

  if (submission && submission.status !== 'REVISION_REQUIRED') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="warning" title="Revision Not Required">
          This submission is not currently in revision required status. Current status: {submission.status.replace(/_/g, ' ').toLowerCase()}
        </Alert>
        <Button onClick={() => navigate(`/author/submissions/${id}`)} className="mt-4">
          Back to Submission
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
            onClick={() => navigate(`/author/submissions/${id}`)}
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
              Submit Revision
            </h1>
            <p className="text-base text-muted-foreground max-w-3xl">
              Address the reviewer comments and submit your revised manuscript. Please provide a detailed response to all reviewer feedback.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {error && (
          <Alert variant="error" title="Submission Error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Original Submission Info */}
        {submission && (
          <InfoSection
            title="Original Submission"
            subtitle="Details of the manuscript being revised"
            className="mb-6"
          >
            <div className="space-y-4">
              <div>
                <div className="info-label mb-1">Title</div>
                <div className="info-value">{submission.title}</div>
              </div>
              <div>
                <div className="info-label mb-1">Submitted</div>
                <div className="info-value">
                  {new Date(submission.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              
              {/* Original Files */}
              {submission.files && submission.files.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <div className="info-label mb-3">Original Files</div>
                  <div className="space-y-2">
                    {submission.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{file.originalName}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span>{file.fileType.toUpperCase()}</span>
                              <span>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                              {file.isMainFile && (
                                <span className="bg-success-100 text-success-700 px-2 py-0.5 rounded font-medium">
                                  Main File
                                </span>
                              )}
                            </div>
                            {file.description && (
                              <p className="text-xs text-muted-foreground mt-1">{file.description}</p>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="ml-4 flex-shrink-0">
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </InfoSection>
        )}

        {/* Reviewer Comments */}
        {submission?.reviews && submission.reviews.length > 0 && (
          <InfoSection
            title="Reviewer Comments"
            subtitle="Feedback from peer reviewers"
            className="mb-6"
          >
            <div className="space-y-4">
              {submission.reviews.map((review, index) => (
                <div key={review.id} className="border border-border rounded-lg p-5 bg-muted/20">
                  <h3 className="font-semibold text-foreground mb-3">Review {index + 1}</h3>
                  {review.recommendation && (
                    <div className="mb-4">
                      <div className="info-label mb-1">Recommendation</div>
                      <p className="text-foreground font-medium">{review.recommendation}</p>
                    </div>
                  )}
                  {review.authorComments && (
                    <div>
                      <div className="info-label mb-2">Comments</div>
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap">{review.authorComments}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </InfoSection>
        )}

        {/* Revision Form */}
        <InfoSection
          title="Revision Details"
          subtitle="Provide your response to reviewer comments"
          className="mb-6"
        >
          <div className="space-y-6">
            <Textarea
              label="Cover Letter to Editor"
              rows={6}
              value={formData.revisionLetter}
              onChange={(e) => handleInputChange('revisionLetter', e.currentTarget.value)}
              placeholder="Explain the changes you have made and how you have addressed the editor's concerns..."
              required
              helperText="Required: Describe the key changes made in response to editorial feedback"
            />

            <Textarea
              label="Response to Reviewers"
              rows={8}
              value={formData.responseToReviewers}
              onChange={(e) => handleInputChange('responseToReviewers', e.currentTarget.value)}
              placeholder="Provide a detailed point-by-point response to each reviewer's comments..."
              required
              helperText="Required: Address each reviewer comment systematically, indicating where changes were made"
            />
          </div>
        </InfoSection>

        {/* File Upload */}
        <InfoSection
          title="Upload Revised Files"
          subtitle="Submit your revised manuscript and supporting documents"
          className="mb-6"
        >
          <div className="space-y-6">
            <div>
              <label className="form-label">
                Revised Manuscript <span className="text-error-600">*</span>
              </label>
              <input
                type="file"
                className="form-input"
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFileChange('revisedManuscript', e.target.files?.[0] || null)}
                required
                aria-label="Upload revised manuscript"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Upload your revised manuscript with all changes incorporated. Accepted formats: PDF, DOC, or DOCX.
              </p>
              {files.revisedManuscript && (
                <div className="mt-3 inline-flex items-center gap-2 bg-success-50 text-success-700 px-3 py-1.5 rounded-md text-sm font-medium border border-success-200">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {files.revisedManuscript.name}
                </div>
              )}
            </div>

            <div>
              <label className="form-label">
                Additional Files <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <input
                type="file"
                className="form-input"
                multiple
                accept=".pdf,.doc,.docx,.zip,.rar"
                onChange={(e) => handleFileChange('additionalFiles', Array.from(e.target.files || []))}
                aria-label="Upload additional files"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Optional: Upload any additional files such as revised figures, supplementary materials, or datasets.
              </p>
              {files.additionalFiles && files.additionalFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.additionalFiles.map((file, index) => (
                    <div key={index} className="inline-flex items-center gap-2 bg-success-50 text-success-700 px-3 py-1.5 rounded-md text-sm font-medium border border-success-200 mr-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </InfoSection>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/author/submissions/${id}`)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            loading={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Revision'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubmitRevision;