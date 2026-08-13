import { apiService, ApiResponse } from './api';
import { cacheManager } from '../utils/cache';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  userId: number;
  email: string;
  token: string;
  onboardingCompleted: boolean;
  gmailVerified: boolean;
  requiresEmailVerification?: boolean;
  hasGeminiKey?: boolean;
  hasGroqKey?: boolean;
  requiresApiKeySetup?: boolean;
}

export interface ProfileStatus {
  success: boolean;
  userId: number;
  email: string;
  onboardingCompleted: boolean;
  gmailVerified: boolean;
  hasNaukriCredentials: boolean;
  hasLinkedInCredentials: boolean;
  hasActiveResume: boolean;
  hasGeminiKey?: boolean;
  hasGroqKey?: boolean;
  requiresApiKeySetup?: boolean;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.post<AuthResponse>('/api/auth/login', credentials);

    if (response.success && response.data && response.data.gmailVerified !== false) {
      apiService.setAuth(response.data.token, response.data.userId.toString());
    }

    return response;
  },

  async register(credentials: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return apiService.post<AuthResponse>('/api/auth/register', credentials);
  },

  async verifyEmail(email: string, code: string): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.post<AuthResponse>('/api/auth/verify-email', { email, code });
    if (response.success && response.data?.token && response.data?.userId) {
      apiService.setAuth(response.data.token, response.data.userId.toString());
    }
    return response;
  },

  async resendVerification(email: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiService.post('/api/auth/resend-verification', { email });
  },

  async getProfileStatus(userId: number): Promise<ApiResponse<ProfileStatus>> {
    return apiService.get<ProfileStatus>(`/api/auth/profile-status?userId=${userId}`);
  },

  async logout() {
    apiService.clearAuth();
    // Clear all cached data on logout to prevent stale data
    cacheManager.clear();
    return { success: true, message: 'Logged out successfully' };
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  getCurrentUserId(): string | null {
    return localStorage.getItem('user_id');
  }
};
