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
    name: 'payment_received',
    subject: 'Payment Received - {{submissionTitle}}',
    htmlContent: `
      <h2>Dear {{authorName}},</h2>
      <p>We have received your payment of {{amount}} {{currency}} for the manuscript "{{submissionTitle}}".</p>
      <p><strong>Invoice Number:</strong> {{invoiceNumber}}</p>
      <p>Your article is now ready for the final stages of publication. Our editorial team will proceed with the necessary steps.</p>
      <p>Best regards,<br>{{journalName}} Editorial Team</p>
    `,
    textContent: 'Dear {{authorName}}, We have received your payment of {{amount}} {{currency}} for "{{submissionTitle}}". Invoice: {{invoiceNumber}}. Your article is ready for publication.',
    variables: ['authorName', 'submissionTitle', 'amount', 'currency', 'invoiceNumber', 'journalName']
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
  },
  {
    name: 'review_thank_you',
    subject: 'Thank You for Your Review - {{submissionTitle}}',
    htmlContent: `
      <h2>Dear {{reviewerName}},</h2>
      <p>Thank you for completing your review of the manuscript "{{submissionTitle}}" for {{journalName}}.</p>
      <p>We appreciate your time and expertise in helping us maintain the quality of our publication.</p>
      <p>You can download your review certificate here: <a href="{{certificateUrl}}">Download Certificate</a></p>
      <p>We hope you will consider reviewing for us again in the future.</p>
      <p>Best regards,<br>{{journalName}} Editorial Team</p>
    `,
    textContent: 'Dear {{reviewerName}}, Thank you for completing your review of "{{submissionTitle}}" for {{journalName}}. Download your certificate at: {{certificateUrl}}. We appreciate your contribution.',
    variables: ['reviewerName', 'submissionTitle', 'certificateUrl', 'journalName']
  },
  {
    name: 'password_reset',
    subject: 'Password Reset Request - {{journalName}}',
    htmlContent: `
      <h2>Dear {{userName}},</h2>
      <p>You have requested to reset your password for your {{journalName}} account.</p>
      <p>Please click the link below to reset your password:</p>
      <p><a href="{{resetUrl}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p>{{resetUrl}}</p>
      <p>This link will expire in 1 hour for security reasons.</p>
      <p>If you did not request this password reset, please ignore this email.</p>
      <p>Best regards,<br>{{journalName}} Support Team</p>
    `,
    textContent: 'Dear {{userName}}, You have requested to reset your password for {{journalName}}. Please visit: {{resetUrl}} to reset your password. This link expires in 1 hour.',
    variables: ['userName', 'resetUrl', 'journalName']
  }
];

