/**
 * Smart Defaults API Type Definitions
 *
 * These types match the Smart Defaults API specification v1.0.
 * Used for automatic quiz configuration from file analysis.
 */

export interface SubjectMatch {
  name: string;
  value: string;
  confidence: number;
}

export interface ComplexityIndicators {
  vocabulary_level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  technical_density: number;
  readability_score: number;
}

export interface SmartDefaultsMetadata {
  content_length: number;
  word_count: number;
  analysis_time_ms: number;
  filename: string;
}

export interface SmartDefaults {
  subject: {
    name: string;
    value: string;
    confidence: number;
    alternatives: SubjectMatch[];
  };
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  question_types: Array<'multiple_choice' | 'true_false' | 'open_ended'>;
  num_questions: number;
  estimated_time_minutes: number;
  content_preview: string;
  complexity_indicators: ComplexityIndicators;
  metadata: SmartDefaultsMetadata;
  reasoning?: string; // Optional AI-generated reasoning for recommendations
}

export interface AnalysisResponse {
  success: boolean;
  defaults: SmartDefaults;
  message?: string;
}

export interface AnalysisError {
  detail: string;
  error_type?: 'file_size' | 'file_type' | 'content' | 'server' | 'network';
}
