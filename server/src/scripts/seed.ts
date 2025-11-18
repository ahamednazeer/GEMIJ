import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth';

const prisma = new PrismaClient();

const emailTemplates = [
  {
    name: 'submission_received',
    subject: 'Submission Received - {{submissionTitle}}',
    htmlContent: `
      <h2>Dear {{authorName}},</h2>
      <p>Thank you for submitting your manuscript to {{journalName}}.</p>
      <p><strong>Submission Details:</strong></p>
      <ul>
        <li>Title: {{submissionTitle}}</li>
        <li>Submission ID: {{submissionId}}</li>
        <li>Submitted: {{submittedDate}}</li>
      </ul>
      <p>Your submission is now under initial review. You will be notified of any updates.</p>
      <p>You can track your submission status at: <a href="{{journalUrl}}/author/submissions/{{submissionId}}">{{journalUrl}}/author/submissions/{{submissionId}}</a></p>
      <p>Best regards,<br>{{journalName}} Editorial Team</p>
    `,
    textContent: 'Dear {{authorName}}, Thank you for submitting your manuscript "{{submissionTitle}}" to {{journalName}}. Submission ID: {{submissionId}}. You will be notified of any updates.',
    variables: ['authorName', 'submissionTitle', 'submissionId', 'submittedDate', 'journalName', 'journalUrl']
  },
  {
    name: 'reviewer_invitation',
    subject: 'Review Invitation - {{submissionTitle}}',
    htmlContent: `
      <h2>Dear {{reviewerName}},</h2>
      <p>You have been invited to review a manuscript for {{journalName}}.</p>
      <p><strong>Manuscript Details:</strong></p>
      <ul>
        <li>Title: {{submissionTitle}}</li>
        <li>Abstract: {{submissionAbstract}}</li>
        <li>Review Due Date: {{dueDate}}</li>
      </ul>
      <p>Please respond to this invitation by clicking: <a href="{{reviewUrl}}">Accept/Decline Review</a></p>
      <p>Thank you for your contribution to the peer review process.</p>
      <p>Best regards,<br>{{journalName}} Editorial Team</p>
    `,
    textContent: 'Dear {{reviewerName}}, You have been invited to review "{{submissionTitle}}" for {{journalName}}. Due date: {{dueDate}}. Please respond at: {{reviewUrl}}',
    variables: ['reviewerName', 'submissionTitle', 'submissionAbstract', 'dueDate', 'reviewUrl', 'journalName']
  },
  {
    name: 'review_reminder',
    subject: 'Review Reminder - {{submissionTitle}}',
    htmlContent: `
      <h2>Dear {{reviewerName}},</h2>
      <p>This is a friendly reminder about your pending review for {{journalName}}.</p>
      <p><strong>Manuscript:</strong> {{submissionTitle}}</p>
      <p><strong>Due Date:</strong> {{dueDate}} ({{daysUntilDue}} days remaining)</p>
      <p>Please complete your review at: <a href="{{reviewUrl}}">{{reviewUrl}}</a></p>
      <p>If you need an extension, please contact the editorial office.</p>
      <p>Best regards,<br>{{journalName}} Editorial Team</p>
    `,
    textContent: 'Reminder: Your review for "{{submissionTitle}}" is due {{dueDate}}. Please complete at: {{reviewUrl}}',
    variables: ['reviewerName', 'submissionTitle', 'dueDate', 'daysUntilDue', 'reviewUrl', 'journalName']
  },
  {
    name: 'decision_accept',
    subject: 'Manuscript Accepted - {{submissionTitle}}',
    htmlContent: `
      <h2>Dear {{authorName}},</h2>
      <p>Congratulations! Your manuscript has been accepted for publication in {{journalName}}.</p>
      <p><strong>Manuscript:</strong> {{submissionTitle}}</p>
      <p><strong>Submission ID:</strong> {{submissionId}}</p>
      <p>{{#if comments}}<strong>Editor Comments:</strong> {{comments}}{{/if}}</p>
      <p>Your manuscript will now proceed to production. You will receive further instructions shortly.</p>
      <p>Thank you for choosing {{journalName}} for your research publication.</p>
      <p>Best regards,<br>{{journalName}} Editorial Team</p>
    `,
    textContent: 'Congratulations! Your manuscript "{{submissionTitle}}" has been accepted for publication in {{journalName}}.',
    variables: ['authorName', 'submissionTitle', 'submissionId', 'comments', 'journalName']
  },
  {
    name: 'decision_reject',
    subject: 'Manuscript Decision - {{submissionTitle}}',
    htmlContent: `
      <h2>Dear {{authorName}},</h2>
      <p>Thank you for submitting your manuscript to {{journalName}}.</p>
      <p>After careful consideration, we regret to inform you that your manuscript "{{submissionTitle}}" cannot be accepted for publication.</p>
      <p>{{#if comments}}<strong>Editor Comments:</strong> {{comments}}{{/if}}</p>
      <p>We appreciate your interest in {{journalName}} and encourage you to consider us for future submissions.</p>
      <p>Best regards,<br>{{journalName}} Editorial Team</p>
    `,
    textContent: 'Your manuscript "{{submissionTitle}}" submitted to {{journalName}} cannot be accepted for publication.',
    variables: ['authorName', 'submissionTitle', 'comments', 'journalName']
  },
  {
    name: 'decision_revision',
    subject: 'Revision Required - {{submissionTitle}}',
    htmlContent: `
      <h2>Dear {{authorName}},</h2>
      <p>Your manuscript submitted to {{journalName}} requires revision before it can be accepted for publication.</p>
      <p><strong>Manuscript:</strong> {{submissionTitle}}</p>
      <p><strong>Submission ID:</strong> {{submissionId}}</p>
      <p>{{#if comments}}<strong>Editor Comments:</strong> {{comments}}{{/if}}</p>
      <p>Please address the reviewers' comments and resubmit your revised manuscript.</p>
      <p>You can access the reviews and submit your revision at: <a href="{{journalUrl}}/author/submissions/{{submissionId}}">{{journalUrl}}/author/submissions/{{submissionId}}</a></p>
      <p>Best regards,<br>{{journalName}} Editorial Team</p>
    `,
    textContent: 'Your manuscript "{{submissionTitle}}" requires revision. Please address the comments and resubmit.',
    variables: ['authorName', 'submissionTitle', 'submissionId', 'comments', 'journalUrl', 'journalName']
  },
  {
    name: 'payment_request',
    subject: 'Article Processing Charge - {{submissionTitle}}',
    htmlContent: `
      <h2>Dear {{authorName}},</h2>
      <p>Your manuscript "{{submissionTitle}}" has been accepted for publication in {{journalName}}.</p>
      <p>To proceed with publication, please complete the Article Processing Charge (APC) payment:</p>
      <p><strong>Amount:</strong> {{apcAmount}} {{currency}}</p>
      <p><strong>Payment Link:</strong> <a href="{{paymentUrl}}">Pay Now</a></p>
      <p>Once payment is received, your article will proceed to final production and publication.</p>
      <p>Best regards,<br>{{journalName}} Editorial Team</p>
    `,
    textContent: 'Your manuscript "{{submissionTitle}}" requires APC payment of {{apcAmount}} {{currency}}. Pay at: {{paymentUrl}}',
    variables: ['authorName', 'submissionTitle', 'apcAmount', 'currency', 'paymentUrl', 'journalName']
  },
  {
    name: 'publication_notification',
    subject: 'Your Article is Now Published - {{submissionTitle}}',
    htmlContent: `
      <h2>Congratulations!</h2>
      <p>Your article has been published in {{journalName}}.</p>
      <p><strong>Title:</strong> {{submissionTitle}}</p>
      <p><strong>DOI:</strong> {{doi}}</p>
      <p><strong>Volume:</strong> {{volume}}, <strong>Issue:</strong> {{issue}}, <strong>Pages:</strong> {{pages}}</p>
      <p><strong>Article URL:</strong> <a href="{{articleUrl}}">{{articleUrl}}</a></p>
      <p>Thank you for publishing with {{journalName}}. We hope you will consider us for your future research publications.</p>
      <p>Best regards,<br>{{journalName}} Editorial Team</p>
    `,
    textContent: 'Your article "{{submissionTitle}}" is now published. DOI: {{doi}}. View at: {{articleUrl}}',
    variables: ['submissionTitle', 'doi', 'volume', 'issue', 'pages', 'articleUrl', 'journalName']
  }
];

