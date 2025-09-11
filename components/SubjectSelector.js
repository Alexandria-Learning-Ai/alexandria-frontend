// components/SubjectSelector.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Keyboard
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { BookLoadingAnimation } from '../components/BookLoadingAnimation';
import logger from '../utils/logger';


const SubjectSelector = ({
  visible,
  onClose,
  onSubjectSelect,
  userId = 'anonymous',
  theme = 'light',
  currentSubject = null,
  onValidationRequest = null // ✅ NEW: Optional validation callback
}) => {
  // State management
  const [searchText, setSearchText] = useState('');
  const [predictionText, setPredictionText] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  // ✅ NEW: Validation state
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  
  // Refs
  const searchInputRef = useRef(null);
  const predictionTimeoutRef = useRef(null);

  // Pre-established subjects with categories
  const defaultSubjects = [
    // Core Academic Subjects
    { key: 'mathematics', name: 'Mathematics', type: 'academic', icon: 'calculator', color: '#E74C3C' },
    { key: 'science', name: 'Science', type: 'academic', icon: 'flask', color: '#3498DB' },
    { key: 'english', name: 'English/Language Arts', type: 'academic', icon: 'book', color: '#9B59B6' },
    { key: 'history', name: 'History', type: 'academic', icon: 'landmark', color: '#F39C12' },
    { key: 'geography', name: 'Geography', type: 'academic', icon: 'globe', color: '#16A085' },
    { key: 'biology', name: 'Biology', type: 'academic', icon: 'dna', color: '#27AE60' },
    { key: 'chemistry', name: 'Chemistry', type: 'academic', icon: 'atom', color: '#8E44AD' },
    { key: 'physics', name: 'Physics', type: 'academic', icon: 'magnet', color: '#E67E22' },
    
    // Specialized Math
    { key: 'algebra', name: 'Algebra', type: 'math', icon: 'square-root-alt', color: '#E74C3C' },
    { key: 'geometry', name: 'Geometry', type: 'math', icon: 'shapes', color: '#E74C3C' },
    { key: 'calculus', name: 'Calculus', type: 'math', icon: 'infinity', color: '#E74C3C' },
    { key: 'statistics', name: 'Statistics', type: 'math', icon: 'chart-bar', color: '#E74C3C' },
    
    // Languages
    { key: 'spanish', name: 'Spanish', type: 'language', icon: 'language', color: '#F39C12' },
    { key: 'french', name: 'French', type: 'language', icon: 'language', color: '#3498DB' },
    { key: 'german', name: 'German', type: 'language', icon: 'language', color: '#34495E' },
    { key: 'mandarin', name: 'Mandarin Chinese', type: 'language', icon: 'language', color: '#E74C3C' },
    
    // Other Subjects
    { key: 'computer_science', name: 'Computer Science', type: 'technical', icon: 'laptop-code', color: '#2C3E50' },
    { key: 'psychology', name: 'Psychology', type: 'social', icon: 'brain', color: '#9B59B6' },
    { key: 'economics', name: 'Economics', type: 'social', icon: 'chart-line', color: '#16A085' },
    { key: 'philosophy', name: 'Philosophy', type: 'humanities', icon: 'lightbulb', color: '#34495E' },
    { key: 'art', name: 'Art & Design', type: 'creative', icon: 'palette', color: '#F39C12' },
    { key: 'music', name: 'Music', type: 'creative', icon: 'music', color: '#9B59B6' }
  ];

  // Predictive text suggestions
  const commonTopicStarters = [
    'Introduction to', 'Advanced', 'Basic', 'Fundamentals of', 'History of',
    'Modern', 'Classical', 'Applied', 'Theoretical', 'Practical'
  ];

  const subjectKeywords = {
    math: ['algebra', 'geometry', 'calculus', 'trigonometry', 'arithmetic', 'statistics'],
    science: ['biology', 'chemistry', 'physics', 'earth science', 'astronomy', 'botany'],
    english: ['literature', 'grammar', 'writing', 'reading', 'poetry', 'prose'],
    history: ['world war', 'ancient', 'medieval', 'renaissance', 'revolution', 'civilization'],
    computer: ['programming', 'algorithms', 'data structures', 'web development', 'artificial intelligence']
  };

  // Load subjects on mount
  useEffect(() => {
    if (visible) {
      loadSubjects();
      // Focus search input when modal opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [visible, userId]);

  // Filter subjects when search text changes
  useEffect(() => {
    filterSubjects();
    handlePredictiveText();
  }, [filterSubjects, handlePredictiveText]);

  // Separate useEffect for validation to prevent loops
  useEffect(() => {
    if (onValidationRequest && searchText.trim()) {
      // Check if current search has no matches (indicating custom subject)
      const hasMatches = subjects.some(subject =>
        subject.name.toLowerCase().includes(searchText.toLowerCase()) ||
        subject.key.toLowerCase().includes(searchText.toLowerCase())
      );
      
      if (!hasMatches) {
        const validationTimeout = setTimeout(() => {
          validateSubjectName(searchText.trim());
        }, 1000); // 1 second delay
        
        return () => clearTimeout(validationTimeout);
      } else {
        setValidationResult(null); // Clear validation when matches are found
      }
    } else {
      setValidationResult(null); // Clear validation when no search text
    }
  }, [searchText, subjects, validateSubjectName]);

  // Load subjects from Firestore and combine with defaults
  const loadSubjects = async () => {
    setLoading(true);
    try {
      let allSubjects = [...defaultSubjects];

      if (userId && userId !== 'anonymous') {
        try {
          // Load user's custom subjects - simplified query without orderBy to avoid index requirements
          const customSubjectsQuery = query(
            collection(db, 'user_subjects'),
            where('userId', '==', userId),
            limit(50)
          );

          const snapshot = await getDocs(customSubjectsQuery);
          const customSubjects = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'custom'
          }));

          // Sort custom subjects by name locally instead of using Firestore orderBy
          customSubjects.sort((a, b) => a.name.localeCompare(b.name));
          allSubjects = [...allSubjects, ...customSubjects];
        } catch (customError) {
          logger.warn('⚠️ Could not load custom subjects:', customError.message);
          // Continue with just default subjects
        }
      }

      setSubjects(allSubjects);
      setFilteredSubjects(allSubjects);
    } catch (error) {
      logger.error('❌ Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter subjects based on search text
  const filterSubjects = useCallback(() => {
    if (!searchText.trim()) {
      setFilteredSubjects(subjects);
      return;
    }

    const filtered = subjects.filter(subject =>
      subject.name.toLowerCase().includes(searchText.toLowerCase()) ||
      subject.key.toLowerCase().includes(searchText.toLowerCase()) ||
      (subject.type && subject.type.toLowerCase().includes(searchText.toLowerCase()))
    );

    setFilteredSubjects(filtered);
  }, [searchText, subjects]);

  // Handle predictive text
  const handlePredictiveText = useCallback(() => {
    if (predictionTimeoutRef.current) {
      clearTimeout(predictionTimeoutRef.current);
    }

    if (!searchText.trim() || searchText.length < 2) {
      setPredictionText('');
      setShowPredictions(false);
      return;
    }

    predictionTimeoutRef.current = setTimeout(() => {
      generatePrediction();
    }, 300);
  }, [searchText]);

  // Generate predictive text suggestions
  const generatePrediction = () => {
    const search = searchText.toLowerCase();
    let suggestions = [];

    // Check for exact matches in existing subjects
    const exactMatch = subjects.find(s => 
      s.name.toLowerCase().startsWith(search)
    );
    
    if (exactMatch && exactMatch.name.toLowerCase() !== search) {
      suggestions.push(exactMatch.name);
    }

    // Check for keyword matches
    Object.entries(subjectKeywords).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (keyword.startsWith(search) && keyword !== search) {
          const capitalized = keyword.charAt(0).toUpperCase() + keyword.slice(1);
          if (!suggestions.includes(capitalized)) {
            suggestions.push(capitalized);
          }
        }
      });
    });

    // Add common topic starters
    commonTopicStarters.forEach(starter => {
      if (search.length >= 3) {
        const suggestion = `${starter} ${search.charAt(0).toUpperCase() + search.slice(1)}`;
        if (!suggestions.includes(suggestion)) {
          suggestions.push(suggestion);
        }
      }
    });

    if (suggestions.length > 0) {
      setPredictionText(suggestions[0]);
      setShowPredictions(true);
    } else {
      setPredictionText('');
      setShowPredictions(false);
    }
  };

  // Accept prediction
  const acceptPrediction = () => {
    if (predictionText) {
      setSearchText(predictionText);
      setPredictionText('');
      setShowPredictions(false);
    }
  };

  // ✅ NEW: Validate subject with parent callback
  const validateSubjectName = useCallback(async (subjectName) => {
    if (!onValidationRequest || !subjectName.trim()) {
      return null;
    }

    setValidating(true);
    try {
      const result = await onValidationRequest(subjectName.trim());
      setValidationResult(result);
      return result;
    } catch (error) {
      logger.error('❌ Error validating subject:', error);
      return null;
    } finally {
      setValidating(false);
    }
  }, [onValidationRequest]);

  // Create new custom subject
  const createCustomSubject = async () => {
    if (!searchText.trim()) {
      Alert.alert('Invalid Subject', 'Please enter a subject name.');
      return;
    }

    if (userId === 'anonymous') {
      Alert.alert(
        'Login Required',
        'Please log in to create custom subjects.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue as Guest', onPress: () => selectGuestSubject() }
        ]
      );
      return;
    }

    setCreating(true);
    
    // ✅ NEW: Validate before creating
    let validation = null;
    if (onValidationRequest) {
      validation = await validateSubjectName(searchText.trim());
    }
    
    try {
      const newSubject = {
        name: searchText.trim(),
        key: `custom_${Date.now()}`,
        userId,
        type: 'custom',
        icon: 'book',
        color: '#9B59B6',
        createdAt: new Date(),
        usageCount: 0,
        validation: validation // Include validation result
      };

      await addDoc(collection(db, 'user_subjects'), newSubject);
      
      // Add to local state
      const updatedSubjects = [newSubject, ...subjects];
      setSubjects(updatedSubjects);
      
      // Select the new subject
      onSubjectSelect(newSubject);
      
      const validationMessage = validation?.valid 
        ? `✅ "${newSubject.name}" is recognized and has been created!`
        : validation?.message 
          ? `"${newSubject.name}" has been created. ${validation.message}`
          : `"${newSubject.name}" has been created and selected!`;
      
      Alert.alert('Success', validationMessage);
    } catch (error) {
      logger.error('❌ Error creating subject:', error);
      Alert.alert('Error', 'Failed to create custom subject. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Select subject as guest (temporary)
  const selectGuestSubject = () => {
    const guestSubject = {
      name: searchText.trim(),
      key: `guest_${Date.now()}`,
      type: 'guest',
      icon: 'book',
      color: '#95A5A6'
    };
    
    onSubjectSelect(guestSubject);
  };

  // Handle subject selection
  const handleSubjectSelection = (subject) => {
    onSubjectSelect(subject);
    setSearchText('');
    setPredictionText('');
    setShowPredictions(false);
  };

  // Clear search
  const clearSearch = () => {
    setSearchText('');
    setPredictionText('');
    setShowPredictions(false);
    setFilteredSubjects(subjects);
  };

  // Group subjects by type
  const groupedSubjects = filteredSubjects.reduce((groups, subject) => {
    const type = subject.type || 'other';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(subject);
    return groups;
  }, {});

  const typeOrder = ['academic', 'math', 'language', 'technical', 'social', 'humanities', 'creative', 'custom', 'guest', 'other'];
  const typeLabels = {
    academic: '🎓 Core Academic',
    math: '🧮 Mathematics',
    language: '🌍 Languages', 
    technical: '💻 Technical',
    social: '👥 Social Sciences',
    humanities: '📚 Humanities',
    creative: '🎨 Creative Arts',
    custom: '📝 Your Custom Subjects',
    guest: '👤 Guest Subjects',
    other: '📋 Other'
  };

  const renderSubjectItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.subjectItem,
        currentSubject?.key === item.key && styles.selectedSubjectItem
      ]}
      onPress={() => handleSubjectSelection(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.subjectIcon, { backgroundColor: item.color || '#9B59B6' }]}>
        <FontAwesome5 name={item.icon || 'book'} size={16} color="#FFFFFF" />
      </View>
      <View style={styles.subjectInfo}>
        <Text style={styles.subjectName}>{item.name}</Text>
        <Text style={styles.subjectType}>
          {item.type === 'custom' ? '👤 Custom' : 
           item.type === 'guest' ? '🚪 Guest' : 
           typeLabels[item.type] || '📋 General'}
        </Text>
      </View>
      {currentSubject?.key === item.key && (
        <FontAwesome5 name="check-circle" size={16} color="#28a745" />
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesome5 name="times" size={20} color="#1A2C5B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose Subject</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <FontAwesome5 name="search" size={16} color="#95A5A6" style={styles.searchIcon} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search or type a new subject..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#95A5A6"
              autoCapitalize="words"
              autoCorrect={false}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <FontAwesome5 name="times-circle" size={16} color="#95A5A6" />
              </TouchableOpacity>
            )}
          </View>

          {/* Predictive Text */}
          {showPredictions && predictionText && (
            <TouchableOpacity 
              style={styles.predictionContainer}
              onPress={acceptPrediction}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="lightbulb" size={14} color="#D4AF37" />
              <Text style={styles.predictionText}>
                Complete: "{predictionText}"
              </Text>
              <FontAwesome5 name="arrow-right" size={12} color="#D4AF37" />
            </TouchableOpacity>
          )}

          {/* ✅ NEW: Validation indicator */}
          {validating && (
            <View style={[styles.createButton, { backgroundColor: '#FFF8E1' }]}>
              <ActivityIndicator size="small" color="#D4AF37" />
              <Text style={[styles.createButtonText, { color: '#D4AF37' }]}>
                Validating "{searchText}"...
              </Text>
            </View>
          )}

          {/* ✅ NEW: Validation result display */}
          {validationResult && !validating && searchText.length > 0 && filteredSubjects.length === 0 && (
            <View style={[
              styles.validationResult,
              { 
                backgroundColor: validationResult.valid ? '#E8F5E8' : '#FFE8E8',
                borderColor: validationResult.valid ? '#28a745' : '#dc3545'
              }
            ]}>
              <FontAwesome5 
                name={validationResult.valid ? "check-circle" : "exclamation-triangle"} 
                size={14} 
                color={validationResult.valid ? "#28a745" : "#dc3545"} 
              />
              <Text style={[
                styles.validationText,
                { color: validationResult.valid ? "#28a745" : "#dc3545" }
              ]}>
                {validationResult.message || 
                 (validationResult.valid 
                   ? `✅ "${searchText}" is recognized`
                   : `⚠️ "${searchText}" may not be recognized`)}
              </Text>
            </View>
          )}

          {/* Create New Subject Button */}
          {searchText.length > 0 && filteredSubjects.length === 0 && !validating && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={createCustomSubject}
              disabled={creating}
              activeOpacity={0.7}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#1A2C5B" />
              ) : (
                <>
                  <FontAwesome5 name="plus-circle" size={16} color="#1A2C5B" />
                  <Text style={styles.createButtonText}>
                    Create "{searchText}" as new subject
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Subjects List */}
        <View style={styles.listContainer}>
          {loading ? (
            <BookLoadingAnimation 
              size={120}
              style={styles.loadingContainer}
            />
          ) : (
            <FlatList
              data={typeOrder.flatMap(type => {
                if (!groupedSubjects[type] || groupedSubjects[type].length === 0) return [];
                return [
                  { type: 'header', title: typeLabels[type], key: `header_${type}` },
                  ...groupedSubjects[type].map(subject => ({ ...subject, type: 'item' }))
                ];
              })}
              keyExtractor={(item) => item.key || item.id || `${item.type}_${item.title}`}
              renderItem={({ item }) => {
                if (item.type === 'header') {
                  return (
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>{item.title}</Text>
                    </View>
                  );
                }
                return renderSubjectItem({ item });
              }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>

        {/* Current Selection */}
        {currentSubject && (
          <View style={styles.currentSelection}>
            <Text style={styles.currentSelectionLabel}>Current Selection:</Text>
            <View style={styles.currentSelectionItem}>
              <View style={[styles.subjectIcon, { backgroundColor: currentSubject.color || '#9B59B6' }]}>
                <FontAwesome5 name={currentSubject.icon || 'book'} size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.currentSelectionText}>{currentSubject.name}</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2C5B',
  },
  headerSpacer: {
    width: 30,
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A2C5B',
  },
  clearButton: {
    padding: 5,
  },
  predictionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  predictionText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1A2C5B',
    fontStyle: 'italic',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginTop: 10,
  },
  createButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2C5B',
  },
  // ✅ NEW: Validation result styles
  validationResult: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    borderWidth: 1,
  },
  validationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#95A5A6',
  },
  listContent: {
    paddingVertical: 10,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F8F9FA',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
  selectedSubjectItem: {
    backgroundColor: '#E8F5E8',
  },
  subjectIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A2C5B',
    marginBottom: 2,
  },
  subjectType: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 71,
  },
  currentSelection: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  currentSelectionLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  currentSelectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentSelectionText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A2C5B',
  },
});

export default SubjectSelector;