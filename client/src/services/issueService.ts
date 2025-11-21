import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Issue {
    id: string;
    volume: number;
    number: number;
    year: number;
    title?: string;
    description?: string;
    coverImage?: string;
    publishedAt?: string;
    isCurrent: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Conference {
    id: string;
    name: string;
    proceedingsNo?: string;
    category?: string;
    description?: string;
    year: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateIssueData {
    volume: number;
    number: number;
    year: number;
    title?: string;
    description?: string;
    coverImage?: string;
    publishedAt?: string;
    isCurrent?: boolean;
}

export interface CreateConferenceData {
    name: string;
    proceedingsNo?: string;
    category?: string;
    description?: string;
    year: number;
    isActive?: boolean;
}

const issueService = {
    // Get all issues
    async getIssues(params?: { status?: string; page?: number; limit?: number }) {
        const response = await axios.get(`${API_URL}/admin/issues`, { params });
        return response.data;
    },

    // Create issue
    async createIssue(data: CreateIssueData) {
        const response = await axios.post(`${API_URL}/admin/issues`, data);
        return response.data;
    },

    // Update issue
    async updateIssue(issueId: string, data: Partial<CreateIssueData>) {
        const response = await axios.put(`${API_URL}/admin/issues/${issueId}`, data);
        return response.data;
    },

    // Set current issue
    async setCurrentIssue(issueId: string) {
        const response = await axios.post(`${API_URL}/admin/issues/${issueId}/set-current`);
        return response.data;
    },

    // Delete issue
    async deleteIssue(issueId: string) {
        const response = await axios.delete(`${API_URL}/admin/issues/${issueId}`);
        return response.data;
    },

    // Get all conferences
    async getConferences(isActive?: boolean) {
        const response = await axios.get(`${API_URL}/admin/conferences`, {
            params: { isActive }
        });
        return response.data;
    },

    // Create conference
    async createConference(data: CreateConferenceData) {
        const response = await axios.post(`${API_URL}/admin/conferences`, data);
        return response.data;
    },

    // Update conference
    async updateConference(conferenceId: string, data: Partial<CreateConferenceData>) {
        const response = await axios.put(`${API_URL}/admin/conferences/${conferenceId}`, data);
        return response.data;
    },

    // Delete conference
    async deleteConference(conferenceId: string) {
        const response = await axios.delete(`${API_URL}/admin/conferences/${conferenceId}`);
        return response.data;
    }
};

export default issueService;
