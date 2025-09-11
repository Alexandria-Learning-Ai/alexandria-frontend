/**
 * MathExplainer - Step-by-step math problem explanation system
 * Provides comprehensive mathematical problem breakdowns with visual aids
 */

export class MathExplainer {
  constructor() {
    this.explanationStyles = {
      beginner: 'Very detailed with basic concepts explained',
      intermediate: 'Standard explanations with key steps',
      advanced: 'Concise explanations focusing on technique',
      visual: 'Heavy emphasis on diagrams and visual representations'
    };

    this.adaptiveFactors = {
      userPerformance: {
        accuracy: 0.8,
        avgTimePerProblem: 120,
        mistakePatterns: [],
        strengthAreas: [],
        weekAreas: []
      },
      problemComplexity: {
        conceptCount: 1,
        stepCount: 3,
        prerequisiteKnowledge: [],
        cognitiveLoad: 'low'
      },
      learningStyle: {
        visual: 0.7,
        auditory: 0.2,
        kinesthetic: 0.1,
        readingWriting: 0.6
      }
    };

    this.mathDomains = {
      algebra: 'Algebraic equations and expressions',
      geometry: 'Geometric shapes, areas, and volumes', 
      trigonometry: 'Trigonometric functions and identities',
      calculus: 'Derivatives, integrals, and limits',
      statistics: 'Data analysis and probability',
      arithmetic: 'Basic mathematical operations'
    };
  }

  /**
   * Generate step-by-step explanation for a math problem
   */
  explainProblem(problem, options = {}) {
    const {
      userLevel = 'intermediate',
      includeVisualAids = true,
      showCommonMistakes = true,
      adaptiveDifficulty = true
    } = options;

    const problemType = this.identifyProblemType(problem);
    const adaptedLevel = adaptiveDifficulty ? 
      this.adaptDifficultyLevel(problem, problemType, userLevel) : userLevel;
    
    const explanation = this.generateExplanation(problem, problemType, adaptedLevel);
    
    return {
      problem: problem,
      problemType: problemType,
      difficulty: this.assessDifficulty(problem, problemType),
      userLevel: adaptedLevel,
      originalLevel: userLevel,
      steps: explanation.steps,
      concepts: explanation.concepts,
      visualAids: includeVisualAids ? explanation.visualAids : null,
      commonMistakes: showCommonMistakes ? explanation.commonMistakes : null,
      practiceProblems: this.generatePracticeProblems(problemType, adaptedLevel),
      estimatedTime: this.estimateExplanationTime(explanation.steps.length, adaptedLevel),
      adaptations: adaptiveDifficulty ? explanation.adaptations : null
    };
  }

  /**
   * Identify the type of math problem
   */
  identifyProblemType(problem) {
    const text = problem.question || problem.text || '';
    const patterns = {
      'linear_equation': /(\d+)?x\s*[+\-]\s*\d+\s*=\s*\d+|solve for x/i,
      'quadratic_equation': /x\^?2|quadratic|ax\^2|discriminant/i,
      'geometry_area': /area|perimeter|rectangle|circle|triangle/i,
      'geometry_volume': /volume|cylinder|sphere|cone|prism/i,
      'trigonometry': /sin|cos|tan|sine|cosine|tangent|angle/i,
      'calculus_derivative': /derivative|d\/dx|differentiate|rate of change/i,
      'calculus_integral': /integral|integrate|∫|area under curve/i,
      'statistics': /mean|median|mode|standard deviation|probability/i,
      'percentage': /percent|%|\bof\b.*\bpercent/i,
      'fractions': /\/|\bfraction|numerator|denominator/i,
      'word_problem': /if.*then|john|mary|store|bought|sold|traveled/i
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return type;
      }
    }

