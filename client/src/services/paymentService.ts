import axios from 'axios';
import { Payment, ApiResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class PaymentService {
  async createPaymentIntent(submissionId: string, amount: number, currency: string = 'USD'): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }> {
    const response = await axios.post<ApiResponse<any>>(`${API_URL}/payments/create-intent`, {
      submissionId,
      amount,
      currency
    });
    return response.data.data!;
  }

  async confirmPayment(submissionId: string, paymentIntentId: string): Promise<Payment> {
    const response = await axios.post<ApiResponse<Payment>>(`${API_URL}/payments/confirm`, {
      submissionId,
      paymentIntentId
    });
    return response.data.data!;
  }

  async getPaymentStatus(submissionId: string): Promise<Payment | null> {
    try {
      const response = await axios.get<ApiResponse<Payment>>(`${API_URL}/payments/submission/${submissionId}`);
      return response.data.data!;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getPaymentHistory(): Promise<Payment[]> {
    const response = await axios.get<ApiResponse<Payment[]>>(`${API_URL}/payments/history`);
    return response.data.data!;
  }
}

export const paymentService = new PaymentService();