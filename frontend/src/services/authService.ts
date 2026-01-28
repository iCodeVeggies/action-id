import api from './api.js';
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  BiometricVerifyRequest,
  BiometricVerifyResponse,
  EnrollCompleteRequest,
  EnrollCompleteResponse,
  ProfileResponse,
  User,
} from '../types/index.js';

export const authService = {
  register: async (email: string, password: string): Promise<AuthResponse> => {
    const request: RegisterRequest = { email, password };
    const response = await api.post<AuthResponse>('/auth/register', request);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const request: LoginRequest = { email, password };
    const response = await api.post<AuthResponse>('/auth/login', request);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  verifyBiometric: async (
    csid: string,
    actionID: string = 'login',
    videoValidated: boolean = false
  ): Promise<BiometricVerifyResponse> => {
    const request: BiometricVerifyRequest = { csid, actionID, videoValidated };
    const response = await api.post<BiometricVerifyResponse>(
      '/auth/verify-biometric',
      request
    );
    return response.data;
  },

  completeEnrollment: async (csid: string): Promise<EnrollCompleteResponse> => {
    const request: EnrollCompleteRequest = { csid };
    const response = await api.post<EnrollCompleteResponse>(
      '/auth/enroll/complete',
      request
    );
    if (response.data.enrolled) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user: User = JSON.parse(userStr);
        user.enrolled = true;
        localStorage.setItem('user', JSON.stringify(user));
      }
    }
    return response.data;
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const response = await api.get<ProfileResponse>('/auth/profile');
    return response.data;
  },

  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};
