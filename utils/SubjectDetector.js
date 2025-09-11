import logger from '../utils/logger';
/**
 * Comprehensive Subject Detection System
 * Analyzes question content to accurately identify academic subjects
 */

export class SubjectDetector {
  
  static SUBJECT_KEYWORDS = {
    // STEM Fields
    'Mathematics': {
      high: [
        'equation', 'solve', 'calculate', 'derivative', 'integral', 'algebra', 'geometry', 
        'trigonometry', 'calculus', 'graph', 'function', 'polynomial', 'logarithm',
        'matrix', 'vector', 'theorem', 'proof', 'quadratic', 'linear', 'exponential'
      ],
      medium: [
        'formula', 'variable', 'coefficient', 'slope', 'angle', 'radius', 'diameter',
        'area', 'volume', 'perimeter', 'circumference', 'tangent', 'sine', 'cosine',
        'limit', 'differentiate', 'integrate', 'probability', 'statistics'
      ],
      low: [
        '+', '-', '*', '/', '=', '<', '>', 'number', 'value', 'sum', 'product',
        'difference', 'quotient', 'ratio', 'proportion', 'percentage', 'fraction'
      ]
    },

    'Physics': {
      high: [
        'force', 'energy', 'momentum', 'velocity', 'acceleration', 'gravity', 'mass',
        'newton', 'electromagnetic', 'quantum', 'relativity', 'thermodynamics',
        'optics', 'wave', 'frequency', 'wavelength', 'amplitude', 'photon'
      ],
      medium: [
        'motion', 'friction', 'pressure', 'temperature', 'heat', 'light', 'sound',
        'electricity', 'magnetic', 'circuit', 'voltage', 'current', 'resistance'
      ],
      low: [
        'speed', 'time', 'distance', 'weight', 'power', 'work', 'joule', 'watt',
        'meter', 'second', 'kilogram', 'physics', 'physical'
      ]
    },

    'Chemistry': {
      high: [
        'molecule', 'atom', 'element', 'compound', 'reaction', 'bond', 'ionic', 
        'covalent', 'periodic table', 'electron', 'proton', 'neutron', 'isotope',
        'oxidation', 'reduction', 'acid', 'base', 'ph', 'molarity', 'catalyst'
      ],
      medium: [
        'chemical', 'solution', 'mixture', 'gas', 'liquid', 'solid', 'plasma',
        'carbon', 'hydrogen', 'oxygen', 'nitrogen', 'organic', 'inorganic'
      ],
      low: [
        'chemistry', 'substance', 'material', 'combine', 'separate', 'dissolve',
        'precipitate', 'evaporate', 'condense', 'freeze', 'melt'
      ]
    },

    'Biology': {
      high: [
        'cell', 'dna', 'rna', 'protein', 'enzyme', 'chromosome', 'gene', 'genetics',
        'evolution', 'photosynthesis', 'respiration', 'mitosis', 'meiosis',
        'ecosystem', 'biodiversity', 'taxonomy', 'phylogeny', 'anatomy'
      ],
      medium: [
        'organism', 'species', 'habitat', 'population', 'community', 'bacteria',
        'virus', 'plant', 'animal', 'fungi', 'membrane', 'nucleus', 'tissue'
      ],
      low: [
        'biology', 'biological', 'life', 'living', 'growth', 'reproduction',
        'adaptation', 'environment', 'natural', 'organic'
      ]
    },

    // Computer Science & Technology  
    'Computer Science': {
      high: [
        'algorithm', 'programming', 'code', 'software', 'database', 'network',
        'artificial intelligence', 'machine learning', 'data structure', 'recursion',
        'object-oriented', 'human-computer interaction', 'hci', 'ui', 'ux',
        'user interface', 'user experience', 'usability', 'interaction design',
        'user-centered design', 'interface design', 'user research', 'wireframe',
        'prototype', 'usability testing', 'accessibility', 'user journey',
        'cybersecurity', 'encryption', 'blockchain', 'compiler'
      ],
      medium: [
        'computer', 'function', 'variable', 'loop', 'array', 'object', 'class',
        'method', 'interface', 'api', 'html', 'css', 'javascript', 'python',
        'java', 'c++', 'server', 'client', 'internet', 'web', 'user needs',
        'design principles', 'user feedback', 'interaction patterns', 'navigation',
        'user flow', 'information architecture', 'responsive design'
      ],
      low: [
        'data', 'input', 'output', 'system', 'process', 'memory', 'storage',
        'hardware', 'software', 'digital', 'binary', 'bit', 'byte', 'user',
        'design', 'interface', 'interaction', 'technology', 'computing'
      ]
    },

    // Social Sciences
    'Psychology': {
      high: [
        'psychological', 'consciousness', 'conditioning', 'personality', 'emotion', 
        'perception', 'therapy', 'mental health', 'disorder', 'freud', 'jung',
        'psychoanalysis', 'behaviorism', 'cognitive psychology', 'developmental psychology',
        'social psychology', 'abnormal psychology', 'clinical psychology'
      ],
      medium: [
        'mind', 'brain', 'neuron', 'stimulus', 'response', 'motivation',
        'stress', 'anxiety', 'depression', 'intelligence', 'psychological test', 
        'psychological experiment', 'psychologist', 'mental', 'emotional'
      ],
      low: [
        'psychology', 'behavior', 'human behavior', 'study', 'research', 'social', 
        'individual', 'group', 'think', 'feel', 'react', 'memory', 'learning',
        'development'
      ]
    },

    'History': {
      high: [
        'war', 'revolution', 'empire', 'civilization', 'ancient', 'medieval',
        'renaissance', 'enlightenment', 'industrial revolution', 'world war',
        'cold war', 'democracy', 'monarchy', 'republic', 'constitution'
      ],
      medium: [
        'president', 'king', 'queen', 'government', 'treaty', 'battle',
        'invasion', 'conquest', 'colony', 'independence', 'slavery', 'civil rights'
      ],
      low: [
        'history', 'historical', 'century', 'decade', 'year', 'period',
        'culture', 'society', 'political', 'economic', 'social'
      ]
    },

    // Language & Literature
    'English Literature': {
      high: [
        'shakespeare', 'poetry', 'novel', 'drama', 'metaphor', 'symbolism',
        'allegory', 'irony', 'satire', 'romanticism', 'modernism', 'postmodernism',
        'protagonist', 'antagonist', 'character', 'plot', 'theme', 'motif'
      ],
      medium: [
        'literature', 'author', 'writer', 'poet', 'book', 'story', 'essay',
        'paragraph', 'sentence', 'verse', 'stanza', 'rhyme', 'meter'
      ],
      low: [
        'english', 'language', 'word', 'meaning', 'context', 'interpretation',
        'analysis', 'criticism', 'reading', 'writing'
      ]
    },

    'Linguistics': {
      high: [
        'phoneme', 'morpheme', 'syntax', 'semantics', 'pragmatics', 'phonology',
        'morphology', 'grammar', 'dialect', 'sociolinguistics', 'psycholinguistics'
      ],
      medium: [
        'language', 'linguistic', 'communication', 'speech', 'accent',
        'pronunciation', 'vocabulary', 'bilingual', 'multilingual'
      ],
      low: [
        'speak', 'talk', 'word', 'sentence', 'meaning', 'understand',
        'express', 'communicate'
      ]
    },

    // Business & Economics
    'Economics': {
      high: [
        'supply', 'demand', 'market', 'inflation', 'recession', 'gdp',
        'monetary policy', 'fiscal policy', 'microeconomics', 'macroeconomics',
        'elasticity', 'monopoly', 'oligopoly', 'competition'
      ],
      medium: [
        'economy', 'economic', 'price', 'cost', 'profit', 'revenue',
        'investment', 'capital', 'labor', 'production', 'consumption'
      ],
      low: [
        'money', 'finance', 'business', 'trade', 'buy', 'sell',
        'income', 'expense', 'budget', 'tax'
      ]
    },

    'Business': {
      high: [
        'management', 'strategy', 'marketing', 'finance', 'accounting',
        'entrepreneurship', 'leadership', 'organizational behavior',
        'supply chain', 'human resources', 'operations'
      ],
      medium: [
        'business', 'company', 'corporation', 'profit', 'revenue',
        'customer', 'product', 'service', 'brand', 'competition'
      ],
      low: [
        'work', 'job', 'employee', 'manager', 'team', 'project',
        'goal', 'objective', 'plan', 'result'
      ]
    },

    // Arts & Humanities
    'Art History': {
      high: [
        'renaissance', 'baroque', 'impressionism', 'cubism', 'surrealism',
        'abstract expressionism', 'pop art', 'sculpture', 'painting',
        'fresco', 'canvas', 'perspective', 'composition'
      ],
      medium: [
        'art', 'artist', 'artwork', 'museum', 'gallery', 'exhibition',
        'style', 'movement', 'technique', 'medium', 'color', 'form'
      ],
      low: [
        'visual', 'image', 'picture', 'draw', 'paint', 'create',
        'design', 'aesthetic', 'beauty', 'expression'
      ]
    },

    'Music': {
      high: [
        'symphony', 'concerto', 'sonata', 'fugue', 'harmony', 'melody',
        'rhythm', 'tempo', 'dynamics', 'timbre', 'classical', 'romantic',
        'baroque', 'jazz', 'blues', 'opera'
      ],
      medium: [
        'music', 'musical', 'song', 'composition', 'instrument', 'orchestra',
        'band', 'choir', 'performance', 'concert', 'scale', 'chord'
      ],
      low: [
        'sound', 'note', 'beat', 'play', 'sing', 'listen',
        'hear', 'audio', 'voice', 'tune'
      ]
    },

    // Health & Medicine
    'Medicine': {
      high: [
        'diagnosis', 'treatment', 'symptom', 'disease', 'disorder', 'syndrome',
        'pathology', 'anatomy', 'physiology', 'pharmacology', 'surgery',
        'therapy', 'clinical', 'medical', 'patient', 'doctor'
      ],
      medium: [
        'health', 'healthcare', 'hospital', 'medicine', 'drug', 'medication',
        'cure', 'heal', 'infection', 'virus', 'bacteria'
      ],
      low: [
        'sick', 'ill', 'pain', 'hurt', 'injury', 'wound',
        'recovery', 'prevention', 'wellness', 'fitness'
      ]
    },

    // Geography & Earth Sciences
    'Geography': {
      high: [
        'continent', 'country', 'capital', 'climate', 'topography', 'cartography',
        'latitude', 'longitude', 'hemisphere', 'equator', 'tropics', 'polar',
        'mountain', 'river', 'ocean', 'desert', 'forest', 'tundra'
      ],
      medium: [
        'geography', 'geographic', 'location', 'region', 'territory',
        'border', 'boundary', 'map', 'navigation', 'compass'
      ],
      low: [
        'place', 'area', 'land', 'water', 'earth', 'world',
        'global', 'local', 'distance', 'direction'
      ]
    },

    'Environmental Science': {
      high: [
        'ecosystem', 'biodiversity', 'sustainability', 'climate change',
        'global warming', 'greenhouse effect', 'carbon footprint',
        'renewable energy', 'pollution', 'conservation', 'ecology'
      ],
      medium: [
        'environment', 'environmental', 'nature', 'natural', 'resource',
        'waste', 'recycling', 'energy', 'solar', 'wind'
      ],
      low: [
        'green', 'clean', 'protect', 'preserve', 'reduce', 'reuse',
        'earth', 'planet', 'future', 'sustainable'
      ]
    },

    // Philosophy & Religion
    'Philosophy': {
      high: [
        'ethics', 'morality', 'metaphysics', 'epistemology', 'logic',
        'existentialism', 'utilitarianism', 'deontology', 'phenomenology',
        'rationalism', 'empiricism', 'skepticism', 'stoicism'
      ],
      medium: [
        'philosophy', 'philosophical', 'philosopher', 'theory', 'argument',
        'reasoning', 'truth', 'knowledge', 'reality', 'existence'
      ],
      low: [
        'think', 'believe', 'opinion', 'idea', 'concept', 'principle',
        'value', 'right', 'wrong', 'good', 'bad'
      ]
    }
  };