    return 'general_math';
  }

  /**
   * Generate comprehensive explanation based on problem type
   */
  generateExplanation(problem, problemType, userLevel) {
    const generators = {
      'linear_equation': this.explainLinearEquation.bind(this),
      'quadratic_equation': this.explainQuadraticEquation.bind(this),
      'geometry_area': this.explainGeometryArea.bind(this),
      'geometry_volume': this.explainGeometryVolume.bind(this),
      'trigonometry': this.explainTrigonometry.bind(this),
      'calculus_derivative': this.explainDerivative.bind(this),
      'calculus_integral': this.explainIntegral.bind(this),
      'statistics': this.explainStatistics.bind(this),
      'percentage': this.explainPercentage.bind(this),
      'fractions': this.explainFractions.bind(this),
      'word_problem': this.explainWordProblem.bind(this)
    };

    const generator = generators[problemType] || this.explainGeneral.bind(this);
    return generator(problem, userLevel);
  }

  /**
   * Explain linear equations step by step
   */
  explainLinearEquation(problem, userLevel) {
    const steps = [
      {
        id: 1,
        title: 'Identify the Equation',
        content: 'First, let\'s identify what type of equation we have and what we need to solve for.',
        math: problem.question,
        explanation: 'This is a linear equation in one variable. Our goal is to isolate the variable.',
        visual: 'equation_identification'
      },
      {
        id: 2,
        title: 'Isolate Variables',
        content: 'Move all terms containing the variable to one side of the equation.',
        math: '3x + 5 = 14',
        explanation: 'Subtract 5 from both sides to move the constant term.',
        action: 'subtract_both_sides',
        visual: 'balance_scale'
      },
      {
        id: 3,
        title: 'Simplify',
        content: 'Simplify both sides of the equation.',
        math: '3x = 9',
        explanation: 'We now have the variable term isolated on the left side.',
        visual: 'simplified_equation'
      },
      {
        id: 4,
        title: 'Solve for Variable',
        content: 'Divide both sides by the coefficient of the variable.',
        math: 'x = 3',
        explanation: 'Divide both sides by 3 to get the final answer.',
        action: 'divide_both_sides',
        visual: 'final_answer'
      },
      {
        id: 5,
        title: 'Verify Solution',
        content: 'Let\'s check our answer by substituting back into the original equation.',
        math: '3(3) + 5 = 9 + 5 = 14 ✓',
        explanation: 'Our solution is correct since both sides equal 14.',
        visual: 'verification'
      }
    ];

    const concepts = [
      {
        name: 'Linear Equation',
        definition: 'An equation where the variable appears only to the first power',
        importance: 'Foundation for all algebraic problem solving'
      },
      {
        name: 'Inverse Operations',
        definition: 'Operations that undo each other (addition/subtraction, multiplication/division)',
        importance: 'Key principle for isolating variables'
      },
      {
        name: 'Balance Property',
        definition: 'Whatever you do to one side of an equation, you must do to the other side',
        importance: 'Maintains equation equality throughout solving process'
      }
    ];

    return {
      steps: userLevel === 'beginner' ? steps : steps.filter(s => s.id !== 1),
      concepts: concepts,
      visualAids: this.generateLinearEquationVisuals(),
      commonMistakes: [
        'Forgetting to perform the same operation on both sides',
        'Sign errors when moving terms across the equals sign',
        'Not checking the solution in the original equation'
      ]
    };
  }

  /**
   * Explain quadratic equations
   */
  explainQuadraticEquation(problem, userLevel) {
    const steps = [
      {
        id: 1,
        title: 'Identify the Quadratic',
        content: 'Recognize this as a quadratic equation in standard form ax² + bx + c = 0',
        math: 'x² - 5x + 6 = 0',
        explanation: 'Here a=1, b=-5, c=6',
        visual: 'quadratic_identification'
      },
      {
        id: 2,
        title: 'Choose Solution Method',
        content: 'We can solve by factoring, quadratic formula, or completing the square.',
        explanation: 'Let\'s try factoring first since the coefficients are simple.',
        visual: 'method_selection'
      },
      {
        id: 3,
        title: 'Factor the Equation',
        content: 'Find two numbers that multiply to 6 and add to -5.',
        math: 'x² - 5x + 6 = (x - 2)(x - 3) = 0',
        explanation: '-2 and -3 multiply to 6 and add to -5',
        visual: 'factoring_diagram'
      },
      {
        id: 4,
        title: 'Apply Zero Product Property',
        content: 'If (x - 2)(x - 3) = 0, then either (x - 2) = 0 or (x - 3) = 0',
        explanation: 'This gives us two separate linear equations to solve',
        visual: 'zero_product_property'
      },
      {
        id: 5,
        title: 'Solve Each Factor',
        content: 'Solve x - 2 = 0 and x - 3 = 0',
        math: 'x = 2 or x = 3',
        explanation: 'These are our two solutions',
        visual: 'solution_set'
      },
      {
        id: 6,
        title: 'Graph and Verify',
        content: 'The solutions are the x-intercepts of the parabola',
        explanation: 'Where the parabola crosses the x-axis',
        visual: 'parabola_graph'
      }
    ];

    const concepts = [
      {
        name: 'Quadratic Equation',
        definition: 'An equation of the form ax² + bx + c = 0 where a ≠ 0',
        importance: 'Models many real-world phenomena involving acceleration, optimization'
      },
      {
        name: 'Zero Product Property',
        definition: 'If AB = 0, then A = 0 or B = 0',
        importance: 'Fundamental property that allows factoring to work'
      },
      {
        name: 'Parabola',
        definition: 'The U-shaped graph of a quadratic function',
        importance: 'Visual representation helps understand solutions'
      }
    ];

    return {
      steps,
      concepts,
      visualAids: this.generateQuadraticVisuals(),
      commonMistakes: [
        'Forgetting that quadratics can have two solutions',
        'Sign errors in factoring',
        'Not checking solutions in original equation'
      ]
    };
  }

  /**
   * Explain geometry area problems
   */
  explainGeometryArea(problem, userLevel) {
    const steps = [
      {
        id: 1,
        title: 'Identify the Shape',
        content: 'First, determine what geometric shape we\'re working with.',
        explanation: 'Different shapes have different area formulas.',
        visual: 'shape_identification'
      },
      {
        id: 2,
        title: 'Recall the Formula',
        content: 'Remember or look up the area formula for this shape.',
        math: 'Area = length × width (for rectangles)',
        explanation: 'Area formulas are derived from basic principles.',
        visual: 'formula_derivation'
      },
      {
        id: 3,
        title: 'Identify Given Information',
        content: 'Extract the measurements from the problem.',
        explanation: 'Make sure units are consistent.',
        visual: 'labeled_diagram'
      },
      {
        id: 4,
        title: 'Substitute Values',
        content: 'Replace variables in the formula with the given numbers.',
        math: 'Area = 8 × 5 = 40',
        explanation: 'Always include units in your final answer.',
        visual: 'calculation_steps'
      },
      {
        id: 5,
        title: 'Check Reasonableness',
        content: 'Does the answer make sense given the context?',
        explanation: 'Always verify that your answer is reasonable.',
        visual: 'reasonableness_check'
      }
    ];

    return {
      steps,
      concepts: [
        {
          name: 'Area',
          definition: 'The amount of space inside a 2D shape',
          importance: 'Fundamental measurement in geometry and real-world applications'
        }
      ],
      visualAids: this.generateGeometryVisuals(),
      commonMistakes: [
        'Confusing area and perimeter formulas',
        'Unit conversion errors',
        'Not including units in the answer'
      ]
    };
  }

  /**
   * Explain word problems
   */
  explainWordProblem(problem, userLevel) {
    const steps = [
      {
        id: 1,
        title: 'Read and Understand',
        content: 'Read the problem carefully and identify what we need to find.',
        explanation: 'Understanding the question is the most important first step.',
        visual: 'problem_analysis'
      },
      {
        id: 2,
        title: 'Identify Given Information',
        content: 'List all the numbers and facts given in the problem.',
        explanation: 'Organize the information to see relationships clearly.',
        visual: 'information_extraction'
      },
      {
        id: 3,
        title: 'Define Variables',
        content: 'Assign variables to represent unknown quantities.',
        explanation: 'Use meaningful variable names when possible.',
        visual: 'variable_definition'
      },
      {
        id: 4,
        title: 'Set Up Equation',
        content: 'Translate the word problem into a mathematical equation.',
        explanation: 'Look for key words that indicate mathematical operations.',
        visual: 'equation_translation'
      },
      {
        id: 5,
        title: 'Solve the Equation',
        content: 'Use appropriate mathematical techniques to solve.',
        explanation: 'Apply the methods we\'ve learned for this type of equation.',
        visual: 'solution_process'
      },
      {
        id: 6,
        title: 'Check and Interpret',
        content: 'Verify the answer makes sense in the context of the problem.',
        explanation: 'Always relate the mathematical answer back to the real-world situation.',
        visual: 'interpretation'
      }
    ];

    return {
      steps,
      concepts: [
        {
          name: 'Problem Translation',
          definition: 'Converting word problems into mathematical expressions',
          importance: 'Essential skill for applying math to real-world situations'
        }
      ],
      visualAids: this.generateWordProblemVisuals(),
      commonMistakes: [
        'Misunderstanding what the problem is asking',
        'Setting up the equation incorrectly',
        'Not checking if the answer makes sense'
      ]
    };
  }

  /**
   * Generate visual aids for different problem types
   */
  generateLinearEquationVisuals() {
    return [
      {
        type: 'balance_scale',
        description: 'Visual representation of equation balance',
        elements: ['left_side', 'right_side', 'balance_point']
      },
      {
        type: 'number_line',
        description: 'Shows solution point on number line',
        elements: ['line', 'solution_point', 'scale_marks']
      }
    ];
  }

  generateQuadraticVisuals() {
    return [
      {
        type: 'parabola_graph',
        description: 'Graph showing x-intercepts as solutions',
        elements: ['parabola', 'x_intercepts', 'vertex', 'axis_labels']
      },
      {
        type: 'factoring_diagram',
        description: 'Visual representation of factoring process',
        elements: ['factor_tree', 'multiplication_table']
      }
    ];
  }

  generateGeometryVisuals() {
    return [
      {
        type: 'labeled_shape',
        description: 'Geometric shape with dimensions labeled',
        elements: ['shape_outline', 'dimension_labels', 'formula_overlay']
      }
    ];
  }

  generateWordProblemVisuals() {
    return [
      {
        type: 'problem_diagram',
        description: 'Visual representation of the problem scenario',
        elements: ['scenario_illustration', 'given_values', 'unknown_highlighted']
      }
    ];
  }

  /**
   * Assess problem difficulty
   */
  assessDifficulty(problem, problemType) {
    const difficultyFactors = {
      'arithmetic': 1,
      'linear_equation': 2,
      'quadratic_equation': 4,
      'geometry_area': 2,
      'geometry_volume': 3,
      'trigonometry': 4,
      'calculus_derivative': 5,
      'calculus_integral': 5,
      'word_problem': 3
    };

    const baseDifficulty = difficultyFactors[problemType] || 2;
    const complexity = this.analyzeComplexity(problem);
    
    return Math.min(5, baseDifficulty + complexity);
  }

  /**
   * Analyze problem complexity
   */
  analyzeComplexity(problem) {
    const text = problem.question || '';
    let complexity = 0;

    // Check for complexity indicators
    if (/\^/.test(text)) complexity++; // Exponents
    if (/sqrt|√/.test(text)) complexity++; // Square roots
    if (/fraction|\//i.test(text)) complexity++; // Fractions
    if (/decimal|\.d+/.test(text)) complexity++; // Decimals
    if (/negative|minus|-/.test(text)) complexity++; // Negative numbers
    if (text.length > 100) complexity++; // Long problems

    return Math.min(3, complexity);
  }

  /**
   * Generate practice problems
   */
  generatePracticeProblems(problemType) {
    const practiceProblems = {
      'linear_equation': [
        'Solve: 2x + 7 = 15',
        'Solve: 4x - 3 = 13',
        'Solve: -3x + 8 = 2'
      ],
      'quadratic_equation': [
        'Solve: x² - 4x + 3 = 0',
        'Solve: x² + 5x + 6 = 0',
        'Solve: 2x² - 8x + 6 = 0'
      ],
      'geometry_area': [
        'Find the area of a rectangle with length 12 cm and width 8 cm',
        'What is the area of a circle with radius 5 meters?',
        'Calculate the area of a triangle with base 6 feet and height 4 feet'
      ]
    };

    return practiceProblems[problemType] || [
      'Try solving a similar problem with different numbers',
      'Practice the same method with a simpler example'
    ];
  }

  /**
   * Estimate time needed for explanation
   */
  estimateExplanationTime(stepCount, userLevel) {
    const baseTimePerStep = {
      'beginner': 2.5, // minutes per step
      'intermediate': 1.5,
      'advanced': 1,
      'visual': 2
    };

    const timePerStep = baseTimePerStep[userLevel] || 1.5;
    return Math.ceil(stepCount * timePerStep);
  }

  /**
   * General explanation fallback
   */
  explainGeneral(problem, userLevel) {
    return {
      steps: [
        {
          id: 1,
          title: 'Analyze the Problem',
          content: 'Let\'s break down this mathematical problem step by step.',
          explanation: 'Understanding the problem structure is key to finding the solution.',
          visual: 'problem_analysis'
        }
      ],
      concepts: [],
      visualAids: [],
      commonMistakes: ['Not reading the problem carefully', 'Rushing through calculations']
    };
  }

  /**
   * Get explanation adapted to user's learning style
   */
  adaptExplanationToStyle(explanation, learningStyle) {
    const adaptations = {
      visual: this.enhanceVisualElements.bind(this),
      auditory: this.addAudioDescriptions.bind(this),
      kinesthetic: this.addInteractiveElements.bind(this),
      reading: this.addDetailedText.bind(this)
    };

    const adapter = adaptations[learningStyle];
    return adapter ? adapter(explanation) : explanation;
  }

  enhanceVisualElements(explanation) {
    // Add more visual components
    return {
      ...explanation,
      visualEnhancements: true,
      graphicsIntensive: true
    };
  }

  addAudioDescriptions(explanation) {
    // Add audio cues and verbal explanations
    return {
      ...explanation,
      audioDescriptions: explanation.steps.map(step => ({
        ...step,
        audioScript: `Now we ${step.title.toLowerCase()}. ${step.explanation}`
      }))
    };
  }

  addInteractiveElements(explanation) {
    // Add interactive components
    return {
      ...explanation,
      interactiveElements: explanation.steps.map(step => ({
        ...step,
        interactive: true,
        canManipulate: true
      }))
    };
  }

  addDetailedText(explanation) {
    // Add more detailed written explanations
    return {
      ...explanation,
      detailedExplanations: true,
      expandedContent: true
    };
  }

  /**
   * Adapt difficulty level based on user performance and problem complexity
   */
  adaptDifficultyLevel(problem, problemType, currentLevel) {
    const complexity = this.assessProblemComplexity(problem, problemType);
    const userPerformance = this.adaptiveFactors.userPerformance;
    
    let adaptedLevel = currentLevel;
    const adaptations = [];

    // Check if user is struggling (low accuracy, long time)
    if (userPerformance.accuracy < 0.6 || userPerformance.avgTimePerProblem > 180) {
      if (currentLevel === 'advanced') {
        adaptedLevel = 'intermediate';
        adaptations.push('Simplified from advanced to intermediate due to performance');
      } else if (currentLevel === 'intermediate') {
        adaptedLevel = 'beginner';
        adaptations.push('Simplified from intermediate to beginner due to performance');
      }
    }
    
    // Check if user is excelling (high accuracy, fast completion)
    else if (userPerformance.accuracy > 0.9 && userPerformance.avgTimePerProblem < 60) {
      if (currentLevel === 'beginner') {
        adaptedLevel = 'intermediate';
        adaptations.push('Advanced from beginner to intermediate due to excellent performance');
      } else if (currentLevel === 'intermediate') {
        adaptedLevel = 'advanced';
        adaptations.push('Advanced from intermediate to advanced due to excellent performance');
      }
    }

    // Adjust for problem complexity
    if (complexity.cognitiveLoad === 'high' && adaptedLevel === 'advanced') {
      adaptedLevel = 'intermediate';
      adaptations.push('Reduced level due to high problem complexity');
    } else if (complexity.cognitiveLoad === 'low' && adaptedLevel === 'beginner') {
      adaptedLevel = 'intermediate';
      adaptations.push('Increased level due to low problem complexity');
    }

    return adaptedLevel;
  }

  /**
   * Assess problem complexity for adaptive difficulty
   */
  assessProblemComplexity(problem, problemType) {
    const text = problem.question || problem.text || problem;
    
    let conceptCount = 1;
    let stepCount = 3;
    let cognitiveLoad = 'medium';
    const prerequisites = [];

    // Count mathematical concepts
    const concepts = [
      'derivative', 'integral', 'limit', 'quadratic', 'linear', 'polynomial',
      'trigonometry', 'logarithm', 'exponential', 'fraction', 'decimal',
      'geometry', 'area', 'volume', 'perimeter', 'angle', 'triangle',
      'circle', 'square', 'rectangle'
    ];
    
    conceptCount = concepts.filter(concept => 
      text.toLowerCase().includes(concept)
    ).length;

    // Estimate step count based on problem type and complexity
    if (problemType.includes('quadratic')) {
      stepCount = 5;
      prerequisites.push('linear equations', 'factoring');
    } else if (problemType.includes('linear')) {
      stepCount = 3;
      prerequisites.push('basic algebra');
    } else if (problemType.includes('geometry')) {
      stepCount = 4;
      prerequisites.push('area formulas', 'basic geometry');
    } else if (problemType.includes('word_problem')) {
      stepCount = 6;
      prerequisites.push('problem interpretation', 'equation setup');
    }

    // Determine cognitive load
    if (conceptCount > 3 || stepCount > 5) {
      cognitiveLoad = 'high';
    } else if (conceptCount <= 1 && stepCount <= 3) {
      cognitiveLoad = 'low';
    }

    return {
      conceptCount,
      stepCount,
      cognitiveLoad,
      prerequisites
    };
  }

  /**
   * Create interactive solution with user input steps
   */
  createInteractiveSolution(problem, options = {}) {
    const explanation = this.explainProblem(problem, options);
    
    const interactiveSteps = explanation.steps.map((step, index) => ({
      ...step,
      stepIndex: index,
      requiresInput: true,
      inputType: this.determineInputType(step),
      inputPrompt: this.generateInputPrompt(step),
      placeholder: this.generatePlaceholder(step),
      hint: step.hint || this.generateHint(step),
      expectedAnswer: this.extractExpectedAnswer(step),
      validationRules: this.getValidationRules(step),
      mistakeExplanation: this.getMistakeExplanation(step),
      keyboardType: this.getKeyboardType(step)
    }));

    return {
      ...explanation,
      interactiveSteps,
      startTime: Date.now(),
      totalSteps: interactiveSteps.length
    };
  }

  /**
   * Determine input type for interactive step
   */
  determineInputType(step) {
    if (step.equation && step.equation.includes('x')) {
      return 'algebraic_expression';
    } else if (step.title.toLowerCase().includes('calculate')) {
      return 'numerical';
    } else if (step.title.toLowerCase().includes('identify')) {
      return 'multiple_choice';
    }
    return 'text';
  }

  /**
   * Generate input prompt for step
   */
  generateInputPrompt(step) {
    const stepType = step.title.toLowerCase();
    
    if (stepType.includes('solve')) {
      return 'What is the value of the variable?';
    } else if (stepType.includes('substitute')) {
      return 'Enter the substituted expression:';
    } else if (stepType.includes('simplify')) {
      return 'Enter the simplified form:';
    } else if (stepType.includes('calculate')) {
      return 'What is the result of this calculation?';
    }
    
    return 'Enter your answer:';
  }

  /**
   * Generate placeholder text
   */
  generatePlaceholder(step) {
    const inputType = this.determineInputType(step);
    
    switch (inputType) {
      case 'algebraic_expression':
        return 'e.g., 2x + 3';
      case 'numerical':
        return 'e.g., 42';
      case 'multiple_choice':
        return 'Select an option';
      default:
        return 'Enter your answer...';
    }
  }

  /**
   * Generate hint for interactive step
   */
  generateHint(step) {
    const stepType = step.title.toLowerCase();
    
    if (stepType.includes('isolate')) {
      return 'Try moving terms to one side of the equation';
    } else if (stepType.includes('substitute')) {
      return 'Replace the variable with the given value';
    } else if (stepType.includes('factor')) {
      return 'Look for common factors or use factoring patterns';
    } else if (stepType.includes('simplify')) {
      return 'Combine like terms and reduce fractions';
    }
    
    return 'Review the previous steps and think about what operation is needed';
  }

  /**
   * Extract expected answer from step
   */
  extractExpectedAnswer(step) {
    // This would typically parse the step content to find the answer
    // For now, returning a placeholder that would be populated by the explanation generation
    return step.result || step.answer || 'answer_placeholder';
  }

  /**
   * Validate step answer
   */
  validateStepAnswer(step, userAnswer) {
    const expected = step.expectedAnswer;
    const cleaned = userAnswer.trim().replace(/\s+/g, ' ');
    
    // Handle different answer formats
    if (step.inputType === 'numerical') {
      const userNum = parseFloat(cleaned);
      const expectedNum = parseFloat(expected);
      return Math.abs(userNum - expectedNum) < 0.01; // Allow small rounding errors
    } else if (step.inputType === 'algebraic_expression') {
      // Simplified algebraic comparison (would need more sophisticated parsing)
      return this.compareAlgebraicExpressions(cleaned, expected);
    }
    
    return cleaned.toLowerCase() === expected.toLowerCase();
  }

  /**
   * Compare algebraic expressions (simplified version)
   */
  compareAlgebraicExpressions(expr1, expr2) {
    // This is a simplified comparison - would need a proper algebra parser
    const normalize = (expr) => expr.replace(/\s+/g, '').toLowerCase();
    return normalize(expr1) === normalize(expr2);
  }

  /**
   * Get validation rules for step
   */
  getValidationRules(step) {
    const inputType = step.inputType || this.determineInputType(step);
    
    const rules = {
      required: true,
      minLength: 1
    };

    if (inputType === 'numerical') {
      rules.pattern = /^-?\d*\.?\d+$/;
      rules.errorMessage = 'Please enter a valid number';
    } else if (inputType === 'algebraic_expression') {
      rules.pattern = /^[0-9x\+\-\*\/\(\)\s\.]+$/;
      rules.errorMessage = 'Please enter a valid algebraic expression';
    }

    return rules;
  }

  /**
   * Get mistake explanation for step
   */
  getMistakeExplanation(step) {
    const stepType = step.title.toLowerCase();
    
    if (stepType.includes('isolate')) {
      return 'Remember to perform the same operation on both sides of the equation';
    } else if (stepType.includes('substitute')) {
      return 'Make sure to substitute the value correctly and maintain the equation structure';
    } else if (stepType.includes('calculate')) {
      return 'Double-check your arithmetic - order of operations matters';
    }
    
    return 'Review the step explanation and try again';
  }

  /**
   * Get appropriate keyboard type
   */
  getKeyboardType(step) {
    const inputType = step.inputType || this.determineInputType(step);
    
    switch (inputType) {
      case 'numerical':
        return 'numeric';
      case 'algebraic_expression':
        return 'ascii-capable';
      default:
        return 'default';
    }
  }

  /**
   * Update user performance metrics for adaptive learning
   */
  updateUserPerformance(accuracy, timeSpent, mistakeTypes = []) {
    const performance = this.adaptiveFactors.userPerformance;
    
    // Update running averages
    performance.accuracy = (performance.accuracy * 0.8) + (accuracy * 0.2);
    performance.avgTimePerProblem = (performance.avgTimePerProblem * 0.8) + (timeSpent * 0.2);
    
    // Track mistake patterns
    mistakeTypes.forEach(mistake => {
      const existing = performance.mistakePatterns.find(m => m.type === mistake);
      if (existing) {
        existing.count++;
      } else {
        performance.mistakePatterns.push({ type: mistake, count: 1 });
      }
    });
    
    // Limit mistake pattern tracking
    performance.mistakePatterns = performance.mistakePatterns
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}

export default MathExplainer;