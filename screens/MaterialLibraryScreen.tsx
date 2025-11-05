/**
 * MaterialLibraryScreen - Main library view for study materials
 *
 * Features:
 * - Tab navigation (Books, Study Guides, Papers)
 * - Search functionality
 * - Filter chips (All, In Progress, Completed)
 * - Material cards with progress
 * - Upload FAB
 * - Empty states
 * - Pull-to-refresh
 * - Loading and error states
 *
 * Navigation:
 * - Navigate to BookDetailScreen when card is tapped
 * - Navigate to UploadModal when FAB is tapped
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontAwesome5 } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../constants/Colors';
import { MaterialKind, MaterialFilterStatus } from '../types/materials';
import { useMaterials, useRetryMaterial, useDeleteMaterial } from '../hooks/useMaterials';
import { useMaterialStatus } from '../hooks/useMaterialStatus';
import logger from '../utils/logger';

// Components
import TabBar from '../components/materials/TabBar';
import FilterChips from '../components/materials/FilterChips';
import SearchBar from '../components/materials/SearchBar';
import MaterialCard from '../components/materials/MaterialCard';
import EmptyState from '../components/materials/EmptyState';

type RootStackParamList = {
  MaterialLibrary: undefined;
  BookDetail: { materialId: string };
  UploadModal: { file: DocumentPicker.DocumentPickerAsset };
};

type MaterialLibraryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MaterialLibrary'
>;

interface MaterialLibraryScreenProps {
  navigation: MaterialLibraryScreenNavigationProp;
}

const MaterialLibraryScreen: React.FC<MaterialLibraryScreenProps> = ({
  navigation,
}) => {
  // State
  const [selectedTab, setSelectedTab] = useState<MaterialKind>('book');
  const [filter, setFilter] = useState<MaterialFilterStatus>('all');
  const [search, setSearch] = useState('');

  // Theme colors
  const themeColors = useMemo(
    () => ({
      background: Colors.background,
      primary: Colors.primary,
      accent: Colors.accent,
      text: Colors.text,
      fab: Colors.primary,
    }),
    []
  );

  // Fetch materials
  const { materials: materialsData, isLoading, isError, refetch } = useMaterials({
    kind: selectedTab,
    status: filter,
    search,
  });

  // P1-2.7 FIX: Ensure materials is ALWAYS an array with strict TypeScript checks
  const materials = React.useMemo(() => {
    // Triple-layer safety: type check, Array.isArray, and null check
    if (materialsData && Array.isArray(materialsData)) {
      return materialsData;
    }
    if (materialsData !== undefined && materialsData !== null) {
      logger.warn('MaterialLibraryScreen: materialsData is not an array', {
        type: typeof materialsData,
        value: materialsData,
      });
    }
    return [];
  }, [materialsData]);

  // Debug logging for materials data
  React.useEffect(() => {
    logger.debug('Materials data updated', {
      count: materials.length,
      isLoading,
      isError,
      tab: selectedTab,
      filter,
    });
  }, [materials.length, isLoading, isError, selectedTab, filter]);

  // Retry and delete mutations
  const retryMutation = useRetryMaterial();
  const deleteMutation = useDeleteMaterial();

  // P1-2.7 FIX: Safe check before calling .some() method
  // Auto-poll processing materials (ONLY when materials are actually processing)
  const hasProcessingMaterials = React.useMemo(() => {
    // Ensure materials is an array before calling .some()
    if (!Array.isArray(materials) || materials.length === 0) {
      return false;
    }
    return materials.some(m => m && (m.status === 'uploading' || m.status === 'processing'));
  }, [materials]);

  const { pollingMaterials, isPolling, pollingCount } = useMaterialStatus({
    materials,
    pollingInterval: 30000, // CRITICAL FIX: Increased from 20s to 30s to reduce API load
    enabled: hasProcessingMaterials,
  });

  // Log polling status
  React.useEffect(() => {
    if (isPolling) {
      logger.info('Auto-polling active for processing materials', {
        count: pollingCount,
      });
    }
  }, [isPolling, pollingCount]);

  // Tab options
  const tabs = useMemo(
    () => [
      { id: 'book' as MaterialKind, label: 'Books' },
      { id: 'study_guide' as MaterialKind, label: 'Study Guides' },
      { id: 'paper' as MaterialKind, label: 'Papers' },
    ],
    []
  );

  // Filter options
  const filters = useMemo(
    () => [
      { id: 'all' as MaterialFilterStatus, label: 'All' },
      { id: 'in_progress' as MaterialFilterStatus, label: 'In Progress' },
      { id: 'completed' as MaterialFilterStatus, label: 'Completed' },
    ],
    []
  );

  // Handle tab change
  const handleTabChange = useCallback((tab: MaterialKind) => {
    setSelectedTab(tab);
    setSearch('');
    logger.info('Tab changed', { tab });
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((newFilter: MaterialFilterStatus) => {
    setFilter(newFilter);
    logger.info('Filter changed', { filter: newFilter });
  }, []);

  // Handle search
  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    logger.debug('Search query', { text });
  }, []);

  // Handle material press
  const handleMaterialPress = useCallback(
    (materialId: string) => {
      logger.info('Navigating to BookDetail', { materialId });
      navigation.navigate('BookDetail', { materialId });
    },
    [navigation]
  );

  // Handle retry material
  const handleRetry = useCallback(
    async (materialId: string) => {
      try {
        logger.info('Retry material requested', { materialId });
        await retryMutation.mutateAsync(materialId);
        Alert.alert('Success', 'Material processing restarted. This may take a few minutes.');
      } catch (error) {
        logger.error('Failed to retry material', error);
        Alert.alert('Error', 'Failed to restart processing. Please try again.');
      }
    },
    [retryMutation]
  );

  // Handle delete material
  const handleDelete = useCallback(
    async (materialId: string) => {
      try {
        logger.info('Delete material requested', { materialId });
        await deleteMutation.mutateAsync(materialId);
        Alert.alert('Success', 'Material deleted successfully.');
      } catch (error) {
        logger.error('Failed to delete material', error);
        Alert.alert('Error', 'Failed to delete material. Please try again.');
      }
    },
    [deleteMutation]
  );

  // Handle upload FAB press
  const handleUpload = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/epub+zip',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        logger.info('Document picker canceled');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        logger.info('File selected', { name: file.name, size: file.size });
        navigation.navigate('UploadModal', { file });
      }
    } catch (error) {
      logger.error('Document picker error', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  }, [navigation]);

  // Render material card
  const renderMaterialCard = useCallback(
    ({ item }) => (
      <MaterialCard
        material={item}
        onPress={() => handleMaterialPress(item.id)}
        onRetry={handleRetry}
        onDelete={handleDelete}
      />
    ),
    [handleMaterialPress, handleRetry, handleDelete]
  );

  // Render empty state
  const renderEmptyState = useCallback(() => {
    if (isLoading) {
      return null;
    }

    if (isError) {
      return (
        <View style={styles.centerContainer}>
          <FontAwesome5 name="exclamation-triangle" size={48} color={Colors.error} />
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: themeColors.primary }]}
            onPress={() => refetch()}
          >
            <FontAwesome5 name="redo" size={16} color={Colors.textLight} />
          </TouchableOpacity>
        </View>
      );
    }

    return <EmptyState tab={selectedTab} onUpload={handleUpload} />;
  }, [isLoading, isError, selectedTab, handleUpload, themeColors.primary, refetch]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Tab navigation */}
      <TabBar tabs={tabs} selectedTab={selectedTab} onTabChange={handleTabChange} />

      {/* Search bar */}
      <SearchBar
        placeholder={`Search ${tabs.find((t) => t.id === selectedTab)?.label.toLowerCase()}...`}
        value={search}
        onSearch={handleSearch}
      />

      {/* Filter chips */}
      <FilterChips options={filters} selected={filter} onChange={handleFilterChange} />

      {/* Material list */}
      <FlatList
        data={materials}
        renderItem={renderMaterialCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          materials.length === 0 && styles.emptyListContainer,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={themeColors.accent}
            colors={[themeColors.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Loading indicator */}
      {isLoading && materials.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.accent} />
        </View>
      )}

      {/* Upload FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: themeColors.fab }]}
        onPress={handleUpload}
        activeOpacity={0.8}
      >
        <FontAwesome5 name="plus" size={24} color={Colors.textLight} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 80,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default MaterialLibraryScreen;
