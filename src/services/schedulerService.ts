import { apiService, ApiResponse } from './api';

export interface ScheduleInfo {
  id: string;
  name: string;
  description: string;
  cronExpression: string;
  humanReadable: string;
  nextExecution: string;
  enabled: boolean;
}

export interface SchedulesResponse {
  success: boolean;
  schedules: ScheduleInfo[];
  timezone: string;
}

export interface ScheduleResponse {
  success: boolean;
  schedule: ScheduleInfo;
  timezone: string;
}

export interface CronPreset {
  name: string;
  cron: string;
  description: string;
}

export const schedulerService = {
  async getAllSchedules(): Promise<ApiResponse<SchedulesResponse>> {
    return apiService.get<SchedulesResponse>('/api/scheduler');
  },

  async getSchedule(schedulerId: string): Promise<ApiResponse<ScheduleResponse>> {
    return apiService.get<ScheduleResponse>(`/api/scheduler/${schedulerId}`);
  },

  async updateSchedule(
    schedulerId: string,
    cronExpression: string
  ): Promise<ApiResponse<ScheduleResponse>> {
    return apiService.put<ScheduleResponse>(`/api/scheduler/${schedulerId}`, { cronExpression });
  },

  async enableSchedule(
    schedulerId: string,
    cronExpression?: string
  ): Promise<ApiResponse<ScheduleResponse>> {
    // Never send a disabled/sentinel cron — backend restores the default when omitted
    const body =
      cronExpression && cronExpression !== "0 0 0 31 12 ?"
        ? { cronExpression }
        : {};
    return apiService.post<ScheduleResponse>(`/api/scheduler/${schedulerId}/enable`, body);
  },

  async disableSchedule(schedulerId: string): Promise<ApiResponse<ScheduleResponse>> {
    return apiService.post<ScheduleResponse>(`/api/scheduler/${schedulerId}/disable`, {});
  },

  async toggleSchedule(schedulerId: string): Promise<ApiResponse<ScheduleResponse>> {
    return apiService.post<ScheduleResponse>(`/api/scheduler/${schedulerId}/toggle`, {});
  },

  async getCronPresets(): Promise<ApiResponse<{ presets: CronPreset[] }>> {
    return apiService.get<{ presets: CronPreset[] }>('/api/scheduler/presets');
  }
};
