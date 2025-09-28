// services/WeaknessAnalysisService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UnifiedNotificationService } from '../utils/UnifiedNotificationService';
import * as Notifications from 'expo-notifications';
import { SubjectDetector } from '../utils/SubjectDetector';
import { API_BASE_URL } from '../config/api';
import logger from '../utils/logger';


export class WeaknessAnalysisService {
  static WEAKNESS_KEY = 'weakness_analysis';
  static REMEDIAL_QUIZ_KEY = 'remedial_quiz_schedule';

  // ✅ STEP 1: Analyze quiz results and identify weaknesses
  static async analyzeQuizResults(userId, quizResults) {
    try {
      logger.info('🔍 Alexandria analyzing quiz results for weaknesses...');
      
      const analysis = {
        userId,
        quizId: quizResults.quizId,
        timestamp: new Date().toISOString(),
        weaknesses: [],
        strengths: [],
        overallAccuracy: quizResults.score / quizResults.totalQuestions,
        recommendations: []
      };

      // Analyze each incorrect answer
      const incorrectAnswers = quizResults.answers.filter(answer => !answer.isCorrect);
      const correctAnswers = quizResults.answers.filter(answer => answer.isCorrect);

      // Categorize weaknesses by topic/skill
      const weaknessMap = new Map();
      const strengthMap = new Map();

      // Process incorrect answers (weaknesses) - ENHANCED with AI analysis
      for (const answer of incorrectAnswers) {
        const topics = await this.extractTopicsWithAI(
          answer.question, 
          answer.explanation, 
          answer.selectedAnswer,
          answer.correctAnswer,
          {
            subject: quizResults.subject,
            topic: quizResults.topic,
            title: quizResults.title
          }
        );
        
        // Get AI-powered detailed analysis for this specific mistake
        const aiAnalysis = await this.analyzeSpecificSkillGaps(
          answer.question, 
          answer.selectedAnswer, 
          answer.correctAnswer, 
          answer.explanation
        );
        
        topics.forEach(topic => {
          if (!weaknessMap.has(topic)) {
            weaknessMap.set(topic, {
              topic,
              incorrectCount: 0,
              totalCount: 0,
              severity: 0,
              examples: [],
              skillType: this.categorizeSkill(topic),
              aiAnalysis: [] // Store AI insights
            });
          }
          const weakness = weaknessMap.get(topic);
          weakness.incorrectCount++;
          weakness.totalCount++;
          weakness.examples.push({
            question: answer.question.substring(0, 100) + '...',
            userAnswer: answer.selectedAnswer,
            correctAnswer: answer.correctAnswer,
            timestamp: new Date().toISOString(),
            aiInsight: aiAnalysis ? aiAnalysis.suggestedIntervention : null
          });
          
          // Store AI analysis details
          if (aiAnalysis) {
            weakness.aiAnalysis.push({
              mistakeType: aiAnalysis.mistakeType,
              granularTopic: aiAnalysis.granularTopic,
              learningLevel: aiAnalysis.learningLevel,
              priority: aiAnalysis.priority
            });
          }
        });
      }

      // Process correct answers (strengths)
      correctAnswers.forEach(answer => {
        const topics = this.extractTopics(answer.question, answer.explanation, {
          subject: quizResults.subject,
          topic: quizResults.topic,
          title: quizResults.title
        });
        topics.forEach(topic => {
          if (!strengthMap.has(topic)) {
            strengthMap.set(topic, {
              topic,
              correctCount: 0,
              totalCount: 0,
              mastery: 0
            });
          }
          const strength = strengthMap.get(topic);
          strength.correctCount++;
          strength.totalCount++;
        });
      });

      // Calculate severity scores and generate recommendations
      weaknessMap.forEach((weakness, topic) => {
        weakness.severity = (weakness.incorrectCount / weakness.totalCount) * 100;
        
        // Check if this topic was also answered correctly
        if (strengthMap.has(topic)) {
          const strength = strengthMap.get(topic);
          weakness.totalCount += strength.totalCount;
          weakness.severity = (weakness.incorrectCount / weakness.totalCount) * 100;
        }

        analysis.weaknesses.push(weakness);
      });

      // Sort weaknesses by severity
      analysis.weaknesses.sort((a, b) => b.severity - a.severity);

      // Generate AI-powered recommendations
      analysis.recommendations = await this.generateRecommendations(analysis);

      // Save analysis to storage
      await this.saveWeaknessAnalysis(userId, analysis);

      // Schedule remedial quiz if needed
      if (analysis.weaknesses.length > 0) {
        await this.scheduleRemedialQuiz(userId, analysis);
      }

      logger.info('✅ Analysis complete:', analysis);
      return analysis;

    } catch (error) {
      logger.error('❌ Error analyzing quiz results:', error);
      return null;
    }
  }

