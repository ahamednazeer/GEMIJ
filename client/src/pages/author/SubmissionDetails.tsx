import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submissionService } from '@/services/submissionService';
import { Submission, SubmissionStatus } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

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
        return 'secondary';
    }
  };

  const formatStatus = (status: SubmissionStatus) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusDescription = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.SUBMITTED:
        return 'Your manuscript has been submitted and is awaiting initial review by the editor.';
      case SubmissionStatus.INITIAL_REVIEW:
        return 'The editor is conducting an initial review to check formatting, scope, and plagiarism.';
      case SubmissionStatus.UNDER_REVIEW:
        return 'Your manuscript is currently under peer review. Reviewers are evaluating your work.';
      case SubmissionStatus.REVISION_REQUIRED:
        return 'Reviewers have requested revisions. Please address their comments and resubmit.';
      case SubmissionStatus.ACCEPTED:
        return 'Congratulations! Your manuscript has been accepted for publication. Please proceed with payment if required.';
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          ← Back to Dashboard
        </Button>
        
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-secondary-900 flex-1 mr-4">
            {submission.title}
          </h1>
          <Badge variant={getStatusBadgeVariant(submission.status)} size="lg">
            {formatStatus(submission.status)}
          </Badge>
        </div>
        
        <p className="text-secondary-600">
          {getStatusDescription(submission.status)}
        </p>
      </div>

      {/* Status Actions */}
      <div className="mb-6">
        {submission.status === SubmissionStatus.REVISION_REQUIRED && (
          <Button 
            onClick={() => navigate(`/submission/${submission.id}/revise`)}
            className="mr-3"
          >
            Submit Revision
          </Button>
        )}
        {submission.status === SubmissionStatus.ACCEPTED && (
          <Button 
            onClick={() => navigate(`/submission/${submission.id}/payment`)}
            className="mr-3"
          >
            Pay APC Fee
          </Button>
        )}
        {submission.status === SubmissionStatus.PUBLISHED && submission.doi && (
          <Button 
            onClick={() => navigate(`/article/${submission.doi}`)}
            variant="outline"
            className="mr-3"
          >
            View Published Article
          </Button>
        )}
      </div>

      {/* Submission Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Manuscript Information</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="text-sm font-medium text-secondary-700">Type</label>
              <p className="text-secondary-900">{submission.manuscriptType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700">Keywords</label>
              <p className="text-secondary-900">{submission.keywords.join(', ')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700">Submitted</label>
              <p className="text-secondary-900">
                {new Date(submission.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            {submission.submittedAt && (
              <div>
                <label className="text-sm font-medium text-secondary-700">Submitted for Review</label>
                <p className="text-secondary-900">
                  {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
            {submission.acceptedAt && (
              <div>
                <label className="text-sm font-medium text-secondary-700">Accepted</label>
                <p className="text-secondary-900">
                  {new Date(submission.acceptedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
            {submission.publishedAt && (
              <div>
                <label className="text-sm font-medium text-secondary-700">Published</label>
                <p className="text-secondary-900">
                  {new Date(submission.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
            {submission.doi && (
              <div>
                <label className="text-sm font-medium text-secondary-700">DOI</label>
                <p className="text-secondary-900">{submission.doi}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Authors</h2>
          </div>
          <div className="card-body space-y-3">
            <div>
              <p className="font-medium text-secondary-900">
                {submission.author.firstName} {submission.author.lastName}
                <span className="text-sm text-secondary-600 ml-2">(Corresponding Author)</span>
              </p>
              <p className="text-sm text-secondary-600">{submission.author.email}</p>
              {submission.author.affiliation && (
                <p className="text-sm text-secondary-600">{submission.author.affiliation}</p>
              )}
            </div>
            {submission.coAuthors.map((author, index) => (
              <div key={index}>
                <p className="font-medium text-secondary-900">
                  {author.firstName} {author.lastName}
                  {author.isCorresponding && (
                    <span className="text-sm text-secondary-600 ml-2">(Corresponding Author)</span>
                  )}
                </p>
                <p className="text-sm text-secondary-600">{author.email}</p>
                {author.affiliation && (
                  <p className="text-sm text-secondary-600">{author.affiliation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Abstract */}
      <div className="card mt-6">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Abstract</h2>
        </div>
        <div className="card-body">
          <p className="text-secondary-900 leading-relaxed">{submission.abstract}</p>
        </div>
      </div>

      {/* Files */}
      {submission.files && submission.files.length > 0 && (
        <div className="card mt-6">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Files</h2>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {submission.files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border border-secondary-200 rounded">
                  <div>
                    <p className="font-medium text-secondary-900">{file.originalName}</p>
                    <p className="text-sm text-secondary-600">
                      {file.fileType} • {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {file.description && (
                      <p className="text-sm text-secondary-600">{file.description}</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews */}
      {submission.reviews && submission.reviews.length > 0 && (
        <div className="card mt-6">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Reviews</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {submission.reviews.map((review, index) => (
                <div key={review.id} className="border border-secondary-200 rounded p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-secondary-900">Review {index + 1}</h3>
                    <Badge variant={review.status === 'COMPLETED' ? 'success' : 'warning'}>
                      {review.status}
                    </Badge>
                  </div>
                  {review.recommendation && (
                    <div className="mb-3">
                      <label className="text-sm font-medium text-secondary-700">Recommendation</label>
                      <p className="text-secondary-900">{review.recommendation}</p>
                    </div>
                  )}
                  {review.authorComments && (
                    <div>
                      <label className="text-sm font-medium text-secondary-700">Comments for Author</label>
                      <p className="text-secondary-900 mt-1">{review.authorComments}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionDetails;