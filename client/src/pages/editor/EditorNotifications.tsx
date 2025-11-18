import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { editorService } from '@/services/editorService';
import { Submission } from '@/types';
import Alert from '@/components/ui/Alert';

const EditorNotifications: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [recipient, setRecipient] = useState<'AUTHOR' | 'REVIEWERS'>('AUTHOR');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const decisionTemplates = {
    accept: {
      subject: 'Manuscript Accepted for Publication',
      template: `Dear {author_name},

We are pleased to inform you that your manuscript titled "{manuscript_title}" has been accepted for publication in our journal.

The reviewers were impressed with the quality of your work and the contribution it makes to the field. Your manuscript will now proceed to the production stage.

Next steps:
1. You will receive a copyright agreement form within the next few days
2. Our production team will contact you regarding any final formatting requirements
3. You will receive page proofs for your review before publication

We expect your article to be published in the next available issue.

Congratulations on this achievement!

Best regards,
Editorial Team`
    },
    minor_revision: {
      subject: 'Minor Revision Required - {manuscript_title}',
      template: `Dear {author_name},

Thank you for submitting your manuscript titled "{manuscript_title}" to our journal.

After careful review by our expert reviewers, we are pleased to inform you that your manuscript has been conditionally accepted pending minor revisions.

The reviewers have provided constructive feedback that will help improve the quality and clarity of your work. Please address all reviewer comments and resubmit your revised manuscript within 30 days.

When resubmitting, please include:
1. A revised manuscript with changes clearly marked
2. A detailed response letter addressing each reviewer comment
3. A clean version of the revised manuscript

We look forward to receiving your revised submission.

Best regards,
Editorial Team`
    },
    major_revision: {
      subject: 'Major Revision Required - {manuscript_title}',
      template: `Dear {author_name},

Thank you for submitting your manuscript titled "{manuscript_title}" to our journal.

After thorough review by our expert reviewers, we believe your manuscript has potential but requires major revisions before it can be considered for publication.

The reviewers have identified significant issues that need to be addressed. Please carefully consider all reviewer comments and make substantial revisions to your manuscript. You have 60 days to submit your revised manuscript.

When resubmitting, please include:
1. A substantially revised manuscript with changes clearly marked
2. A comprehensive response letter addressing each reviewer comment point-by-point
3. A clean version of the revised manuscript

Please note that the revised manuscript may be sent for re-review.

Best regards,
Editorial Team`
    },
    reject: {
      subject: 'Manuscript Decision - {manuscript_title}',
      template: `Dear {author_name},

Thank you for submitting your manuscript titled "{manuscript_title}" to our journal.

After careful consideration by our editorial team and expert reviewers, we regret to inform you that we cannot accept your manuscript for publication in our journal.

This decision was based on the following factors:
- The manuscript does not align sufficiently with the journal's scope and focus
- The reviewers identified significant methodological concerns
- The contribution to the field is not substantial enough for our publication standards

We encourage you to consider the reviewers' feedback for future submissions to other journals. The peer review process, while sometimes disappointing, is designed to maintain the highest standards of scientific publication.

Thank you for considering our journal for your research.

Best regards,
Editorial Team`
    }
  };

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

  const sendDecisionLetter = async () => {
    if (!selectedTemplate) {
      setMessage({ text: 'Please select a decision template', type: 'error' });
      return;
    }

    setProcessing(true);
    try {
      await editorService.sendDecisionLetter(id!, selectedTemplate, customMessage);
      setMessage({ text: 'Decision letter sent successfully', type: 'success' });
      setTimeout(() => {
        navigate('/editor/submissions');
      }, 2000);
    } catch (error) {
      console.error('Failed to send decision letter:', error);
      setMessage({ text: 'Failed to send decision letter', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const sendCustomEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      setMessage({ text: 'Please provide subject and message', type: 'error' });
      return;
    }

    setProcessing(true);
    try {
      await editorService.sendCustomEmail(id!, recipient, {
        subject: emailSubject,
        message: emailMessage
      });
      setMessage({ text: 'Email sent successfully', type: 'success' });
      setEmailSubject('');
      setEmailMessage('');
    } catch (error) {
      console.error('Failed to send email:', error);
      setMessage({ text: 'Failed to send email', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const getTemplatePreview = () => {
    if (!selectedTemplate || !submission) return '';
    
    const template = decisionTemplates[selectedTemplate as keyof typeof decisionTemplates];
    if (!template) return '';

    return template.template
      .replace(/{author_name}/g, `${submission.author.firstName} ${submission.author.lastName}`)
      .replace(/{manuscript_title}/g, submission.title);
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
        <h1 className="text-3xl font-bold text-secondary-900">Editor Notifications</h1>
        <p className="text-secondary-600 mt-2">
          Send decision letters and communications for: <span className="font-medium">{submission.title}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Decision Letters */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-secondary-900">Decision Letters</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Select Decision Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full border border-secondary-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Choose a template...</option>
                  <option value="accept">Accept for Publication</option>
                  <option value="minor_revision">Minor Revision Required</option>
                  <option value="major_revision">Major Revision Required</option>
                  <option value="reject">Reject Manuscript</option>
                </select>
              </div>

              {selectedTemplate && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Template Preview
                  </label>
                  <div className="bg-secondary-50 p-4 rounded-lg border max-h-64 overflow-y-auto">
                    <div className="text-sm text-secondary-700 whitespace-pre-wrap">
                      {getTemplatePreview()}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Additional Custom Message (Optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                  className="w-full border border-secondary-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Add any additional comments or instructions..."
                />
              </div>

              <button
                onClick={sendDecisionLetter}
                disabled={processing || !selectedTemplate}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Sending Decision Letter...' : 'Send Decision Letter'}
              </button>
            </div>
          </div>

          {/* Submission Summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-secondary-900">Submission Details</h3>
            </div>
            <div className="card-body space-y-3">
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div><span className="font-medium text-secondary-700">Title:</span> {submission.title}</div>
                <div><span className="font-medium text-secondary-700">Author:</span> {submission.author.firstName} {submission.author.lastName}</div>
                <div><span className="font-medium text-secondary-700">Email:</span> {submission.author.email}</div>
                <div><span className="font-medium text-secondary-700">Submitted:</span> {new Date(submission.createdAt).toLocaleDateString()}</div>
                <div><span className="font-medium text-secondary-700">Status:</span> {submission.status.replace(/_/g, ' ')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Communications */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-secondary-900">Custom Communication</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Recipient
                </label>
                <select
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value as 'AUTHOR' | 'REVIEWERS')}
                  className="w-full border border-secondary-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="AUTHOR">Author</option>
                  <option value="REVIEWERS">Reviewers</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full border border-secondary-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Email subject..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Message
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={8}
                  className="w-full border border-secondary-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Type your message here..."
                />
              </div>

              <button
                onClick={sendCustomEmail}
                disabled={processing || !emailSubject.trim() || !emailMessage.trim()}
                className="w-full bg-secondary-600 text-white py-2 px-4 rounded-md hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Sending Email...' : 'Send Custom Email'}
              </button>
            </div>
          </div>

          {/* Quick Templates */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-secondary-900">Quick Templates</h3>
            </div>
            <div className="card-body space-y-2">
              <button
                onClick={() => {
                  setEmailSubject('Request for Additional Information');
                  setEmailMessage(`Dear ${submission.author.firstName} ${submission.author.lastName},

Thank you for your submission. We need some additional information to proceed with the review process.

Please provide:
1. [Specify what is needed]
2. [Additional requirements]

Please respond within 7 days.

Best regards,
Editorial Team`);
                }}
                className="w-full text-left bg-blue-50 text-blue-700 px-3 py-2 rounded hover:bg-blue-100 transition-colors text-sm"
              >
                Request Additional Information
              </button>

              <button
                onClick={() => {
                  setEmailSubject('Review Deadline Extension');
                  setEmailMessage(`Dear Reviewer,

We hope this message finds you well. We are writing regarding the manuscript review for "${submission.title}".

We understand that quality reviews take time, and we would like to offer you an extension of [X days] for completing your review.

Please let us know if this extension is sufficient or if you need to decline the review.

Thank you for your valuable contribution to the peer review process.

Best regards,
Editorial Team`);
                  setRecipient('REVIEWERS');
                }}
                className="w-full text-left bg-yellow-50 text-yellow-700 px-3 py-2 rounded hover:bg-yellow-100 transition-colors text-sm"
              >
                Review Extension Notice
              </button>

              <button
                onClick={() => {
                  setEmailSubject('Manuscript Status Update');
                  setEmailMessage(`Dear ${submission.author.firstName} ${submission.author.lastName},

We wanted to provide you with an update on the status of your manuscript titled "${submission.title}".

Current status: [Provide status update]

We appreciate your patience during the review process and will keep you informed of any further developments.

Best regards,
Editorial Team`);
                }}
                className="w-full text-left bg-green-50 text-green-700 px-3 py-2 rounded hover:bg-green-100 transition-colors text-sm"
              >
                Status Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorNotifications;