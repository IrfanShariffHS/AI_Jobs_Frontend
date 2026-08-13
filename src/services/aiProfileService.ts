import { apiService, ApiResponse } from './api';

export type DataSource = 'resume' | 'naukri' | 'linkedin' | 'manual' | 'ai';

export interface ProfileField {
  value: any;
  source: DataSource;
  confidence: number;
  lastUpdated: string;
}

export interface ProfileData {
  fullName: ProfileField;
  email: ProfileField;
  mobile: ProfileField;
  dateOfBirth: ProfileField;
  currentCity: ProfileField;
  preferredLocation: ProfileField;
  currentCompany: ProfileField;
  currentDesignation: ProfileField;
  yearsOfExperience: ProfileField;
  currentCTC: ProfileField;
  expectedCTC: ProfileField;
  noticePeriod: ProfileField;
  preferredJobRole: ProfileField;
  employmentType: ProfileField;
  highestQualification: ProfileField;
  skills: ProfileField;
  summary: ProfileField;
  experience: ProfileField;
  education: ProfileField;
  certifications: ProfileField;
  projects: ProfileField;
}

export interface SourceData {
  source: DataSource;
  data: any;
  lastSynced: string;
  available: boolean;
  error?: string;
}

export interface AIProfileSuggestion {
  field: string;
  currentValue: any;
  suggestedValue: any;
  reason: string;
  confidence: number;
  category: 'enhancement' | 'correction' | 'completion' | 'formatting';
}

export interface ProfileDiff {
  field: string;
  oldValue: any;
  newValue: any;
  source: DataSource;
}

export interface ProfileSyncResult {
  success: boolean;
  mergedData: ProfileData;
  sources: SourceData[];
  diffs: ProfileDiff[];
  suggestions: AIProfileSuggestion[];
  overallConfidence: number;
}

export const aiProfileService = {
  /**
   * Retrieve profile data from all available sources
   */
  async retrieveAllSources(): Promise<ApiResponse<SourceData[]>> {
    return apiService.get<SourceData[]>('/api/profile/sources');
  },

  /**
   * Merge and normalize data from multiple sources
   */
  async mergeProfileData(): Promise<ApiResponse<ProfileSyncResult>> {
    return apiService.post<ProfileSyncResult>('/api/profile/merge', {});
  },

  /**
   * Get AI-powered profile suggestions
   */
  async getProfileSuggestions(profileData: any): Promise<ApiResponse<AIProfileSuggestion[]>> {
    return apiService.post<AIProfileSuggestion[]>('/api/profile/suggestions', profileData);
  },

  /**
   * Validate a profile field using AI
   */
  async validateField(field: string, value: any): Promise<ApiResponse<{
    valid: boolean;
    issues: string[];
    suggestions: string[];
    confidence: number;
  }>> {
    return apiService.post<{
      valid: boolean;
      issues: string[];
      suggestions: string[];
      confidence: number;
    }>('/api/profile/validate', { field, value });
  },

  /**
   * Sync profile with new resume data
   */
  async syncWithResume(resumeId: number): Promise<ApiResponse<{
    diffs: ProfileDiff[];
    suggestions: AIProfileSuggestion[];
    requiresConfirmation: boolean;
  }>> {
    return apiService.post<{
      diffs: ProfileDiff[];
      suggestions: AIProfileSuggestion[];
      requiresConfirmation: boolean;
    }>('/api/profile/sync-resume', { resumeId });
  },

  /**
   * Apply AI suggestions to profile
   */
  async applySuggestions(suggestions: AIProfileSuggestion[]): Promise<ApiResponse<{ success: boolean }>> {
    return apiService.post<{ success: boolean }>('/api/profile/apply-suggestions', { suggestions });
  },

  /**
   * Auto-save profile with source tracking
   */
  async autoSaveProfile(profileData: Partial<ProfileData>): Promise<ApiResponse<{ success: boolean; version: number }>> {
    return apiService.put<{ success: boolean; version: number }>('/api/profile/auto-save', profileData);
  },

  /**
   * Get profile version history
   */
  async getVersionHistory(): Promise<ApiResponse<{
    versions: Array<{
      version: number;
      timestamp: string;
      changedFields: string[];
      source: DataSource;
    }>;
  }>> {
    return apiService.get<{
      versions: Array<{
        version: number;
        timestamp: string;
        changedFields: string[];
        source: DataSource;
      }>;
    }>('/api/profile/history');
  },

  /**
   * Get profile completeness score
   */
  async getCompletenessScore(): Promise<ApiResponse<{
    overall: number;
    sections: {
      personal: number;
      professional: number;
      skills: number;
      experience: number;
      education: number;
    };
    missingFields: string[];
  }>> {
    return apiService.get<{
      overall: number;
      sections: {
        personal: number;
        professional: number;
        skills: number;
        experience: number;
        education: number;
      };
      missingFields: string[];
    }>('/api/profile/completeness');
  }
};
