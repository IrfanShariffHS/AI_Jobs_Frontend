import { apiService, ApiResponse } from './api';

export interface ResumeUploadHistory {
  id: number;
  filename: string;
  uploadTimestamp: string;
  md5Hash: string;
  status: string;
  errorMessage: string | null;
  userId: number;
}

export interface ResumeStatus {
  success: boolean;
  hasResume: boolean;
  latestResume: ResumeUploadHistory | null;
}

export interface ResumeUploadResponse {
  success: boolean;
  message: string;
  isUpdate: boolean;
  resumeId?: number;
  uploadHistory: ResumeUploadHistory;
  parsedData?: any;
  parseWarning?: string;
}


export const resumeService = {
  async uploadResume(file: File): Promise<ApiResponse<ResumeUploadResponse>> {
    return apiService.upload<ResumeUploadResponse>('/api/resume/upload', file);
  },

  async getResumeStatus(): Promise<ApiResponse<ResumeStatus>> {
    return apiService.get<ResumeStatus>('/api/resume/status');
  },

  async getResumeHistory(): Promise<ApiResponse<{ history: ResumeUploadHistory[] }>> {
    return apiService.get<{ history: ResumeUploadHistory[] }>('/api/resume/history');
  },

  async parseResume(resumeId?: number): Promise<ApiResponse<{ data: any }>> {
    return apiService.post<{ data: any }>('/api/resume/parse', resumeId != null ? { resumeId } : {});
  },

  async deleteLatestResume(): Promise<ApiResponse<{ message: string }>> {
    return apiService.delete<{ message: string }>('/api/resume/latest');
  },

  /** Opens authenticated resume download in a new tab / triggers browser download */
  async downloadLatestResume(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('user_id');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userId) headers['X-User-Id'] = userId;
    const response = await fetch(`${apiService.getBaseUrl()}/api/resume/download`, { headers });
    if (!response.ok) {
      throw new Error('Failed to download resume');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  /** Returns an object URL for inline PDF preview (caller must revoke) */
  async getPreviewObjectUrl(): Promise<string> {
    const token = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('user_id');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userId) headers['X-User-Id'] = userId;
    const response = await fetch(`${apiService.getBaseUrl()}/api/resume/preview`, { headers });
    if (!response.ok) {
      throw new Error('Failed to load resume preview');
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },
};
