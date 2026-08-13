export { apiService } from './api';
export { authService } from './authService';
export { dashboardService } from './dashboardService';
export { jobService } from './jobService';
export { applicationService } from './applicationService';
export { resumeService } from './resumeService';
export { recruiterService } from './recruiterService';
export { schedulerService } from './schedulerService';
export { notificationService } from './notificationService';
export { profileService } from './profileService';
export { aiService } from './aiService';
export { portalService } from './portalService';
export { aiProfileService } from './aiProfileService';
export { onboardingService } from './onboardingService';
export { autoApplyService } from './autoApplyService';

export type { ApiResponse } from './api';
export type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  ProfileStatus 
} from './authService';
export type { DashboardStats } from './dashboardService';
export type { JobPosting, JobSearchResponse, JobListResponse } from './jobService';
export type { JobApplication, ApplicationListResponse } from './applicationService';
export type { 
  ResumeUploadHistory, 
  ResumeStatus, 
  ResumeUploadResponse 
} from './resumeService';
export type { HrContact, RecruiterListResponse } from './recruiterService';
export type { 
  ScheduleInfo, 
  SchedulesResponse, 
  ScheduleResponse, 
  CronPreset 
} from './schedulerService';
export type { JobAlert, NotificationsResponse } from './notificationService';
export type { UserProfile, ProfileCompletionData } from './profileService';
export type { AISuggestions, ProfileAnalysis } from './aiService';
export type { PortalCredentials, PortalConfiguration } from './portalService';
export type {
  OnboardingStatus,
  ProfileSnapshot,
  MissingFieldsResponse,
  SyncProfileResponse,
  PortalConnectResult,
} from './onboardingService';
export type { 
  DataSource, 
  ProfileField, 
  ProfileData, 
  SourceData, 
  AIProfileSuggestion, 
  ProfileDiff, 
  ProfileSyncResult 
} from './aiProfileService';
export type {
  AutoApplyStatus,
  AutoApplySettings,
  AutoApplyStats,
  AutoApplyLog,
  ReviewJob,
  ReviewJobsResponse,
  ApproveResult,
} from './autoApplyService';
