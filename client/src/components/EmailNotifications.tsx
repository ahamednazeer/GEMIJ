import React from 'react';
import { SubmissionStatus } from '@/types';

interface EmailNotificationsProps {
  status: SubmissionStatus;
  title: string;
  authorName: string;
  submissionId: string;
}

const EmailNotifications: React.FC<EmailNotificationsProps> = ({
  status,
  title,
  authorName,
  submissionId
}) => {
  const getEmailContent = () => {
    switch (status) {
      case SubmissionStatus.SUBMITTED:
        return {
          subject: 'Manuscript Submission Received',
          content: `Dear ${authorName},

Thank you for submitting your manuscript "${title}" to our journal.

Your submission has been received and assigned the ID: ${submissionId}

What happens next:
1. Initial screening by our editorial team (3-5 business days)
2. Plagiarism and formatting check
3. Assignment to peer reviewers if accepted for review

You can track the status of your submission in your dashboard at any time.

Best regards,
Editorial Team`
        };

      case SubmissionStatus.UNDER_REVIEW:
        return {
          subject: 'Manuscript Under Peer Review',
          content: `Dear ${authorName},

Your manuscript "${title}" (ID: ${submissionId}) has passed initial screening and is now under peer review.

The review process typically takes 4-6 weeks. We have assigned qualified reviewers who will evaluate your work based on:
- Scientific rigor and methodology
- Originality and significance
- Clarity of presentation
- Relevance to the journal's scope

You will be notified once the reviews are complete.

Best regards,
Editorial Team`
        };

      case SubmissionStatus.REVISION_REQUIRED:
        return {
          subject: 'Revision Required for Your Manuscript',
          content: `Dear ${authorName},

The peer review of your manuscript "${title}" (ID: ${submissionId}) is complete.

The reviewers have recommended revisions before the manuscript can be accepted for publication. Please log into your dashboard to view the detailed reviewer comments and submit your revised manuscript.

Please address all reviewer comments and provide a detailed response letter explaining how you have addressed each point.

The revision deadline is 60 days from today.

Best regards,
Editorial Team`
        };

      case SubmissionStatus.ACCEPTED:
        return {
          subject: 'Manuscript Accepted for Publication!',
          content: `Dear ${authorName},

Congratulations! Your manuscript "${title}" (ID: ${submissionId}) has been accepted for publication.

Next steps:
1. Pay the Article Processing Charge (APC) of $25.00
2. Review and approve the final proof
3. Your article will be published online

Please log into your dashboard to complete the payment process.

Best regards,
Editorial Team`
        };

      case SubmissionStatus.PUBLISHED:
        return {
          subject: 'Your Article Has Been Published!',
          content: `Dear ${authorName},

We are pleased to inform you that your article "${title}" has been published and is now available online.

Your article details:
- DOI: [Will be assigned]
- Volume and Issue: [Current issue]
- Publication Date: ${new Date().toLocaleDateString()}

The article is now freely accessible to readers worldwide and will be indexed in major academic databases.

Thank you for choosing our journal for your research publication.

Best regards,
Editorial Team`
        };

      case SubmissionStatus.REJECTED:
        return {
          subject: 'Manuscript Decision - Not Accepted',
          content: `Dear ${authorName},

After careful consideration and peer review, we regret to inform you that your manuscript "${title}" (ID: ${submissionId}) cannot be accepted for publication in our journal.

This decision was based on the peer review feedback, which you can view in your dashboard. While we cannot accept this manuscript, we encourage you to consider the reviewers' comments for future submissions.

Thank you for considering our journal for your research.

Best regards,
Editorial Team`
        };

      default:
        return null;
    }
  };

  const emailContent = getEmailContent();

  if (!emailContent) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">
            Email Notification Sent
          </h3>
          <div className="mt-2 text-sm text-blue-700">
            <p><strong>Subject:</strong> {emailContent.subject}</p>
            <details className="mt-2">
              <summary className="cursor-pointer hover:text-blue-800">
                View email content
              </summary>
              <div className="mt-2 p-3 bg-white border border-blue-200 rounded text-xs font-mono whitespace-pre-line">
                {emailContent.content}
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailNotifications;