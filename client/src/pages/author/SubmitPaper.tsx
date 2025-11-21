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
  declarations: {
    originalWork: boolean;
    noConflictOfInterest: boolean;
    ethicsApproval: boolean;
    dataAvailability: boolean;
    copyrightTransfer: boolean;
  };
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
    comments: '',
    declarations: {
      originalWork: false,
      noConflictOfInterest: false,
      ethicsApproval: false,
      dataAvailability: false,
      copyrightTransfer: false
    }
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
    'Declarations',
    'Review & Submit'
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeclarationChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      declarations: {
        ...prev.declarations,
        [field]: value
      }
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

    // Validate required declarations
    if (!formData.declarations.originalWork || !formData.declarations.noConflictOfInterest || !formData.declarations.copyrightTransfer) {
      setError('Please confirm all required declarations before submitting.');
      setIsSubmitting(false);
      return;
    }

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
              <div key={index} className="card mb-4">
                <div className="card-body">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-foreground">Author {index + 1}</h4>
                    {formData.authors.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAuthor(index)}
                        className="text-error-600 hover:text-error-700 hover:bg-error-50"
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
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={author.isCorresponding}
                        onChange={(e) => updateAuthor(index, 'isCorresponding', e.target.checked)}
                      />
                      <span className="text-sm font-medium text-foreground group-hover:text-primary-700 transition-colors">
                        Corresponding author
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Manuscript File <span className="text-error-600">*</span>
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/30 hover:border-primary-300 hover:bg-primary-50/30 transition-colors duration-200 group cursor-pointer">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-muted-foreground group-hover:text-primary-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <input
                  type="file"
                  className="hidden"
                  id="manuscript-file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange('manuscript', e.target.files?.[0] || null)}
                  aria-label="Upload manuscript file"
                />
                <label htmlFor="manuscript-file" className="cursor-pointer">
                  <span className="text-base font-semibold text-foreground block mb-1">Upload manuscript</span>
                  <span className="text-sm text-muted-foreground">PDF, DOC, or DOCX format (max 10MB)</span>
                  {files.manuscript && (
                    <div className="mt-4 inline-flex items-center gap-2 bg-success-50 text-success-700 px-3 py-1.5 rounded-md text-sm font-medium border border-success-200">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {files.manuscript.name}
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Cover Letter <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/30 hover:border-primary-300 hover:bg-primary-50/30 transition-colors duration-200 group cursor-pointer">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-muted-foreground group-hover:text-primary-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <input
                  type="file"
                  className="hidden"
                  id="cover-letter-file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange('coverLetter', e.target.files?.[0] || null)}
                  aria-label="Upload cover letter"
                />
                <label htmlFor="cover-letter-file" className="cursor-pointer">
                  <span className="text-base font-semibold text-foreground block mb-1">Upload cover letter</span>
                  <span className="text-sm text-muted-foreground">Optional letter to the editor</span>
                  {files.coverLetter && (
                    <div className="mt-4 inline-flex items-center gap-2 bg-success-50 text-success-700 px-3 py-1.5 rounded-md text-sm font-medium border border-success-200">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {files.coverLetter.name}
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Supplementary Files <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/30 hover:border-primary-300 hover:bg-primary-50/30 transition-colors duration-200 group cursor-pointer">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-muted-foreground group-hover:text-primary-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <input
                  type="file"
                  className="hidden"
                  id="supplementary-files"
                  multiple
                  accept=".pdf,.doc,.docx,.zip,.rar"
                  onChange={(e) => handleFileChange('supplementary', Array.from(e.target.files || []))}
                  aria-label="Upload supplementary files"
                />
                <label htmlFor="supplementary-files" className="cursor-pointer">
                  <span className="text-base font-semibold text-foreground block mb-1">Upload additional files</span>
                  <span className="text-sm text-muted-foreground">Datasets, code, appendices, etc.</span>
                  {files.supplementary && files.supplementary.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      {files.supplementary.map((file, idx) => (
                        <div key={idx} className="inline-flex items-center gap-2 bg-success-50 text-success-700 px-3 py-1.5 rounded-md text-sm font-medium border border-success-200">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="card">
              <div className="card-body">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    id="doubleBlind"
                    className="form-checkbox mt-0.5"
                    checked={formData.isDoubleBlind}
                    onChange={(e) => handleInputChange('isDoubleBlind', e.target.checked)}
                  />
                  <div>
                    <span className="text-base font-semibold text-foreground block mb-1">Request Double-Blind Peer Review</span>
                    <span className="text-sm text-muted-foreground">Ensure reviewer and author identities remain anonymous throughout the review process</span>
                  </div>
                </label>
              </div>
            </div>

            <Textarea
              label="Suggested Reviewers"
              rows={3}
              value={formData.suggestedReviewers}
              onChange={(e) => handleInputChange('suggestedReviewers', e.currentTarget.value)}
              placeholder="Enter email addresses separated by commas (optional)"
              helperText="You may suggest potential reviewers who are qualified to evaluate your work"
            />

            <Textarea
              label="Excluded Reviewers"
              rows={3}
              value={formData.excludedReviewers}
              onChange={(e) => handleInputChange('excludedReviewers', e.currentTarget.value)}
              placeholder="Enter email addresses separated by commas (optional)"
              helperText="List any reviewers who should not evaluate your manuscript due to conflicts"
            />

            <Textarea
              label="Comments to Editor"
              rows={4}
              value={formData.comments}
              onChange={(e) => handleInputChange('comments', e.currentTarget.value)}
              placeholder="Any additional information for the editorial team (optional)"
            />

            <Textarea
              label="Conflict of Interest Statement"
              rows={4}
              value={formData.conflictOfInterest}
              onChange={(e) => handleInputChange('conflictOfInterest', e.currentTarget.value)}
              placeholder="Declare any potential conflicts of interest or state 'None declared'"
              required
              helperText="Required: Please disclose any financial or personal relationships that could be perceived as influencing your work"
            />

            <Textarea
              label="Ethics Statement"
              rows={4}
              value={formData.ethicsStatement}
              onChange={(e) => handleInputChange('ethicsStatement', e.currentTarget.value)}
              placeholder="If applicable, provide ethics approval information (optional)"
              helperText="Include ethics committee approval number and institution if applicable"
            />

            <Textarea
              label="Funding Information"
              rows={4}
              value={formData.fundingInfo}
              onChange={(e) => handleInputChange('fundingInfo', e.currentTarget.value)}
              placeholder="List funding sources and grant numbers, or state 'None' (optional)"
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">Author Declarations</h3>
              <p className="text-sm text-muted-foreground">Please confirm the following declarations before submitting your manuscript. All required declarations must be confirmed.</p>
            </div>

            <div className="space-y-3">
              <div className="card">
                <div className="card-body">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="form-checkbox mt-0.5"
                      checked={formData.declarations.originalWork}
                      onChange={(e) => handleDeclarationChange('originalWork', e.target.checked)}
                      required
                    />
                    <div>
                      <span className="text-base font-semibold text-foreground block mb-1">
                        Original Work <span className="text-error-600">*</span>
                      </span>
                      <span className="text-sm text-muted-foreground">I confirm that this manuscript represents original work that has not been published elsewhere and is not under consideration for publication in any other journal.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="form-checkbox mt-0.5"
                      checked={formData.declarations.noConflictOfInterest}
                      onChange={(e) => handleDeclarationChange('noConflictOfInterest', e.target.checked)}
                      required
                    />
                    <div>
                      <span className="text-base font-semibold text-foreground block mb-1">
                        Conflict of Interest <span className="text-error-600">*</span>
                      </span>
                      <span className="text-sm text-muted-foreground">I have disclosed all potential conflicts of interest in the manuscript or confirm that no conflicts of interest exist.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="form-checkbox mt-0.5"
                      checked={formData.declarations.ethicsApproval}
                      onChange={(e) => handleDeclarationChange('ethicsApproval', e.target.checked)}
                    />
                    <div>
                      <span className="text-base font-semibold text-foreground block mb-1">Ethics Approval</span>
                      <span className="text-sm text-muted-foreground">If applicable, I confirm that this research has received appropriate ethics approval and complies with ethical guidelines.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="form-checkbox mt-0.5"
                      checked={formData.declarations.dataAvailability}
                      onChange={(e) => handleDeclarationChange('dataAvailability', e.target.checked)}
                    />
                    <div>
                      <span className="text-base font-semibold text-foreground block mb-1">Data Availability</span>
                      <span className="text-sm text-muted-foreground">I confirm that data supporting the results will be made available as required by journal policies.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="card border-primary-200 bg-primary-50/30">
                <div className="card-body">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="form-checkbox mt-0.5"
                      checked={formData.declarations.copyrightTransfer}
                      onChange={(e) => handleDeclarationChange('copyrightTransfer', e.target.checked)}
                      required
                    />
                    <div>
                      <span className="text-base font-semibold text-foreground block mb-1">
                        Copyright Transfer <span className="text-error-600">*</span>
                      </span>
                      <span className="text-sm text-muted-foreground">I agree to transfer copyright to the journal upon acceptance of the manuscript for publication.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">Review Your Submission</h3>
              <p className="text-sm text-muted-foreground">Please review all information before submitting. You can return to previous steps to make changes if needed.</p>
            </div>

            <div className="card">
              <div className="card-header">
                <h4 className="font-semibold text-foreground">Manuscript Details</h4>
              </div>
              <div className="card-body space-y-3">
                <div className="info-field">
                  <div className="info-label">Title</div>
                  <div className="info-value">{formData.title || 'Not provided'}</div>
                </div>
                <div className="info-field">
                  <div className="info-label">Type</div>
                  <div className="info-value">{formData.manuscriptType || 'Not selected'}</div>
                </div>
                <div className="info-field">
                  <div className="info-label">Research Area</div>
                  <div className="info-value">{formData.researchArea || 'Not selected'}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h4 className="font-semibold text-foreground">Authors</h4>
              </div>
              <div className="card-body space-y-3">
                {formData.authors.map((author, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {author.firstName} {author.lastName}
                        {author.isCorresponding && (
                          <span className="ml-2 text-xs font-normal text-primary-700 bg-primary-50 px-2 py-0.5 rounded">Corresponding</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{author.email}</div>
                      {author.affiliation && (
                        <div className="text-sm text-muted-foreground">{author.affiliation}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h4 className="font-semibold text-foreground">Files</h4>
              </div>
              <div className="card-body space-y-2">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Manuscript</span>
                  <span className="text-sm font-medium text-foreground">{files.manuscript?.name || 'Not uploaded'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">Cover Letter</span>
                  <span className="text-sm font-medium text-foreground">{files.coverLetter?.name || 'Not uploaded'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">Supplementary Files</span>
                  <span className="text-sm font-medium text-foreground">{files.supplementary?.length || 0} file(s)</span>
                </div>
              </div>
            </div>

            <Alert variant="warning" title="Final Confirmation">
              By submitting this manuscript, you confirm that all information is accurate and complete, and that you have obtained necessary permissions for publication. Once submitted, you will receive a confirmation email with your submission ID.
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Academic Header - Clean & Professional */}
      <div className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Submit Manuscript
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Submit your research manuscript for peer review. Please complete all required sections before final submission.
            </p>
          </div>

          {/* Progress Stepper */}
          <div className="bg-muted/50 rounded-lg p-6 border border-border">
            <Stepper steps={steps} currentStep={currentStep} onStepChange={setCurrentStep} />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          {/* Navigation Footer */}
          <div className="card-footer flex justify-between items-center gap-4">
            <Button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              variant="outline"
              className="min-w-[120px]"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </Button>

            {currentStep < steps.length ? (
              <Button
                type="button"
                onClick={nextStep}
                className="min-w-[120px]"
              >
                Continue
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                loading={isSubmitting}
                className="min-w-[160px]"
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Review'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitPaper;