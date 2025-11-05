import React from 'react';
import { View, Text, TouchableOpacity, Vibration } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface ThemeColors {
  alexandriaGold: string;
  text: string;
  textSecondary: string;
  [key: string]: string;
}

interface Subject {
  key: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  source?: string;
}

interface Course {
  id: string;
  key: string;
  name: string;
  icon: string;
  color: string;
}

interface PredefinedSubject {
  value: string;
  label: string;
  icon: string;
  color: string;
}

interface SubjectSelectorSectionProps {
  isVisible: boolean;
  selectedSubject: Subject | null;
  userCourses: Course[];
  hasProfileCourses: boolean;
  predefinedSubjects: PredefinedSubject[];
  onSubjectSelect: (subject: Subject) => void;
  onOpenFullSelector: () => void;
  isDisabled: boolean;
  themeColors: ThemeColors;
  styles: any;
  t: (key: string, options?: any) => string;
}

/**
 * SubjectSelectorSection - Subject/course selection interface
 *
 * Features:
 * - User's profile courses displayed first (top 4)
 * - Predefined subjects as quick select options
 * - Full selector button to browse all subjects
 * - Helper text for auto-detection
 * - Vibration feedback on selection
 * - Theme-aware styling
 * - Only shows when files are selected
 */
const SubjectSelectorSection: React.FC<SubjectSelectorSectionProps> = ({
  isVisible,
  selectedSubject,
  userCourses,
  hasProfileCourses,
  predefinedSubjects,
  onSubjectSelect,
  onOpenFullSelector,
  isDisabled,
  themeColors,
  styles,
  t
}) => {
  if (!isVisible) return null;

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        <FontAwesome5 name="tags" size={14} color="#D4AF37" /> {t('upload.documentSubject')}
      </Text>

      {/* Quick Course Selection - User's courses first, then predefined */}
      {!selectedSubject && (
        <View style={styles.predefinedSubjectsContainer}>
          {/* User's Profile Courses */}
          {hasProfileCourses && (
            <>
              <Text style={[styles.predefinedSubjectsLabel, { color: themeColors.alexandriaGold }]}>
                📚 Your Courses:
              </Text>
              <View style={styles.predefinedSubjectsRow}>
                {userCourses.slice(0, 4).map((course) => (
                  <TouchableOpacity
                    key={course.id}
                    style={[
                      styles.predefinedSubjectChip,
                      styles.userCourseChip,
                      {
                        backgroundColor: course.color + '25',
                        borderColor: course.color + '60',
                        borderWidth: 2,
                      }
                    ]}
                    onPress={() => {
                      onSubjectSelect({
                        key: course.key,
                        name: course.name,
                        type: 'profile_course',
                        icon: course.icon,
                        color: course.color,
                        source: 'user_profile'
                      });
                      Vibration.vibrate(30);
                    }}
                    activeOpacity={0.7}
                    disabled={isDisabled}
                  >
                    <FontAwesome5
                      name={course.icon}
                      size={12}
                      color={course.color}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[
                      styles.predefinedSubjectText,
                      styles.userCourseText,
                      { color: course.color }
                    ]}>
                      {course.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Show more courses message if user has more than 4 */}
              {userCourses.length > 4 && (
                <Text style={[styles.moreCourseHint, { color: themeColors.textSecondary }]}>
                  +{userCourses.length - 4} more in full selector
                </Text>
              )}
            </>
          )}

          {/* Predefined Subjects (only if user has no courses or as fallback) */}
          <Text style={[
            styles.predefinedSubjectsLabel,
            { color: hasProfileCourses ? themeColors.textSecondary : themeColors.text }
          ]}>
            {hasProfileCourses ? 'Or choose from:' : t('upload.quickSelect')}
          </Text>
          <View style={styles.predefinedSubjectsRow}>
            {predefinedSubjects.slice(0, hasProfileCourses ? 3 : 4).map((subject) => (
              <TouchableOpacity
                key={subject.value}
                style={[
                  styles.predefinedSubjectChip,
                  {
                    backgroundColor: subject.color + (hasProfileCourses ? '15' : '20'),
                    borderColor: subject.color + (hasProfileCourses ? '30' : '40'),
                    opacity: hasProfileCourses ? 0.8 : 1.0,
                  }
                ]}
                onPress={() => {
                  onSubjectSelect({
                    key: subject.value,
                    name: subject.label.replace(/📚|🧬|📜|📝|💻|🎨|🎵|🌍|💼|🏥|⚖️|🔬|⚗️|🧠|💰/g, '').trim(),
                    type: 'predefined',
                    icon: subject.icon,
                    color: subject.color
                  });
                  Vibration.vibrate(30);
                }}
                activeOpacity={0.7}
                disabled={isDisabled}
              >
                <FontAwesome5
                  name={subject.icon}
                  size={12}
                  color={subject.color}
                  style={{ marginRight: 6 }}
                />
                <Text style={[
                  styles.predefinedSubjectText,
                  { color: subject.color }
                ]}>
                  {subject.label.replace(/📚|🧬|📜|📝|💻|🎨|🎵|🌍|💼|🏥|⚖️|🔬|⚗️|🧠|💰/g, '').trim()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={onOpenFullSelector}
        activeOpacity={0.7}
        disabled={isDisabled}
      >
        <View style={styles.dropdownContent}>
          <FontAwesome5
            name="tags"
            size={16}
            color="#D4AF37"
            style={styles.dropdownIcon}
          />
          <Text style={[
            styles.dropdownText,
            !selectedSubject && styles.dropdownPlaceholder
          ]}>
            {selectedSubject && selectedSubject.name
              ? `📚 ${selectedSubject.name}`
              : t('upload.browseAllSubjects')
            }
          </Text>
          <FontAwesome5 name="chevron-down" size={14} color="#CBD5E0" />
        </View>
      </TouchableOpacity>

      <Text style={styles.uploadHelper}>
        💡 Manually categorize your document for better progress tracking, or let Alexandria auto-detect the subject
      </Text>
    </View>
  );
};

export default SubjectSelectorSection;
