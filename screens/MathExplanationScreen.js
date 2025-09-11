import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MathExplainer } from '../utils/MathExplainer';
import { HapticManager } from '../utils/HapticManager';
import { BookLoadingScreen } from '../components/BookLoadingAnimation';
import { Colors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');

export default function MathExplanationScreen({ route, navigation }) {
  const { problem, answer, userAnswer, isCorrect } = route.params;
  const [currentStep, setCurrentStep] = useState(0);
  const [explanation, setExplanation] = useState(null);
  const [showVisualAid, setShowVisualAid] = useState(true);
  const [animatedValues] = useState({
    stepProgress: new Animated.Value(0),
    fadeIn: new Animated.Value(0),
    slideIn: new Animated.Value(50)
  });

  const scrollViewRef = useRef(null);
  const mathExplainer = new MathExplainer();

  useEffect(() => {
    generateExplanation();
    animateEntrance();
  }, []);

  useEffect(() => {
    animateStepTransition();
  }, [currentStep]);

  const generateExplanation = async () => {
    const result = await mathExplainer.explainProblem(problem, {
      includeVisualAids: true,
      userLevel: 'intermediate',
      showCommonMistakes: !isCorrect
    });
    setExplanation(result);
  };

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(animatedValues.fadeIn, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(animatedValues.slideIn, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true
      })
    ]).start();
  };

  const animateStepTransition = () => {
    if (!explanation) return;
    
    const progress = (currentStep + 1) / explanation.steps.length;
    
    Animated.timing(animatedValues.stepProgress, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false
    }).start();
  };

  const handleNextStep = () => {
    if (!explanation || currentStep >= explanation.steps.length - 1) return;
    
    HapticManager.performHaptic('light');
    setCurrentStep(currentStep + 1);
    
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handlePreviousStep = () => {
    if (currentStep <= 0) return;
    
    HapticManager.performHaptic('light');
    setCurrentStep(currentStep - 1);
    
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleStepJump = (stepIndex) => {
    HapticManager.performHaptic('medium');
    setCurrentStep(stepIndex);
  };

  const renderProgressBar = () => {
    if (!explanation) return null;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: animatedValues.stepProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {explanation.steps.length}
        </Text>
      </View>
    );
  };

  const renderStepIndicators = () => {
    if (!explanation) return null;

    return (
      <View style={styles.stepIndicators}>
        {explanation.steps.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.stepDot,
              index === currentStep && styles.stepDotActive,
              index < currentStep && styles.stepDotCompleted
            ]}
            onPress={() => handleStepJump(index)}
          >
            {index < currentStep ? (
              <Ionicons name="checkmark" size={12} color="#fff" />
            ) : (
              <Text style={[
                styles.stepDotText,
                index === currentStep && styles.stepDotTextActive
              ]}>
                {index + 1}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderVisualAid = (step) => {
    if (!showVisualAid || !step.visualAid) return null;

    return (
      <View style={styles.visualAidContainer}>
        <Text style={styles.visualAidTitle}>Visual Representation</Text>
        {step.visualAid.type === 'graph' && (
          <View style={styles.graphPlaceholder}>
            <Text style={styles.graphText}>{step.visualAid.description}</Text>
          </View>
        )}
        {step.visualAid.type === 'diagram' && (
          <View style={styles.diagramContainer}>
            <Text style={styles.diagramText}>{step.visualAid.content}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderCommonMistake = (mistake) => {
    return (
      <View style={styles.mistakeContainer}>
        <View style={styles.mistakeHeader}>
          <Ionicons name="warning" size={20} color="#ff6b6b" />
          <Text style={styles.mistakeTitle}>Common Mistake</Text>
        </View>
        <Text style={styles.mistakeText}>{mistake.description}</Text>
        <Text style={styles.mistakeCorrection}>{mistake.correction}</Text>
      </View>
    );
  };

  const renderCurrentStep = () => {
    if (!explanation) return null;

    const step = explanation.steps[currentStep];
    if (!step) return null;

    return (
      <Animated.View
        style={[
          styles.stepContainer,
          {
            opacity: animatedValues.fadeIn,
            transform: [{ translateY: animatedValues.slideIn }]
          }
        ]}
      >
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepDescription}>{step.description}</Text>
        </View>

        {step.equation && (
          <View style={styles.equationContainer}>
            <Text style={styles.equation}>{step.equation}</Text>
          </View>
        )}

        {step.explanation && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationText}>{step.explanation}</Text>
          </View>
        )}

        {renderVisualAid(step)}

        {step.workingOut && (
          <View style={styles.workingContainer}>
            <Text style={styles.workingTitle}>Working:</Text>
            {step.workingOut.map((work, index) => (
              <Text key={index} style={styles.workingText}>{work}</Text>
            ))}
          </View>
        )}

        {step.keyLearning && (
          <View style={styles.keyLearningContainer}>
            <View style={styles.keyLearningHeader}>
              <Ionicons name="bulb" size={20} color="#ffa726" />
              <Text style={styles.keyLearningTitle}>Key Learning</Text>
            </View>
            <Text style={styles.keyLearningText}>{step.keyLearning}</Text>
          </View>
        )}

        {step.commonMistakes && step.commonMistakes.map((mistake, index) => (
          <View key={index}>
            {renderCommonMistake(mistake)}
          </View>
        ))}
      </Animated.View>
    );
  };

  const renderNavigationButtons = () => {
    if (!explanation) return null;

    return (
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentStep === 0 && styles.navButtonDisabled
          ]}
          onPress={handlePreviousStep}
          disabled={currentStep === 0}
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={currentStep === 0 ? '#ccc' : '#007AFF'} 
          />
          <Text style={[
            styles.navButtonText,
            currentStep === 0 && styles.navButtonTextDisabled
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            currentStep >= explanation.steps.length - 1 && styles.navButtonDisabled
          ]}
          onPress={handleNextStep}
          disabled={currentStep >= explanation.steps.length - 1}
        >
          <Text style={[
            styles.navButtonText,
            currentStep >= explanation.steps.length - 1 && styles.navButtonTextDisabled
          ]}>
            Next
          </Text>
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={currentStep >= explanation.steps.length - 1 ? '#ccc' : '#007AFF'} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Step-by-Step Solution</Text>
          <Text style={styles.problemText}>{problem}</Text>
          
          {!isCorrect && (
            <View style={styles.incorrectBadge}>
              <Ionicons name="information-circle" size={16} color="#ff6b6b" />
              <Text style={styles.incorrectText}>
                Your answer: {userAnswer} | Correct: {answer}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.visualToggle}
          onPress={() => {
            setShowVisualAid(!showVisualAid);
            HapticManager.performHaptic('light');
          }}
        >
          <Ionicons 
            name={showVisualAid ? 'eye' : 'eye-off'} 
            size={20} 
            color="#007AFF" 
          />
        </TouchableOpacity>
      </View>
    );
  };

  if (!explanation) {
    return (
      <BookLoadingScreen 
        message="Generating explanation..."
        animationSize={200}
      />
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderProgressBar()}
      {renderStepIndicators()}
      
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderCurrentStep()}
        
        {currentStep === explanation.steps.length - 1 && explanation.practiceProblems && (
          <View style={styles.practiceContainer}>
            <Text style={styles.practiceTitle}>Practice Problems</Text>
            {explanation.practiceProblems.map((practice, index) => (
              <View key={index} style={styles.practiceItem}>
                <Text style={styles.practiceText}>{practice.problem}</Text>
                <Text style={styles.practiceHint}>Hint: {practice.hint}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {renderNavigationButtons()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9'
  },
  closeButton: {
    padding: 8
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 15
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  problemText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'monospace'
  },
  incorrectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff5f5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fed7d7'
  },
  incorrectText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#c53030'
  },
  visualToggle: {
    padding: 8
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff'
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e1e5e9',
    borderRadius: 2,
    marginBottom: 8
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9'
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e1e5e9',
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepDotActive: {
    backgroundColor: '#007AFF'
  },
  stepDotCompleted: {
    backgroundColor: '#34c759'
  },
  stepDotText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600'
  },
  stepDotTextActive: {
    color: '#fff'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 20
  },
  stepContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  stepHeader: {
    marginBottom: 15
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24
  },
  equationContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF'
  },
  equation: {
    fontSize: 18,
    fontFamily: 'monospace',
    color: '#333',
    textAlign: 'center'
  },
  explanationContainer: {
    marginVertical: 15
  },
  explanationText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24
  },
  visualAidContainer: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cce7ff'
  },
  visualAidTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
    marginBottom: 10
  },
  graphPlaceholder: {
    height: 150,
    backgroundColor: '#fff',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  graphText: {
    color: '#666',
    fontSize: 14
  },
  diagramContainer: {
    padding: 10
  },
  diagramText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace'
  },
  workingContainer: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#fafafa',
    borderRadius: 8
  },
  workingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10
  },
  workingText: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'monospace',
    marginVertical: 2
  },
  keyLearningContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#fffbf0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7'
  },
  keyLearningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  keyLearningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e17055',
    marginLeft: 8
  },
  keyLearningText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20
  },
  mistakeContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7d7'
  },
  mistakeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  mistakeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c53030',
    marginLeft: 8
  },
  mistakeText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 8
  },
  mistakeCorrection: {
    fontSize: 14,
    color: '#38a169',
    lineHeight: 20,
    fontWeight: '500'
  },
  practiceContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f0f8ff',
    borderRadius: 12
  },
  practiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  practiceItem: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8
  },
  practiceText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontFamily: 'monospace'
  },
  practiceHint: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic'
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9'
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15
  },
  navButtonDisabled: {
    opacity: 0.5
  },
  navButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginHorizontal: 8
  },
  navButtonTextDisabled: {
    color: '#ccc'
  }
});