import axios from 'axios';
import { Submission, Review, User, ApiResponse, SubmissionStatus, ReviewStatus } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface AdminStats {
  totalUsers: number;
  totalAuthors: number;
  totalEditors: number;
  totalReviewers: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  publishedArticles: number;
  totalRevenue: number;
  pendingPayments: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export interface UserManagementData {
  id: string;
  name: string;
  email: string;
  role: 'AUTHOR' | 'EDITOR' | 'REVIEWER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  registrationDate: string;
  lastLogin?: string;
  submissionsCount?: number;
  reviewsCount?: number;
}

export interface SystemSettings {
  apcFee: number;
  currency: string;
  reviewDeadlineDays: number;
  revisionDeadlineDays: number;
  maxReviewers: number;
  autoAssignReviewers: boolean;
  plagiarismThreshold: number;
  emailNotifications: boolean;
  journalName: string;
  journalDescription: string;
  contactEmail: string;
  submissionGuidelines: string;
  reviewGuidelines: string;
  ethicsPolicy: string;
}

export interface IssueData {
  id: string;
  volume: number;
  issue: number;
  year: number;
  title: string;
  description?: string;
  coverImage?: string;
  publishedDate?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  articles: {
    id: string;
    title: string;
    authors: string[];
    doi: string;
    pages: string;
  }[];
}

export interface PaymentData {
  id: string;
  submissionId: string;
  authorId: string;
  authorName: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
  paymentDate?: string;
  refundDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  invoiceNumber: string;
}

export interface ComplaintData {
  id: string;
  type: 'PLAGIARISM' | 'ETHICS' | 'QUALITY' | 'PROCESS' | 'OTHER';
  submissionId?: string;
  complainantName: string;
  complainantEmail: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedTo?: string;
  createdDate: string;
  resolvedDate?: string;
  resolution?: string;
}

export interface SystemHealthData {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastBackup: string;
  databaseSize: string;
  activeUsers: number;
  serverLoad: number;
  memoryUsage: number;
  diskUsage: number;
  errorRate: number;
  responseTime: number;
}

export interface ReportData {
  type: 'MONTHLY' | 'YEARLY' | 'CUSTOM';
  period: string;
  submissions: {
    total: number;
    accepted: number;
    rejected: number;
    pending: number;
  };
  reviews: {
    completed: number;
    pending: number;
    overdue: number;
  };
  financial: {
    revenue: number;
    refunds: number;
    pendingPayments: number;
  };
  users: {
    newRegistrations: number;
    activeUsers: number;
  };
}

class AdminService {
  // Dashboard & Statistics
  async getAdminStats(): Promise<AdminStats> {
    const response = await axios.get<ApiResponse<AdminStats>>(`${API_URL}/admin/stats`);
    return response.data.data!;
  }

  async getSystemHealth(): Promise<SystemHealthData> {
    const response = await axios.get<ApiResponse<SystemHealthData>>(`${API_URL}/admin/system/health`);
    return response.data.data!;
  }

  // User Management
  async getAllUsers(params?: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ users: UserManagementData[]; pagination: any }> {
    const response = await axios.get<ApiResponse<UserManagementData[]>>(`${API_URL}/admin/users`, { params });
    return {
      users: response.data.data!,
      pagination: response.data.pagination!
    };
  }

  async getUserById(userId: string): Promise<UserManagementData> {
    const response = await axios.get<ApiResponse<UserManagementData>>(`${API_URL}/admin/users/${userId}`);
    return response.data.data!;
  }

  async updateUserRole(userId: string, role: string): Promise<void> {
    await axios.put(`${API_URL}/admin/users/${userId}/role`, { role });
  }

  async updateUserStatus(userId: string, status: string): Promise<void> {
    await axios.put(`${API_URL}/admin/users/${userId}/status`, { status });
  }

  async deleteUser(userId: string): Promise<void> {
    await axios.delete(`${API_URL}/admin/users/${userId}`);
  }

  async createUser(userData: {
    name: string;
    email: string;
    role: string;
    password: string;
  }): Promise<UserManagementData> {
    const response = await axios.post<ApiResponse<UserManagementData>>(`${API_URL}/admin/users`, userData);
    return response.data.data!;
  }

  async bulkUpdateUsers(userIds: string[], updates: {
    role?: string;
    status?: string;
  }): Promise<void> {
    await axios.put(`${API_URL}/admin/users/bulk`, { userIds, updates });
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSettings> {
    const response = await axios.get<ApiResponse<SystemSettings>>(`${API_URL}/admin/settings`);
    return response.data.data!;
  }

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const response = await axios.put<ApiResponse<SystemSettings>>(`${API_URL}/admin/settings`, settings);
    return response.data.data!;
  }

  async resetSettingsToDefault(): Promise<SystemSettings> {
    const response = await axios.post<ApiResponse<SystemSettings>>(`${API_URL}/admin/settings/reset`);
    return response.data.data!;
  }

  // Issue Management
  async getAllIssues(params?: {
    status?: string;
    year?: number;
    page?: number;
    limit?: number;
  }): Promise<{ issues: IssueData[]; pagination: any }> {
    const response = await axios.get<ApiResponse<IssueData[]>>(`${API_URL}/admin/issues`, { params });
    return {
      issues: response.data.data!,
      pagination: response.data.pagination!
    };
  }

  async getIssueById(issueId: string): Promise<IssueData> {
    const response = await axios.get<ApiResponse<IssueData>>(`${API_URL}/admin/issues/${issueId}`);
    return response.data.data!;
  }

  async createIssue(issueData: {
    volume: number;
    issue: number;
    year: number;
    title: string;
    description?: string;
  }): Promise<IssueData> {
    const response = await axios.post<ApiResponse<IssueData>>(`${API_URL}/admin/issues`, issueData);
    return response.data.data!;
  }

  async updateIssue(issueId: string, updates: Partial<IssueData>): Promise<IssueData> {
    const response = await axios.put<ApiResponse<IssueData>>(`${API_URL}/admin/issues/${issueId}`, updates);
    return response.data.data!;
  }

  async publishIssue(issueId: string): Promise<void> {
    await axios.post(`${API_URL}/admin/issues/${issueId}/publish`);
  }

  async archiveIssue(issueId: string): Promise<void> {
    await axios.post(`${API_URL}/admin/issues/${issueId}/archive`);
  }

  async addArticleToIssue(issueId: string, submissionId: string, pages: string): Promise<void> {
    await axios.post(`${API_URL}/admin/issues/${issueId}/articles`, { submissionId, pages });
  }

  async removeArticleFromIssue(issueId: string, submissionId: string): Promise<void> {
    await axios.delete(`${API_URL}/admin/issues/${issueId}/articles/${submissionId}`);
  }

  // Payment Management
  async getAllPayments(params?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{ payments: PaymentData[]; pagination: any }> {
    const response = await axios.get<ApiResponse<PaymentData[]>>(`${API_URL}/admin/payments`, { params });
    return {
      payments: response.data.data!,
      pagination: response.data.pagination!
    };
  }

  async getPaymentById(paymentId: string): Promise<PaymentData> {
    const response = await axios.get<ApiResponse<PaymentData>>(`${API_URL}/admin/payments/${paymentId}`);
    return response.data.data!;
  }

  async processRefund(paymentId: string, reason: string): Promise<void> {
    await axios.post(`${API_URL}/admin/payments/${paymentId}/refund`, { reason });
  }

  async markPaymentAsPaid(paymentId: string, transactionId: string): Promise<void> {
    await axios.put(`${API_URL}/admin/payments/${paymentId}/paid`, { transactionId });
  }

  async generateInvoice(paymentId: string): Promise<Blob> {
    const response = await axios.get(`${API_URL}/admin/payments/${paymentId}/invoice`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async bulkProcessPayments(paymentIds: string[], action: 'REFUND' | 'MARK_PAID'): Promise<void> {
    await axios.post(`${API_URL}/admin/payments/bulk`, { paymentIds, action });
  }

  // System Monitoring
  async getSubmissionStats(period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'): Promise<any> {
    const response = await axios.get<ApiResponse<any>>(`${API_URL}/admin/stats/submissions`, {
      params: { period }
    });
    return response.data.data!;
  }

  async getUserActivityStats(period: 'DAILY' | 'WEEKLY' | 'MONTHLY'): Promise<any> {
    const response = await axios.get<ApiResponse<any>>(`${API_URL}/admin/stats/users`, {
      params: { period }
    });
    return response.data.data!;
  }

  async getFinancialStats(period: 'MONTHLY' | 'YEARLY'): Promise<any> {
    const response = await axios.get<ApiResponse<any>>(`${API_URL}/admin/stats/financial`, {
      params: { period }
    });
    return response.data.data!;
  }

  async performSystemBackup(): Promise<void> {
    await axios.post(`${API_URL}/admin/system/backup`);
  }

  async getSystemLogs(params?: {
    level?: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{ logs: any[]; pagination: any }> {
    const response = await axios.get<ApiResponse<any[]>>(`${API_URL}/admin/system/logs`, { params });
    return {
      logs: response.data.data!,
      pagination: response.data.pagination!
    };
  }

  // Complaint Handling
  async getAllComplaints(params?: {
    status?: string;
    type?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Promise<{ complaints: ComplaintData[]; pagination: any }> {
    const response = await axios.get<ApiResponse<ComplaintData[]>>(`${API_URL}/admin/complaints`, { params });
    return {
      complaints: response.data.data!,
      pagination: response.data.pagination!
    };
  }

  async getComplaintById(complaintId: string): Promise<ComplaintData> {
    const response = await axios.get<ApiResponse<ComplaintData>>(`${API_URL}/admin/complaints/${complaintId}`);
    return response.data.data!;
  }

  async updateComplaintStatus(complaintId: string, status: string, resolution?: string): Promise<void> {
    await axios.put(`${API_URL}/admin/complaints/${complaintId}/status`, { status, resolution });
  }

  async assignComplaint(complaintId: string, assignedTo: string): Promise<void> {
    await axios.put(`${API_URL}/admin/complaints/${complaintId}/assign`, { assignedTo });
  }

  async updateComplaintPriority(complaintId: string, priority: string): Promise<void> {
    await axios.put(`${API_URL}/admin/complaints/${complaintId}/priority`, { priority });
  }

  async addComplaintNote(complaintId: string, note: string): Promise<void> {
    await axios.post(`${API_URL}/admin/complaints/${complaintId}/notes`, { note });
  }

  // Retraction Management
  async initiateRetraction(submissionId: string, reason: string): Promise<void> {
    await axios.post(`${API_URL}/admin/retractions`, { submissionId, reason });
  }

  async getRetractions(): Promise<any[]> {
    const response = await axios.get<ApiResponse<any[]>>(`${API_URL}/admin/retractions`);
    return response.data.data!;
  }

  // Report Generation
  async generateReport(params: {
    type: 'MONTHLY' | 'YEARLY' | 'CUSTOM';
    dateFrom?: string;
    dateTo?: string;
    includeFinancial?: boolean;
    includeSubmissions?: boolean;
    includeUsers?: boolean;
  }): Promise<ReportData> {
    const response = await axios.post<ApiResponse<ReportData>>(`${API_URL}/admin/reports/generate`, params);
    return response.data.data!;
  }

  async downloadReport(reportId: string, format: 'PDF' | 'EXCEL' | 'CSV'): Promise<Blob> {
    const response = await axios.get(`${API_URL}/admin/reports/${reportId}/download`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }

  async getReportHistory(): Promise<any[]> {
    const response = await axios.get<ApiResponse<any[]>>(`${API_URL}/admin/reports/history`);
    return response.data.data!;
  }

  async scheduleReport(params: {
    type: 'MONTHLY' | 'YEARLY';
    recipients: string[];
    format: 'PDF' | 'EXCEL';
  }): Promise<void> {
    await axios.post(`${API_URL}/admin/reports/schedule`, params);
  }
}

export default new AdminService();