  // ✅ Validate subject against quiz metadata and content
  static validateSubject(detectedSubject, quizMetadata, questions) {
    // If quiz has explicit subject metadata, prefer that
    if (quizMetadata.subject && quizMetadata.subject !== 'General Knowledge') {
      const metadataSubject = quizMetadata.subject.toLowerCase().replace(/ /g, '_');
      logger.info(`📋 Using quiz metadata subject: ${metadataSubject}`);
      return metadataSubject;
    }

    // If topic suggests a specific subject, map it
    if (quizMetadata.topic) {
      const topicSubject = this.mapTopicToSubject(quizMetadata.topic);
      if (topicSubject) {
        logger.info(`🗂️ Mapped topic "${quizMetadata.topic}" to subject: ${topicSubject}`);
        return topicSubject;
      }
    }

    // Use content-based detection as fallback
    return detectedSubject.toLowerCase().replace(/ /g, '_');
  }

  // ✅ Map common topics to their correct subjects
  static mapTopicToSubject(topic) {
    const topicMappings = {
      'human-computer interaction': 'computer_science',
      'hci': 'computer_science',
      'user interface': 'computer_science', 
      'ui': 'computer_science',
      'ux': 'computer_science',
      'user experience': 'computer_science',
      'interface design': 'computer_science',
      'usability': 'computer_science',
      'user-centered design': 'computer_science',
      'interaction design': 'computer_science'
    };

    const normalizedTopic = topic.toLowerCase();
    return topicMappings[normalizedTopic] || null;
  }

  // ✅ ENHANCED: Extract specific topics with AI-powered granular analysis
  static async extractTopicsWithAI(question, explanation = '', userAnswer, correctAnswer, quizMetadata = {}) {
    try {
      // First, use our existing subject detection
      const basicTopics = this.extractTopics(question, explanation, quizMetadata);
      
      // Then enhance with AI-powered specific skill analysis
      const aiAnalysis = await this.analyzeSpecificSkillGaps(question, userAnswer, correctAnswer, explanation);
      
      // Combine both approaches
      const topics = [...basicTopics];
      
      if (aiAnalysis && aiAnalysis.specificSkills) {
        aiAnalysis.specificSkills.forEach(skill => {
          if (!topics.includes(skill)) {
            topics.push(skill);
          }
        });
      }
      
      return topics;
      
    } catch (error) {
      logger.error('AI topic extraction failed, falling back to basic:', error);
      return this.extractTopics(question, explanation, quizMetadata);
    }
  }

  // ✅ AI-powered specific skill gap analysis
  static async analyzeSpecificSkillGaps(question, userAnswer, correctAnswer, explanation = '') {
    try {
      const prompt = `Analyze this quiz mistake to identify specific learning gaps:

QUESTION: ${question}
STUDENT ANSWER: ${userAnswer}
CORRECT ANSWER: ${correctAnswer}
EXPLANATION: ${explanation}

Please identify:
1. The specific concept/skill the student lacks
2. The type of mistake (conceptual, procedural, factual, analytical)
3. The granular topic area (be very specific, not just broad subjects)
4. The learning level needed (basic understanding, application, analysis, synthesis)

Respond in JSON format:
{
  "specificSkills": ["specific_skill_1", "specific_skill_2"],
  "mistakeType": "conceptual|procedural|factual|analytical",
  "granularTopic": "very_specific_topic_name",
  "learningLevel": "basic|application|analysis|synthesis",
  "priority": "high|medium|low",
  "suggestedIntervention": "brief description"
}`;

      // Try to get real AI analysis first, fall back to simulation
      try {
        // Use metadata subject or detected subject instead of hardcoded 'General'
        const subjectForAI = quizMetadata?.subject || 'Computer Science'; // Default based on your HCI example
        const realAnalysis = await this.callAIAnalysisAPI(question, userAnswer, correctAnswer, subjectForAI);
        if (realAnalysis) {
          return realAnalysis;
        }
      } catch (apiError) {
        logger.info('AI API failed, using pattern-based analysis:', apiError.message);
      }
      
      // Fallback to pattern-based simulation
      return this.simulateAIAnalysis(question, userAnswer, correctAnswer);
      
    } catch (error) {
      logger.error('AI skill analysis failed:', error);
      return null;
    }
  }

  // ✅ Real AI API integration using existing /explain endpoint
  static async callAIAnalysisAPI(question, userAnswer, correctAnswer, subject = 'General') {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          user_answer: userAnswer,
          correct_answer: correctAnswer,
          subject: subject,
          difficulty: 'medium',
          tier: 1 // Use basic tier (GPT-3.5) for testing
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.explanation) {
        // Extract insights from the AI explanation to create our analysis format
        return this.parseAIExplanationForWeaknessAnalysis(data.explanation, question, userAnswer, correctAnswer);
      }

