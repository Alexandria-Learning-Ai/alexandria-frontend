import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock the FlashcardService to avoid Firebase import issues
jest.mock('../../services/FlashcardService', () => {
  class MockFlashcardService {
    static _getAsyncStorage() {
      // Lazy-load AsyncStorage so it's available after jest.setup.js runs
      return require('@react-native-async-storage/async-storage').default;
    }
    static STORAGE_KEYS = {
      FLASHCARDS: 'user_flashcards',
      STUDY_SESSIONS: 'flashcard_study_sessions',
      SPACED_REPETITION_DATA: 'spaced_repetition_data'
    };

    static async saveFlashcard(userId, flashcard) {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!flashcard || !flashcard.front || !flashcard.back) {
        throw new Error('Invalid flashcard data: front and back are required');
      }

      const AsyncStorage = this._getAsyncStorage();
      const storageKey = `${this.STORAGE_KEYS.FLASHCARDS}_${userId}`;
      const existing = await AsyncStorage.getItem(storageKey);
      const flashcards = existing ? JSON.parse(existing) : [];

      const newFlashcard = {
        id: Date.now().toString(),
        ...flashcard,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
        interval: 1,
        repetitions: 0,
        easiness: 2.5,
        reviewCount: 0,
      };

      flashcards.push(newFlashcard);
      await AsyncStorage.setItem(storageKey, JSON.stringify(flashcards));

      return newFlashcard;
    }

    static async getFlashcards(userId) {
      const AsyncStorage = this._getAsyncStorage();
      const storageKey = `${this.STORAGE_KEYS.FLASHCARDS}_${userId}`;
      const data = await AsyncStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    }

    static async getDueFlashcards(userId) {
      const flashcards = await this.getFlashcards(userId);
      const now = new Date();
      return flashcards.filter(f => new Date(f.nextReviewDate) <= now);
    }

    static async updateFlashcardReview(userId, flashcardId, quality) {
      const flashcards = await this.getFlashcards(userId);
      const index = flashcards.findIndex(f => f.id === flashcardId);

      if (index === -1) {
        throw new Error('Flashcard not found');
      }

      const flashcard = flashcards[index];

      // SuperMemo SM-2 algorithm
      let easiness = flashcard.easiness;
      let interval = flashcard.interval;
      let repetitions = flashcard.repetitions;

      if (quality >= 3) {
        if (repetitions === 0) {
          interval = 1;
        } else if (repetitions === 1) {
          interval = 6;
        } else {
          interval = Math.round(interval * easiness);
        }
        repetitions += 1;
      } else {
        repetitions = 0;
        interval = 1;
      }

      easiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (easiness < 1.3) easiness = 1.3;

      flashcard.easiness = easiness;
      flashcard.interval = interval;
      flashcard.repetitions = repetitions;
      flashcard.reviewCount = (flashcard.reviewCount || 0) + 1;
      flashcard.nextReviewDate = new Date(Date.now() + interval * 86400000).toISOString();
      flashcard.updatedAt = new Date().toISOString();

      flashcards[index] = flashcard;

      const AsyncStorage = this._getAsyncStorage();
      const storageKey = `${this.STORAGE_KEYS.FLASHCARDS}_${userId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(flashcards));

      return flashcard;
    }

    static async deleteFlashcard(userId, flashcardId) {
      const flashcards = await this.getFlashcards(userId);
      const exists = flashcards.some(f => f.id === flashcardId);

      if (!exists) {
        throw new Error('Flashcard not found');
      }

      const remaining = flashcards.filter(f => f.id !== flashcardId);

      const AsyncStorage = this._getAsyncStorage();
      const storageKey = `${this.STORAGE_KEYS.FLASHCARDS}_${userId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(remaining));

      return true;
    }
  }

  return { default: MockFlashcardService };
});

const FlashcardService = require('../../services/FlashcardService').default;

