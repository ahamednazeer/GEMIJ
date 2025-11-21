import { Request } from 'express';
import { UserRole, SubmissionStatus, ReviewStatus, PaymentStatus } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
  };
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  title?: string;
  affiliation?: string;
  country?: string;
  orcid?: string;
  role?: UserRole;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SubmissionData {
  title: string;
  abstract: string;
  keywords: string[];
  manuscriptType: string;
  isDoubleBlind?: boolean;
  suggestedReviewers?: string[];
  excludedReviewers?: string[];
  comments?: string;
  coAuthors: CoAuthorData[];
}

export interface CoAuthorData {
  firstName: string;
  lastName: string;
  email: string;
  affiliation?: string;
  isCorresponding?: boolean;
  order: number;
}

export interface ReviewData {
  recommendation: string;
  confidentialComments?: string;
  authorComments?: string;
  rating?: number;
}

export interface EmailTemplateData {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, any>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

export {
  UserRole,
  SubmissionStatus,
  ReviewStatus,
  PaymentStatus
};