// HierarchicalSubjectService.js
// Handles hierarchical subject classification (Subject → Course → Topic)
import logger from '../utils/logger';

export class HierarchicalSubjectService {
  // ✅ COMPREHENSIVE HIERARCHICAL TAXONOMY: Subject → Courses → Specific Topics
  // Supports students across ALL academic disciplines
  static SUBJECT_HIERARCHY = {
    'Computer Science': {
      icon: 'laptop-code',
      color: '#3498DB',
      courses: {
        'Object Oriented Programming': {
          keywords: ['oop', 'class', 'object', 'inheritance', 'polymorphism', 'encapsulation', 'abstraction', 'constructor', 'destructor', 'method', 'instance', 'static', 'virtual', 'override', 'interface', 'abstract class'],
          topics: ['Classes and Objects', 'Inheritance', 'Polymorphism', 'Encapsulation', 'Design Patterns']
        },
        'Web Development': {
          keywords: ['html', 'css', 'javascript', 'react', 'angular', 'vue', 'node.js', 'express', 'dom', 'api', 'rest', 'frontend', 'backend', 'fullstack', 'bootstrap', 'jquery', 'responsive', 'mvc'],
          topics: ['Frontend Development', 'Backend Development', 'Full Stack', 'Web APIs', 'Responsive Design']
        },
        'User Experience & User Interface': {
          keywords: ['ux', 'ui', 'usability', 'wireframe', 'prototype', 'user research', 'persona', 'accessibility', 'interaction design', 'information architecture', 'user testing', 'heuristic', 'design thinking', 'user journey'],
          topics: ['User Research', 'Wireframing', 'Prototyping', 'Usability Testing', 'Design Systems']
        },
        'Database Systems': {
          keywords: ['database', 'sql', 'nosql', 'mysql', 'postgresql', 'mongodb', 'orm', 'acid', 'transaction', 'normalization', 'index', 'query', 'schema', 'relational', 'entity', 'foreign key', 'primary key'],
          topics: ['Relational Databases', 'NoSQL', 'Database Design', 'Query Optimization', 'Transactions']
        },
        'Data Structures & Algorithms': {
          keywords: ['array', 'linked list', 'stack', 'queue', 'tree', 'graph', 'hash table', 'sorting', 'searching', 'recursion', 'dynamic programming', 'greedy', 'big o', 'complexity', 'binary tree', 'heap'],
          topics: ['Arrays & Lists', 'Trees & Graphs', 'Sorting Algorithms', 'Search Algorithms', 'Complexity Analysis']
        },
        'Software Engineering': {
          keywords: ['sdlc', 'agile', 'scrum', 'waterfall', 'testing', 'debugging', 'version control', 'git', 'ci/cd', 'deployment', 'documentation', 'requirements', 'design patterns', 'refactoring'],
          topics: ['Software Development Life Cycle', 'Testing', 'Version Control', 'Project Management']
        }
      }
    },

    'Mathematics': {
      icon: 'calculator',
      color: '#E74C3C',
      courses: {
        'Calculus I': {
          keywords: ['derivative', 'integral', 'limit', 'continuity', 'differentiation', 'chain rule', 'product rule', 'quotient rule', 'optimization'],
          topics: ['Limits', 'Derivatives', 'Applications of Derivatives']
        },
        'Calculus II': {
          keywords: ['integration', 'antiderivative', 'substitution', 'integration by parts', 'series', 'sequence', 'convergence'],
          topics: ['Integration Techniques', 'Series and Sequences', 'Applications of Integration']
        },
        'Linear Algebra': {
          keywords: ['matrix', 'vector', 'eigenvalue', 'eigenvector', 'determinant', 'linear transformation', 'span', 'basis', 'dimension'],
          topics: ['Vectors and Matrices', 'Linear Transformations', 'Eigenvalues and Eigenvectors']
        },
        'Statistics': {
          keywords: ['probability', 'distribution', 'mean', 'median', 'standard deviation', 'hypothesis testing', 'regression', 'correlation'],
          topics: ['Descriptive Statistics', 'Probability Theory', 'Inferential Statistics']
        }
      }
    },

    'Business': {
      icon: 'briefcase',
      color: '#2ECC71',
      courses: {
        'Marketing': {
          keywords: ['marketing', 'advertising', 'brand', 'consumer behavior', 'market research', 'segmentation', 'positioning', 'promotion', '4ps'],
          topics: ['Market Research', 'Brand Management', 'Digital Marketing', 'Consumer Behavior']
        },
        'Finance': {
          keywords: ['finance', 'investment', 'portfolio', 'risk', 'return', 'valuation', 'capital', 'financial statements', 'cash flow'],
          topics: ['Corporate Finance', 'Investment Analysis', 'Financial Markets', 'Risk Management']
        },
        'Management': {
          keywords: ['management', 'leadership', 'strategy', 'organization', 'planning', 'controlling', 'motivation', 'team', 'decision making'],
          topics: ['Strategic Management', 'Organizational Behavior', 'Leadership', 'Operations Management']
        }
      }
    },

    'Science': {
      icon: 'flask',
      color: '#9B59B6',
      courses: {
        'General Chemistry': {
          keywords: ['atom', 'molecule', 'periodic table', 'chemical bond', 'reaction', 'stoichiometry', 'molarity', 'ph', 'acid', 'base'],
          topics: ['Atomic Structure', 'Chemical Bonding', 'Chemical Reactions', 'Solutions']
        },
        'Organic Chemistry': {
          keywords: ['organic', 'carbon', 'hydrocarbon', 'functional group', 'isomer', 'stereochemistry', 'mechanism', 'synthesis'],
          topics: ['Hydrocarbons', 'Functional Groups', 'Stereochemistry', 'Reaction Mechanisms']
        },
        'Biology': {
          keywords: ['cell', 'dna', 'rna', 'protein', 'evolution', 'genetics', 'ecology', 'photosynthesis', 'respiration'],
          topics: ['Cell Biology', 'Genetics', 'Evolution', 'Ecology']
        },
        'Physics': {
          keywords: ['force', 'energy', 'motion', 'wave', 'electricity', 'magnetism', 'quantum', 'relativity', 'thermodynamics'],
          topics: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Quantum Physics']
        }
      }
    },

    // ✅ MEDICINE & HEALTH SCIENCES
    'Medicine': {
      icon: 'heartbeat',
      color: '#E74C3C',
      courses: {
        'Anatomy': {
          keywords: ['anatomy', 'muscle', 'bone', 'organ', 'tissue', 'skeletal', 'cardiovascular', 'nervous system', 'respiratory', 'digestive'],
          topics: ['Human Body Systems', 'Musculoskeletal System', 'Cardiovascular System', 'Nervous System']
        },
        'Physiology': {
          keywords: ['physiology', 'function', 'homeostasis', 'metabolism', 'circulation', 'breathing', 'kidney', 'liver', 'heart rate'],
          topics: ['Cellular Physiology', 'Organ Function', 'Body Systems Integration']
        },
        'Pharmacology': {
          keywords: ['drug', 'medication', 'dosage', 'pharmacokinetics', 'pharmacodynamics', 'side effects', 'contraindication'],
          topics: ['Drug Mechanisms', 'Dosage Calculations', 'Drug Interactions', 'Clinical Applications']
        },
        'Pathology': {
          keywords: ['disease', 'pathology', 'diagnosis', 'symptoms', 'syndrome', 'infection', 'inflammation', 'tumor', 'cancer'],
          topics: ['Disease Mechanisms', 'Diagnostic Methods', 'Infectious Diseases', 'Chronic Conditions']
        }
      }
    },

    // ✅ ENGINEERING
    'Engineering': {
      icon: 'cogs',
      color: '#F39C12',
      courses: {
        'Mechanical Engineering': {
          keywords: ['mechanical', 'thermodynamics', 'fluid mechanics', 'heat transfer', 'materials', 'stress', 'strain', 'engine'],
          topics: ['Mechanics', 'Thermodynamics', 'Materials Science', 'Machine Design']
        },
        'Electrical Engineering': {
          keywords: ['electrical', 'circuit', 'voltage', 'current', 'resistance', 'capacitor', 'inductor', 'transistor', 'amplifier'],
          topics: ['Circuit Analysis', 'Electronics', 'Power Systems', 'Signal Processing']
        },
        'Civil Engineering': {
          keywords: ['civil', 'structural', 'concrete', 'steel', 'bridge', 'building', 'foundation', 'soil', 'construction'],
          topics: ['Structural Analysis', 'Construction Materials', 'Geotechnical Engineering', 'Transportation']
        },
        'Chemical Engineering': {
          keywords: ['chemical', 'reactor', 'process', 'distillation', 'separation', 'catalyst', 'mass transfer', 'unit operations'],
          topics: ['Unit Operations', 'Reaction Engineering', 'Process Design', 'Safety Engineering']
        }
      }
    },

    // ✅ PSYCHOLOGY
    'Psychology': {
      icon: 'brain',
      color: '#9B59B6',
      courses: {
        'General Psychology': {
          keywords: ['psychology', 'behavior', 'cognitive', 'learning', 'memory', 'perception', 'motivation', 'emotion'],
          topics: ['Learning and Memory', 'Cognitive Processes', 'Motivation and Emotion', 'Personality']
        },
        'Developmental Psychology': {
          keywords: ['development', 'child', 'adolescent', 'attachment', 'piaget', 'erikson', 'stages', 'growth'],
          topics: ['Child Development', 'Adolescent Psychology', 'Adult Development', 'Aging']
        },
        'Abnormal Psychology': {
          keywords: ['abnormal', 'mental health', 'disorder', 'anxiety', 'depression', 'schizophrenia', 'therapy', 'dsm'],
          topics: ['Mental Disorders', 'Diagnostic Criteria', 'Treatment Approaches', 'Psychological Assessment']
        }
      }
    },

    // ✅ LITERATURE & ENGLISH
    'Literature': {
      icon: 'book-open',
      color: '#8E44AD',
      courses: {
        'American Literature': {
          keywords: ['american literature', 'hemingway', 'fitzgerald', 'twain', 'whitman', 'dickinson', 'civil war', 'great depression'],
          topics: ['Colonial Literature', 'Romanticism', 'Modernism', 'Contemporary Fiction']
        },
        'British Literature': {
          keywords: ['british literature', 'shakespeare', 'chaucer', 'milton', 'romantic poets', 'victorian', 'medieval'],
          topics: ['Medieval Literature', 'Renaissance', 'Romantic Period', 'Victorian Era']
        },
        'World Literature': {
          keywords: ['world literature', 'international', 'translation', 'global', 'cultural', 'comparative literature'],
          topics: ['Ancient Texts', 'Cultural Narratives', 'International Authors', 'Translation Studies']
        },
        'Creative Writing': {
          keywords: ['creative writing', 'fiction', 'poetry', 'narrative', 'character development', 'plot', 'dialogue'],
          topics: ['Fiction Writing', 'Poetry Composition', 'Screenplay Writing', 'Literary Criticism']
        }
      }
    },

    // ✅ HISTORY
    'History': {
      icon: 'landmark',
      color: '#795548',
      courses: {
        'World History': {
          keywords: ['world history', 'ancient civilizations', 'empire', 'renaissance', 'industrial revolution', 'world war'],
          topics: ['Ancient Civilizations', 'Medieval Period', 'Renaissance', 'Modern Era']
        },
        'American History': {
          keywords: ['american history', 'colonial', 'revolution', 'civil war', 'constitution', 'presidents', 'slavery'],
          topics: ['Colonial America', 'Revolutionary War', 'Civil War', 'Modern America']
        },
        'European History': {
          keywords: ['european history', 'feudalism', 'reformation', 'enlightenment', 'french revolution', 'napoleon'],
          topics: ['Medieval Europe', 'Renaissance', 'Age of Exploration', 'Modern Europe']
        }
      }
    },

    // ✅ ECONOMICS
    'Economics': {
      icon: 'chart-line',
      color: '#607D8B',
      courses: {
        'Microeconomics': {
          keywords: ['microeconomics', 'supply', 'demand', 'elasticity', 'consumer', 'producer', 'market', 'competition'],
          topics: ['Supply and Demand', 'Market Structures', 'Consumer Theory', 'Production Theory']
        },
        'Macroeconomics': {
          keywords: ['macroeconomics', 'gdp', 'inflation', 'unemployment', 'monetary policy', 'fiscal policy', 'recession'],
          topics: ['National Income', 'Economic Growth', 'Monetary Policy', 'Fiscal Policy']
        },
        'International Economics': {
          keywords: ['international economics', 'trade', 'exchange rate', 'globalization', 'tariff', 'import', 'export'],
          topics: ['International Trade', 'Exchange Rates', 'Trade Policy', 'Economic Integration']
        }
      }
    },

    // ✅ CHEMISTRY (Enhanced)
    'Chemistry': {
      icon: 'flask',
      color: '#4CAF50',
      courses: {
        'General Chemistry': {
          keywords: ['atom', 'molecule', 'periodic table', 'chemical bond', 'reaction', 'stoichiometry', 'molarity', 'ph', 'acid', 'base'],
          topics: ['Atomic Structure', 'Chemical Bonding', 'Chemical Reactions', 'Solutions']
        },
        'Organic Chemistry': {
          keywords: ['organic', 'carbon', 'hydrocarbon', 'functional group', 'isomer', 'stereochemistry', 'mechanism', 'synthesis'],
          topics: ['Hydrocarbons', 'Functional Groups', 'Stereochemistry', 'Reaction Mechanisms']
        },
        'Physical Chemistry': {
          keywords: ['physical chemistry', 'thermodynamics', 'kinetics', 'quantum mechanics', 'spectroscopy', 'phase transition'],
          topics: ['Chemical Thermodynamics', 'Kinetics', 'Quantum Chemistry', 'Spectroscopy']
        },
        'Analytical Chemistry': {
          keywords: ['analytical', 'chromatography', 'spectroscopy', 'titration', 'quantitative', 'qualitative', 'instrumentation'],
          topics: ['Quantitative Analysis', 'Instrumental Methods', 'Separation Techniques', 'Quality Control']
        }
      }
    },

    // ✅ PHILOSOPHY
    'Philosophy': {
      icon: 'lightbulb',
      color: '#FF9800',
      courses: {
        'Ethics': {
          keywords: ['ethics', 'moral', 'right', 'wrong', 'virtue', 'duty', 'consequentialism', 'deontology', 'utilitarianism'],
          topics: ['Normative Ethics', 'Applied Ethics', 'Moral Theory', 'Ethical Dilemmas']
        },
        'Logic': {
          keywords: ['logic', 'argument', 'premise', 'conclusion', 'valid', 'sound', 'fallacy', 'reasoning'],
          topics: ['Formal Logic', 'Informal Logic', 'Critical Thinking', 'Logical Fallacies']
        },
        'Metaphysics': {
          keywords: ['metaphysics', 'reality', 'existence', 'being', 'consciousness', 'identity', 'time', 'space'],
          topics: ['Nature of Reality', 'Mind-Body Problem', 'Personal Identity', 'Free Will']
        }
      }
    },

    // ✅ SOCIOLOGY
    'Sociology': {
      icon: 'users',
      color: '#3F51B5',
      courses: {
        'Introduction to Sociology': {
          keywords: ['sociology', 'society', 'social', 'culture', 'institution', 'group', 'interaction', 'structure'],
          topics: ['Social Structure', 'Culture and Society', 'Social Institutions', 'Social Change']
        },
        'Social Research Methods': {
          keywords: ['research methods', 'survey', 'interview', 'observation', 'quantitative', 'qualitative', 'sampling'],
          topics: ['Research Design', 'Data Collection', 'Statistical Analysis', 'Qualitative Methods']
        }
      }
    },

    // ✅ POLITICAL SCIENCE
    'Political Science': {
      icon: 'balance-scale',
      color: '#2196F3',
      courses: {
        'American Government': {
          keywords: ['government', 'constitution', 'congress', 'president', 'supreme court', 'federalism', 'democracy'],
          topics: ['Constitutional Framework', 'Branches of Government', 'Civil Rights', 'Public Policy']
        },
        'International Relations': {
          keywords: ['international relations', 'diplomacy', 'foreign policy', 'war', 'peace', 'sovereignty', 'globalization'],
          topics: ['International System', 'Foreign Policy', 'International Law', 'Global Issues']
        },
        'Comparative Politics': {
          keywords: ['comparative politics', 'political system', 'democracy', 'authoritarianism', 'political party', 'election'],
          topics: ['Political Systems', 'Democratic Transitions', 'Political Parties', 'Electoral Systems']
        }
      }
    },

    // ✅ ART & DESIGN
    'Art': {
      icon: 'palette',
      color: '#E91E63',
      courses: {
        'Art History': {
          keywords: ['art history', 'renaissance', 'baroque', 'impressionism', 'modern art', 'contemporary', 'museum'],
          topics: ['Ancient Art', 'Renaissance Art', 'Modern Movements', 'Contemporary Art']
        },
        'Studio Art': {
          keywords: ['studio art', 'painting', 'drawing', 'sculpture', 'ceramics', 'printmaking', 'mixed media'],
          topics: ['Drawing Fundamentals', 'Painting Techniques', 'Sculpture', 'Digital Art']
        },
        'Graphic Design': {
          keywords: ['graphic design', 'typography', 'layout', 'branding', 'logo', 'visual communication', 'adobe'],
          topics: ['Design Principles', 'Typography', 'Branding', 'Digital Design']
        }
      }
    },

    // ✅ MUSIC
    'Music': {
      icon: 'music',
      color: '#9C27B0',
      courses: {
        'Music Theory': {
          keywords: ['music theory', 'harmony', 'melody', 'rhythm', 'chord', 'scale', 'key signature', 'time signature'],
          topics: ['Fundamentals', 'Harmony', 'Form and Analysis', 'Composition']
        },
        'Music History': {
          keywords: ['music history', 'classical', 'baroque', 'romantic', 'modern', 'composer', 'period', 'style'],
          topics: ['Baroque Period', 'Classical Era', 'Romantic Period', 'Modern Music']
        },
        'Music Performance': {
          keywords: ['performance', 'instrument', 'technique', 'practice', 'ensemble', 'solo', 'repertoire'],
          topics: ['Instrumental Technique', 'Ensemble Playing', 'Solo Performance', 'Stage Presence']
        }
      }
    },

    // ✅ NURSING
    'Nursing': {
      icon: 'user-nurse',
      color: '#00BCD4',
      courses: {
        'Fundamentals of Nursing': {
          keywords: ['nursing', 'patient care', 'assessment', 'intervention', 'evaluation', 'vital signs', 'hygiene'],
          topics: ['Nursing Process', 'Patient Assessment', 'Basic Care', 'Safety Principles']
        },
        'Pharmacology for Nurses': {
          keywords: ['nursing pharmacology', 'medication administration', 'drug calculation', 'side effects', 'contraindications'],
          topics: ['Drug Administration', 'Dosage Calculations', 'Medication Safety', 'Patient Education']
        },
        'Medical-Surgical Nursing': {
          keywords: ['medical surgical', 'acute care', 'chronic illness', 'post operative', 'wound care'],
          topics: ['Acute Care Nursing', 'Surgical Care', 'Chronic Disease Management', 'Emergency Care']
        }
      }
    },

    // ✅ EDUCATION
    'Education': {
      icon: 'chalkboard-teacher',
      color: '#FF5722',
      courses: {
        'Educational Psychology': {
          keywords: ['educational psychology', 'learning theory', 'motivation', 'development', 'assessment', 'classroom management'],
          topics: ['Learning Theories', 'Student Development', 'Motivation', 'Assessment Methods']
        },
        'Curriculum and Instruction': {
          keywords: ['curriculum', 'instruction', 'lesson planning', 'teaching methods', 'standards', 'objectives'],
          topics: ['Curriculum Design', 'Instructional Strategies', 'Lesson Planning', 'Educational Standards']
        },
        'Special Education': {
          keywords: ['special education', 'disability', 'inclusion', 'iep', 'accommodation', 'differentiation'],
          topics: ['Inclusive Education', 'Learning Disabilities', 'Behavioral Interventions', 'Legal Issues']
        }
      }
    }
  };

