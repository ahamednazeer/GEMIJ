import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submissionService } from '@/services/submissionService';
import { Submission, SubmissionStatus } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Timeline from '@/components/submission/Timeline';
import InfoSection from '@/components/ui/InfoSection';
import InfoField from '@/components/ui/InfoField';
import StatusCard from '@/components/ui/StatusCard';

const SubmissionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getStatusBadgeVariant = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.SUBMITTED:
      case SubmissionStatus.INITIAL_REVIEW:
        return 'info';
      case SubmissionStatus.UNDER_REVIEW:
        return 'warning';
      case SubmissionStatus.REVISION_REQUIRED:
        return 'warning';
      case SubmissionStatus.ACCEPTED:
        return 'success';
      case SubmissionStatus.PUBLISHED:
        return 'success';
      case SubmissionStatus.REJECTED:
        return 'error';
      default:
        return 'neutral';
    }
  };

  const formatStatus = (status: SubmissionStatus) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusDescription = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.SUBMITTED:
        return 'Your manuscript has been submitted and is awaiting initial review by the editor.';
      case SubmissionStatus.RETURNED_FOR_FORMATTING:
        return 'Your manuscript has been returned for formatting corrections. Please address the issues and resubmit.';
      case SubmissionStatus.INITIAL_REVIEW:
        return 'The editor is conducting an initial review to check formatting, scope, and plagiarism.';
      case SubmissionStatus.UNDER_REVIEW:
        return 'Your manuscript is currently under peer review. Reviewers are evaluating your work.';
      case SubmissionStatus.REVISION_REQUIRED:
        return 'Reviewers have requested revisions. Please address their comments and resubmit.';
      case SubmissionStatus.ACCEPTED:
        return 'Congratulations! Your manuscript has been accepted for publication. Please proceed with payment if required.';
      case SubmissionStatus.PAYMENT_PENDING:
        return 'Your manuscript is accepted! Please complete the payment to proceed with publication.';
      case SubmissionStatus.PUBLISHED:
        return 'Your manuscript has been published and is now available online.';
      case SubmissionStatus.REJECTED:
        return 'Unfortunately, your manuscript was not accepted for publication.';
      default:
        return 'Status information not available.';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-secondary-600 mt-2">Loading submission details...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="error" title="Error">
          {error || 'Submission not found'}
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
                {submission.title}
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                {getStatusDescription(submission.status)}
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

        {/* Status Actions */}
        {(submission.status === SubmissionStatus.REVISION_REQUIRED || 
          submission.status === SubmissionStatus.ACCEPTED || 
          submission.status === SubmissionStatus.PAYMENT_PENDING ||
          (submission.status === SubmissionStatus.PUBLISHED && submission.doi)) && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-3">
              {submission.status === SubmissionStatus.REVISION_REQUIRED && (
                <Button
                  onClick={() => navigate(`/author/submissions/${submission.id}/revise`)}
                >
                  Submit Revision
                </Button>
              )}
              {(submission.status === SubmissionStatus.ACCEPTED || submission.status === SubmissionStatus.PAYMENT_PENDING) && (
                <Button
                  onClick={() => navigate(`/author/submissions/${submission.id}/payment`)}
                >
                  Pay Publication Fee
                </Button>
              )}
              {submission.status === SubmissionStatus.PUBLISHED && submission.doi && (
                <Button
                  onClick={() => navigate(`/article/${submission.doi}`)}
                  variant="outline"
                >
                  View Published Article
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Submission Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <InfoSection
            title="Manuscript Information"
            subtitle="Key details about your submission"
          >
            <div className="space-y-4">
              <InfoField
                label="Type"
                value={submission.manuscriptType}
              />
              <InfoField
                label="Keywords"
                value={
                  <div className="flex flex-wrap gap-2 mt-2">
                    {submission.keywords.map((keyword, index) => (
                      <span key={index} className="bg-primary-100 text-primary-700 px-2.5 py-1 rounded-md text-xs font-medium">
                        {keyword}
                      </span>
                    ))}
                  </div>
                }
              />
              <InfoField
                label="Submitted"
                value={new Date(submission.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              />
              {submission.submittedAt && (
                <InfoField
                  label="Submitted for Review"
                  value={new Date(submission.submittedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                />
              )}
              {submission.acceptedAt && (
                <div className="pt-3 border-t border-border">
                  <InfoField
                    label="Accepted"
                    value={new Date(submission.acceptedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    valueClassName="text-success-700 font-semibold"
                  />
                </div>
              )}
              {submission.publishedAt && (
                <div className="pt-3 border-t border-border">
                  <InfoField
                    label="Published"
                    value={new Date(submission.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    valueClassName="text-primary-700 font-semibold"
                  />
                </div>
              )}
              {submission.doi && (
                <div className="pt-3 border-t border-border">
                  <InfoField
                    label="DOI"
                    value={<code className="text-sm font-mono break-all">{submission.doi}</code>}
                  />
                </div>
              )}
            </div>
          </InfoSection>

          <InfoSection
            title="Authors"
            subtitle="Research team and contributors"
            accent
          >
            <div className="space-y-4">
              <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="status-dot bg-primary-600"></div>
                  <p className="font-semibold text-foreground">
                    {submission.author.firstName} {submission.author.lastName}
                  </p>
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded font-medium">
                    Corresponding
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{submission.author.email}</p>
                {submission.author.affiliation && (
                  <p className="text-sm text-muted-foreground">{submission.author.affiliation}</p>
                )}
              </div>
              {submission.coAuthors.map((author, index) => (
                <div key={index} className="bg-muted/50 p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="status-dot bg-secondary-400"></div>
                    <p className="font-semibold text-foreground">
                      {author.firstName} {author.lastName}
                    </p>
                    {author.isCorresponding && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded font-medium">
                        Corresponding
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{author.email}</p>
                  {author.affiliation && (
                    <p className="text-sm text-muted-foreground">{author.affiliation}</p>
                  )}
                </div>
              ))}
            </div>
          </InfoSection>
        </div>
      </div>

      {/* Abstract */}
      <InfoSection
        title="Abstract"
        subtitle="Research summary and key findings"
        className="mb-6"
      >
        <p className="text-foreground leading-relaxed prose-academic">{submission.abstract}</p>
      </InfoSection>

      {/* Files */}
      {submission.files && submission.files.length > 0 && (
        <InfoSection
          title="Files"
          subtitle="Manuscript and supporting documents"
          className="mb-6"
        >
          <div className="space-y-3">
            {submission.files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{file.originalName}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {file.fileType.toUpperCase()} • {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {file.description && (
                    <p className="text-sm text-muted-foreground mt-1">{file.description}</p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="ml-4 flex-shrink-0">
                  Download
                </Button>
              </div>
            ))}
          </div>
        </InfoSection>
      )}

      {/* Reviews */}
      {submission.reviews && submission.reviews.length > 0 && (
        <InfoSection
          title="Peer Reviews"
          subtitle="Reviewer feedback and recommendations"
          className="mb-6"
        >
          <div className="space-y-4">
            {submission.reviews.map((review, index) => (
              <div key={review.id} className="border border-border rounded-lg p-5 bg-muted/20">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-foreground">Review {index + 1}</h3>
                  <Badge variant={review.status === 'COMPLETED' ? 'success' : 'warning'}>
                    {review.status}
                  </Badge>
                </div>
                {review.recommendation && (
                  <div className="mb-4">
                    <div className="info-label mb-1">Recommendation</div>
                    <p className="text-foreground font-medium">{review.recommendation}</p>
                  </div>
                )}
                {review.authorComments && (
                  <div>
                    <div className="info-label mb-2">Comments for Author</div>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">{review.authorComments}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </InfoSection>
      )}

      {/* Timeline */}
      {submission.timeline && submission.timeline.length > 0 && (
        <InfoSection
          title="Submission Timeline"
          subtitle="Complete history of your submission"
        >
          <Timeline events={submission.timeline} />
        </InfoSection>
      )}
    </div>
  );
};

export default SubmissionDetails;