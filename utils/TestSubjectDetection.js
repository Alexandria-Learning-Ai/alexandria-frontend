/**
 * Test Utility for Subject Detection System
 * Use this to verify that the comprehensive subject detection works correctly
 */

import { SubjectDetector } from './SubjectDetector';
import logger from '../utils/logger';


export class TestSubjectDetection {
  
  static TEST_QUESTIONS = [
    // Computer Science
    {
      question: "Human-Computer Interaction (HCI) primarily focuses on the tasks to be completed rather than the needs of users.",
      expectedSubject: "Computer Science",
      description: "HCI Question"
    },
    {
      question: "What is the time complexity of a binary search algorithm?",
      expectedSubject: "Computer Science", 
      description: "Algorithm Question"
    },
    {
      question: "In object-oriented programming, what is inheritance?",
      expectedSubject: "Computer Science",
      description: "Programming Concept"
    },

    // Mathematics
    {
      question: "What is the derivative of x^2 + 3x + 1?",
      expectedSubject: "Mathematics",
      description: "Calculus Question"
    },
    {
      question: "Solve the quadratic equation 2x^2 - 5x + 3 = 0",
      expectedSubject: "Mathematics",
      description: "Algebra Question"
    },
    {
      question: "Find the area of a circle with radius 5 units",
      expectedSubject: "Mathematics", 
      description: "Geometry Question"
    },

    // Physics
    {
      question: "What is Newton's second law of motion?",
      expectedSubject: "Physics",
      description: "Physics Law"
    },
    {
      question: "Calculate the kinetic energy of a 5kg object moving at 10 m/s",
      expectedSubject: "Physics",
      description: "Energy Calculation"
    },

    // Biology
    {
      question: "What is the process by which plants convert sunlight into energy?",
      expectedSubject: "Biology",
      description: "Photosynthesis"
    },
    {
      question: "Describe the structure and function of mitochondria",
      expectedSubject: "Biology",
      description: "Cell Biology"
    },

    // Chemistry
    {
      question: "What happens when an acid reacts with a base?",
      expectedSubject: "Chemistry",
      description: "Chemical Reaction"
    },
    {
      question: "How many electrons can the second shell of an atom hold?",
      expectedSubject: "Chemistry",
      description: "Atomic Structure"
    },

    // History  
    {
      question: "Which battle marked the end of Napoleon's rule in Europe?",
      expectedSubject: "History",
      description: "European History"
    },
    {
      question: "What were the main causes of World War I?",
      expectedSubject: "History",
      description: "World History"
    },

    // English Literature
    {
      question: "What literary device does Shakespeare use in 'To be or not to be'?",
      expectedSubject: "English Literature",
      description: "Literary Analysis"
    },
    {
      question: "Identify the metaphor in this poem excerpt",
      expectedSubject: "English Literature", 
      description: "Poetry Analysis"
    },

    // Psychology
    {
      question: "What is classical conditioning in behavioral psychology?",
      expectedSubject: "Psychology",
      description: "Learning Theory"
    },
    {
      question: "Describe the stages of cognitive development according to Piaget",
      expectedSubject: "Psychology",
      description: "Developmental Psychology"
    },

    // Economics
    {
      question: "What happens to price when supply increases and demand stays constant?",
      expectedSubject: "Economics",
      description: "Supply and Demand"
    },
    {
      question: "Define GDP and explain its importance in measuring economic health",
      expectedSubject: "Economics",
      description: "Economic Indicators"
    },

    // Geography
    {
      question: "What is the difference between weather and climate?",
      expectedSubject: "Geography",
      description: "Physical Geography"
    },
    {
      question: "Name the capital cities of the following European countries",
      expectedSubject: "Geography",
      description: "Political Geography"
    },

    // Art History
    {
      question: "What characterized the Renaissance art movement?",
      expectedSubject: "Art History",
      description: "Art Movement"
    },

    // Medicine
    {
      question: "What are the symptoms of Type 2 diabetes?", 
      expectedSubject: "Medicine",
      description: "Medical Diagnosis"
    },

    // Edge Cases
    {
      question: "What is the best way to study for exams?",
      expectedSubject: "General Knowledge",
      description: "General Study Advice"
    },
    {
      question: "How do you make a peanut butter sandwich?",
      expectedSubject: "General Knowledge", 
      description: "Practical Question"
    }
  ];

