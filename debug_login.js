// Quick login debug script
// Run this in your Expo app console to test API connectivity

import { API_BASE_URL } from './config/api';
import { StudentProfileService } from './services/StudentProfileService';

export const debugLogin = async (userId = 'test') => {
  console.log('🔍 LOGIN DEBUG STARTED');
  console.log('='.repeat(50));
  
  // 1. Check API Base URL
  console.log('1. API Configuration:');
  console.log(`   API_BASE_URL: ${API_BASE_URL}`);
  
  // 2. Test basic connectivity
  console.log('\n2. Testing API Connectivity...');
  try {
    const testResponse = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      timeout: 5000
    });
    console.log(`   ✅ API Response: ${testResponse.status} ${testResponse.statusText}`);
  } catch (error) {
    console.log(`   ❌ API Connection Failed: ${error.message}`);
  }
  
  // 3. Test profile service
  console.log('\n3. Testing Profile Service...');
  try {
    const profileStatus = await StudentProfileService.checkProfileStatus(userId);
    console.log('   ✅ Profile Status:', profileStatus);
  } catch (error) {
    console.log(`   ❌ Profile Check Failed: ${error.message}`);
  }
  
  // 4. Check AsyncStorage
  console.log('\n4. Checking Local Storage...');
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const termsAccepted = await AsyncStorage.getItem(`termsAccepted_${userId}`);
    const profileCompleted = await AsyncStorage.getItem(`profileCompleted_${userId}`);
    console.log(`   Terms Accepted: ${termsAccepted}`);
    console.log(`   Profile Completed: ${profileCompleted}`);
  } catch (error) {
    console.log(`   ❌ Storage Check Failed: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🔍 LOGIN DEBUG COMPLETED');
};

// Auto-run for testing
// debugLogin('your_test_user_id_here');