const systemSettings = [
  { key: 'journal_name', value: 'International Journal of Advanced Technology and Engineering Management', type: 'string' },
  { key: 'journal_abbreviation', value: 'IJATEM', type: 'string' },
  { key: 'journal_issn', value: '2345-6789', type: 'string' },
  { key: 'apc_amount', value: '299.00', type: 'decimal' },
  { key: 'apc_currency', value: 'INR', type: 'string' },
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

  console.log('Creating sample issues and articles...');

  // Create Issue 1 (Current Issue)
  const issue1 = await prisma.issue.upsert({
    where: { volume_number: { volume: 1, number: 1 } },
    update: {},
    create: {
      volume: 1,
      number: 1,
      title: 'Inaugural Issue - Technology and Innovation',
      description: 'The first issue of our journal featuring cutting-edge research in technology and engineering management, artificial intelligence, and digital transformation.',
      isCurrent: true,
      publishedAt: new Date('2024-01-15')
    }
  });

  // Create Issue 2 (Previous Issue)
  const issue2 = await prisma.issue.upsert({
    where: { volume_number: { volume: 1, number: 2 } },
    update: {},
    create: {
      volume: 1,
      number: 2,
      title: 'Sustainable Engineering Solutions',
      description: 'Exploring sustainable practices in engineering and technology management for a greener future.',
      isCurrent: false,
      publishedAt: new Date('2024-03-15')
    }
  });

  // Create Issue 3 (Archive Issue)
  const issue3 = await prisma.issue.upsert({
    where: { volume_number: { volume: 1, number: 3 } },
    update: {},
    create: {
      volume: 1,
      number: 3,
      title: 'Digital Transformation in Industry 4.0',
      description: 'Latest developments in digital transformation, IoT, and smart manufacturing systems.',
      isCurrent: false,
      publishedAt: new Date('2024-05-15')
    }
  });

  // Sample articles for Issue 1 (Current Issue)
  const articles1 = [
    {
      title: 'Artificial Intelligence in Supply Chain Management: A Comprehensive Review',
      abstract: 'This paper presents a comprehensive review of artificial intelligence applications in supply chain management. We analyze current trends, challenges, and future opportunities in AI-driven supply chain optimization. The study covers machine learning algorithms, predictive analytics, and automation technologies that are transforming modern supply chains.',
      keywords: ['Artificial Intelligence', 'Supply Chain', 'Machine Learning', 'Optimization', 'Automation'],
      authors: [
        { firstName: 'Dr. Sarah', lastName: 'Johnson', affiliation: 'MIT Technology Institute', email: 'sarah.johnson@mit.edu' },
        { firstName: 'Prof. Michael', lastName: 'Chen', affiliation: 'Stanford University', email: 'michael.chen@stanford.edu' }
      ],
      doi: '10.1234/ijatem.2024.001',
      pages: '1-15',
      pdfPath: '/uploads/articles/ai-supply-chain-2024.pdf',
      views: 1250,
      downloads: 340
    },
    {
      title: 'Blockchain Technology for Secure Data Management in IoT Systems',
      abstract: 'Internet of Things (IoT) systems generate massive amounts of data that require secure and efficient management. This research proposes a blockchain-based framework for secure data management in IoT environments. We present implementation details, security analysis, and performance evaluation of our proposed system.',
      keywords: ['Blockchain', 'IoT', 'Data Security', 'Distributed Systems', 'Cryptography'],
      authors: [
        { firstName: 'Dr. Ahmed', lastName: 'Hassan', affiliation: 'Cairo University', email: 'ahmed.hassan@cu.edu.eg' },
        { firstName: 'Dr. Lisa', lastName: 'Wang', affiliation: 'University of Toronto', email: 'lisa.wang@utoronto.ca' }
      ],
      doi: '10.1234/ijatem.2024.002',
      pages: '16-28',
      pdfPath: '/uploads/articles/blockchain-iot-2024.pdf',
      views: 980,
      downloads: 275
    },
    {
      title: 'Machine Learning Approaches for Predictive Maintenance in Manufacturing',
      abstract: 'Predictive maintenance is crucial for reducing downtime and maintenance costs in manufacturing. This study compares various machine learning approaches for predictive maintenance, including deep learning, ensemble methods, and time series analysis. We evaluate these methods using real industrial datasets.',
      keywords: ['Predictive Maintenance', 'Machine Learning', 'Manufacturing', 'Deep Learning', 'Time Series'],
      authors: [
        { firstName: 'Prof. Robert', lastName: 'Smith', affiliation: 'Georgia Tech', email: 'robert.smith@gatech.edu' },
        { firstName: 'Dr. Maria', lastName: 'Rodriguez', affiliation: 'Technical University of Madrid', email: 'maria.rodriguez@upm.es' }
      ],
      doi: '10.1234/ijatem.2024.003',
      pages: '29-42',
      pdfPath: '/uploads/articles/ml-predictive-maintenance-2024.pdf',
      views: 1450,
      downloads: 420
    }
  ];

  // Sample articles for Issue 2
  const articles2 = [
    {
      title: 'Renewable Energy Integration in Smart Grid Systems',
      abstract: 'The integration of renewable energy sources into smart grid systems presents both opportunities and challenges. This paper analyzes various integration strategies, grid stability issues, and energy storage solutions for sustainable power systems.',
      keywords: ['Renewable Energy', 'Smart Grid', 'Energy Storage', 'Grid Stability', 'Sustainability'],
      authors: [
        { firstName: 'Dr. Elena', lastName: 'Petrov', affiliation: 'Technical University of Denmark', email: 'elena.petrov@dtu.dk' },
        { firstName: 'Prof. James', lastName: 'Wilson', affiliation: 'University of California Berkeley', email: 'james.wilson@berkeley.edu' }
      ],
      doi: '10.1234/ijatem.2024.004',
      pages: '1-18',
      pdfPath: '/uploads/articles/renewable-energy-grid-2024.pdf',
      views: 890,
      downloads: 230
    },
    {
      title: 'Sustainable Manufacturing Processes: A Life Cycle Assessment Approach',
      abstract: 'This research presents a comprehensive life cycle assessment of sustainable manufacturing processes. We analyze environmental impacts, resource consumption, and waste generation across different manufacturing scenarios to identify best practices for sustainable production.',
      keywords: ['Sustainable Manufacturing', 'Life Cycle Assessment', 'Environmental Impact', 'Resource Efficiency', 'Waste Management'],
      authors: [
        { firstName: 'Dr. Thomas', lastName: 'Mueller', affiliation: 'Technical University of Munich', email: 'thomas.mueller@tum.de' },
        { firstName: 'Dr. Priya', lastName: 'Sharma', affiliation: 'Indian Institute of Technology Delhi', email: 'priya.sharma@iitd.ac.in' }
      ],
      doi: '10.1234/ijatem.2024.005',
      pages: '19-35',
      pdfPath: '/uploads/articles/sustainable-manufacturing-lca-2024.pdf',
      views: 720,
      downloads: 185
    }
  ];

  // Sample articles for Issue 3
  const articles3 = [
    {
      title: 'Digital Twin Technology in Industry 4.0: Applications and Challenges',
      abstract: 'Digital twin technology is revolutionizing industrial processes by creating virtual replicas of physical systems. This paper explores current applications, implementation challenges, and future prospects of digital twins in Industry 4.0 environments.',
      keywords: ['Digital Twin', 'Industry 4.0', 'Virtual Reality', 'Simulation', 'Digital Transformation'],
      authors: [
        { firstName: 'Prof. Hans', lastName: 'Schmidt', affiliation: 'RWTH Aachen University', email: 'hans.schmidt@rwth-aachen.de' },
        { firstName: 'Dr. Yuki', lastName: 'Tanaka', affiliation: 'University of Tokyo', email: 'yuki.tanaka@u-tokyo.ac.jp' }
      ],
      doi: '10.1234/ijatem.2024.006',
      pages: '1-22',
      pdfPath: '/uploads/articles/digital-twin-industry40-2024.pdf',
      views: 1100,
      downloads: 310
    }
  ];

  // Create articles for each issue
  for (const articleData of articles1) {
    await prisma.article.upsert({
      where: { doi: articleData.doi },
      update: {},
      create: {
        ...articleData,
        authors: articleData.authors,
        issueId: issue1.id,
        publishedAt: new Date('2024-01-15')
      }
    });
  }

  for (const articleData of articles2) {
    await prisma.article.upsert({
      where: { doi: articleData.doi },
      update: {},
      create: {
        ...articleData,
        authors: articleData.authors,
        issueId: issue2.id,
        publishedAt: new Date('2024-03-15')
      }
    });
  }

  for (const articleData of articles3) {
    await prisma.article.upsert({
      where: { doi: articleData.doi },
      update: {},
      create: {
        ...articleData,
        authors: articleData.authors,
        issueId: issue3.id,
        publishedAt: new Date('2024-05-15')
      }
    });
  }

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