  /**
   * Classify content into Subject → Course → Topic hierarchy
   * @param {Array} questions - Quiz questions
   * @param {Object} metadata - Quiz metadata
   * @returns {Object} - { subject, course, topic, confidence }
   */
  static classifyHierarchical(questions, metadata = {}) {
    try {
      logger.info('🎯 Starting hierarchical subject classification...');

      // 1. Check if metadata already provides clear hierarchy
      const metadataResult = this.checkMetadataHierarchy(metadata);
      if (metadataResult) {
        logger.info(`✅ Using metadata hierarchy: ${metadataResult.subject} → ${metadataResult.course}`);
        return metadataResult;
      }

      // 2. Analyze question content for course-level classification
      const contentResult = this.analyzeQuestionContent(questions);
      if (contentResult.confidence > 0.7) {
        logger.info(`✅ Content analysis result: ${contentResult.subject} → ${contentResult.course} (confidence: ${contentResult.confidence})`);
        return contentResult;
      }

      // 3. Fallback to subject-level classification
      logger.info('🔄 Using subject-level fallback classification');
      return {
        subject: this.getSubjectFromContent(questions),
        course: null,
        topic: null,
        confidence: 0.5,
        source: 'fallback'
      };

    } catch (error) {
      logger.error('❌ Hierarchical classification error:', error);
      return {
        subject: 'General Knowledge',
        course: null,
        topic: null,
        confidence: 0.1,
        source: 'error_fallback'
      };
    }
  }

