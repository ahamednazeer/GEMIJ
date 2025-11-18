import axios from 'axios';
import { Submission, Review, User, ApiResponse, SubmissionStatus, ReviewStatus } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface EditorDecision {
  decision: 'ACCEPT' | 'MINOR_REVISION' | 'MAJOR_REVISION' | 'REJECT';
  comments: string;
  confidentialComments?: string;
}

export interface ReviewerInvitation {
  reviewerId: string;
  dueDate: string;
  message?: string;
}

export interface ProductionData {
  doi?: string;
  volume?: number;
  issue?: number;
  pages?: string;
}

export interface EditorStats {
  totalSubmissions: number;
  pendingReview: number;
  underReview: number;
  awaitingDecision: number;
  accepted: number;
  rejected: number;
  published: number;
}

class EditorService {
  // Submission Management
  async getSubmissionsForEditor(params?: {
    status?: SubmissionStatus;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ submissions: Submission[]; pagination: any }> {
    const response = await axios.get<ApiResponse<Submission[]>>(`${API_URL}/editor/submissions`, { params });
    return {
      submissions: response.data.data!,
      pagination: response.data.pagination!
    };
  }

  async getSubmissionForEditor(id: string): Promise<Submission> {
    const response = await axios.get<ApiResponse<Submission>>(`${API_URL}/editor/submissions/${id}`);
    return response.data.data!;
  }

  async updateSubmissionStatus(id: string, status: SubmissionStatus, comments?: string): Promise<Submission> {
    const response = await axios.put<ApiResponse<Submission>>(`${API_URL}/editor/submissions/${id}/status`, {
      status,
      comments
    });
    return response.data.data!;
  }

  // Initial Screening
  async performInitialScreening(id: string, data: {
    decision: 'PROCEED_TO_REVIEW' | 'REJECT';
    comments: string;
    plagiarismCheck?: boolean;
    scopeCheck?: boolean;
  }): Promise<Submission> {
    const response = await axios.post<ApiResponse<Submission>>(`${API_URL}/editor/submissions/${id}/screen`, data);
    return response.data.data!;
  }

  // Reviewer Management
  async getAvailableReviewers(submissionId: string, params?: {
    expertise?: string;
    excludeConflicts?: boolean;
  }): Promise<User[]> {
    const response = await axios.get<ApiResponse<User[]>>(`${API_URL}/editor/submissions/${submissionId}/available-reviewers`, { params });
    return response.data.data!;
  }

  async inviteReviewer(submissionId: string, invitation: ReviewerInvitation): Promise<Review> {
    const response = await axios.post<ApiResponse<Review>>(`${API_URL}/editor/submissions/${submissionId}/invite-reviewer`, invitation);
    return response.data.data!;
  }

  async removeReviewer(submissionId: string, reviewId: string, reason: string): Promise<void> {
    await axios.delete(`${API_URL}/editor/submissions/${submissionId}/reviews/${reviewId}`, {
      data: { reason }
    });
  }

  async sendReviewerReminder(reviewId: string, message?: string): Promise<void> {
    await axios.post(`${API_URL}/editor/reviews/${reviewId}/remind`, { message });
  }

  async extendReviewDeadline(reviewId: string, newDueDate: string, reason: string): Promise<Review> {
    const response = await axios.put<ApiResponse<Review>>(`${API_URL}/editor/reviews/${reviewId}/extend-deadline`, {
      dueDate: newDueDate,
      reason
    });
    return response.data.data!;
  }

  // Review Management
  async getReviewsForSubmission(submissionId: string): Promise<Review[]> {
    const response = await axios.get<ApiResponse<Review[]>>(`${API_URL}/editor/submissions/${submissionId}/reviews`);
    return response.data.data!;
  }

  async getOverdueReviews(): Promise<Review[]> {
    const response = await axios.get<ApiResponse<Review[]>>(`${API_URL}/editor/reviews/overdue`);
    return response.data.data!;
  }

  // Editorial Decision
  async makeEditorialDecision(submissionId: string, decision: EditorDecision): Promise<Submission> {
    const response = await axios.post<ApiResponse<Submission>>(`${API_URL}/editor/submissions/${submissionId}/decision`, decision);
    return response.data.data!;
  }

  async requestRevision(submissionId: string, data: {
    type: 'MINOR_REVISION' | 'MAJOR_REVISION';
    comments: string;
    deadline: string;
    requireReReview?: boolean;
  }): Promise<Submission> {
    const response = await axios.post<ApiResponse<Submission>>(`${API_URL}/editor/submissions/${submissionId}/request-revision`, data);
    return response.data.data!;
  }

  // Revision Handling
  async getRevisedSubmissions(): Promise<Submission[]> {
    const response = await axios.get<ApiResponse<Submission[]>>(`${API_URL}/editor/submissions/revised`);
    return response.data.data!;
  }

  async handleRevision(submissionId: string, action: {
    decision: 'ACCEPT_REVISION' | 'SEND_FOR_RE_REVIEW' | 'REJECT_REVISION';
    comments?: string;
    reviewerIds?: string[];
  }): Promise<Submission> {
    const response = await axios.post<ApiResponse<Submission>>(`${API_URL}/editor/submissions/${submissionId}/handle-revision`, action);
    return response.data.data!;
  }

  // Production & Publishing
  async moveToProduction(submissionId: string, productionData: ProductionData): Promise<Submission> {
    const response = await axios.post<ApiResponse<Submission>>(`${API_URL}/editor/submissions/${submissionId}/production`, productionData);
    return response.data.data!;
  }

  async assignDOI(submissionId: string): Promise<{ doi: string }> {
    const response = await axios.post<ApiResponse<{ doi: string }>>(`${API_URL}/editor/submissions/${submissionId}/assign-doi`);
    return response.data.data!;
  }

  async publishSubmission(submissionId: string, issueId: string): Promise<Submission> {
    const response = await axios.post<ApiResponse<Submission>>(`${API_URL}/editor/submissions/${submissionId}/publish`, {
      issueId
    });
    return response.data.data!;
  }

  // Issue Management
  async getIssues(): Promise<any[]> {
    const response = await axios.get<ApiResponse<any[]>>(`${API_URL}/editor/issues`);
    return response.data.data!;
  }

  async createIssue(data: {
    volume: number;
    number: number;
    title?: string;
    description?: string;
  }): Promise<any> {
    const response = await axios.post<ApiResponse<any>>(`${API_URL}/editor/issues`, data);
    return response.data.data!;
  }

  async addToIssue(issueId: string, submissionId: string, pages: string): Promise<void> {
    await axios.post(`${API_URL}/editor/issues/${issueId}/articles`, {
      submissionId,
      pages
    });
  }

  // Statistics & Analytics
  async getEditorStats(): Promise<EditorStats> {
    const response = await axios.get<ApiResponse<EditorStats>>(`${API_URL}/editor/stats`);
    return response.data.data!;
  }

  async getSubmissionTimeline(submissionId: string): Promise<any[]> {
    const response = await axios.get<ApiResponse<any[]>>(`${API_URL}/editor/submissions/${submissionId}/timeline`);
    return response.data.data!;
  }

  // Communication
  async sendDecisionLetter(submissionId: string, template: string, customMessage?: string): Promise<void> {
    await axios.post(`${API_URL}/editor/submissions/${submissionId}/send-decision`, {
      template,
      customMessage
    });
  }

  async sendCustomEmail(submissionId: string, recipient: 'AUTHOR' | 'REVIEWERS', data: {
    subject: string;
    message: string;
  }): Promise<void> {
    await axios.post(`${API_URL}/editor/submissions/${submissionId}/send-email`, {
      recipient,
      ...data
    });
  }

  // Plagiarism & Quality Checks
  async runPlagiarismCheck(submissionId: string): Promise<{
    similarity: number;
    report: any;
  }> {
    const response = await axios.post<ApiResponse<any>>(`${API_URL}/editor/submissions/${submissionId}/plagiarism-check`);
    return response.data.data!;
  }

  async performQualityCheck(submissionId: string): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const response = await axios.post<ApiResponse<any>>(`${API_URL}/editor/submissions/${submissionId}/quality-check`);
    return response.data.data!;
  }
}

export const editorService = new EditorService();