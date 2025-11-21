export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  title?: string;
  affiliation?: string;
  country?: string;
  orcid?: string;
  bio?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Submission {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  manuscriptType: string;
  status: SubmissionStatus;
  isDoubleBlind: boolean;
  suggestedReviewers?: string[];
  excludedReviewers?: string[];
  comments?: string;
  decisionType?: string;
  decisionComments?: string;
  submittedAt?: string;
  acceptedAt?: string;
  publishedAt?: string;
  doi?: string;
  volume?: number;
  issue?: number;
  pages?: string;
  createdAt: string;
  updatedAt: string;
  author: User;
  coAuthors: CoAuthor[];
  files: SubmissionFile[];
  reviews: Review[];
  revisions?: Revision[];
  timeline?: TimelineEvent[];
  _count?: {
    reviews: number;
  };
}

export interface CoAuthor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  affiliation?: string;
  isCorresponding: boolean;
  order: number;
}

export interface SubmissionFile {
  id: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  description?: string;
  isMainFile: boolean;
  uploadedAt: string;
}

export interface Revision {
  id: string;
  revisionNumber: number;
  authorResponse?: string;
  submittedAt: string;
  files: RevisionFile[];
}

export interface RevisionFile {
  id: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  uploadedAt: string;
}

export interface Review {
  id: string;
  status: ReviewStatus;
  recommendation?: string;
  confidentialComments?: string;
  authorComments?: string;
  rating?: number;
  invitedAt: string;
  acceptedAt?: string;
  submittedAt?: string;
  dueDate: string;
  remindersSent: number;
  reviewer: User;
  submission: Submission;
}

export interface Issue {
  id: string;
  volume: number;
  number: number;
  title?: string;
  description?: string;
  coverImage?: string;
  publishedAt?: string;
  isCurrent: boolean;
  articles: Article[];
  _count?: {
    articles: number;
  };
}

export interface Article {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  authors: any[];
  doi: string;
  pages: string;
  pdfPath: string;
  publishedAt: string;
  views: number;
  downloads: number;
  issue: Issue;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentId?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  proofUrl?: string;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export enum UserRole {
  VISITOR = 'VISITOR',
  AUTHOR = 'AUTHOR',
  REVIEWER = 'REVIEWER',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN'
}

export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  RETURNED_FOR_FORMATTING = 'RETURNED_FOR_FORMATTING',
  INITIAL_REVIEW = 'INITIAL_REVIEW',
  UNDER_REVIEW = 'UNDER_REVIEW',
  REVISION_REQUIRED = 'REVISION_REQUIRED',
  REVISED = 'REVISED',
  ACCEPTED = 'ACCEPTED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
  WITHDRAWN = 'WITHDRAWN'
}

export enum ReviewStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DECLINED = 'DECLINED',
  OVERDUE = 'OVERDUE'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export interface SubmissionFormData {
  title: string;
  abstract: string;
  keywords: string[];
  manuscriptType: string;
  isDoubleBlind: boolean;
  suggestedReviewers: string[];
  excludedReviewers: string[];
  comments: string;
  coAuthors: CoAuthorFormData[];
}

export interface CoAuthorFormData {
  firstName: string;
  lastName: string;
  email: string;
  affiliation: string;
  isCorresponding: boolean;
  order: number;
}

export interface ReviewFormData {
  recommendation: 'ACCEPT' | 'MINOR_REVISION' | 'MAJOR_REVISION' | 'REJECT';
  confidentialComments?: string;
  authorComments: string;
  rating?: number;
}

export interface TimelineEvent {
  id: string;
  event: string;
  fromStatus?: string;
  toStatus?: string;
  description: string;
  performedBy?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  submissionId?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  invoiceUrl?: string;
  createdAt: string;
}