  /**
   * Run comprehensive test suite
   */
  static runTests() {
    logger.info('🧪 Starting Comprehensive Subject Detection Tests');
    logger.info('='.repeat(60));
    
    const results = {
      total: 0,
      correct: 0,
      incorrect: 0,
      details: []
    };

    this.TEST_QUESTIONS.forEach((test, index) => {
      const detection = SubjectDetector.detectSubject(test.question);
      const isCorrect = detection.subject === test.expectedSubject;
      
      results.total++;
      if (isCorrect) {
        results.correct++;
      } else {
        results.incorrect++;
      }

      const result = {
        index: index + 1,
        description: test.description,
        question: test.question.substring(0, 80) + '...',
        expected: test.expectedSubject,
        detected: detection.subject,
        confidence: Math.round(detection.confidence * 100),
        correct: isCorrect,
        alternatives: detection.alternatives
      };

      results.details.push(result);

      // Log result
      const status = isCorrect ? '✅' : '❌';
      logger.info(`${status} Test ${index + 1}: ${test.description}`);
      logger.info(`   Expected: ${test.expectedSubject}`);
      logger.info(`   Detected: ${detection.subject} (${result.confidence}% confidence)`);
      if (!isCorrect && detection.alternatives.length > 0) {
        logger.info(`   Alternatives: ${detection.alternatives.map(alt => `${alt.subject} (${Math.round(alt.confidence * 100)}%)`).join(', ')}`);
      }
      logger.info('');
    });

    // Summary
    logger.info('='.repeat(60));
    logger.info('📊 TEST RESULTS SUMMARY');
    logger.info(`Total Tests: ${results.total}`);
    logger.info(`Correct: ${results.correct} (${Math.round(results.correct/results.total * 100)}%)`);
    logger.info(`Incorrect: ${results.incorrect} (${Math.round(results.incorrect/results.total * 100)}%)`);
    logger.info('='.repeat(60));

    // Failed tests details
    if (results.incorrect > 0) {
      logger.info('\n❌ FAILED TESTS DETAILS:');
      results.details
        .filter(r => !r.correct)
        .forEach(r => {
          logger.info(`${r.index}. ${r.description}`);
          logger.info(`   Expected: ${r.expected}, Got: ${r.detected}`);
          logger.info(`   Question: ${r.question}`);
          logger.info('');
        });
    }

    return results;
  }

  /**
   * Test a single question
   */
  static testSingle(questionText) {
    logger.info('🔍 Testing Single Question');
    logger.info(`Question: "${questionText}"`);
    logger.info('-'.repeat(40));
    
    const result = SubjectDetector.getDetailedAnalysis(questionText);
    
    logger.info(`Subject: ${result.subject}`);
    logger.info(`Confidence: ${Math.round(result.confidence * 100)}%`);
    logger.info(`Method: ${result.method}`);
    
    if (result.alternatives.length > 0) {
      logger.info('Alternatives:');
      result.alternatives.forEach(alt => {
        logger.info(`  - ${alt.subject}: ${Math.round(alt.confidence * 100)}%`);
      });
    }
    
    logger.info(`Details: ${result.details.topScore} points from ${result.details.matchedKeywords} keywords`);
    
    return result;
  }

  /**
   * Quick test for the most common subjects
   */
  static quickTest() {
    const quickTests = [
      "Human-Computer Interaction (HCI) primarily focuses on the tasks to be completed rather than the needs of users.",
      "What is the derivative of x^2 + 3x + 1?", 
      "Which battle marked the end of Napoleon's rule in Europe?",
      "What is the process by which plants convert sunlight into energy?"
    ];

    logger.info('🚀 Quick Subject Detection Test');
    
    quickTests.forEach((question, index) => {
      const result = SubjectDetector.detectSubject(question);
      logger.info(`${index + 1}. ${result.subject} (${Math.round(result.confidence * 100)}%)`);
      logger.info(`   "${question.substring(0, 60)}..."`);
    });
  }

  /**
   * Get supported subjects list
   */
  static listSupportedSubjects() {
    const subjects = SubjectDetector.getSupportedSubjects();
    logger.info('📚 Supported Subjects:');
    subjects.forEach((subject, index) => {
      logger.info(`${index + 1}. ${subject}`);
    });
    return subjects;
  }
}