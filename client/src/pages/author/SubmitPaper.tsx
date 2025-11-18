import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import Stepper from '@/components/ui/Stepper';
import { submissionService } from '@/services/submissionService';
import { SubmissionFormData } from '@/types';

interface FormData {
  title: string;
  abstract: string;
  keywords: string;
  authors: Array<{
    firstName: string;
    lastName: string;
    email: string;
    affiliation: string;
    isCorresponding: boolean;
  }>;
  manuscriptType: string;
  researchArea: string;
  conflictOfInterest: string;
  ethicsStatement: string;
  fundingInfo: string;
  isDoubleBlind: boolean;
  suggestedReviewers: string;
  excludedReviewers: string;
  comments: string;
}

const SubmitPaper: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    abstract: '',
    keywords: '',
    authors: [{
      firstName: '',
      lastName: '',
      email: '',
      affiliation: '',
      isCorresponding: true
    }],
    manuscriptType: '',
    researchArea: '',
    conflictOfInterest: '',
    ethicsStatement: '',
    fundingInfo: '',
    isDoubleBlind: false,
    suggestedReviewers: '',
    excludedReviewers: '',
    comments: ''
  });
  const [files, setFiles] = useState<{
    manuscript?: File;
    coverLetter?: File;
    supplementary?: File[];
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    'Manuscript Details',
    'Authors',
    'Files',
    'Additional Information',
    'Review & Submit'
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addAuthor = () => {
    setFormData(prev => ({
      ...prev,
      authors: [...prev.authors, {
        firstName: '',
        lastName: '',
        email: '',
        affiliation: '',
        isCorresponding: false
      }]
    }));
  };

  const removeAuthor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      authors: prev.authors.filter((_, i) => i !== index)
    }));
  };

  const updateAuthor = (index: number, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      authors: prev.authors.map((author, i) => 
        i === index ? { ...author, [field]: value } : author
      )
    }));
  };

  const handleFileChange = (
    type: 'manuscript' | 'coverLetter' | 'supplementary',
    file: File | File[] | null
  ) => {
    setFiles((prev) => {
      if (type === 'supplementary') {
        return { ...prev, supplementary: (file as File[] | null) ?? [] };
      }
      if (type === 'manuscript') {
        return { ...prev, manuscript: (file as File) ?? undefined };
      }
      return { ...prev, coverLetter: (file as File) ?? undefined };
    });
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare submission data
      const submissionData: SubmissionFormData = {
        title: formData.title,
        abstract: formData.abstract,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        manuscriptType: formData.manuscriptType,
        isDoubleBlind: formData.isDoubleBlind,
        suggestedReviewers: formData.suggestedReviewers.split(',').map(r => r.trim()).filter(r => r),
        excludedReviewers: formData.excludedReviewers.split(',').map(r => r.trim()).filter(r => r),
        comments: formData.comments,
        coAuthors: formData.authors.map((author, index) => ({
          firstName: author.firstName,
          lastName: author.lastName,
          email: author.email,
          affiliation: author.affiliation,
          isCorresponding: author.isCorresponding,
          order: index + 1
        }))
      };

      // Create submission
      const submission = await submissionService.createSubmission(submissionData);
      setSubmissionId(submission.id);

      // Upload files
      if (files.manuscript) {
        await submissionService.uploadFile(submission.id, files.manuscript, 'manuscript');
      }
      if (files.coverLetter) {
        await submissionService.uploadFile(submission.id, files.coverLetter, 'cover-letter');
      }
      if (files.supplementary && files.supplementary.length > 0) {
        for (const file of files.supplementary) {
          await submissionService.uploadFile(submission.id, file, 'supplementary');
        }
      }

      // Submit for review
      await submissionService.submitForReview(submission.id);

      // Navigate to dashboard with success message
      navigate('/dashboard', { 
        state: { 
          message: 'Manuscript submitted successfully! You will receive an email confirmation shortly.',
          type: 'success'
        }
      });
    } catch (error: any) {
      console.error('Submission error:', error);
      setError(error.response?.data?.error || 'Failed to submit manuscript. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <Input
              label="Manuscript Title *"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.currentTarget.value)}
              placeholder="Enter the full title of your manuscript"
              required
            />
            
            <Textarea
              label="Abstract *"
              rows={8}
              value={formData.abstract}
              onChange={(e) => handleInputChange('abstract', e.currentTarget.value)}
              placeholder="Provide a comprehensive abstract (250-300 words)"
              required
            />
            
            <Input
              label="Keywords *"
              value={formData.keywords}
              onChange={(e) => handleInputChange('keywords', e.currentTarget.value)}
              placeholder="Enter 4-6 keywords separated by commas"
              required
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Manuscript Type *"
                value={formData.manuscriptType}
                onChange={(e) => handleInputChange('manuscriptType', e.currentTarget.value)}
                required
                options={[
                  { label: 'Select type', value: '' },
                  { label: 'Research Article', value: 'research-article' },
                  { label: 'Review Article', value: 'review' },
                  { label: 'Case Study', value: 'case-study' },
                  { label: 'Technical Note', value: 'technical-note' },
                ]}
              />
              
              <Select
                label="Research Area *"
                value={formData.researchArea}
                onChange={(e) => handleInputChange('researchArea', e.currentTarget.value)}
                required
                options={[
                  { label: 'Select area', value: '' },
                  { label: 'Artificial Intelligence', value: 'artificial-intelligence' },
                  { label: 'Machine Learning', value: 'machine-learning' },
                  { label: 'Data Science', value: 'data-science' },
                  { label: 'Computer Vision', value: 'computer-vision' },
                  { label: 'Natural Language Processing', value: 'natural-language-processing' },
                  { label: 'Robotics', value: 'robotics' },
                  { label: 'Cybersecurity', value: 'cybersecurity' },
                  { label: 'Software Engineering', value: 'software-engineering' },
                ]}
              />
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Authors</h3>
              <Button type="button" onClick={addAuthor} size="sm">
                Add Author
              </Button>
            </div>
            
            {formData.authors.map((author, index) => (
              <div key={index} className="border border-secondary-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Author {index + 1}</h4>
                  {formData.authors.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-error-700 hover:bg-red-50"
                      onClick={() => removeAuthor(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name *"
                    value={author.firstName}
                    onChange={(e) => updateAuthor(index, 'firstName', e.currentTarget.value)}
                    required
                  />
                  
                  <Input
                    label="Last Name *"
                    value={author.lastName}
                    onChange={(e) => updateAuthor(index, 'lastName', e.currentTarget.value)}
                    required
                  />
                  
                  <Input
                    label="Email *"
                    type="email"
                    value={author.email}
                    onChange={(e) => updateAuthor(index, 'email', e.currentTarget.value)}
                    required
                  />
                  
                  <Input
                    label="Affiliation *"
                    value={author.affiliation}
                    onChange={(e) => updateAuthor(index, 'affiliation', e.currentTarget.value)}
                    required
                  />
                </div>
                
                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={author.isCorresponding}
                      onChange={(e) => updateAuthor(index, 'isCorresponding', e.target.checked)}
                    />
                    <span className="ml-2 text-sm text-secondary-700">
                      Corresponding author
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="form-label">Manuscript File *</label>
              <input
                type="file"
                className="form-input"
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFileChange('manuscript', e.target.files?.[0] || null)}
              />
              <p className="text-sm text-secondary-500 mt-1">
                Upload your manuscript in PDF, DOC, or DOCX format (max 10MB)
              </p>
            </div>
            
            <div>
              <label className="form-label">Cover Letter</label>
              <input
                type="file"
                className="form-input"
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFileChange('coverLetter', e.target.files?.[0] || null)}
              />
              <p className="text-sm text-secondary-500 mt-1">
                Optional cover letter addressing the editor
              </p>
            </div>
            
            <div>
              <label className="form-label">Supplementary Files</label>
              <input
                type="file"
                className="form-input"
                multiple
                accept=".pdf,.doc,.docx,.zip,.rar"
                onChange={(e) => handleFileChange('supplementary', Array.from(e.target.files || []))}
              />
              <p className="text-sm text-secondary-500 mt-1">
                Additional files such as datasets, code, or appendices
              </p>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="doubleBlind"
                className="form-checkbox"
                checked={formData.isDoubleBlind}
                onChange={(e) => handleInputChange('isDoubleBlind', e.target.checked)}
              />
              <label htmlFor="doubleBlind" className="text-sm text-secondary-700">
                Request double-blind peer review
              </label>
            </div>

            <Textarea
              label="Suggested Reviewers"
              rows={3}
              value={formData.suggestedReviewers}
              onChange={(e) => handleInputChange('suggestedReviewers', e.currentTarget.value)}
              placeholder="Enter email addresses of suggested reviewers, separated by commas"
            />

            <Textarea
              label="Excluded Reviewers"
              rows={3}
              value={formData.excludedReviewers}
              onChange={(e) => handleInputChange('excludedReviewers', e.currentTarget.value)}
              placeholder="Enter email addresses of reviewers to exclude, separated by commas"
            />

            <Textarea
              label="Comments to Editor"
              rows={4}
              value={formData.comments}
              onChange={(e) => handleInputChange('comments', e.currentTarget.value)}
              placeholder="Any additional comments for the editor"
            />
            
            <Textarea
              label="Conflict of Interest Statement *"
              rows={4}
              value={formData.conflictOfInterest}
              onChange={(e) => handleInputChange('conflictOfInterest', e.currentTarget.value)}
              placeholder="Declare any potential conflicts of interest or state 'None'"
              required
            />
            
            <Textarea
              label="Ethics Statement"
              rows={4}
              value={formData.ethicsStatement}
              onChange={(e) => handleInputChange('ethicsStatement', e.currentTarget.value)}
              placeholder="If applicable, provide ethics approval information"
            />
            
            <Textarea
              label="Funding Information"
              rows={4}
              value={formData.fundingInfo}
              onChange={(e) => handleInputChange('fundingInfo', e.currentTarget.value)}
              placeholder="List funding sources and grant numbers, or state 'None'"
            />
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Review Your Submission</h3>
            
            <div className="card">
              <div className="card-body">
                <h4 className="font-medium mb-2">Manuscript Details</h4>
                <p><strong>Title:</strong> {formData.title}</p>
                <p><strong>Type:</strong> {formData.manuscriptType}</p>
                <p><strong>Research Area:</strong> {formData.researchArea}</p>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h4 className="font-medium mb-2">Authors</h4>
                {formData.authors.map((author, index) => (
                  <p key={index}>
                    {author.firstName} {author.lastName} ({author.email})
                    {author.isCorresponding && ' - Corresponding Author'}
                  </p>
                ))}
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h4 className="font-medium mb-2">Files</h4>
                <p><strong>Manuscript:</strong> {files.manuscript?.name || 'Not uploaded'}</p>
                <p><strong>Cover Letter:</strong> {files.coverLetter?.name || 'Not uploaded'}</p>
                <p><strong>Supplementary:</strong> {files.supplementary?.length || 0} files</p>
              </div>
            </div>
            
            <Alert variant="warning" title="Before you submit">
              By submitting this manuscript, you confirm that all information is accurate and complete, and that you have obtained necessary permissions for publication.
            </Alert>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">Submit Manuscript</h1>
        <p className="text-secondary-600 mt-2">
          Complete all steps to submit your manuscript for review
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <Stepper steps={steps} currentStep={currentStep} onStepChange={setCurrentStep} />
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="error" title="Submission Error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Form Content */}
      <div className="card">
        <div className="card-body">
          {renderStep()}
        </div>
        
        <div className="card-footer flex justify-between">
          <Button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            variant="outline"
          >
            Previous
          </Button>
          
          {currentStep < steps.length ? (
            <Button type="button" onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Manuscript'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmitPaper;