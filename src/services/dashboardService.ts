import { apiService, ApiResponse } from './api';
import { withCache, invalidateCache, forceRefresh } from '../utils/cache';

export interface DashboardStats {
  jobStats: {
    totalCrawled: number;
    platformBreakdown: Record<string, number>;
    averageResumeMatchScore: string;
  };
  applicationStats: {
    applied: number;
    skipped: number;
    failed: number;
  };
  emailStats: {
    totalSent: number;
    totalFailed: number;
    sentToday: number;
    sentThisWeek: number;
    sentThisMonth: number;
  };
  recruiterStats: {
    total: number;
    replied: number;
    pending: number;
  };
  resumeStats: {
    totalUploads: number;
    successfulSyncs: number;
    lastUpload: string | null;
  };
}

export interface TrendingSkill {
  name: string;
  demand: number;
  growth: string;
  explanation?: string;
  impact?: string;
  priority?: string;
  frequency?: number;
  percentage?: number;
  relevance_score?: number;
  recommendation_score?: number;
  category?: string;
}

export interface AiRecommendation {
  id: string;
  type: string;
  title: string;
  impact: string;
  priority: string;
  explanation?: string;
  category?: string;
  action?: string;
  [key: string]: unknown;
}

export const dashboardService = {
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    return withCache('dashboard-stats', async () => {
      return apiService.get<DashboardStats>('/api/dashboard/stats');
    });
  },

  async getTrendingSkills(): Promise<ApiResponse<TrendingSkill[]>> {
    return withCache('trending-skills', async () => {
      const response = await apiService.get<any>('/api/profile/trending-skills');
      if (!response.success) {
        return { success: false, error: response.error, message: response.message };
      }

      // Backend returns { success, data: [...] }; apiService wraps the whole body as response.data
      const payload = response.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.skills)
            ? payload.skills
            : [];

      const normalized: ApiResponse<TrendingSkill[]> = {
        success: true,
        data: list,
        message: response.message,
      };
      return normalized;
    });
  },

  async getAiRecommendations(): Promise<ApiResponse<AiRecommendation[]>> {
    return withCache('ai-recommendations', async () => {
      const response = await apiService.get<any>('/api/profile/recommendations');
      if (!response.success) {
        return { success: false, error: response.error, message: response.message };
      }
      const payload = response.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.recommendations)
            ? payload.recommendations
            : [];
      return { success: true, data: list, message: response.message };
    });
  },

  // Force refresh methods for when you need absolutely fresh data
  async refreshStats(): Promise<ApiResponse<DashboardStats>> {
    return forceRefresh('dashboard-stats', async () => {
      return apiService.get<DashboardStats>('/api/dashboard/stats');
    });
  },

  async refreshTrendingSkills(): Promise<ApiResponse<TrendingSkill[]>> {
    // Call the backend refresh endpoint which invalidates cache and regenerates
    return forceRefresh('trending-skills', async () => {
      const response = await apiService.post<any>('/api/profile/trending-skills/refresh', {});
      if (!response.success) {
        return { success: false, error: response.error, message: response.message };
      }

      const payload = response.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.skills)
            ? payload.skills
            : [];

      const normalized: ApiResponse<TrendingSkill[]> = {
        success: true,
        data: list,
        message: response.message || 'Trending skills refreshed successfully',
      };
      return normalized;
    });
  },
};
