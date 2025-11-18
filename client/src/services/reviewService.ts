import axios from 'axios';
import { Review, ReviewFormData, ApiResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ReviewService {
  async getReviewInvitations(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ reviews: Review[]; pagination: any }> {
    const response = await axios.get<ApiResponse<Review[]>>(`${API_URL}/reviews/invitations`, { params });
    return {
      reviews: response.data.data!,
      pagination: response.data.pagination!
    };
  }

  async getReview(reviewId: string): Promise<Review> {
    const response = await axios.get<ApiResponse<Review>>(`${API_URL}/reviews/${reviewId}`);
    return response.data.data!;
  }

  async respondToInvitation(reviewId: string, accept: boolean): Promise<Review> {
    const response = await axios.post<ApiResponse<Review>>(`${API_URL}/reviews/${reviewId}/respond`, {
      accept
    });
    return response.data.data!;
  }

  async submitReview(reviewId: string, reviewData: ReviewFormData): Promise<Review> {
    const response = await axios.post<ApiResponse<Review>>(`${API_URL}/reviews/${reviewId}/submit`, reviewData);
    return response.data.data!;
  }

  async updateReview(reviewId: string, reviewData: Partial<ReviewFormData>): Promise<Review> {
    const response = await axios.put<ApiResponse<Review>>(`${API_URL}/reviews/${reviewId}`, reviewData);
    return response.data.data!;
  }

  async downloadManuscript(submissionId: string, fileId: string): Promise<Blob> {
    const response = await axios.get(`${API_URL}/submissions/${submissionId}/files/${fileId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async uploadAnnotatedFile(reviewId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', 'annotated-manuscript');

    const response = await axios.post<ApiResponse<any>>(`${API_URL}/reviews/${reviewId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  }

  async getReviewHistory(): Promise<Review[]> {
    const response = await axios.get<ApiResponse<Review[]>>(`${API_URL}/reviews/history`);
    return response.data.data!;
  }

  async generateCertificate(reviewId: string): Promise<Blob> {
    const response = await axios.get(`${API_URL}/reviews/${reviewId}/certificate`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async getReviewStats(): Promise<{
    totalReviews: number;
    completedReviews: number;
    pendingReviews: number;
    averageRating: number;
  }> {
    const response = await axios.get<ApiResponse<any>>(`${API_URL}/reviews/stats`);
    return response.data.data!;
  }

  async getPendingInvitations(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ invitations: any[]; pagination: any }> {
    const response = await axios.get<ApiResponse<any[]>>(`${API_URL}/reviews/invitations/pending`, { params });
    return {
      invitations: response.data.data!,
      pagination: response.data.pagination!
    };
  }

  async acceptInvitation(invitationId: string, responseNotes?: string): Promise<any> {
    const response = await axios.post<ApiResponse<any>>(`${API_URL}/reviews/invitations/${invitationId}/accept`, {
      responseNotes
    });
    return response.data.data!;
  }

  async declineInvitation(invitationId: string, responseNotes?: string): Promise<any> {
    const response = await axios.post<ApiResponse<any>>(`${API_URL}/reviews/invitations/${invitationId}/decline`, {
      responseNotes
    });
    return response.data.data!;
  }
}

export const reviewService = new ReviewService();