import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import EnhancedBirthdayInput from '../EnhancedBirthdayInput';

interface ProfileStep1PersonalInfoProps {
  profile: any;
  isEditingMode: boolean;
  onProfileChange: (updates: any) => void;
  onFocus: (offset: number) => void;
}

/**
 * ProfileStep1PersonalInfo - Personal information step
 *
 * Features:
 * - Name fields (first/last)
 * - Email (new users only)
 * - Password (new users only)
 * - Birthday input
 */
const ProfileStep1PersonalInfo: React.FC<ProfileStep1PersonalInfoProps> = ({
  profile,
  isEditingMode,
  onProfileChange,
  onFocus,
}) => {
  return (
    <Animatable.View animation="slideInRight" style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <FontAwesome5 name={isEditingMode ? "user" : "user-plus"} size={32} color="#D4AF37" />
        <Text style={styles.stepTitle}>
          {isEditingMode ? 'Edit Personal Information' : 'Create Your Account'}
        </Text>
        <Text style={styles.stepSubtitle}>
          {isEditingMode ? 'Update your name and contact details' : 'Enter your details to get started'}
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={styles.input}
          value={profile.firstName}
          onChangeText={(text) => onProfileChange({ firstName: text })}
          onFocus={() => onFocus(100)}
          placeholder="Enter your first name"
          placeholderTextColor="#CBD5E0"
          maxLength={25}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={styles.input}
          value={profile.lastName}
          onChangeText={(text) => onProfileChange({ lastName: text })}
          onFocus={() => onFocus(200)}
          placeholder="Enter your last name"
          placeholderTextColor="#CBD5E0"
          maxLength={25}
        />
      </View>

      {!isEditingMode && (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              value={profile.email}
              onChangeText={(text) => onProfileChange({ email: text })}
              onFocus={() => onFocus(300)}
              placeholder="Enter your email address"
              placeholderTextColor="#CBD5E0"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              value={profile.password}
              onChangeText={(text) => onProfileChange({ password: text })}
              onFocus={() => onFocus(400)}
              placeholder="Create a password (min. 6 characters)"
              placeholderTextColor="#CBD5E0"
              secureTextEntry
              autoComplete="new-password"
            />
          </View>
        </>
      )}

      <View style={styles.inputContainer}>
        <EnhancedBirthdayInput
          value={profile.birthDate}
          onDateChange={(formattedDate, dateObject) => {
            onProfileChange({
              birthDate: formattedDate,
              birthDateObject: dateObject
            });
          }}
          style={styles.input}
          label="Birth Date *"
          required={true}
          minAge={13}
          maxAge={120}
        />
      </View>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8F4E3',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#CBD5E0',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8F4E3',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F8F4E3',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
});

export default React.memo(ProfileStep1PersonalInfo);
