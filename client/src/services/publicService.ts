import axios from 'axios';
import { Issue, Article, ApiResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class PublicService {
  async getCurrentIssue(): Promise<Issue> {
    const response = await axios.get<ApiResponse<Issue>>(`${API_URL}/public/current-issue`);
    return response.data.data!;
  }

  async getArchive(page = 1, limit = 10): Promise<{ issues: Issue[]; pagination: any }> {
    const response = await axios.get<ApiResponse<Issue[]>>(`${API_URL}/public/archive`, {
      params: { page, limit }
    });
    return {
      issues: response.data.data!,
      pagination: response.data.pagination!
    };
  }

  async getIssue(volume: number, number: number): Promise<Issue> {
    const response = await axios.get<ApiResponse<Issue>>(`${API_URL}/public/issues/${volume}/${number}`);
    return response.data.data!;
  }

  async getArticle(doi: string): Promise<Article> {
    const response = await axios.get<ApiResponse<Article>>(`${API_URL}/public/articles/${doi}`);
    return response.data.data!;
  }

  async searchArticles(params: {
    q?: string;
    author?: string;
    year?: string;
    page?: number;
    limit?: number;
  }): Promise<{ articles: Article[]; pagination: any }> {
    const response = await axios.get<ApiResponse<Article[]>>(`${API_URL}/public/search`, {
      params
    });
    return {
      articles: response.data.data!,
      pagination: response.data.pagination!
    };
  }

  async getJournalStats(): Promise<any> {
    const response = await axios.get<ApiResponse<any>>(`${API_URL}/public/stats`);
    return response.data.data!;
  }

  async downloadArticle(doi: string): Promise<void> {
    const response = await axios.get(`${API_URL}/public/articles/${doi}/download`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${doi.replace('/', '_')}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

export const publicService = new PublicService();