  /**
   * Check metadata for existing hierarchy information
   */
  static checkMetadataHierarchy(metadata) {
    // Check for course information from user profile
    if (metadata.course && metadata.course_code) {
      const subject = this.findSubjectByCourse(metadata.course);
      if (subject) {
        return {
          subject: subject,
          course: metadata.course,
          topic: metadata.topic || null,
          confidence: 0.95,
          source: 'metadata'
        };
      }
    }

    // Check for explicit subject/course in metadata
    if (metadata.subject && metadata.course) {
      return {
        subject: metadata.subject,
        course: metadata.course,
        topic: metadata.topic || null,
        confidence: 0.9,
        source: 'metadata'
      };
    }

    return null;
  }

  /**
   * Analyze question content for course-specific keywords
   */
  static analyzeQuestionContent(questions) {
    if (!questions || questions.length === 0) {
      return { confidence: 0 };
    }

    // Combine all question text and options
    const allText = questions.map(q => {
      const questionText = q.text || q.questionText || '';
      const optionsText = (q.options || []).join(' ');
      return `${questionText} ${optionsText}`;
    }).join(' ').toLowerCase();

    logger.info(`📝 Analyzing content: ${allText.substring(0, 100)}...`);

    // Score each course based on keyword matches
    const courseScores = {};
    let maxScore = 0;
    let bestMatch = null;

    Object.entries(this.SUBJECT_HIERARCHY).forEach(([subjectName, subjectData]) => {
      Object.entries(subjectData.courses).forEach(([courseName, courseData]) => {
        let score = 0;

        courseData.keywords.forEach(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          const matches = (allText.match(regex) || []).length;
          score += matches * (keyword.length > 6 ? 3 : keyword.length > 3 ? 2 : 1);
        });

        courseScores[`${subjectName}::${courseName}`] = score;

        if (score > maxScore) {
          maxScore = score;
          bestMatch = {
            subject: subjectName,
            course: courseName,
            score: score
          };
        }
      });
    });