      return null;
      
    } catch (error) {
      logger.error('AI API call failed:', error);
      throw error;
    }
  }

  // ✅ Parse AI explanation to extract weakness analysis insights
  static parseAIExplanationForWeaknessAnalysis(explanation, question, userAnswer, correctAnswer) {
    try {
      const explanationLower = explanation.toLowerCase();
      const questionLower = question.toLowerCase();
      
      // Use our existing content analysis as base
      const analysisResult = this.analyzeQuestionContent(questionLower, String(userAnswer).toLowerCase(), String(correctAnswer).toLowerCase());
      
      // Enhance with insights from AI explanation
      let enhancedMistakeType = analysisResult.mistakeType;
      let enhancedPriority = analysisResult.priority;
      let enhancedIntervention = analysisResult.intervention;
      
      // Detect mistake type from AI explanation
      if (explanationLower.includes('concept') || explanationLower.includes('understanding') || explanationLower.includes('principle')) {
        enhancedMistakeType = 'conceptual';
      } else if (explanationLower.includes('step') || explanationLower.includes('process') || explanationLower.includes('method') || explanationLower.includes('procedure')) {
        enhancedMistakeType = 'procedural';
      } else if (explanationLower.includes('analyze') || explanationLower.includes('reasoning') || explanationLower.includes('logic')) {
        enhancedMistakeType = 'analytical';
      } else if (explanationLower.includes('fact') || explanationLower.includes('information') || explanationLower.includes('remember') || explanationLower.includes('recall')) {
        enhancedMistakeType = 'factual';
      }
      
      // Adjust priority based on explanation tone
      if (explanationLower.includes('critical') || explanationLower.includes('important') || explanationLower.includes('fundamental')) {
        enhancedPriority = 'high';
      } else if (explanationLower.includes('advanced') || explanationLower.includes('complex')) {
        enhancedPriority = 'medium';
      }
      
      // Create intervention suggestion from explanation insights
      if (explanation.length > 50) {
        // Extract key learning points from explanation
        const sentences = explanation.split('.').slice(0, 2);
        enhancedIntervention = `Focus on: ${sentences.join('. ').substring(0, 100)}...`;
      }
      
      return {
        specificSkills: analysisResult.skills,
        mistakeType: enhancedMistakeType,
        granularTopic: analysisResult.topic,
        learningLevel: analysisResult.level,
        priority: enhancedPriority,
        suggestedIntervention: enhancedIntervention,
        aiExplanation: explanation
      };
      
    } catch (error) {
      logger.error('Error parsing AI explanation:', error);
      return null;
    }
  }

  // ✅ ENHANCED: Universal AI simulation with dynamic pattern recognition
  static simulateAIAnalysis(question, userAnswer, correctAnswer) {
    const questionLower = question.toLowerCase();
    const userAnswerLower = String(userAnswer || '').toLowerCase();
    const correctAnswerLower = String(correctAnswer || '').toLowerCase();
    
    // Advanced pattern recognition using comprehensive keyword analysis
    const analysisResult = this.analyzeQuestionContent(questionLower, userAnswerLower, correctAnswerLower);
    
    return {
      specificSkills: analysisResult.skills,
      mistakeType: analysisResult.mistakeType,
      granularTopic: analysisResult.topic,
      learningLevel: analysisResult.level,
      priority: analysisResult.priority,
      suggestedIntervention: analysisResult.intervention
    };
  }

  // ✅ COMPREHENSIVE: Dynamic content analysis for any subject
  static analyzeQuestionContent(question, userAnswer, correctAnswer) {
    // Extract key terms and concepts
    const questionWords = this.extractKeyTerms(question);
    const domainInfo = this.identifyDomain(question, questionWords);
    
    // Analyze mistake type based on question structure and answers
    const mistakeType = this.inferMistakeType(question, userAnswer, correctAnswer, questionWords);
    
    // Generate specific skills based on domain and content
    const skills = this.generateRelevantSkills(domainInfo, questionWords, mistakeType);
    
    // Create granular topic name
    const granularTopic = this.createGranularTopic(domainInfo, questionWords);
    
    // Determine learning level needed
    const learningLevel = this.assessLearningLevel(question, mistakeType);
    
    // Set priority based on mistake type and domain complexity
    const priority = this.calculatePriority(mistakeType, domainInfo.complexity);
    
    // Generate intervention suggestion
    const intervention = this.suggestIntervention(mistakeType, domainInfo.domain, skills);
    
    return {
      skills,
      mistakeType,
      topic: granularTopic,
      level: learningLevel,
      priority,
      intervention
    };
  }

  // Extract meaningful terms from question text
  static extractKeyTerms(text) {
    // Remove common words and extract meaningful terms
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'what', 'which', 'how', 'why', 'when', 'where', 'who'];
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    // Extract technical terms, proper nouns, and domain-specific vocabulary
    const keyTerms = words.filter(word => {
      return /^[A-Z]/.test(word) || // Proper nouns
             word.length > 6 || // Longer technical terms
             /\d/.test(word) || // Contains numbers
             this.isTechnicalTerm(word);
    });
    
    return [...new Set([...keyTerms, ...words.slice(0, 10)])]; // Keep top 10 words plus key terms
  }

  // Identify the domain/subject area dynamically
  static identifyDomain(question, keyTerms) {
    const domainIndicators = {
      // STEM
      mathematics: ['equation', 'solve', 'calculate', 'formula', 'graph', 'function', 'integral', 'derivative', 'algebra', 'geometry', 'statistics', 'probability'],
      physics: ['force', 'energy', 'velocity', 'acceleration', 'mass', 'gravity', 'wave', 'frequency', 'circuit', 'quantum'],
      chemistry: ['molecule', 'atom', 'reaction', 'element', 'compound', 'acid', 'base', 'chemical', 'catalyst', 'bond'],
      biology: ['cell', 'dna', 'organism', 'evolution', 'photosynthesis', 'enzyme', 'protein', 'genetics', 'species'],
      
      // Computer Science & Technology
      computer_science: ['algorithm', 'programming', 'code', 'software', 'database', 'network', 'api', 'function', 'variable'],
      web_development: ['html', 'css', 'javascript', 'frontend', 'backend', 'website', 'browser', 'server'],
      data_science: ['data', 'analytics', 'machine learning', 'ai', 'dataset', 'model', 'prediction', 'visualization'],
      cybersecurity: ['security', 'encryption', 'password', 'firewall', 'malware', 'vulnerability', 'attack', 'breach'],
      
      // Business & Professional
      business: ['management', 'strategy', 'marketing', 'sales', 'revenue', 'profit', 'customer', 'market'],
      finance: ['investment', 'stock', 'bond', 'portfolio', 'risk', 'return', 'financial', 'accounting'],
      project_management: ['project', 'timeline', 'milestone', 'stakeholder', 'scope', 'budget', 'deliverable'],
      
      // Languages & Communication
      language: ['grammar', 'vocabulary', 'pronunciation', 'syntax', 'verb', 'noun', 'adjective', 'sentence'],
      literature: ['poem', 'novel', 'author', 'character', 'plot', 'theme', 'metaphor', 'symbolism'],
      writing: ['essay', 'paragraph', 'thesis', 'argument', 'evidence', 'conclusion', 'draft', 'revision'],
      
      // Creative & Arts
      art: ['color', 'composition', 'design', 'painting', 'drawing', 'sculpture', 'visual', 'aesthetic'],
      music: ['note', 'chord', 'rhythm', 'melody', 'harmony', 'instrument', 'scale', 'tempo'],
      
      // Health & Medicine
      medicine: ['patient', 'diagnosis', 'treatment', 'symptom', 'disease', 'therapy', 'medical', 'health'],
      psychology: ['behavior', 'cognitive', 'emotion', 'personality', 'therapy', 'mental', 'psychological'],
      
      // Social Sciences
      history: ['historical', 'century', 'war', 'civilization', 'culture', 'society', 'period', 'event'],
      geography: ['country', 'continent', 'climate', 'population', 'city', 'region', 'location', 'map'],
      sociology: ['society', 'social', 'community', 'culture', 'group', 'institution', 'relationship'],
      
      // Other Professional Fields
      legal: ['law', 'legal', 'court', 'judge', 'lawyer', 'contract', 'rights', 'justice'],
      engineering: ['design', 'build', 'structure', 'material', 'system', 'process', 'technical', 'construction']
    };
    
    let bestMatch = 'general_knowledge';
    let maxScore = 0;
    let complexity = 'medium';
    
    for (const [domain, indicators] of Object.entries(domainIndicators)) {
      const score = indicators.reduce((acc, indicator) => {
        const regex = new RegExp(indicator, 'i');
        return acc + (regex.test(question) ? 2 : 0) + keyTerms.filter(term => regex.test(term)).length;
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = domain;
      }
    }
    
    // Determine complexity based on technical vocabulary density
    const technicalDensity = keyTerms.filter(term => this.isTechnicalTerm(term)).length / keyTerms.length;
    if (technicalDensity > 0.4) complexity = 'high';
    else if (technicalDensity > 0.2) complexity = 'medium';
    else complexity = 'basic';
    
    return { domain: bestMatch, complexity, confidence: maxScore };
  }

  // Check if a term is technical/specialized
  static isTechnicalTerm(word) {
    const technicalPatterns = [
      /tion$/, /sion$/, /ment$/, /ness$/, // Abstract concepts
      /^[A-Z]{2,}$/, // Acronyms
      /\d+/, // Contains numbers
      /(micro|macro|meta|pseudo|proto|auto|bio|geo|neo|multi|inter|intra|trans|pre|post|anti|pro)/, // Prefixes
      /(ology|ography|ometry|istics|ization|ability|ibility)$/ // Technical suffixes
    ];
    
    return technicalPatterns.some(pattern => pattern.test(word)) || word.length > 8;
  }

  // Infer mistake type from question structure and answers
  static inferMistakeType(question, userAnswer, correctAnswer, keyTerms) {
    // Procedural: involves steps, calculations, processes
    if (/solve|calculate|find|determine|compute|steps?|process|method|how to/.test(question)) {
      return 'procedural';
    }
    
    // Analytical: involves reasoning, comparison, evaluation
    if (/analyze|compare|evaluate|assess|why|explain|reasoning|because|therefore|however/.test(question)) {
      return 'analytical';
    }
    
    // Factual: involves specific facts, dates, names, definitions
    if (/when|where|who|what is|define|definition|year|date|name|term/.test(question)) {
      return 'factual';
    }
    
    // Conceptual: involves understanding principles, theories, relationships
    return 'conceptual';
  }

  // Generate relevant skills based on domain and content
  static generateRelevantSkills(domainInfo, keyTerms, mistakeType) {
    const baseSkills = [domainInfo.domain.replace('_', ' ')];
    
    // Add skills based on mistake type
    const mistakeTypeSkills = {
      'conceptual': ['theoretical_understanding', 'principle_application'],
      'procedural': ['step_by_step_process', 'method_application'],
      'analytical': ['critical_thinking', 'logical_reasoning'],
      'factual': ['information_recall', 'detail_retention']
    };
    
    baseSkills.push(...(mistakeTypeSkills[mistakeType] || []));
    
    // Add domain-specific skills based on key terms
    keyTerms.slice(0, 3).forEach(term => {
      if (term.length > 3) {
        baseSkills.push(term.replace(/[^a-zA-Z]/g, '_').toLowerCase());
      }
    });
    
    return [...new Set(baseSkills)].slice(0, 4); // Limit to 4 skills
  }

  // Create granular topic name
  static createGranularTopic(domainInfo, keyTerms) {
    const mainConcepts = keyTerms.slice(0, 2).join('_');
    return `${domainInfo.domain}_${mainConcepts}`.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
  }

  // Assess required learning level
  static assessLearningLevel(question, mistakeType) {
    const levelKeywords = {
      'synthesis': ['create', 'design', 'develop', 'formulate', 'construct'],
      'analysis': ['analyze', 'compare', 'contrast', 'evaluate', 'assess'],
      'application': ['apply', 'use', 'solve', 'demonstrate', 'calculate'],
      'basic': ['define', 'list', 'identify', 'recall', 'what', 'when', 'where']
    };
    
    for (const [level, keywords] of Object.entries(levelKeywords)) {
      if (keywords.some(keyword => question.includes(keyword))) {
        return level;
      }
    }
    
    return mistakeType === 'factual' ? 'basic' : 'application';
  }

  // Calculate priority based on mistake type and complexity
  static calculatePriority(mistakeType, complexity) {
    const priorityMatrix = {
      'conceptual': { 'basic': 'high', 'medium': 'high', 'high': 'medium' },
      'procedural': { 'basic': 'medium', 'medium': 'high', 'high': 'high' },
      'analytical': { 'basic': 'low', 'medium': 'medium', 'high': 'high' },
      'factual': { 'basic': 'low', 'medium': 'medium', 'high': 'medium' }
    };
    
    return priorityMatrix[mistakeType]?.[complexity] || 'medium';
  }

  // Generate specific intervention suggestion
  static suggestIntervention(mistakeType, domain, skills) {
    const interventions = {
      'conceptual': `Focus on understanding core principles in ${domain.replace('_', ' ')}`,
      'procedural': `Practice step-by-step methods and procedures for ${domain.replace('_', ' ')}`,
      'analytical': `Develop critical thinking skills for ${domain.replace('_', ' ')} problems`,
      'factual': `Review and memorize key facts about ${domain.replace('_', ' ')}`
    };
    
    return interventions[mistakeType] || `Strengthen foundational knowledge in ${domain.replace('_', ' ')}`;
  }

  // ✅ Extract topics using comprehensive subject detection with validation
  static extractTopics(question, explanation = '', quizMetadata = {}) {
    const content = question + ' ' + explanation;
    
    // Use our comprehensive subject detector
    const detectionResult = SubjectDetector.detectSubject(content, {
      minConfidence: 0.2 // Lower threshold for broader detection
    });
    
    // Validate against quiz metadata
    const validatedSubject = this.validateSubject(detectionResult.subject, quizMetadata, []);
    
    logger.info(`🎯 Subject validation for weakness analysis:`, {
      question: question.substring(0, 80) + '...',
      detectedSubject: detectionResult.subject,
      validatedSubject,
      confidence: detectionResult.confidence,
      alternatives: detectionResult.alternatives,
      metadata: quizMetadata
    });
    
    const topics = [];
    
    // Use validated subject first
    if (validatedSubject !== 'general_knowledge') {
      topics.push(validatedSubject);
    }
    
    // Add high-confidence alternatives if they don't conflict
    detectionResult.alternatives
      .filter(alt => alt.confidence > 0.4 && alt.subject !== 'General Knowledge')
      .forEach(alt => {
        const altTopic = alt.subject.toLowerCase().replace(/ /g, '_');
        if (!topics.includes(altTopic)) {
          topics.push(altTopic);
        }
      });
    
    // If no specific subjects detected, use general knowledge
    if (topics.length === 0) {
      topics.push('general_knowledge');
    }
    
    return topics;
  }

  // ✅ ENHANCED: Dynamic skill categorization for any domain
  static categorizeSkill(topic) {
    const skillCategories = {
      // Fundamental skills - building blocks
      'fundamentals': [
        'mathematics', 'algebra', 'grammar', 'basic_math', 'fundamentals', 'language',
        'reading', 'writing', 'arithmetic', 'vocabulary', 'syntax', 'spelling'
      ],
      
      // Application skills - using knowledge in practice
      'application': [
        'problem_solving', 'physics', 'chemistry', 'programming', 'coding', 'calculation',
        'web_development', 'software', 'engineering', 'design', 'construction', 'implementation'
      ],
      
      // Memorization skills - facts, data, terminology
      'memorization': [
        'history', 'geography', 'biology_facts', 'vocabulary', 'terminology', 'dates',
        'names', 'locations', 'facts', 'definitions', 'medical', 'legal', 'recall'
      ],
      
      // Analysis skills - evaluation, reasoning, critical thinking
      'analysis': [
        'calculus', 'critical_thinking', 'evaluation', 'assessment', 'research', 'analysis',
        'literature', 'psychology', 'philosophy', 'sociology', 'reasoning', 'logic'
      ],
      
      // Creative skills - artistic, innovative, design-oriented
      'creative': [
        'art', 'music', 'design', 'creative', 'composition', 'aesthetics', 'innovation',
        'brainstorming', 'ideation', 'artistic', 'visual', 'graphic'
      ],
      
      // Professional skills - business, management, communication
      'professional': [
        'business', 'management', 'finance', 'project_management', 'communication',
        'leadership', 'strategy', 'marketing', 'sales', 'negotiation', 'presentation'
      ],
      
      // Technical skills - specialized, advanced, tool-specific
      'technical': [
        'cybersecurity', 'data_science', 'machine_learning', 'database', 'network',
        'system', 'advanced', 'specialized', 'technical', 'scientific', 'research'
      ]
    };

    // Convert topic to lowercase for matching
    const topicLower = topic.toLowerCase();

    // Find best matching category
    for (const [category, keywords] of Object.entries(skillCategories)) {
      const matches = keywords.filter(keyword => {
        return topicLower.includes(keyword) || keyword.includes(topicLower);
      });
      
      if (matches.length > 0) {
        return category;
      }
    }

    // Default categorization based on topic characteristics
    if (this.isTechnicalTerm(topicLower)) {
      return 'technical';
    }
    
    if (topicLower.includes('create') || topicLower.includes('design')) {
      return 'creative';
    }
    
    if (topicLower.includes('manage') || topicLower.includes('business')) {
      return 'professional';
    }

    // Default to application if no specific match
    return 'application';
  }

  // ✅ ENHANCED: Generate AI-powered contextual recommendations
  static async generateRecommendations(analysis) {
    const recommendations = [];
    const topWeaknesses = analysis.weaknesses.slice(0, 3);

    topWeaknesses.forEach(weakness => {
      // Use AI analysis to create more specific recommendations
      const aiInsights = weakness.aiAnalysis || [];
      const mostCommonMistakeType = this.getMostCommonMistakeType(aiInsights);
      const granularTopics = this.getGranularTopics(aiInsights);
      
      let actionMessage = '';
      let actionType = 'remedial_quiz';
      
      // Customize recommendation based on AI analysis
      if (mostCommonMistakeType === 'conceptual') {
        actionMessage = `💡 You need deeper conceptual understanding of ${weakness.topic.replace(/_/g, ' ')}`;
        actionType = 'concept_review';
      } else if (mostCommonMistakeType === 'procedural') {
        actionMessage = `⚙️ Practice the step-by-step process for ${weakness.topic.replace(/_/g, ' ')} problems`;
        actionType = 'practice_drill';
      } else if (mostCommonMistakeType === 'factual') {
        actionMessage = `📖 Review key facts and details about ${weakness.topic.replace(/_/g, ' ')}`;
        actionType = 'fact_review';
      } else if (mostCommonMistakeType === 'analytical') {
        actionMessage = `🧠 Work on analytical skills for ${weakness.topic.replace(/_/g, ' ')} problems`;
        actionType = 'analytical_practice';
      } else {
        actionMessage = `🎯 Focus on ${weakness.topic.replace(/_/g, ' ')} - you missed ${weakness.incorrectCount} out of ${weakness.totalCount} questions`;
      }

      if (weakness.severity > 70) {
        recommendations.push({
          priority: 'high',
          message: actionMessage,
          action: actionType,
          topic: weakness.topic,
          skillType: weakness.skillType,
          specificGaps: granularTopics,
          aiInsight: this.generateContextualInsight(weakness)
        });
      } else if (weakness.severity > 40) {
        recommendations.push({
          priority: 'medium',
          message: actionMessage,
          action: actionType,
          topic: weakness.topic,
          skillType: weakness.skillType,
          specificGaps: granularTopics,
          aiInsight: this.generateContextualInsight(weakness)
        });
      }
    });

    // Add contextual recommendations based on overall performance pattern
    if (analysis.overallAccuracy < 0.6) {
      const fundamentalWeaknesses = analysis.weaknesses.filter(w => 
        w.aiAnalysis && w.aiAnalysis.some(ai => ai.learningLevel === 'basic')
      );
      
      if (fundamentalWeaknesses.length > 0) {
        recommendations.unshift({
          priority: 'critical',
          message: `🏗️ Build stronger foundations - focusing on basic concepts will improve all areas`,
          action: 'fundamentals_quiz',
          topic: 'fundamentals',
          skillType: 'fundamentals',
          aiInsight: 'Multiple fundamental gaps detected - prioritize building core understanding'
        });
      }
    }

    return recommendations;
  }

  // Helper methods for AI-enhanced recommendations
  static getMostCommonMistakeType(aiAnalyses) {
    if (!aiAnalyses.length) return 'conceptual';
    
    const types = {};
    aiAnalyses.forEach(analysis => {
      types[analysis.mistakeType] = (types[analysis.mistakeType] || 0) + 1;
    });
    
    return Object.entries(types).reduce((a, b) => types[a] > types[b] ? a : b)[0];
  }

  static getGranularTopics(aiAnalyses) {
    return [...new Set(aiAnalyses.map(analysis => analysis.granularTopic))].slice(0, 3);
  }

  static generateContextualInsight(weakness) {
    const examples = weakness.examples.slice(0, 2);
    const hasAI = weakness.aiAnalysis && weakness.aiAnalysis.length > 0;
    
    if (hasAI) {
      const commonPattern = this.getMostCommonMistakeType(weakness.aiAnalysis);
      return `Based on your mistakes, this appears to be a ${commonPattern} gap. ${examples.length > 1 ? 'Multiple examples show' : 'Your mistake shows'} you need targeted practice in this area.`;
    }
    
    return `You struggled with ${examples.length} question${examples.length > 1 ? 's' : ''} in this area - focused practice will help.`;
  }

  // ✅ STEP 2: Generate targeted remedial quiz
  static async generateRemedialQuiz(userId, targetWeakness) {
    try {
      logger.info('🎯 Generating remedial quiz for:', targetWeakness.topic);

      const remedialQuiz = {
        id: `remedial_${Date.now()}`,
        userId,
        type: 'remedial',
        targetTopic: targetWeakness.topic,
        title: `Alexandria Focus: ${targetWeakness.topic.replace('_', ' ').toUpperCase()}`,
        description: `Targeted practice to strengthen your ${targetWeakness.topic.replace('_', ' ')} skills`,
        difficulty: this.getDifficultyLevel(targetWeakness),
        questionCount: Math.min(10, Math.max(5, targetWeakness.incorrectCount * 2)),
        timeLimit: 15, // minutes
        aiPrompt: this.generateAIQuizPrompt(targetWeakness),
        scheduledFor: new Date(Date.now() + this.getRandomDelay()),
        priority: targetWeakness.severity > 70 ? 'high' : 'medium'
      };

      await this.saveRemedialQuiz(userId, remedialQuiz);
      return remedialQuiz;

    } catch (error) {
      logger.error('Error generating remedial quiz:', error);
      return null;
    }
  }

  // ✅ Generate AI prompt for targeted quiz creation
  static generateAIQuizPrompt(weakness) {
    const examples = weakness.examples.slice(0, 2);
    
    return `Create a ${weakness.skillType} quiz focused on ${weakness.topic.replace('_', ' ')} concepts. 
    
The student struggled with these types of questions:
${examples.map(ex => `- ${ex.question}`).join('\n')}

Generate questions that:
1. Address the specific gaps shown in these examples
2. Start with fundamental concepts if this is a basics issue
3. Gradually increase in complexity
4. Include clear explanations for each answer
5. Focus on ${weakness.topic.replace('_', ' ')} skills

Difficulty: ${this.getDifficultyLevel(weakness)}
Target: Help student master ${weakness.topic.replace('_', ' ')} through focused practice.`;
  }

  // ✅ STEP 3: Schedule smart notifications
  static async scheduleRemedialQuiz(userId, analysis) {
    try {
      const topWeakness = analysis.weaknesses[0];
      if (!topWeakness || topWeakness.severity < 30) return;

      // Generate the remedial quiz
      const remedialQuiz = await this.generateRemedialQuiz(userId, topWeakness);
      
      if (remedialQuiz) {
        // Schedule notification
        const notificationTime = this.getOptimalNotificationTime();
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🎯 Alexandria Skill Focus',
            body: `Ready to strengthen your ${topWeakness.topic.replace('_', ' ')} skills? I've prepared a targeted quiz for you!`,
            data: {
              type: 'remedial_quiz',
              userId,
              quizId: remedialQuiz.id,
              topic: topWeakness.topic,
              priority: remedialQuiz.priority
            }
          },
          trigger: { date: notificationTime }
        });

        logger.info(`📱 Remedial quiz notification scheduled for ${notificationTime}`);
      }

    } catch (error) {
      logger.error('Error scheduling remedial quiz:', error);
    }
  }

  // ✅ Get optimal notification time (smart scheduling)
  static getOptimalNotificationTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Schedule for optimal learning times (9 AM - 7 PM)
    const optimalHours = [9, 11, 14, 16, 19]; // 9am, 11am, 2pm, 4pm, 7pm
    const randomHour = optimalHours[Math.floor(Math.random() * optimalHours.length)];
    
    tomorrow.setHours(randomHour, Math.floor(Math.random() * 60), 0, 0);
    
    // Add random delay of 1-3 days
    const randomDays = Math.floor(Math.random() * 3) + 1;
    tomorrow.setDate(tomorrow.getDate() + randomDays);
    
    return tomorrow;
  }

  // ✅ Utility functions
  static getDifficultyLevel(weakness) {
    if (weakness.severity > 80) return 'basic';
    if (weakness.severity > 50) return 'intermediate';
    return 'advanced';
  }

  static getRandomDelay() {
    // Random delay between 4-72 hours
    const minHours = 4;
    const maxHours = 72;
    return (minHours + Math.random() * (maxHours - minHours)) * 60 * 60 * 1000;
  }

  // ✅ Storage functions
  static async saveWeaknessAnalysis(userId, analysis) {
    try {
      const existing = await AsyncStorage.getItem(`${this.WEAKNESS_KEY}_${userId}`);
      const analyses = existing ? JSON.parse(existing) : [];
      
      analyses.unshift(analysis); // Add to beginning
      
      // Keep only last 10 analyses
      const trimmed = analyses.slice(0, 10);
      
      await AsyncStorage.setItem(`${this.WEAKNESS_KEY}_${userId}`, JSON.stringify(trimmed));
    } catch (error) {
      logger.error('Error saving weakness analysis:', error);
    }
  }

  static async saveRemedialQuiz(userId, quiz) {
    try {
      const existing = await AsyncStorage.getItem(`${this.REMEDIAL_QUIZ_KEY}_${userId}`);
      const quizzes = existing ? JSON.parse(existing) : [];
      
      quizzes.push(quiz);
      
      await AsyncStorage.setItem(`${this.REMEDIAL_QUIZ_KEY}_${userId}`, JSON.stringify(quizzes));
    } catch (error) {
      logger.error('Error saving remedial quiz:', error);
    }
  }

  // ✅ API functions for UI
  static async getWeaknessHistory(userId) {
    try {
      const data = await AsyncStorage.getItem(`${this.WEAKNESS_KEY}_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('Error getting weakness history:', error);
      return [];
    }
  }

  static async getPendingRemedialQuizzes(userId) {
    try {
      const data = await AsyncStorage.getItem(`${this.REMEDIAL_QUIZ_KEY}_${userId}`);
      const quizzes = data ? JSON.parse(data) : [];
      
      // Return only future/pending quizzes
      return quizzes.filter(quiz => new Date(quiz.scheduledFor) > new Date());
    } catch (error) {
      logger.error('Error getting pending quizzes:', error);
      return [];
    }
  }

  static async getCurrentWeaknesses(userId) {
    try {
      const analyses = await this.getWeaknessHistory(userId);
      if (analyses.length === 0) return [];

      // Aggregate weaknesses from recent analyses
      const recentAnalyses = analyses.slice(0, 3); // Last 3 quizzes
      const weaknessMap = new Map();

      recentAnalyses.forEach(analysis => {
        analysis.weaknesses.forEach(weakness => {
          if (!weaknessMap.has(weakness.topic)) {
            weaknessMap.set(weakness.topic, {
              topic: weakness.topic,
              totalIncorrect: 0,
              totalQuestions: 0,
              severity: 0,
              trend: 'stable'
            });
          }
          const existing = weaknessMap.get(weakness.topic);
          existing.totalIncorrect += weakness.incorrectCount;
          existing.totalQuestions += weakness.totalCount;
        });
      });

      // Calculate current severity and trends
      const currentWeaknesses = Array.from(weaknessMap.values()).map(weakness => {
        weakness.severity = (weakness.totalIncorrect / weakness.totalQuestions) * 100;
        return weakness;
      }).filter(weakness => weakness.severity > 25); // Only significant weaknesses

      return currentWeaknesses.sort((a, b) => b.severity - a.severity);

    } catch (error) {
      logger.error('Error getting current weaknesses:', error);
      return [];
    }
  }
}

export default WeaknessAnalysisService;