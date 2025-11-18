import axios from 'axios';
import { Submission, SubmissionFormData, ApiResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class SubmissionService {
  async createSubmission(data: SubmissionFormData): Promise<Submission> {
    const response = await axios.post<ApiResponse<Submission>>(`${API_URL}/submissions`, data);
    return response.data.data!;
  }

  async getSubmissions(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ submissions: Submission[]; pagination: any }> {
    const response = await axios.get<ApiResponse<Submission[]>>(`${API_URL}/submissions`, { params });
    return {
      submissions: response.data.data!,
      pagination: response.data.pagination!
    };
  }

  async getSubmission(id: string): Promise<Submission> {
    const response = await axios.get<ApiResponse<Submission>>(`${API_URL}/submissions/${id}`);
    return response.data.data!;
  }

  async updateSubmission(id: string, data: Partial<SubmissionFormData>): Promise<Submission> {
    const response = await axios.put<ApiResponse<Submission>>(`${API_URL}/submissions/${id}`, data);
    return response.data.data!;
  }

  async submitForReview(id: string): Promise<Submission> {
    const response = await axios.post<ApiResponse<Submission>>(`${API_URL}/submissions/${id}/submit`);
    return response.data.data!;
  }

  async withdrawSubmission(id: string): Promise<Submission> {
    const response = await axios.post<ApiResponse<Submission>>(`${API_URL}/submissions/${id}/withdraw`);
    return response.data.data!;
  }

  async uploadFile(submissionId: string, file: File, fileType: 'manuscript' | 'cover-letter' | 'supplementary', description?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);
    if (description) {
      formData.append('description', description);
    }

    const response = await axios.post<ApiResponse<any>>(`${API_URL}/submissions/${submissionId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  }

  async deleteFile(submissionId: string, fileId: string): Promise<void> {
    await axios.delete(`${API_URL}/submissions/${submissionId}/files/${fileId}`);
  }

  async createRevision(submissionId: string, data: {
    revisionLetter: string;
    responseToReviewers: string;
  }): Promise<any> {
    const response = await axios.post<ApiResponse<any>>(`${API_URL}/submissions/${submissionId}/revisions`, data);
    return response.data.data!;
  }

  async uploadRevisionFile(submissionId: string, revisionId: string, file: File, fileType: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);

    const response = await axios.post<ApiResponse<any>>(`${API_URL}/submissions/${submissionId}/revisions/${revisionId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  }

  async approveProof(submissionId: string, approved: boolean, comments?: string): Promise<any> {
    const response = await axios.post<ApiResponse<any>>(`${API_URL}/submissions/${submissionId}/proof-approval`, {
      approved,
      comments
    });
    return response.data.data!;
  }
}

export const submissionService = new SubmissionService();