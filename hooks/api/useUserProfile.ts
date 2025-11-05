import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../config/queryClient';
import OfflineManager from '../../utils/OfflineManager';
import { auth } from '../../firebaseConfig';
import logger from '../../utils/logger';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  birthDate?: string;
  educationLevel?: string;
  year?: string;
  semester?: string;
  program?: string;
  courses: any[];
  studyGoals?: string;
  learningStyles: string[];
  painPoints: string[];
}

/**
 * useUserProfile
 *
 * React Query hook for managing user profile with caching
 *
 * Features:
 * - Auto-caching with background updates
 * - Optimistic updates for profile changes
 * - Local storage persistence
 */
export const useUserProfile = () => {
  const queryClient = useQueryClient();

  // Fetch user profile
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) {
        logger.warn('No user logged in');
        return null;
      }

      // Try to load from OfflineManager cache
      const cachedProfile = await OfflineManager.getCachedData(OfflineManager.CACHE_KEYS.USER_PROFILE);

      if (cachedProfile) {
        logger.info('✅ Loaded user profile from OfflineManager cache');
        return cachedProfile;
      }

      // Return minimal profile from auth if no cached data
      const defaultProfile = {
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        courses: [],
        learningStyles: [],
        painPoints: [],
      };

      // Cache the default profile
      await OfflineManager.cacheData(OfflineManager.CACHE_KEYS.USER_PROFILE, defaultProfile);
      logger.info('✅ Created and cached default user profile');

      return defaultProfile;
    },
    // Keep profile data fresh for 10 minutes
    staleTime: 10 * 60 * 1000,
    // Keep in cache for 30 minutes
    gcTime: 30 * 60 * 1000,
    enabled: !!auth.currentUser,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationKey: ['updateProfile'],
    mutationFn: async (updates: Partial<UserProfile>) => {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const currentProfile = queryClient.getQueryData<UserProfile>(queryKeys.user.profile) || {};
      const updatedProfile = { ...currentProfile, ...updates };

      // Save to OfflineManager cache
      await OfflineManager.cacheData(OfflineManager.CACHE_KEYS.USER_PROFILE, updatedProfile);

      // Queue for offline sync if offline
      if (!OfflineManager.isOnline) {
        await OfflineManager.queueOfflineAction({
          type: 'PROFILE_UPDATED',
          data: updatedProfile,
        });
        logger.info('📝 Profile update queued for offline sync');
      }

      logger.info('✅ Profile updated via OfflineManager:', Object.keys(updates));
      return updatedProfile;
    },
    // Optimistic update
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.user.profile });

      const previousProfile = queryClient.getQueryData(queryKeys.user.profile);

      queryClient.setQueryData(queryKeys.user.profile, (old: any) => ({
        ...old,
        ...updates,
      }));

      return { previousProfile };
    },
    onError: (err, updates, context) => {
      queryClient.setQueryData(queryKeys.user.profile, context?.previousProfile);
      logger.error('❌ Failed to update profile:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
    },
  });

  // Add course mutation
  const addCourseMutation = useMutation({
    mutationKey: ['addCourse'],
    mutationFn: async (course: any) => {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const currentProfile = queryClient.getQueryData<UserProfile>(queryKeys.user.profile);
      const courses = currentProfile?.courses || [];
      const updatedCourses = [...courses, course];

      const updatedProfile = { ...currentProfile, courses: updatedCourses };
      await OfflineManager.cacheData(OfflineManager.CACHE_KEYS.USER_PROFILE, updatedProfile);

      logger.info('✅ Course added via OfflineManager');
      return updatedProfile;
    },
    onMutate: async (course) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.user.profile });

      const previousProfile = queryClient.getQueryData(queryKeys.user.profile);

      queryClient.setQueryData(queryKeys.user.profile, (old: any) => ({
        ...old,
        courses: [...(old?.courses || []), course],
      }));

      return { previousProfile };
    },
    onError: (err, course, context) => {
      queryClient.setQueryData(queryKeys.user.profile, context?.previousProfile);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
    },
  });

  // Remove course mutation
  const removeCourseMutation = useMutation({
    mutationKey: ['removeCourse'],
    mutationFn: async (courseId: string) => {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const currentProfile = queryClient.getQueryData<UserProfile>(queryKeys.user.profile);
      const updatedCourses = currentProfile?.courses.filter(c => c.id !== courseId) || [];

      const updatedProfile = { ...currentProfile, courses: updatedCourses };
      await OfflineManager.cacheData(OfflineManager.CACHE_KEYS.USER_PROFILE, updatedProfile);

      logger.info('✅ Course removed via OfflineManager');
      return updatedProfile;
    },
    onMutate: async (courseId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.user.profile });

      const previousProfile = queryClient.getQueryData(queryKeys.user.profile);

      queryClient.setQueryData(queryKeys.user.profile, (old: any) => ({
        ...old,
        courses: old?.courses.filter(c => c.id !== courseId) || [],
      }));

      return { previousProfile };
    },
    onError: (err, courseId, context) => {
      queryClient.setQueryData(queryKeys.user.profile, context?.previousProfile);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
    },
  });

  return {
    // Data
    profile,
    isLoading,
    isError,
    error,

    // Actions
    refetch,
    updateProfile: updateProfileMutation.mutate,
    updateProfileAsync: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    addCourse: addCourseMutation.mutate,
    isAddingCourse: addCourseMutation.isPending,
    removeCourse: removeCourseMutation.mutate,
    isRemovingCourse: removeCourseMutation.isPending,
  };
};

export default useUserProfile;
