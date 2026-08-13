import { apiService, ApiResponse } from './api';

export type PlatformType = 'RESUME' | 'NAUKRI' | 'LINKEDIN';

export interface PlatformConnection {
  id: number;
  platform: PlatformType | string;
  connectionStatus: 'CONNECTED' | 'NOT_CONNECTED' | 'DISCONNECTED' | 'ERROR' | string;
  accountEmail?: string | null;
  accountName?: string | null;
  lastSuccessfulSyncAt?: string | null;
  lastProfileUpdateAt?: string | null;
  lastSyncAttemptAt?: string | null;
  lastSyncResult?: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'PENDING_APPROVAL' | string | null;
  lastSyncError?: string | null;
  syncStatus?: string;
  fieldsSyncedCount?: number;
  fieldsMissingCount?: number;
  profileCompletionPct?: number;
  resumeUploadAt?: string | null;
  nextScheduledSyncAt?: string | null;
  scheduledSyncEnabled?: boolean;
  scheduledSyncCron?: string | null;
  canEditCredentials?: boolean;
  canSync?: boolean;
}

export interface PendingProfileChange {
  id: number;
  platform: string;
  fieldName: string;
  currentValue?: string | null;
  proposedValue?: string | null;
  createdAt?: string;
}

export interface PlatformConnectionsDashboard {
  success: boolean;
  connections: PlatformConnection[];
  overallProfileCompletion: number;
  pendingApprovals: number;
  profileSyncEnabled: boolean;
  lastProfileSyncAt?: string | null;
}

export const platformConnectionService = {
  async getConnections(): Promise<ApiResponse<PlatformConnectionsDashboard>> {
    return apiService.get<PlatformConnectionsDashboard>('/api/platform-connections');
  },

  async updateCredentials(
    platform: string,
    email: string,
    password: string
  ): Promise<ApiResponse<any>> {
    return apiService.post(`/api/platform-connections/${platform}/credentials`, { email, password });
  },

  async reconnect(platform: string, email: string, password: string): Promise<ApiResponse<any>> {
    return apiService.post(`/api/platform-connections/${platform}/reconnect`, { email, password });
  },

  async disconnect(platform: string): Promise<ApiResponse<any>> {
    return apiService.delete(`/api/platform-connections/${platform}`);
  },

  async sync(platform: string, live = true): Promise<ApiResponse<any>> {
    return apiService.post(`/api/platform-connections/${platform}/sync?live=${live}`, {});
  },

  async syncAll(): Promise<ApiResponse<any>> {
    return apiService.post('/api/platform-connections/sync-all', {});
  },

  async retry(platform: string): Promise<ApiResponse<any>> {
    return apiService.post(`/api/platform-connections/${platform}/retry`, {});
  },

  async getHistory(platform?: string, limit = 20): Promise<ApiResponse<any>> {
    const path = platform
      ? `/api/platform-connections/${platform}/history?limit=${limit}`
      : `/api/platform-connections/history?limit=${limit}`;
    return apiService.get(path);
  },

  async updateSchedule(platform: string, enabled: boolean, cron?: string): Promise<ApiResponse<any>> {
    return apiService.patch(`/api/platform-connections/${platform}/schedule`, { enabled, cron });
  },

  async getPendingChanges(): Promise<ApiResponse<{ pendingChanges: PendingProfileChange[]; count: number }>> {
    return apiService.get('/api/platform-connections/pending-changes');
  },

  async approveChange(changeId: number): Promise<ApiResponse<any>> {
    return apiService.post(`/api/platform-connections/pending-changes/${changeId}/approve`, {});
  },

  async rejectChange(changeId: number): Promise<ApiResponse<any>> {
    return apiService.post(`/api/platform-connections/pending-changes/${changeId}/reject`, {});
  },

  async resolveAllPending(approve: boolean): Promise<ApiResponse<any>> {
    return apiService.post('/api/platform-connections/pending-changes/resolve-all', { approve });
  },
};