const systemSettings = [
  { key: 'journal_name', value: 'International Journal of Advanced Technology and Engineering Management', type: 'string' },
  { key: 'journal_abbreviation', value: 'IJATEM', type: 'string' },
  { key: 'journal_issn', value: '2345-6789', type: 'string' },
  { key: 'apc_amount', value: '299.00', type: 'decimal' },
  { key: 'apc_currency', value: 'USD', type: 'string' },
  { key: 'review_deadline_days', value: '21', type: 'number' },
  { key: 'reminder_days_before_due', value: '3', type: 'number' },
  { key: 'max_reviewers_per_submission', value: '3', type: 'number' },
  { key: 'min_reviewers_for_decision', value: '2', type: 'number' }
];

async function main() {
  console.log('Seeding database...');

  console.log('Creating email templates...');
  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { name: template.name },
      update: template,
      create: template
    });
  }

  console.log('Creating system settings...');
  for (const setting of systemSettings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value, type: setting.type },
      create: setting
    });
  }

  console.log('Creating admin user...');
  const adminPassword = await hashPassword('admin123');
  await prisma.user.upsert({
    where: { email: 'admin@journal.com' },
    update: {},
    create: {
      email: 'admin@journal.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
      emailVerified: true
    }
  });

  console.log('Creating sample editor...');
  const editorPassword = await hashPassword('editor123');
  await prisma.user.upsert({
    where: { email: 'editor@journal.com' },
    update: {},
    create: {
      email: 'editor@journal.com',
      password: editorPassword,
      firstName: 'Chief',
      lastName: 'Editor',
      title: 'Professor',
      affiliation: 'University of Technology',
      role: 'EDITOR',
      isActive: true,
      emailVerified: true
    }
  });

  console.log('Creating sample reviewer...');
  const reviewerPassword = await hashPassword('reviewer123');
  await prisma.user.upsert({
    where: { email: 'reviewer@journal.com' },
    update: {},
    create: {
      email: 'reviewer@journal.com',
      password: reviewerPassword,
      firstName: 'Expert',
      lastName: 'Reviewer',
      title: 'Dr.',
      affiliation: 'Research Institute',
      role: 'REVIEWER',
      isActive: true,
      emailVerified: true
    }
  });

  console.log('Creating sample author...');
  const authorPassword = await hashPassword('author123');
  await prisma.user.upsert({
    where: { email: 'author@journal.com' },
    update: {},
    create: {
      email: 'author@journal.com',
      password: authorPassword,
      firstName: 'Research',
      lastName: 'Author',
      title: 'PhD',
      affiliation: 'Academic University',
      role: 'AUTHOR',
      isActive: true,
      emailVerified: true
    }
  });

  console.log('Creating sample issue...');
  await prisma.issue.upsert({
    where: { volume_number: { volume: 1, number: 1 } },
    update: {},
    create: {
      volume: 1,
      number: 1,
      title: 'Inaugural Issue',
      description: 'The first issue of our journal featuring cutting-edge research in technology and engineering management.',
      isCurrent: true,
      publishedAt: new Date()
    }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });