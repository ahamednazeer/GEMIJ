import axios from 'axios';
import { Payment, ApiResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class PaymentService {
  async createPaymentIntent(submissionId: string, amount: number, currency: string = 'INR'): Promise<{
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
      const response = await axios.get<ApiResponse<Payment>>(`${API_URL}/payments/submissions/${submissionId}/payment-status`);
      return response.data.data!;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getPaymentById(paymentId: string): Promise<any> {
    const response = await axios.get<ApiResponse<any>>(`${API_URL}/payments/${paymentId}`);
    return response.data.data!;
  }

  async getPaymentHistory(): Promise<Payment[]> {
    const response = await axios.get<ApiResponse<Payment[]>>(`${API_URL}/payments/history`);
    return response.data.data!;
  }

  async uploadProof(submissionId: string, file: File, paymentMethod: 'BANK_TRANSFER' | 'UPI' = 'BANK_TRANSFER'): Promise<Payment> {
    const formData = new FormData();
    formData.append('proof', file);
    formData.append('paymentMethod', paymentMethod);

    const response = await axios.post<ApiResponse<Payment>>(
      `${API_URL}/payments/submissions/${submissionId}/proof`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data.data!;
  }
}

export const paymentService = new PaymentService();