    if (bestMatch && maxScore > 0) {
      const confidence = Math.min(maxScore / (questions.length * 2), 1.0);

      return {
        subject: bestMatch.subject,
        course: bestMatch.course,
        topic: null, // TODO: Implement topic detection
        confidence: confidence,
        source: 'content_analysis',
        scores: courseScores
      };
    }

    return { confidence: 0 };
  }

  /**
   * Find subject by course name
   */
  static findSubjectByCourse(courseName) {
    for (const [subjectName, subjectData] of Object.entries(this.SUBJECT_HIERARCHY)) {
      if (subjectData.courses[courseName]) {
        return subjectName;
      }
    }
    return null;
  }

  /**
   * Get subject from content (fallback method)
   */
  static getSubjectFromContent(questions) {
    // Use simplified subject detection for fallback
    const subjectKeywords = {
      'Computer Science': ['programming', 'code', 'algorithm', 'software', 'computer'],
      'Mathematics': ['math', 'equation', 'calculate', 'formula', 'number'],
      'Science': ['chemistry', 'biology', 'physics', 'experiment', 'theory'],
      'Business': ['business', 'marketing', 'finance', 'management', 'company']
    };

    const allText = questions.map(q =>
      `${q.text || q.questionText || ''} ${(q.options || []).join(' ')}`
    ).join(' ').toLowerCase();

    let maxScore = 0;
    let bestSubject = 'General Knowledge';

    Object.entries(subjectKeywords).forEach(([subject, keywords]) => {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (allText.includes(keyword) ? 1 : 0);
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        bestSubject = subject;
      }
    });

    return bestSubject;
  }

  /**
   * Get course suggestions for a subject
   */
  static getCoursesForSubject(subjectName) {
    const subjectData = this.SUBJECT_HIERARCHY[subjectName];
    return subjectData ? Object.keys(subjectData.courses) : [];
  }

  /**
   * Get display information for hierarchy
   */
  static getHierarchyDisplayInfo(subject, course = null) {
    const subjectData = this.SUBJECT_HIERARCHY[subject];
    if (!subjectData) {
      return {
        subject: subject,
        course: course,
        icon: 'book',
        color: '#95A5A6'
      };
    }

    return {
      subject: subject,
      course: course,
      icon: subjectData.icon,
      color: subjectData.color,
      courseTopics: course ? subjectData.courses[course]?.topics || [] : []
    };
  }

  // ✅ NEW: Get subject icon
  static getSubjectIcon(subjectName) {
    const subjectData = this.SUBJECT_HIERARCHY[subjectName];
    return subjectData ? subjectData.icon : 'book';
  }

  // ✅ NEW: Get subject color
  static getSubjectColor(subjectName) {
    const subjectData = this.SUBJECT_HIERARCHY[subjectName];
    return subjectData ? subjectData.color : '#9E9E9E';
  }
}

export default HierarchicalSubjectService;