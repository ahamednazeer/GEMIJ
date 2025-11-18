# Academic Journal Platform

A complete, production-ready academic journal management system with submission workflow, peer review, and publishing capabilities.

## Features

- **Multi-role System**: Authors, Reviewers, Editors, Admins
- **Submission Workflow**: Multi-step submission with file upload
- **Peer Review**: Double-blind review system with automated notifications
- **Editorial Dashboard**: Complete manuscript management
- **Payment Integration**: APC processing with Stripe
- **Mobile-First Design**: Responsive, accessible interface
- **Email Automation**: Template-based notifications
- **DOI Integration**: Automatic DOI assignment
- **Archive System**: Issue-based publication management

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with role-based access
- **File Storage**: AWS S3 or local storage
- **Email**: Nodemailer with template system
- **Payments**: Stripe integration

## Quick Start

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Set up environment variables**:
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

3. **Set up database**:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start development servers**:
   ```bash
   npm run dev
   ```

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   ├── utils/         # Utilities
│   │   └── types/         # TypeScript types
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utilities
├── shared/                # Shared types and utilities
└── docs/                  # Documentation
```

## User Roles & Permissions

- **Visitor**: Browse published articles, search archive
- **Author**: Submit manuscripts, track submissions, respond to reviews
- **Reviewer**: Review assigned manuscripts, provide feedback
- **Editor**: Manage submissions, assign reviewers, make decisions
- **Admin**: System administration, user management, payments

## Deployment

See [deployment guide](docs/deployment.md) for production setup instructions.

## License

MIT License - see LICENSE file for details.