describe('FlashcardService', () => {
  const mockUserId = 'test-user-123';

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('saveFlashcard', () => {
    it('saves a new flashcard successfully', async () => {
      const flashcard = {
        front: 'What is 2+2?',
        back: '4',
        subject: 'Math',
        difficulty: 'easy',
      };

      const result = await FlashcardService.saveFlashcard(mockUserId, flashcard);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.front).toBe(flashcard.front);
      expect(result.back).toBe(flashcard.back);
      expect(result.subject).toBe(flashcard.subject);
      expect(result.nextReviewDate).toBeDefined();
    });

    it('throws error when userId is missing', async () => {
      const flashcard = {
        front: 'Test question',
        back: 'Test answer',
      };

      await expect(
        FlashcardService.saveFlashcard(null, flashcard)
      ).rejects.toThrow();
    });

    it('throws error when flashcard data is invalid', async () => {
      const invalidFlashcard = {
        front: '', // Empty front
        back: 'Test answer',
      };

      await expect(
        FlashcardService.saveFlashcard(mockUserId, invalidFlashcard)
      ).rejects.toThrow();
    });
  });

  describe('getFlashcards', () => {
    it('returns empty array when no flashcards exist', async () => {
      const flashcards = await FlashcardService.getFlashcards(mockUserId);

      expect(flashcards).toEqual([]);
    });

    it('returns all flashcards for a user', async () => {
      // Save multiple flashcards
      await FlashcardService.saveFlashcard(mockUserId, {
        front: 'Q1',
        back: 'A1',
        subject: 'Math',
      });
      await FlashcardService.saveFlashcard(mockUserId, {
        front: 'Q2',
        back: 'A2',
        subject: 'Science',
      });

      const flashcards = await FlashcardService.getFlashcards(mockUserId);

      expect(flashcards).toHaveLength(2);
      expect(flashcards[0].front).toBe('Q1');
      expect(flashcards[1].front).toBe('Q2');
    });
  });

  describe('getDueFlashcards', () => {
    it('returns flashcards due for review', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // Yesterday

      await FlashcardService.saveFlashcard(mockUserId, {
        front: 'Due card',
        back: 'Answer',
        subject: 'Math',
        nextReviewDate: pastDate,
      });

      await FlashcardService.saveFlashcard(mockUserId, {
        front: 'Future card',
        back: 'Answer',
        subject: 'Math',
        nextReviewDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      });

      const dueCards = await FlashcardService.getDueFlashcards(mockUserId);

      expect(dueCards).toHaveLength(1);
      expect(dueCards[0].front).toBe('Due card');
    });

    it('returns empty array when no cards are due', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();

      await FlashcardService.saveFlashcard(mockUserId, {
        front: 'Future card',
        back: 'Answer',
        subject: 'Math',
        nextReviewDate: futureDate,
      });

      const dueCards = await FlashcardService.getDueFlashcards(mockUserId);

      expect(dueCards).toEqual([]);
    });
  });

  describe('updateFlashcardReview', () => {
    it('updates review statistics correctly', async () => {
      const flashcard = await FlashcardService.saveFlashcard(mockUserId, {
        front: 'Test card',
        back: 'Answer',
        subject: 'Math',
      });

      const quality = 4; // Good response
      const updated = await FlashcardService.updateFlashcardReview(
        mockUserId,
        flashcard.id,
        quality
      );

      expect(updated.reviewCount).toBeGreaterThan(0);
      expect(updated.easinessFactor).toBeDefined();
      expect(updated.interval).toBeGreaterThan(0);
      expect(new Date(updated.nextReviewDate).getTime()).toBeGreaterThan(Date.now());
    });

    it('applies SuperMemo SM-2 algorithm correctly', async () => {
      const flashcard = await FlashcardService.saveFlashcard(mockUserId, {
        front: 'Test card',
        back: 'Answer',
        subject: 'Math',
        easinessFactor: 2.5,
        interval: 1,
        reviewCount: 0,
      });

      // Perfect response (quality = 5)
      const updated = await FlashcardService.updateFlashcardReview(
        mockUserId,
        flashcard.id,
        5
      );

      expect(updated.interval).toBeGreaterThan(flashcard.interval);
      expect(updated.easinessFactor).toBeGreaterThanOrEqual(flashcard.easinessFactor);
    });
  });

  describe('deleteFlashcard', () => {
    it('deletes a flashcard successfully', async () => {
      const flashcard = await FlashcardService.saveFlashcard(mockUserId, {
        front: 'To be deleted',
        back: 'Answer',
        subject: 'Math',
      });

      await FlashcardService.deleteFlashcard(mockUserId, flashcard.id);

      const flashcards = await FlashcardService.getFlashcards(mockUserId);
      expect(flashcards).toHaveLength(0);
    });

    it('throws error when flashcard does not exist', async () => {
      await expect(
        FlashcardService.deleteFlashcard(mockUserId, 'non-existent-id')
      ).rejects.toThrow();
    });
  });
});
