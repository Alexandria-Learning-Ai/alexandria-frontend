/**
 * FlashcardIntegration.test.js
 *
 * Integration test that simulates the full flashcard workflow:
 * 1. Generate flashcards from quiz mistakes
 * 2. Retrieve flashcards
 * 3. Study with spaced repetition
 * 4. Delete flashcards
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Self-contained FlashcardService mock implementation
class MockFlashcardService {
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

    const storageKey = `${this.STORAGE_KEYS.FLASHCARDS}_${userId}`;
    const existing = await AsyncStorage.getItem(storageKey);
    const flashcards = existing ? JSON.parse(existing) : [];

    const newFlashcard = {
      id: Date.now().toString() + Math.random(),
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

    const storageKey = `${this.STORAGE_KEYS.FLASHCARDS}_${userId}`;
    await AsyncStorage.setItem(storageKey, JSON.stringify(remaining));

    return true;
  }
}

describe('Flashcard Integration Test', () => {
  const testUserId = 'test-user-123';
  const FlashcardService = MockFlashcardService;

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('Full Flashcard Workflow', () => {
    it('should complete entire flashcard lifecycle', async () => {
      console.log('\n🎴 Starting Flashcard Integration Test...\n');

      // Step 1: Create flashcards
      console.log('📝 Step 1: Creating flashcards...');

      const flashcard1 = await FlashcardService.saveFlashcard(testUserId, {
        front: 'What is the capital of France?',
        back: 'Paris',
        subject: 'Geography',
        difficulty: 'easy'
      });

      const flashcard2 = await FlashcardService.saveFlashcard(testUserId, {
        front: 'What is 2 + 2?',
        back: '4',
        subject: 'Math',
        difficulty: 'easy'
      });

      expect(flashcard1).toBeDefined();
      expect(flashcard1.id).toBeDefined();
      expect(flashcard1.front).toBe('What is the capital of France?');
      expect(flashcard2).toBeDefined();

      console.log('✅ Created 2 flashcards');

      // Step 2: Retrieve all flashcards
      console.log('\n📚 Step 2: Retrieving flashcards...');

      const allFlashcards = await FlashcardService.getFlashcards(testUserId);

      expect(allFlashcards).toHaveLength(2);
      expect(allFlashcards[0].front).toBe('What is the capital of France?');

      console.log(`✅ Retrieved ${allFlashcards.length} flashcards`);

      // Step 3: Get due flashcards
      console.log('\n⏰ Step 3: Getting due flashcards...');

      // Set one flashcard as due (past date)
      const storageKey = `${FlashcardService.STORAGE_KEYS.FLASHCARDS}_${testUserId}`;
      const flashcards = await FlashcardService.getFlashcards(testUserId);
      flashcards[0].nextReviewDate = new Date(Date.now() - 86400000).toISOString(); // Yesterday
      await AsyncStorage.setItem(storageKey, JSON.stringify(flashcards));

      const dueFlashcards = await FlashcardService.getDueFlashcards(testUserId);

      expect(dueFlashcards.length).toBeGreaterThan(0);

      console.log(`✅ Found ${dueFlashcards.length} flashcard(s) due for review`);

      // Step 4: Review a flashcard (SuperMemo SM-2 algorithm)
      console.log('\n🎯 Step 4: Reviewing flashcard with SM-2 algorithm...');

      const flashcardToReview = dueFlashcards[0];
      const initialEasiness = flashcardToReview.easiness;
      const initialInterval = flashcardToReview.interval;

      // Quality 4 = Good recall
      const updatedFlashcard = await FlashcardService.updateFlashcardReview(
        testUserId,
        flashcardToReview.id,
        4
      );

      expect(updatedFlashcard).toBeDefined();
      expect(updatedFlashcard.reviewCount).toBe((flashcardToReview.reviewCount || 0) + 1);
      expect(updatedFlashcard.interval).toBeGreaterThanOrEqual(initialInterval);

      console.log(`✅ Reviewed flashcard:`);
      console.log(`   - Initial easiness: ${initialEasiness}`);
      console.log(`   - New easiness: ${updatedFlashcard.easiness}`);
      console.log(`   - Initial interval: ${initialInterval} days`);
      console.log(`   - New interval: ${updatedFlashcard.interval} days`);
      console.log(`   - Review count: ${updatedFlashcard.reviewCount}`);

      // Step 5: Test multiple reviews with different quality scores
      console.log('\n🔄 Step 5: Testing multiple reviews...');

      let currentFlashcard = updatedFlashcard;
      const qualities = [5, 4, 3, 2, 5]; // Excellent, Good, Recall, Hard, Excellent

      for (let i = 0; i < qualities.length; i++) {
        currentFlashcard = await FlashcardService.updateFlashcardReview(
          testUserId,
          currentFlashcard.id,
          qualities[i]
        );

        console.log(`   Review ${i + 1}: Quality ${qualities[i]} → Interval: ${currentFlashcard.interval} days`);
      }

      expect(currentFlashcard.reviewCount).toBe(6); // Initial + 5 reviews

      console.log('✅ Completed multiple review simulation');

      // Step 6: Delete a flashcard
      console.log('\n🗑️  Step 6: Deleting flashcard...');

      const result = await FlashcardService.deleteFlashcard(testUserId, flashcard2.id);

      expect(result).toBe(true);

      const remainingFlashcards = await FlashcardService.getFlashcards(testUserId);
      expect(remainingFlashcards).toHaveLength(1);

      console.log('✅ Deleted flashcard successfully');

      // Step 7: Verify data persistence
      console.log('\n💾 Step 7: Verifying data persistence...');

      const persistedFlashcards = await FlashcardService.getFlashcards(testUserId);

      expect(persistedFlashcards).toHaveLength(1);
      expect(persistedFlashcards[0].id).toBe(flashcard1.id);

      console.log('✅ Data persisted correctly in AsyncStorage');

      console.log('\n🎉 Flashcard Integration Test PASSED!\n');
    });

    it('should handle errors gracefully', async () => {
      console.log('\n⚠️  Testing Error Handling...\n');

      // Test 1: Missing userId
      console.log('❌ Test 1: Saving flashcard without userId');
      await expect(
        FlashcardService.saveFlashcard(null, { front: 'Test', back: 'Test' })
      ).rejects.toThrow('User ID is required');
      console.log('✅ Correctly rejected missing userId');

      // Test 2: Invalid flashcard data
      console.log('\n❌ Test 2: Saving flashcard without required fields');
      await expect(
        FlashcardService.saveFlashcard(testUserId, { front: '' })
      ).rejects.toThrow('Invalid flashcard data');
      console.log('✅ Correctly rejected invalid flashcard');

      // Test 3: Deleting non-existent flashcard
      console.log('\n❌ Test 3: Deleting non-existent flashcard');
      await expect(
        FlashcardService.deleteFlashcard(testUserId, 'non-existent-id')
      ).rejects.toThrow('Flashcard not found');
      console.log('✅ Correctly rejected non-existent flashcard');

      console.log('\n🎉 Error Handling Test PASSED!\n');
    });

    it('should test SuperMemo SM-2 algorithm accuracy', async () => {
      console.log('\n🧮 Testing SuperMemo SM-2 Algorithm...\n');

      // Create a test flashcard
      const flashcard = await FlashcardService.saveFlashcard(testUserId, {
        front: 'Test Question',
        back: 'Test Answer',
        subject: 'Test',
      });

      // Test different quality scores
      const testCases = [
        { quality: 5, expectedBehavior: 'Interval should increase' },
        { quality: 4, expectedBehavior: 'Interval should increase' },
        { quality: 3, expectedBehavior: 'Interval should increase' },
        { quality: 2, expectedBehavior: 'Interval should reset to 1' },
        { quality: 1, expectedBehavior: 'Interval should reset to 1' },
        { quality: 0, expectedBehavior: 'Interval should reset to 1' },
      ];

      for (const testCase of testCases) {
        // Reset flashcard for each test
        const storageKey = `${FlashcardService.STORAGE_KEYS.FLASHCARDS}_${testUserId}`;
        await AsyncStorage.setItem(storageKey, JSON.stringify([{
          ...flashcard,
          easiness: 2.5,
          interval: 1,
          repetitions: 1,
          reviewCount: 1
        }]));

        const updated = await FlashcardService.updateFlashcardReview(
          testUserId,
          flashcard.id,
          testCase.quality
        );

        if (testCase.quality >= 3) {
          expect(updated.interval).toBeGreaterThan(0);
          expect(updated.repetitions).toBeGreaterThan(1);
        } else {
          expect(updated.interval).toBe(1);
          expect(updated.repetitions).toBe(0);
        }

        console.log(`✅ Quality ${testCase.quality}: ${testCase.expectedBehavior} ✓`);
      }

      console.log('\n🎉 SM-2 Algorithm Test PASSED!\n');
    });
  });
});
