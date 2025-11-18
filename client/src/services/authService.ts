import axios from 'axios';
import { User, AuthResponse, ApiResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class AuthService {
  private token: string | null = null;

  constructor() {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    axios.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.setToken(null);
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    this.token = token;
  }

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const response = await axios.post<ApiResponse<AuthResponse>>(`${API_URL}/auth/login`, credentials);
    return response.data.data!;
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    title?: string;
    affiliation?: string;
    country?: string;
    orcid?: string;
  }): Promise<AuthResponse> {
    const response = await axios.post<ApiResponse<AuthResponse>>(`${API_URL}/auth/register`, userData);
    return response.data.data!;
  }

  async getProfile(): Promise<User> {
    const response = await axios.get<ApiResponse<User>>(`${API_URL}/auth/profile`);
    return response.data.data!;
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await axios.put<ApiResponse<User>>(`${API_URL}/auth/profile`, userData);
    return response.data.data!;
  }
}

export const authService = new AuthService();