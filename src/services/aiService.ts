import { apiService, ApiResponse } from './api';

export interface AISuggestions {
  suggestions: string[];
  improvements: string[];
  missingSkills: string[];
  recommendedAdditions: string[];
}

export interface ProfileAnalysis {
  profileSuggestions: AISuggestions;
  linkedinSuggestions: AISuggestions;
  resumeSuggestions: AISuggestions;
  generatedAt: string;
}

export const aiService = {
  async generateProfileSuggestions(resumeText: string): Promise<ApiResponse<AISuggestions>> {
    return apiService.post<AISuggestions>('/api/ai-profile/generate-suggestions', { resumeText });
  },

  async generateLinkedInSuggestions(resumeText: string): Promise<ApiResponse<AISuggestions>> {
    return apiService.post<AISuggestions>('/api/ai-profile/generate-linkedin-suggestions', { resumeText });
  },

  async generateResumeSuggestions(resumeText: string): Promise<ApiResponse<AISuggestions>> {
    return apiService.post<AISuggestions>('/api/ai-profile/generate-resume-suggestions', { resumeText });
  },

  async approveAndApplySuggestions(approvedChanges: Record<string, string>): Promise<ApiResponse<any>> {
    return apiService.post<any>('/api/ai-profile/approve-suggestions', approvedChanges);
  },

  async analyzeProfile(resumeText: string): Promise<ApiResponse<ProfileAnalysis>> {
    return apiService.post<ProfileAnalysis>('/api/ai-profile/analyze-profile', { resumeText });
  }
};
