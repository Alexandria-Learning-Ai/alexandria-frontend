/**
 * useSubjectClassification Hook
 * Handles subject/category classification for quizzes
 */

import { useCallback } from 'react';
import logger from '../utils/logger';
import AISubjectClassificationService from '../services/AISubjectClassificationService';
import HierarchicalSubjectService from '../services/HierarchicalSubjectService';

interface QuizMetadata {
  subject?: string;
  topic?: string;
  category?: string;
  difficulty?: string;
  [key: string]: any;
}

interface Question {
  id?: string;
  text?: string;
  questionText?: string;
  type?: string;
  options?: any[];
  [key: string]: any;
}

interface HierarchicalResult {
  subject: string;
  course: string;
  topic: string;
  confidence: number;
  displayText: string;
}

export const useSubjectClassification = () => {
  /**
   * Hierarchical subject classification with Course-level detection
   */
  const determineCategoryHierarchical = useCallback(
    async (
      metadataParam: QuizMetadata,
      keywords: string[],
      questionsParam: Question[]
    ): Promise<HierarchicalResult> => {
      try {
        logger.info('🎯 Using hierarchical subject classification...');

        // Use the new hierarchical service
        const hierarchy = HierarchicalSubjectService.classifyHierarchical(
          questionsParam,
          metadataParam
        );

        // Return the primary subject for backward compatibility, but also store hierarchy
        return {
          subject: hierarchy.subject,
          course: hierarchy.course,
          topic: hierarchy.topic,
          confidence: hierarchy.confidence,
          displayText: hierarchy.course
            ? `${hierarchy.subject} - ${hierarchy.course}`
            : hierarchy.subject,
        };
      } catch (error) {
        logger.error('Error in hierarchical classification, using fallback:', error);
        const fallbackSubject = await determineCategory(metadataParam, keywords, questionsParam);
        return {
          subject: fallbackSubject,
          course: '',
          topic: '',
          confidence: 0.5,
          displayText: fallbackSubject,
        };
      }
    },
    []
  );

  /**
   * Intelligent subject classification with AI primary + keyword fallback
   */
  const determineCategory = useCallback(
    async (metadataParam: QuizMetadata, keywords: string[], questionsParam: Question[]): Promise<string> => {
      try {
        // 1. INSTANT: Check metadata fields first (90% of cases)
        if (
          metadataParam?.subject &&
          metadataParam.subject !== 'general' &&
          metadataParam.subject !== 'General Knowledge'
        ) {
          logger.info(`📊 Using metadata subject: ${metadataParam.subject}`);
          return metadataParam.subject;
        }
        if (
          metadataParam?.topic &&
          metadataParam.topic !== 'general' &&
          metadataParam.topic !== 'General Knowledge'
        ) {
          logger.info(`📊 Using metadata topic: ${metadataParam.topic}`);
          return metadataParam.topic;
        }
        if (
          metadataParam?.category &&
          metadataParam.category !== 'general' &&
          metadataParam.category !== 'General Knowledge'
        ) {
          logger.info(`📊 Using metadata category: ${metadataParam.category}`);
          return metadataParam.category;
        }

        // 2. SMART: Use AI classification for unclear/custom content
        if (Array.isArray(questionsParam) && questionsParam.length >= 2) {
          logger.info('🤖 Using AI classification as primary method...');
          try {
            const aiSubject = await AISubjectClassificationService.classifyQuizSubject(
              questionsParam,
              metadataParam
            );
            if (aiSubject && aiSubject !== 'General Knowledge') {
              logger.info(`✅ AI classified subject as: ${aiSubject}`);
              return aiSubject;
            }
          } catch (error) {
            logger.warn('❌ AI classification failed, falling back to keyword analysis:', error);
          }
        }

        // Enhanced keyword mapping
        const categoryMap: Record<string, string[]> = {
          Mathematics: [
            'math', 'mathematics', 'algebra', 'calculus', 'geometry', 'arithmetic', 'equation',
            'trigonometry', 'statistics', 'probability', 'derivative', 'integral', 'polynomial',
            'logarithm', 'exponential', 'matrix', 'vector', 'limit', 'function', 'theorem',
            'proof', 'sine', 'cosine', 'tangent', 'hyperbola', 'parabola', 'circle', 'triangle',
            'square', 'rectangle', 'area', 'perimeter', 'volume', 'angle', 'degree', 'radian',
          ],
          Science: [
            'physics', 'chemistry', 'biology', 'anatomy', 'molecule', 'cell', 'atom', 'electron',
            'proton', 'neutron', 'nuclear', 'quantum', 'gravity', 'force', 'energy', 'momentum',
            'acceleration', 'velocity', 'mass', 'density', 'pressure', 'temperature', 'heat',
            'light', 'wave', 'frequency', 'amplitude', 'magnetic', 'electric', 'current', 'voltage',
            'organism', 'ecosystem', 'evolution', 'genetics', 'dna', 'rna', 'protein', 'enzyme',
            'photosynthesis', 'respiration', 'mitosis', 'meiosis', 'bacteria', 'virus',
          ],
          History: [
            'history', 'historical', 'ancient', 'medieval', 'renaissance', 'revolution', 'war',
            'civilization', 'empire', 'dynasty', 'monarch', 'democracy', 'republic', 'treaty',
            'battle', 'conquest', 'independence', 'colonial', 'industrial', 'world war',
            'civil war', 'constitution', 'amendment', 'president', 'congress', 'parliament',
          ],
          Literature: [
            'literature', 'novel', 'poem', 'poetry', 'author', 'character', 'plot', 'theme',
            'metaphor', 'symbolism', 'allegory', 'narrative', 'prose', 'verse', 'rhyme',
            'meter', 'stanza', 'sonnet', 'haiku', 'drama', 'tragedy', 'comedy', 'shakespeare',
            'dickens', 'twain', 'hemingway', 'fitzgerald', 'orwell', 'austen',
          ],
          English: [
            'english', 'grammar', 'vocabulary', 'syntax', 'language', 'word', 'sentence',
            'paragraph', 'essay', 'writing', 'reading', 'comprehension', 'verb', 'noun',
            'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'clause',
            'phrase', 'subject', 'predicate', 'tense', 'passive', 'active',
          ],
          Geography: [
            'geography', 'country', 'capital', 'continent', 'ocean', 'mountain', 'river',
            'climate', 'weather', 'precipitation', 'latitude', 'longitude', 'equator',
            'hemisphere', 'timezone', 'population', 'urban', 'rural', 'city', 'state',
            'province', 'territory', 'border', 'coastline', 'island', 'peninsula',
          ],
          Computer_Science: [
            'programming', 'code', 'coding', 'function', 'variable', 'algorithm', 'software',
            'hardware', 'computer', 'database', 'sql', 'python', 'java', 'javascript',
            'html', 'css', 'array', 'loop', 'conditional', 'class', 'object', 'inheritance',
            'recursion', 'sorting', 'searching', 'data structure', 'binary', 'network',
          ],
          Business: [
            'business', 'marketing', 'finance', 'accounting', 'economics', 'management',
            'entrepreneurship', 'strategy', 'profit', 'revenue', 'budget', 'investment',
            'stock', 'market', 'supply', 'demand', 'inflation', 'gdp', 'recession',
            'corporation', 'partnership', 'liability', 'asset', 'equity', 'debt',
          ],
          Art: [
            'art', 'painting', 'sculpture', 'drawing', 'design', 'color', 'composition',
            'perspective', 'renaissance', 'baroque', 'impressionism', 'modern', 'abstract',
            'picasso', 'monet', 'da vinci', 'michelangelo', 'museum', 'gallery',
          ],
          Music: [
            'music', 'musical', 'song', 'melody', 'rhythm', 'harmony', 'chord', 'scale',
            'note', 'instrument', 'piano', 'guitar', 'violin', 'drums', 'orchestra',
            'band', 'composer', 'musician', 'genre', 'classical', 'jazz', 'rock', 'pop',
          ],
        };

        // 3. RELIABLE BACKUP: Enhanced keyword analysis when AI isn't available
        logger.info('🔄 Using enhanced keyword analysis as backup...');

        // Check provided keywords first
        if (Array.isArray(keywords)) {
          for (const [category, categoryKeywords] of Object.entries(categoryMap)) {
            const matches = keywords.filter((keyword) =>
              categoryKeywords.some((catKeyword) => keyword?.toLowerCase().includes(catKeyword))
            ).length;
            if (matches > 0) {
              logger.info(`📊 Subject detected via provided keywords: ${category}`);
              return category;
            }
          }
        }

        // Analyze question content comprehensively
        if (Array.isArray(questionsParam) && questionsParam.length > 0) {
          const allQuestionText = questionsParam
            .map((q) => `${q.text || q.questionText || ''} ${(q.options || []).join(' ')}`)
            .join(' ')
            .toLowerCase();

          // Score each category based on question content
          const categoryScores: Record<string, number> = {};
          for (const [category, categoryKeywords] of Object.entries(categoryMap)) {
            let score = 0;
            categoryKeywords.forEach((keyword) => {
              const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
              const matches = (allQuestionText.match(regex) || []).length;
              score += matches * (keyword.length > 4 ? 2 : 1); // Longer keywords get more weight
            });
            categoryScores[category] = score;
          }

          // Find the category with highest score
          const bestMatch = Object.entries(categoryScores).sort(([, a], [, b]) => b - a)[0];

          if (bestMatch && bestMatch[1] > 0) {
            logger.info(`📊 Subject detected via content analysis: ${bestMatch[0]} (score: ${bestMatch[1]})`);
            return bestMatch[0];
          }
        }

        // 4. FINAL FALLBACK: Simple type detection and default
        const mathTypes = questionsParam.filter((q) => q?.type === 'math').length;
        if (mathTypes > questionsParam.length * 0.5) {
          logger.info('📊 Subject detected via question types: Mathematics');
          return 'Mathematics';
        }

        logger.info('📊 No specific subject detected, using General Knowledge');
        return 'General Knowledge';
      } catch (error) {
        logger.error('Error determining category:', error);
        return 'General Knowledge';
      }
    },
    []
  );

  /**
   * Synchronous version for non-async contexts (uses cached/keyword only)
   */
  const determineCategorySync = useCallback(
    (metadataParam: QuizMetadata, keywords: string[], questionsParam: Question[]): string => {
      try {
        // Check metadata fields first
        if (
          metadataParam?.subject &&
          metadataParam.subject !== 'general' &&
          metadataParam.subject !== 'General Knowledge'
        ) {
          return metadataParam.subject;
        }
        if (
          metadataParam?.topic &&
          metadataParam.topic !== 'general' &&
          metadataParam.topic !== 'General Knowledge'
        ) {
          return metadataParam.topic;
        }
        if (
          metadataParam?.category &&
          metadataParam.category !== 'general' &&
          metadataParam.category !== 'General Knowledge'
        ) {
          return metadataParam.category;
        }

        // Use keyword analysis only (no AI for sync version)
        return AISubjectClassificationService.fallbackClassification(
          questionsParam || [],
          metadataParam || {}
        );
      } catch (error) {
        logger.error('Error in sync category determination:', error);
        return 'General Knowledge';
      }
    },
    []
  );

  return {
    determineCategoryHierarchical,
    determineCategory,
    determineCategorySync,
  };
};
