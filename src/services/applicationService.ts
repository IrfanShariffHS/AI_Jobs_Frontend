import { apiService, ApiResponse } from './api';
import { withCache, invalidateCache, forceRefresh } from '../utils/cache';

export interface JobApplication {
  id: number;
  jobId?: number;
  jobTitle: string;
  company: string;
  applicationStatus: string;
  appliedAt: string;
  lastUpdate?: string;
  nextStep?: string;
  notes?: string;
  salary?: string;
  location?: string;
  matchScore?: number;
  recruiterName?: string;
  interviewDate?: string;
  offerAmount?: string;
}

export interface ApplicationListResponse {
  success: boolean;
  count: number;
  applications: JobApplication[];
}

export const applicationService = {
  async getApplications(status?: string): Promise<ApiResponse<ApplicationListResponse>> {
    const cacheKey = status ? `applications-${status}` : 'applications';
    return withCache(cacheKey, async () => {
      const endpoint = status ? `/api/applications?status=${status}` : '/api/applications';
      return apiService.get<ApplicationListResponse>(endpoint);
    });
  },

  async getApplicationById(id: number): Promise<ApiResponse<JobApplication>> {
    return withCache(`application-${id}`, async () => {
      return apiService.get<JobApplication>(`/api/applications/${id}`);
    });
  },

  async updateApplicationStatus(id: number, status: string, notes?: string): Promise<ApiResponse<any>> {
    const result = await apiService.put(`/api/applications/${id}/status`, { status, notes });
    // Invalidate cache when application is updated
    if (result.success) {
      invalidateCache('applications');
    }
    return result;
  },

  async getApplicationHistory(id: number): Promise<ApiResponse<any>> {
    return withCache(`application-history-${id}`, async () => {
      return apiService.get(`/api/applications/${id}/history`);
    });
  },

  // Force refresh methods
  async refreshApplications(status?: string): Promise<ApiResponse<ApplicationListResponse>> {
    const cacheKey = status ? `applications-${status}` : 'applications';
    return forceRefresh(cacheKey, async () => {
      const endpoint = status ? `/api/applications?status=${status}` : '/api/applications';
      return apiService.get<ApplicationListResponse>(endpoint);
    });
  },
};
