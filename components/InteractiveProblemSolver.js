import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MathExplainer } from '../utils/MathExplainer';
import { HapticManager } from '../utils/HapticManager';
import { BookLoadingScreen } from '../components/BookLoadingAnimation';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

export default function InteractiveProblemSolver({ problem, onSolutionComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userInputs, setUserInputs] = useState([]);
  const [explanation, setExplanation] = useState(null);
  const [showHints, setShowHints] = useState(false);
  const [mistakes, setMistakes] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));
  
  const inputRefs = useRef([]);
  const mathExplainer = new MathExplainer();

  useEffect(() => {
    generateInteractiveSolution();
    animateEntrance();
  }, []);

  const generateInteractiveSolution = async () => {
    const result = await mathExplainer.createInteractiveSolution(problem, {
      allowUserInput: true,
      showHints: true,
      trackMistakes: true
    });
    
    setExplanation(result);
    setUserInputs(new Array(result.interactiveSteps.length).fill(''));
  };

  const animateEntrance = () => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start();
  };

  const animateStepProgress = () => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true
      })
    ]).start();
  };

  const handleInputChange = (stepIndex, value) => {
    const newInputs = [...userInputs];
    newInputs[stepIndex] = value;
    setUserInputs(newInputs);
  };

  const validateStepInput = (stepIndex) => {
    if (!explanation) return false;

    const step = explanation.interactiveSteps[stepIndex];
    const userInput = userInputs[stepIndex].trim();
    
    if (!userInput) {
      Alert.alert('Missing Input', 'Please enter your answer for this step.');
      return false;
    }

    const isCorrect = mathExplainer.validateStepAnswer(step, userInput);
    
    if (!isCorrect) {
      const mistake = {
        stepIndex,
        userAnswer: userInput,
        correctAnswer: step.expectedAnswer,
        explanation: step.mistakeExplanation || 'Not quite right. Try again!'
      };
      
      setMistakes([...mistakes, mistake]);
      HapticManager.performHaptic('error');
      
      Alert.alert(
        'Try Again',
        mistake.explanation,
        [
          { text: 'Show Hint', onPress: () => setShowHints(true) },
          { text: 'Continue', style: 'default' }
        ]
      );
      
      return false;
    }

    HapticManager.performHaptic('success');
    return true;
  };

  const handleNextStep = () => {
    if (!validateStepInput(currentStep)) return;

    animateStepProgress();
    
    if (currentStep < explanation.interactiveSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setTimeout(() => {
        inputRefs.current[currentStep + 1]?.focus();
      }, 300);
    } else {
      completeSolution();
    }
  };

  const completeSolution = () => {
    setIsComplete(true);
    
    const solutionData = {
      problem,
      userAnswers: userInputs,
      mistakes: mistakes.length,
      hintsUsed: showHints,
      timeSpent: Date.now() - (explanation?.startTime || Date.now()),
      stepsCompleted: explanation.interactiveSteps.length
    };
    
    HapticManager.performHaptic('success');
    onSolutionComplete?.(solutionData);
  };

  const handleShowHint = (stepIndex) => {
    setShowHints(true);
    HapticManager.performHaptic('light');
  };

  const resetSolver = () => {
    setCurrentStep(0);
    setUserInputs(new Array(explanation?.interactiveSteps.length || 0).fill(''));
    setMistakes([]);
    setShowHints(false);
    setIsComplete(false);
    
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  };

  const renderProgressIndicator = () => {
    if (!explanation) return null;

    const progress = (currentStep + 1) / explanation.interactiveSteps.length;
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                opacity: animatedValue
              }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {explanation.interactiveSteps.length}
        </Text>
      </View>
    );
  };

  const renderCurrentStep = () => {
    if (!explanation || isComplete) return null;

    const step = explanation.interactiveSteps[currentStep];
    if (!step) return null;

    return (
      <Animated.View
        style={[
          styles.stepContainer,
          {
            opacity: animatedValue,
            transform: [{
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })
            }]
          }
        ]}
      >
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepDescription}>{step.description}</Text>

        {step.equation && (
          <View style={styles.equationContainer}>
            <Text style={styles.equation}>{step.equation}</Text>
          </View>
        )}

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>{step.inputPrompt}</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              ref={ref => inputRefs.current[currentStep] = ref}
              style={styles.input}
              value={userInputs[currentStep]}
              onChangeText={(value) => handleInputChange(currentStep, value)}
              placeholder={step.placeholder || "Enter your answer..."}
              keyboardType={step.keyboardType || 'numeric'}
              returnKeyType="done"
              onSubmitEditing={handleNextStep}
              autoFocus={currentStep === 0}
            />
            
            <TouchableOpacity
              style={styles.hintButton}
              onPress={() => handleShowHint(currentStep)}
            >
              <Ionicons name="help-circle-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {showHints && step.hint && (
            <Animated.View style={[styles.hintContainer, { opacity: animatedValue }]}>
              <Ionicons name="bulb-outline" size={16} color="#ffa726" />
              <Text style={styles.hintText}>{step.hint}</Text>
            </Animated.View>
          )}
        </View>

        {step.workingSpace && (
          <View style={styles.workingSpace}>
            <Text style={styles.workingTitle}>Working Space:</Text>
            <Text style={styles.workingContent}>{step.workingSpace}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            !userInputs[currentStep] && styles.nextButtonDisabled
          ]}
          onPress={handleNextStep}
          disabled={!userInputs[currentStep]}
        >
          <Text style={[
            styles.nextButtonText,
            !userInputs[currentStep] && styles.nextButtonTextDisabled
          ]}>
            {currentStep === explanation.interactiveSteps.length - 1 ? 'Complete' : 'Next Step'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderCompletionSummary = () => {
    if (!isComplete || !explanation) return null;

    const accuracy = ((explanation.interactiveSteps.length - mistakes.length) / explanation.interactiveSteps.length) * 100;
    
    return (
      <Animated.View style={[styles.completionContainer, { opacity: animatedValue }]}>
        <View style={styles.completionHeader}>
          <Ionicons name="checkmark-circle" size={48} color="#34c759" />
          <Text style={styles.completionTitle}>Solution Complete!</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Accuracy</Text>
            <Text style={styles.statValue}>{accuracy.toFixed(0)}%</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Steps</Text>
            <Text style={styles.statValue}>{explanation.interactiveSteps.length}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Mistakes</Text>
            <Text style={styles.statValue}>{mistakes.length}</Text>
          </View>
        </View>

        {mistakes.length > 0 && (
          <View style={styles.mistakesSection}>
            <Text style={styles.mistakesTitle}>Areas for Improvement:</Text>
            {mistakes.map((mistake, index) => (
              <View key={index} style={styles.mistakeItem}>
                <Text style={styles.mistakeStep}>Step {mistake.stepIndex + 1}</Text>
                <Text style={styles.mistakeDetail}>
                  Your answer: {mistake.userAnswer}
                </Text>
                <Text style={styles.mistakeDetail}>
                  Correct answer: {mistake.correctAnswer}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.completionActions}>
          <TouchableOpacity style={styles.actionButton} onPress={resetSolver}>
            <Ionicons name="refresh" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryActionButton]}
            onPress={() => onSolutionComplete?.({ accuracy, mistakes: mistakes.length })}
          >
            <Ionicons name="arrow-forward" size={20} color="#fff" />
            <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  if (!explanation) {
    return (
      <BookLoadingScreen 
        message="Preparing interactive solution..."
        animationSize={180}
      />
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.problemText}>{problem}</Text>
        {renderProgressIndicator()}
      </View>

      {!isComplete ? renderCurrentStep() : renderCompletionSummary()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500'
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9'
  },
  problemText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'monospace'
  },
  progressContainer: {
    alignItems: 'center'
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e1e5e9',
    borderRadius: 3,
    marginBottom: 8
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.math,
    borderRadius: 3
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  stepContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 15
  },
  equationContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF'
  },
  equation: {
    fontSize: 18,
    fontFamily: 'monospace',
    color: '#333',
    textAlign: 'center'
  },
  inputSection: {
    marginBottom: 20
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    fontFamily: 'monospace'
  },
  hintButton: {
    marginLeft: 10,
    padding: 8
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbf0',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7'
  },
  hintText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#e17055',
    lineHeight: 20
  },
  workingSpace: {
    backgroundColor: '#fafafa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20
  },
  workingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  workingContent: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'monospace',
    lineHeight: 20
  },
  nextButton: {
    backgroundColor: Colors.math,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center'
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc'
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  nextButtonTextDisabled: {
    color: '#999'
  },
  completionContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  completionHeader: {
    alignItems: 'center',
    marginBottom: 20
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20
  },
  statItem: {
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  mistakesSection: {
    width: '100%',
    marginBottom: 20
  },
  mistakesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
    marginBottom: 10
  },
  mistakeItem: {
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ff6b6b'
  },
  mistakeStep: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c53030',
    marginBottom: 4
  },
  mistakeDetail: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace'
  },
  completionActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    flex: 0.48
  },
  primaryActionButton: {
    backgroundColor: '#007AFF'
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF'
  },
  primaryActionButtonText: {
    color: '#fff'
  }
});