import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reviewService } from '@/services/reviewService';
import { Review, ReviewFormData } from '@/types';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import FileUpload from '@/components/FileUpload';

const ReviewForm: React.FC = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<ReviewFormData>({
    recommendation: 'MINOR_REVISION',
    confidentialComments: '',
    authorComments: '',
    rating: 3
  });

  const [annotatedFile, setAnnotatedFile] = useState<File | null>(null);

  useEffect(() => {
    if (reviewId) {
      loadReview();
    }
  }, [reviewId]);

  const loadReview = async () => {
    try {
      const data = await reviewService.getReview(reviewId!);
      setReview(data);
      
      // Pre-populate form if review has been started
      if (data.recommendation) {
        setFormData({
          recommendation: data.recommendation as any,
          confidentialComments: data.confidentialComments || '',
          authorComments: data.authorComments || '',
          rating: data.rating || 3
        });
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load review');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ReviewFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveDraft = async () => {
    setError(null);
    try {
      await reviewService.updateReview(reviewId!, formData);
      setSuccess('Draft saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save draft');
    }
  };

  const handleSubmitReview = async () => {
    if (!formData.authorComments.trim()) {
      setError('Please provide comments for the authors');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Upload annotated file if provided
      if (annotatedFile) {
        await reviewService.uploadAnnotatedFile(reviewId!, annotatedFile);
      }

      // Submit review
      await reviewService.submitReview(reviewId!, formData);

      navigate('/dashboard', {
        state: {
          message: 'Review submitted successfully! Thank you for your contribution.',
          type: 'success'
        }
      });
    } catch (error: any) {
      console.error('Review submission error:', error);
      setError(error.response?.data?.error || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadManuscript = async (fileId: string, fileName: string) => {
    try {
      const blob = await reviewService.downloadManuscript(review!.submission.id, fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      setError('Failed to download file');
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'ACCEPT':
        return 'text-green-700 bg-green-100';
      case 'MINOR_REVISION':
        return 'text-blue-700 bg-blue-100';
      case 'MAJOR_REVISION':
        return 'text-yellow-700 bg-yellow-100';
      case 'REJECT':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-secondary-700 bg-secondary-100';
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => handleInputChange('rating', i + 1)}
        className={`text-2xl ${i < rating ? 'text-yellow-400' : 'text-secondary-300'} hover:text-yellow-400 transition-colors`}
      >
        ★
      </button>
    ));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-secondary-600 mt-2">Loading review...</p>
        </div>
      </div>
    );
  }

  if (error && !review) {
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

  if (!review) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="error" title="Review Not Found">
          The review could not be found.
        </Alert>
        <Button onClick={() => navigate('/dashboard')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const isCompleted = review.status === 'COMPLETED';
  const daysLeft = Math.ceil((new Date(review.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0;

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
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              {isCompleted ? 'Review Completed' : 'Manuscript Review'}
            </h1>
            <p className="text-secondary-600">
              {isCompleted ? 'View your submitted review' : 'Provide your expert evaluation'}
            </p>
          </div>
          <Badge variant={isCompleted ? 'success' : isOverdue ? 'error' : 'warning'}>
            {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : `${daysLeft} days left`}
          </Badge>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Error" className="mb-6">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" title="Success" className="mb-6">
          {success}
        </Alert>
      )}

      {/* Manuscript Information */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Manuscript Information</h2>
        </div>
        <div className="card-body">
          <h3 className="font-medium text-secondary-900 mb-3">{review.submission.title}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-secondary-700">Type</label>
              <p className="text-secondary-900">{review.submission.manuscriptType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700">Review Type</label>
              <p className="text-secondary-900">
                {review.submission.isDoubleBlind ? 'Double-blind' : 'Single-blind'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700">Keywords</label>
              <p className="text-secondary-900">{review.submission.keywords.join(', ')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700">Due Date</label>
              <p className={`text-secondary-900 ${isOverdue ? 'text-red-600' : ''}`}>
                {new Date(review.dueDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Authors (only if not double-blind) */}
          {!review.submission.isDoubleBlind && review.submission.author && (
            <div className="mb-4">
              <label className="text-sm font-medium text-secondary-700">Authors</label>
              <div className="mt-1">
                <p className="text-secondary-900">
                  {review.submission.author.firstName} {review.submission.author.lastName}
                  {review.submission.author.affiliation && (
                    <span className="text-secondary-600"> - {review.submission.author.affiliation}</span>
                  )}
                </p>
                {review.submission.coAuthors.map((author, index) => (
                  <p key={index} className="text-secondary-900">
                    {author.firstName} {author.lastName}
                    {author.affiliation && (
                      <span className="text-secondary-600"> - {author.affiliation}</span>
                    )}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Abstract */}
          <div>
            <label className="text-sm font-medium text-secondary-700">Abstract</label>
            <p className="text-secondary-900 mt-1 leading-relaxed">{review.submission.abstract}</p>
          </div>
        </div>
      </div>

      {/* Manuscript Files */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Manuscript Files</h2>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {review.submission.files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 border border-secondary-200 rounded">
                <div>
                  <p className="font-medium text-secondary-900">{file.originalName}</p>
                  <p className="text-sm text-secondary-600">
                    {file.fileType} • {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                    {file.isMainFile && <span className="ml-2 text-primary-600">• Main File</span>}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadManuscript(file.id, file.originalName)}
                >
                  Download
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review Form */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Review Form</h2>
        </div>
        <div className="card-body space-y-6">
          {/* Overall Rating */}
          <div>
            <label className="form-label">Overall Quality Rating *</label>
            <div className="flex items-center space-x-2 mb-2">
              {getRatingStars(formData.rating || 0)}
              <span className="text-sm text-secondary-600 ml-4">
                {formData.rating}/5 stars
              </span>
            </div>
            <p className="text-xs text-secondary-500">
              1 = Poor, 2 = Fair, 3 = Good, 4 = Very Good, 5 = Excellent
            </p>
          </div>

          {/* Recommendation */}
          <Select
            label="Recommendation *"
            value={formData.recommendation}
            onChange={(e) => handleInputChange('recommendation', e.currentTarget.value)}
            required
            disabled={isCompleted}
            options={[
              { label: 'Accept without revision', value: 'ACCEPT' },
              { label: 'Accept with minor revisions', value: 'MINOR_REVISION' },
              { label: 'Major revisions required', value: 'MAJOR_REVISION' },
              { label: 'Reject', value: 'REJECT' }
            ]}
          />

          {/* Current recommendation preview */}
          <div className="p-3 rounded-lg border">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(formData.recommendation)}`}>
              {formData.recommendation === 'ACCEPT' ? 'Accept' :
               formData.recommendation === 'MINOR_REVISION' ? 'Minor Revision' :
               formData.recommendation === 'MAJOR_REVISION' ? 'Major Revision' :
               'Reject'}
            </span>
          </div>

          {/* Comments for Authors */}
          <Textarea
            label="Comments for Authors *"
            rows={8}
            value={formData.authorComments}
            onChange={(e) => handleInputChange('authorComments', e.currentTarget.value)}
            placeholder="Provide detailed, constructive feedback for the authors. Include specific suggestions for improvement, questions about methodology, and comments on presentation quality..."
            required
            disabled={isCompleted}
          />

          {/* Confidential Comments */}
          <Textarea
            label="Confidential Comments to Editor"
            rows={6}
            value={formData.confidentialComments}
            onChange={(e) => handleInputChange('confidentialComments', e.currentTarget.value)}
            placeholder="Private comments for the editor only. Include your assessment of the manuscript's suitability, any concerns about ethics or methodology, and your overall recommendation rationale..."
            disabled={isCompleted}
          />

          {/* Annotated File Upload */}
          {!isCompleted && (
            <div>
              <label className="form-label">Annotated Manuscript (Optional)</label>
              <FileUpload
                label=""
                accept=".pdf"
                onFileSelect={(file) => setAnnotatedFile(file as File)}
                value={annotatedFile}
                description="Upload an annotated version of the manuscript with your detailed comments and suggestions"
              />
            </div>
          )}
        </div>
      </div>

      {/* Review Guidelines */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Review Guidelines</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-secondary-900 mb-2">Evaluation Criteria</h3>
              <ul className="text-sm text-secondary-700 space-y-1">
                <li>• Technical quality and rigor</li>
                <li>• Originality and significance</li>
                <li>• Clarity of presentation</li>
                <li>• Literature review adequacy</li>
                <li>• Methodology appropriateness</li>
                <li>• Results interpretation</li>
                <li>• Conclusions validity</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-secondary-900 mb-2">Review Standards</h3>
              <ul className="text-sm text-secondary-700 space-y-1">
                <li>• Be constructive and respectful</li>
                <li>• Provide specific examples</li>
                <li>• Suggest improvements</li>
                <li>• Maintain confidentiality</li>
                <li>• Be objective and fair</li>
                <li>• Focus on scientific merit</li>
                <li>• Complete review thoroughly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        {!isCompleted && (
          <>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={submitting}
            >
              Save Draft
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submitting || !formData.authorComments.trim()}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </>
        )}
        
        {isCompleted && (
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        )}
      </div>

      {/* Submission Confirmation */}
      {!isCompleted && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-900 mb-2">Before Submitting</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Ensure you have thoroughly read the manuscript</li>
            <li>• Provide constructive and detailed feedback</li>
            <li>• Double-check your recommendation</li>
            <li>• Review cannot be modified after submission</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReviewForm;