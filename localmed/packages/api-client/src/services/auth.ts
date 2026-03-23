import { apiClient } from '../client';

export interface RegisterParams {
  phone: string;
  name?: string;
  email?: string;
}

export interface VerifyOtpParams {
  phone: string;
  otp: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    phone: string;
    name?: string;
    email?: string;
  };
}

export const authApi = {
  register: (params: RegisterParams) => apiClient.post('/auth/register', params),
  verifyOtp: (params: VerifyOtpParams) => apiClient.post<AuthResponse>('/auth/verify-otp', params),
  refreshToken: (refreshToken: string) => apiClient.post('/auth/refresh-token', { refreshToken }),
  logout: () => apiClient.post('/auth/logout'),
};
