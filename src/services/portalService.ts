import { apiService, ApiResponse } from './api';

export interface PortalCredentials {
  email: string;
  password: string;
  enabled: boolean;
}

export interface PortalConfiguration {
  linkedIn: PortalCredentials;
  naukri: PortalCredentials;
}

export const portalService = {
  async savePortalConfiguration(data: PortalConfiguration): Promise<ApiResponse<{ success: boolean }>> {
    return apiService.post<{ success: boolean }>('/api/portal/configure', data);
  },

  async validateLinkedInCredentials(email: string, password: string): Promise<ApiResponse<{ valid: boolean }>> {
    return apiService.post<{ valid: boolean }>('/api/portal/linkedin/validate', { email, password });
  },

  async validateNaukriCredentials(email: string, password: string): Promise<ApiResponse<{ valid: boolean }>> {
    return apiService.post<{ valid: boolean }>('/api/portal/naukri/validate', { email, password });
  },

  async getPortalConfiguration(): Promise<ApiResponse<PortalConfiguration>> {
    return apiService.get<PortalConfiguration>('/api/portal/config');
  },

  async updateLinkedInCredentials(data: PortalCredentials): Promise<ApiResponse<{ success: boolean }>> {
    return apiService.put<{ success: boolean }>('/api/portal/linkin', data);
  },

  async updateNaukriCredentials(data: PortalCredentials): Promise<ApiResponse<{ success: boolean }>> {
    return apiService.put<{ success: boolean }>('/api/portal/naukri', data);
  }
};
