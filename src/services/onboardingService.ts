import { apiService, ApiResponse } from './api';

export interface OnboardingStatus {
  success: boolean;
  userId: number;
  email: string;
  onboardingCompleted: boolean;
  step1_resumeUploaded: boolean;
  step2_naukriConnected: boolean;
  step3_linkedInConnected: boolean;
  step3_profileSynced: boolean;
  step4_missingFieldsFilled: boolean;
  hasStoredNaukriCredentials: boolean;
  hasStoredLinkedInCredentials: boolean;
  missingFields: string[];
  currentStep: number;
  totalSteps: number;
}

export interface PortalConnectResult {
  success: boolean;
  email: string;
  naukri: {
    hasStoredCredentials: boolean;
    connected: boolean;
    message: string;
  };
  linkedIn: {
    hasStoredCredentials: boolean;
    connected: boolean;
    message: string;
  };
}

export interface ProfileSnapshot {
  fullName?: string;
  email?: string;
  phone?: string;
  currentCity?: string;
  preferredLocation?: string;
  currentCompany?: string;
  currentDesignation?: string;
  yearsOfExperience?: string;
  currentCTC?: string;
  expectedCTC?: string;
  noticePeriod?: string;
  preferredJobRole?: string;
  employmentType?: string;
  highestQualification?: string;
  skills?: string;
  summary?: string;
}

export interface MissingFieldsResponse {
  success: boolean;
  missingFields: string[];
  profileComplete: boolean;
  profile: ProfileSnapshot;
}

export interface SyncProfileResponse {
  success: boolean;
  message: string;
  mergedProfile: Record<string, unknown>;
  missingFields: string[];
  profileComplete: boolean;
}

export interface CompleteOnboardingResponse {
  success: boolean;
  message: string;
  missingFields?: string[];
  mergedProfile?: Record<string, unknown>;
}

export const onboardingService = {
  async getStatus(): Promise<ApiResponse<OnboardingStatus>> {
    return apiService.get<OnboardingStatus>('/api/onboarding/status');
  },

  async uploadResume(file: File): Promise<ApiResponse<{ success: boolean; message: string; resumeFileId: number; extractionResult?: Record<string, unknown> }>> {
    return apiService.upload('/api/onboarding/upload-resume', file);
  },

  async saveNaukriCredentials(email: string, password: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiService.post('/api/onboarding/naukri-credentials', { email, password });
  },

  async saveLinkedInCredentials(email: string, password: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiService.post('/api/onboarding/linkedin-credentials', { email, password });
  },

  async validateNaukriCredentials(): Promise<ApiResponse<{ validated: boolean; message: string }>> {
    return apiService.post('/api/onboarding/validate-naukri-credentials', {});
  },

  async validateLinkedInCredentials(): Promise<ApiResponse<{ validated: boolean; message: string }>> {
    return apiService.post('/api/onboarding/validate-linkedin-credentials', {});
  },

  async autoConnectPortals(): Promise<ApiResponse<PortalConnectResult>> {
    return apiService.post('/api/onboarding/auto-connect-portals', {});
  },

  async syncProfile(): Promise<ApiResponse<SyncProfileResponse>> {
    return apiService.post('/api/onboarding/sync-profile', {});
  },

  async getMissingFields(): Promise<ApiResponse<MissingFieldsResponse>> {
    return apiService.get<MissingFieldsResponse>('/api/onboarding/missing-fields');
  },

  async updateProfile(profileData: Partial<ProfileSnapshot>): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiService.patch('/api/onboarding/update-profile', profileData);
  },

  async completeOnboarding(): Promise<ApiResponse<CompleteOnboardingResponse>> {
    return apiService.post('/api/onboarding/complete', {});
  },
};
