/**
 * useChapter - Fetches chapter metadata + content (single unified endpoint)
 *
 * ✅ Improvements:
 * - Uses `/api/chapters/{chapter_id}/content` (no expired S3 URLs)
 * - Adds prefetch support (for next chapter)
 * - Better Axios error differentiation
 * - Smarter retry logic (up to 3 attempts for transient issues)
 * - Unified logger formatting
 * - Safe staleTime/gcTime for smooth navigation
 */

import { useQuery, UseQueryResult, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import logger from '../utils/logger';
import { Chapter, ChapterContentType } from '../types/materials';

export interface ChapterData {
  chapter: Chapter;
  content: string;
  epub_styles?: string | null;
}

/**
 * Hook to fetch a chapter (metadata + content)
 */
export const useChapter = (chapterId: string): UseQueryResult<ChapterData, Error> => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['chapter', chapterId],
    enabled: !!chapterId && !!auth.currentUser,
    staleTime: 1000 * 60 * 30, // 30 mins
    gcTime: 1000 * 60 * 60, // 1 hour

    queryFn: async (): Promise<ChapterData> => {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      try {
        logger.info('📖 Fetching chapter (metadata + content)', { chapterId });

        const response = await axios.get(`${API_BASE_URL}/api/chapters/${chapterId}/content`, {
          headers: {
            'X-User-ID': user.uid,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        });

        const data = response.data;

        if (!data?.chapter || !data?.content) {
          throw new Error('Invalid chapter response structure');
        }

        const chapter: Chapter = {
          id: data.chapter.id,
          material_id: data.chapter.material_id,
          index: data.chapter.index,
          title: data.chapter.title,
          word_count: data.chapter.word_count,
          content_url: data.chapter.content_url || '',
          content_type: (data.content_type as ChapterContentType) || 'text',
          created_at: data.chapter.created_at || new Date().toISOString(),
        };

        logger.success('✅ Chapter loaded successfully', {
          title: chapter.title,
          type: chapter.content_type,
          contentTypeFromAPI: data.content_type,
          hasEpubStyles: !!data.epub_styles,
        });

        return {
          chapter,
          content: data.content,
          epub_styles: data.epub_styles || null,
        };
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;

          if (status === 404) {
            throw new Error('Chapter not found.');
          }
          if (status === 403) {
            throw new Error('Access denied or content link expired.');
          }
          if (error.code === 'ECONNABORTED') {
            throw new Error('Request timeout. Chapter may be large or slow.');
          }
        }

        if (!navigator.onLine) {
          throw new Error('No internet connection.');
        }

        logger.error('❌ Failed to fetch chapter', { chapterId, error });
        throw error;
      }
    },

    retry: (failureCount, error) => {
      if (error.message?.includes('temporarily') || error.message?.includes('timeout')) {
        return failureCount < 3;
      }
      return failureCount < 1;
    },

    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
  });
};

/**
 * Prefetch helper for upcoming chapters
 * (used after completing a chapter to speed up navigation)
 */
export const prefetchChapter = async (chapterId: string) => {
  const user = auth.currentUser;
  if (!user || !chapterId) return;

  const queryClient = useQueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: ['chapter', chapterId],
      queryFn: async (): Promise<ChapterData> => {
        const response = await axios.get(`${API_BASE_URL}/api/chapters/${chapterId}/content`, {
          headers: {
            'X-User-ID': user.uid,
            'Content-Type': 'application/json',
          },
        });

        const data = response.data;
        if (!data?.chapter || !data?.content) {
          throw new Error('Invalid chapter response format during prefetch.');
        }

        const chapter: Chapter = {
          id: data.chapter.id,
          material_id: data.chapter.material_id,
          index: data.chapter.index,
          title: data.chapter.title,
          word_count: data.chapter.word_count,
          content_url: data.chapter.content_url || '',
          content_type: (data.content_type as ChapterContentType) || 'text',
          created_at: data.chapter.created_at || new Date().toISOString(),
        };

        return {
          chapter,
          content: data.content,
          epub_styles: data.epub_styles || null,
        };
      },
    });

    logger.info('⚡ Prefetched next chapter successfully', { chapterId });
  } catch (e) {
    logger.warn('Prefetch failed (non-critical)', { chapterId, error: e });
  }
};
