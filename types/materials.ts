/**
 * Type definitions for Book Study Mode (Phase A)
 *
 * These interfaces define the data structures for materials, chapters,
 * and progress tracking in the Alexandria learning platform.
 */

/**
 * Material kind types
 */
export type MaterialKind = 'book' | 'study_guide' | 'paper';

/**
 * Material processing status
 */
export type MaterialStatus = 'uploading' | 'processing' | 'ready' | 'failed' | 'needs_verification';

/**
 * Material filter options
 */
export type MaterialFilterStatus = 'all' | 'in_progress' | 'completed';

/**
 * Main material interface
 */
export interface Material {
  id: string;
  user_id: string;
  title: string;
  author?: string;
  publisher?: string;
  published_date?: string;
  description?: string;
  category?: string;
  kind: MaterialKind;
  status: MaterialStatus;
  source_file_url: string;
  chapter_count: number;
  word_count: number;
  overall_progress: number; // 0.0 to 1.0
  created_at: string;
  updated_at: string;
  cover_image_url?: string;
  metadata?: MaterialMetadata;
}

/**
 * Material metadata (optional extended information)
 */
export interface MaterialMetadata {
  isbn?: string;
  publisher?: string;
  publication_date?: string;
  description?: string;
  tags?: string[];
  language?: string;
}

/**
 * Chapter interface
 */
export interface Chapter {
  id: string;
  material_id: string;
  index: number; // 1-indexed chapter number
  title: string;
  content_url: string; // S3 signed URL (1-hour expiry)
  word_count: number;
  created_at: string;
}

/**
 * Chapter progress interface
 */
export interface ChapterProgress {
  chapter_id: string;
  material_id: string;
  user_id: string;
  read_pct: number; // 0.0 to 1.0
  completed: boolean;
  last_position: number; // scroll position
  last_read_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Progress map keyed by chapter_id
 */
export interface ProgressMap {
  [chapterId: string]: ChapterProgress;
}

/**
 * Material list item (for library view)
 */
export interface MaterialListItem extends Material {
  current_chapter_index?: number;
  current_chapter_title?: string;
}

/**
 * Material detail (includes chapters)
 */
export interface MaterialDetail extends Material {
  chapters: Chapter[];
}

/**
 * Upload result from backend
 * Matches backend UploadResponse in book_study_routes.py
 */
export interface UploadResult {
  material_id: string; // Backend returns 'material_id' not 'id'
  job_id: string;
  status: string; // Backend returns status as string
}

/**
 * Progress update for batching
 */
export interface ProgressUpdate {
  material_id: string;
  chapter_id: string;
  read_pct: number;
  last_position: number;
  timestamp: number;
}

/**
 * Batch progress sync payload
 */
export interface ProgressSyncPayload {
  updates: ProgressUpdate[];
}

/**
 * Material filter parameters
 */
export interface MaterialFilterParams {
  kind?: MaterialKind;
  status?: MaterialFilterStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * API response for materials list
 * Matches backend MaterialListResponse in book_study_routes.py
 */
export interface MaterialsListResponse {
  materials: MaterialListItem[];
  total: number;
}

/**
 * API response for material detail
 */
export interface MaterialDetailResponse {
  material: MaterialDetail;
  progress: ProgressMap;
}

/**
 * API response for chapter content
 */
export interface ChapterContentResponse {
  chapter: Chapter;
  progress?: ChapterProgress;
}

/**
 * Upload type selector option
 */
export interface UploadTypeOption {
  id: MaterialKind;
  label: string;
  icon: string;
}

/**
 * Reader settings (persisted locally)
 */
export interface ReaderSettings {
  fontSize: number; // 14, 16, 18
  fontFamily?: string;
  lineHeight?: number;
  backgroundColor?: string;
  textColor?: string;
}

/**
 * Chapter action type
 */
export type ChapterAction = 'summary' | 'flashcards' | 'quiz' | 'audio';

/**
 * Material card props
 */
export interface MaterialCardProps {
  material: MaterialListItem;
  onPress: () => void;
}

/**
 * Tab option
 */
export interface TabOption {
  id: MaterialKind;
  label: string;
}

/**
 * Filter chip option
 */
export interface FilterChipOption {
  id: MaterialFilterStatus;
  label: string;
}
