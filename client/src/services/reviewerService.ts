import axios from 'axios';
import { Review, ReviewFormData, ApiResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ReviewerService {
  async getReviewInvitations(): Promise<Review[]> {
    const response = await axios.get<ApiResponse<Review[]>>(`${API_URL}/reviews/invitations`);
    return response.data.data!;
  }

  async getPendingReviews(): Promise<Review[]> {
    const response = await axios.get<ApiResponse<Review[]>>(`${API_URL}/reviews/pending`);
    return response.data.data!;
  }

  async getCompletedReviews(): Promise<Review[]> {
    const response = await axios.get<ApiResponse<Review[]>>(`${API_URL}/reviews/completed`);
    return response.data.data!;
  }

  async getReview(reviewId: string): Promise<Review> {
    const response = await axios.get<ApiResponse<Review>>(`${API_URL}/reviews/${reviewId}`);
    return response.data.data!;
  }

  async acceptInvitation(reviewId: string): Promise<Review> {
    const response = await axios.post<ApiResponse<Review>>(`${API_URL}/reviews/${reviewId}/accept`);
    return response.data.data!;
  }

  async declineInvitation(reviewId: string, reason?: string): Promise<Review> {
    const response = await axios.post<ApiResponse<Review>>(`${API_URL}/reviews/${reviewId}/decline`, {
      reason
    });
    return response.data.data!;
  }

  async submitReview(reviewId: string, reviewData: ReviewFormData): Promise<Review> {
    const response = await axios.post<ApiResponse<Review>>(`${API_URL}/reviews/${reviewId}/submit`, reviewData);
    return response.data.data!;
  }

  async uploadReviewFile(reviewId: string, file: File, description?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const response = await axios.post<ApiResponse<any>>(`${API_URL}/reviews/${reviewId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  }

  async downloadManuscript(submissionId: string): Promise<Blob> {
    const response = await axios.get(`${API_URL}/submissions/${submissionId}/manuscript`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async getReviewerStats(): Promise<{
    totalReviews: number;
    pendingReviews: number;
    completedReviews: number;
    averageRating: number;
  }> {
    const response = await axios.get<ApiResponse<any>>(`${API_URL}/reviews/stats`);
    return response.data.data!;
  }

  async requestCertificate(reviewId: string): Promise<{
    certificateUrl: string;
  }> {
    const response = await axios.post<ApiResponse<any>>(`${API_URL}/reviews/${reviewId}/certificate`);
    return response.data.data!;
  }

  async saveReviewDraft(reviewId: string, reviewData: Partial<ReviewFormData>): Promise<Review> {
    const response = await axios.post<ApiResponse<Review>>(`${API_URL}/reviews/${reviewId}/draft`, reviewData);
    return response.data.data!;
  }
}

export const reviewerService = new ReviewerService();