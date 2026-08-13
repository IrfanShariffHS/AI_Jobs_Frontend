import { apiService, ApiResponse } from './api';

export type PortalPlatform = 'NAUKRI' | 'LINKEDIN';

export interface PortalSession {
  id?: number;
  userId?: number;
  platform?: string;
  status?: string;
  expiresAt?: string | null;
  lastValidatedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  expired?: boolean;
  hasStorageState?: boolean;
}

export interface SessionsResponse {
  success: boolean;
  sessions: PortalSession[];
  count: number;
  platformValidity?: Record<string, boolean>;
}

export interface SessionActionResponse {
  success: boolean;
  isValid?: boolean;
  platform?: string;
  message?: string;
  session?: PortalSession;
  isReady?: boolean;
  naukriValid?: boolean;
  linkedInValid?: boolean;
}

export const sessionService = {
  async list(): Promise<ApiResponse<SessionsResponse>> {
    return apiService.get<SessionsResponse>('/api/sessions');
  },

  async get(platform: PortalPlatform): Promise<ApiResponse<SessionActionResponse>> {
    return apiService.get<SessionActionResponse>(`/api/sessions/${platform}`);
  },

  async validate(platform: PortalPlatform): Promise<ApiResponse<SessionActionResponse>> {
    return apiService.post<SessionActionResponse>(`/api/sessions/${platform}/validate`, {});
  },

  async refresh(platform: PortalPlatform): Promise<ApiResponse<SessionActionResponse>> {
    return apiService.post<SessionActionResponse>(`/api/sessions/${platform}/refresh`, {});
  },

  async invalidate(platform: PortalPlatform): Promise<ApiResponse<SessionActionResponse>> {
    return apiService.delete<SessionActionResponse>(`/api/sessions/${platform}`);
  },

  async checkAutoApplyReady(): Promise<ApiResponse<SessionActionResponse>> {
    return apiService.get<SessionActionResponse>('/api/sessions/auto-apply-check');
  },

  async loginNaukri(): Promise<ApiResponse<{ status: string; message: string }>> {
    return apiService.get('/api/naukri/login');
  },

  async loginLinkedIn(): Promise<ApiResponse<{ status: string; message: string }>> {
    return apiService.get('/api/linkedin/login');
  },
};