  /**
   * Detect subject from question text using comprehensive keyword analysis
   * @param {string} questionText - The question to analyze
   * @param {object} options - Additional options for detection
   * @returns {object} - Detection result with subject, confidence, and alternatives
   */
  static detectSubject(questionText, options = {}) {
    if (!questionText || typeof questionText !== 'string') {
      return {
        subject: 'General Knowledge',
        confidence: 0,
        alternatives: [],
        method: 'fallback'
      };
    }

    const text = questionText.toLowerCase();
    const scores = {};
    const detectionDetails = {};

    // Calculate scores for each subject
    Object.entries(this.SUBJECT_KEYWORDS).forEach(([subject, categories]) => {
      let score = 0;
      let matchedKeywords = [];
      
      // High value keywords (5 points each)
      categories.high.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
          score += 5;
          matchedKeywords.push({ keyword, weight: 'high', points: 5 });
        }
      });
      
      // Medium value keywords (3 points each)  
      categories.medium.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
          score += 3;
          matchedKeywords.push({ keyword, weight: 'medium', points: 3 });
        }
      });
      
      // Low value keywords (1 point each)
      categories.low.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
          score += 1;
          matchedKeywords.push({ keyword, weight: 'low', points: 1 });
        }
      });
      
      scores[subject] = score;
      detectionDetails[subject] = {
        score,
        matchedKeywords,
        keywordCount: matchedKeywords.length
      };
    });

    // Sort subjects by score
    const sortedSubjects = Object.entries(scores)
      .sort(([,scoreA], [,scoreB]) => scoreB - scoreA)
      .map(([subject, score]) => ({
        subject,
        score,
        confidence: this.calculateConfidence(score, detectionDetails[subject]),
        details: detectionDetails[subject]
      }));

    const topMatch = sortedSubjects[0];
    const alternatives = sortedSubjects.slice(1, 4).filter(s => s.score > 0);

    // Apply confidence threshold - only return specific subject if confidence is high enough
    const minConfidence = options.minConfidence || 0.4;
    const finalSubject = topMatch.confidence >= minConfidence ? topMatch.subject : 'General Knowledge';

    return {
      subject: finalSubject,
      confidence: topMatch.confidence,
      alternatives: alternatives.map(alt => ({
        subject: alt.subject,
        confidence: alt.confidence
      })),
      method: 'keyword-analysis',
      details: {
        topScore: topMatch.score,
        matchedKeywords: topMatch.details.matchedKeywords.length,
        analysisComplete: true
      }
    };
  }

  /**
   * Calculate confidence score based on keyword matches
   * @private
   */
  static calculateConfidence(score, details) {
    if (score === 0) return 0;
    
    // Base confidence from score
    let confidence = Math.min(score / 15, 1.0); // Scale to max of 1.0
    
    // Boost confidence if high-value keywords were matched
    const highValueMatches = details.matchedKeywords.filter(k => k.weight === 'high').length;
    if (highValueMatches > 0) {
      confidence += 0.2 * highValueMatches;
    }
    
    // Boost confidence if multiple keywords were matched
    if (details.keywordCount >= 3) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Get detailed analysis of subject detection
   * @param {string} questionText - The question to analyze
   * @returns {object} - Detailed analysis results
   */
  static getDetailedAnalysis(questionText) {
    const result = this.detectSubject(questionText);
    
    return {
      ...result,
      questionLength: questionText.length,
      wordCount: questionText.split(' ').length,
      analysisTimestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Batch analyze multiple questions
   * @param {Array<string>} questions - Array of question texts
   * @returns {Array<object>} - Array of detection results
   */
  static batchDetect(questions) {
    return questions.map(question => this.detectSubject(question));
  }

  /**
   * Get all supported subjects
   * @returns {Array<string>} - List of all subjects the detector can identify
   */
  static getSupportedSubjects() {
    return Object.keys(this.SUBJECT_KEYWORDS);
  }

  /**
   * Validate if a subject is supported
   * @param {string} subject - Subject to validate
   * @returns {boolean} - Whether the subject is supported
   */
  static isSubjectSupported(subject) {
    return Object.keys(this.SUBJECT_KEYWORDS).includes(subject);
  }

  /**
   * Test the subject detector with sample content including HCI cases
   */
  static testDetection() {
    const testCases = [
      'What is the derivative of x²?',
      'Who was the first president of the United States?', 
      'What is photosynthesis?',
      'Human-Computer Interaction (HCI) primarily focuses on the tasks to be completed rather than the needs of users.',
      'What is the main goal of user-centered design?',
      'Usability testing is important for interface design.',
      'User experience design involves understanding user behavior and needs.',
      'Wireframing and prototyping are essential steps in UI design.',
      'Accessibility guidelines help make interfaces usable for everyone.'
    ];
    
    logger.info('🧪 Testing SubjectDetector with HCI improvements:');
    testCases.forEach(text => {
      const result = this.detectSubject(text);
      logger.info(`"${text.substring(0, 60)}..." → ${result.subject} (${(result.confidence * 100).toFixed(1)}%)`);
      if (result.alternatives.length > 0) {
        logger.info(`  Alt: ${result.alternatives.slice(0, 2).map(alt => `${alt.subject} (${(alt.confidence * 100).toFixed(1)}%)`).join(', ')}`);
      }
    });
  }
}