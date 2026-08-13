import { apiService, ApiResponse } from './api';

export interface AutoApplyProgress {
  processed: number;
  total: number;
  applied: number;
  pendingReview: number;
  failed: number;
  jobsFound?: number;
  applicationsSubmitted?: number;
  successfulApplications?: number;
  failedApplications?: number;
  skippedJobs?: number;
  remainingQuota?: number;
  dailyLimit?: number;
}

export interface AutoApplyLog {
  type: 'info' | 'success' | 'error' | 'warning' | string;
  time: string;
  message: string;
  platform?: string;
  level?: string;
  timestamp?: string;
}

export interface AutoApplySettings {
  minMatchScore: number;
  dailyApplicationLimit: number;
  applicationsToday: number;
  platforms: string[];
  locationPreference: string;
  autoApplyEnabled: boolean;
  coverLetter?: string;
}

export interface AutoApplyStats {
  applied: number;
  pendingReview: number;
  failed: number;
  skipped: number;
}

export interface AutoApplyStatus {
  isRunning: boolean;
  status: string;
  message?: string;
  currentUserId?: number;
  currentPlatform?: string;
  startedAt?: string | null;
  progress?: AutoApplyProgress;
  logs?: AutoApplyLog[];
  activityLogs?: AutoApplyLog[];
  settings?: AutoApplySettings;
  stats?: AutoApplyStats;
  platformStats?: Record<string, number>;
}

export interface ReviewJob {
  id: number;
  applicationId?: number | null;
  title: string;
  company: string;
  location?: string;
  platform?: string;
  matchScore: number;
  matchAnalysis?: string;
  missingSkills?: string[];
  matchingSkills?: string[];
  matchBreakdown?: Record<string, unknown>;
  experienceMatch?: number;
  educationMatch?: number;
  atsCompatibility?: number;
  keywordMatch?: number;
  recruiterRelevance?: number;
  autoApplyReason?: string;
  profileImprovements?: string[];
  jobUrl?: string;
  salary?: string;
  experience?: string;
  notes?: string;
  postedAt?: string;
}

export interface ReviewJobsResponse {
  success: boolean;
  count: number;
  matchThreshold: number;
  jobs: ReviewJob[];
}

export interface ApproveResult {
  success: boolean;
  applied: number;
  failed: number;
  details?: string[];
  message: string;
}

export const autoApplyService = {
  async start(): Promise<ApiResponse<AutoApplyStatus>> {
    return apiService.post<AutoApplyStatus>('/api/auto-apply/start', {});
  },

  async stop(): Promise<ApiResponse<AutoApplyStatus>> {
    return apiService.post<AutoApplyStatus>('/api/auto-apply/stop', {});
  },

  async getStatus(): Promise<ApiResponse<AutoApplyStatus>> {
    return apiService.get<AutoApplyStatus>('/api/auto-apply/status');
  },

  async getReviewJobs(): Promise<ApiResponse<ReviewJobsResponse>> {
    return apiService.get<ReviewJobsResponse>('/api/auto-apply/review');
  },

  async approveJobs(jobIds: number[]): Promise<ApiResponse<ApproveResult>> {
    return apiService.post<ApproveResult>('/api/auto-apply/approve', { jobIds });
  },

  async rejectJobs(jobIds: number[]): Promise<ApiResponse<{ success: boolean; rejected: number; message: string }>> {
    return apiService.post('/api/auto-apply/reject', { jobIds });
  },

  async getSettings(): Promise<ApiResponse<{ success: boolean; settings: AutoApplySettings; stats: AutoApplyStats }>> {
    return apiService.get('/api/auto-apply/settings');
  },

  async updateSettings(payload: {
    autoApplyEnabled?: boolean;
    minMatchScore?: number;
  }): Promise<ApiResponse<{ success: boolean; settings: AutoApplySettings }>> {
    return apiService.put('/api/auto-apply/settings', payload);
  },
};
