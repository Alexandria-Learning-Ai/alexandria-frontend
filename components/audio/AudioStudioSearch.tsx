/**
 * AudioStudioSearch - Search and filter component for playlists
 *
 * Features:
 * - Real-time search with debouncing
 * - Filter chips (All, Favorites, By Folder, By Date)
 * - Sort dropdown (Name, Date, Duration, Track Count)
 * - Results counter
 * - Empty state handling
 * - Clear filters functionality
 *
 * Usage:
 * <AudioStudioSearch
 *   onSearch={(results) => setFilteredPlaylists(results)}
 *   onFiltersChange={(filters) => setActiveFilters(filters)}
 * />
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { auth } from '../../firebaseConfig';
import { API_BASE_URL } from '../../config/api';
import axios from 'axios';
import logger from '../../utils/logger';

interface Filters {
  folder_id: string | null;
  date_from: string | null;
  date_to: string | null;
  is_favorite: boolean;
}

interface SortConfig {
  field: 'name' | 'created_at' | 'total_duration' | 'item_count';
  order: 'asc' | 'desc';
}

interface AudioStudioSearchProps {
  onSearch: (results: any[]) => void;
  onFiltersChange?: (filters: Filters) => void;
  onSortChange?: (sort: SortConfig) => void;
}

const AudioStudioSearch: React.FC<AudioStudioSearchProps> = ({
  onSearch,
  onFiltersChange,
  onSortChange,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState<Filters>({
    folder_id: null,
    date_from: null,
    date_to: null,
    is_favorite: false,
  });
  const [sort, setSort] = useState<SortConfig>({
    field: 'created_at',
    order: 'desc',
  });
  const [resultCount, setResultCount] = useState<number>(0);
  const [showSortMenu, setShowSortMenu] = useState<boolean>(false);

  // Theme colors
  const themeColors = useMemo(() => ({
    background: '#1A2C5B',
    alexandriaGold: '#D4AF37',
    alexandriaBronze: '#B8941F',
    text: '#F8F4E3',
    textSecondary: '#CBD5E0',
    inputBackground: 'rgba(248, 244, 227, 0.1)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    chipBackground: 'rgba(212, 175, 55, 0.2)',
    chipActiveBackground: 'rgba(212, 175, 55, 0.4)',
  }), []);

  // Sort options
  const sortOptions = [
    { field: 'name', order: 'asc', label: 'Name (A-Z)' },
    { field: 'name', order: 'desc', label: 'Name (Z-A)' },
    { field: 'created_at', order: 'desc', label: 'Date Created (Newest)' },
    { field: 'created_at', order: 'asc', label: 'Date Created (Oldest)' },
    { field: 'total_duration', order: 'desc', label: 'Duration (Longest)' },
    { field: 'total_duration', order: 'asc', label: 'Duration (Shortest)' },
    { field: 'item_count', order: 'desc', label: 'Track Count (Most)' },
    { field: 'item_count', order: 'asc', label: 'Track Count (Least)' },
  ] as const;

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery || hasActiveFilters()) {
        performSearch();
      } else {
        // No search/filters active - return all playlists
        fetchAllPlaylists();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filters, sort]);

  // Check if any filters are active
  const hasActiveFilters = useCallback(() => {
    return (
      filters.is_favorite ||
      filters.folder_id !== null ||
      filters.date_from !== null ||
      filters.date_to !== null
    );
  }, [filters]);

  // Fetch all playlists (no filters)
  const fetchAllPlaylists = useCallback(async () => {
    try {
      setLoading(true);

      const user = auth.currentUser;
      if (!user) {
        logger.warn('User not authenticated');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/audio/playlists`, {
        params: {
          user_id: user.uid,
          sort: sort.field,
          order: sort.order,
        },
        headers: { 'X-User-ID': user.uid },
        timeout: 10000,
      });

      const playlists = response.data.playlists || [];
      setResultCount(playlists.length);
      onSearch(playlists);
      setLoading(false);
    } catch (error) {
      logger.error('Error fetching playlists:', error);
      setLoading(false);
    }
  }, [sort, onSearch]);

  // Perform search with filters
  const performSearch = useCallback(async () => {
    try {
      setLoading(true);

      const user = auth.currentUser;
      if (!user) {
        logger.warn('User not authenticated');
        setLoading(false);
        return;
      }

      const params: any = {
        user_id: user.uid,
        sort: sort.field,
        order: sort.order,
      };

      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }

      if (filters.is_favorite) {
        params.is_favorite = true;
      }

      if (filters.folder_id) {
        params.folder_id = filters.folder_id;
      }

      if (filters.date_from) {
        params.date_from = filters.date_from;
      }

      if (filters.date_to) {
        params.date_to = filters.date_to;
      }

      logger.info('🔍 Searching playlists:', params);

      const response = await axios.get(`${API_BASE_URL}/api/audio/playlists/search`, {
        params,
        headers: { 'X-User-ID': user.uid },
        timeout: 10000,
      });

      const results = response.data.playlists || [];
      setResultCount(results.length);
      onSearch(results);

      logger.info(`✅ Found ${results.length} playlists`);
      setLoading(false);
    } catch (error) {
      logger.error('Error searching playlists:', error);
      setLoading(false);
      onSearch([]);
      setResultCount(0);
    }
  }, [searchQuery, filters, sort, onSearch]);

  // Toggle favorite filter
  const toggleFavorites = useCallback(() => {
    const newFilters = {
      ...filters,
      is_favorite: !filters.is_favorite,
    };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [filters, onFiltersChange]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const clearedFilters: Filters = {
      folder_id: null,
      date_from: null,
      date_to: null,
      is_favorite: false,
    };
    setFilters(clearedFilters);
    setSearchQuery('');
    onFiltersChange?.(clearedFilters);
  }, [onFiltersChange]);

  // Handle sort change
  const handleSortChange = useCallback((option: typeof sortOptions[number]) => {
    const newSort: SortConfig = {
      field: option.field as any,
      order: option.order as any,
    };
    setSort(newSort);
    setShowSortMenu(false);
    onSortChange?.(newSort);
  }, [onSortChange]);

  // Get active sort label
  const getActiveSortLabel = useMemo(() => {
    const activeOption = sortOptions.find(
      (opt) => opt.field === sort.field && opt.order === sort.order
    );
    return activeOption?.label || 'Sort';
  }, [sort]);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor }]}>
        <FontAwesome5 name="search" size={16} color={themeColors.textSecondary} style={styles.searchIcon} />

        <TextInput
          style={[styles.searchInput, { color: themeColors.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search playlists..."
          placeholderTextColor={themeColors.textSecondary}
        />

        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <FontAwesome5 name="times-circle" size={16} color={themeColors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Sort Dropdown */}
        <TouchableOpacity
          style={[styles.sortButton, { borderColor: themeColors.borderColor }]}
          onPress={() => setShowSortMenu(!showSortMenu)}
          activeOpacity={0.7}
        >
          <FontAwesome5 name="sort-amount-down" size={14} color={themeColors.alexandriaGold} />
        </TouchableOpacity>
      </View>

      {/* Sort Menu */}
      {showSortMenu && (
        <View style={[styles.sortMenu, { backgroundColor: themeColors.background, borderColor: themeColors.borderColor }]}>
          {sortOptions.map((option, index) => {
            const isActive =
              option.field === sort.field && option.order === sort.order;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.sortOption,
                  isActive && { backgroundColor: themeColors.chipActiveBackground },
                ]}
                onPress={() => handleSortChange(option)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    { color: isActive ? themeColors.alexandriaGold : themeColors.text },
                  ]}
                >
                  {option.label}
                </Text>
                {isActive && (
                  <FontAwesome5 name="check" size={14} color={themeColors.alexandriaGold} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScrollView}
        contentContainerStyle={styles.filtersContainer}
      >
        {/* All/Clear Filters */}
        {hasActiveFilters() ? (
          <TouchableOpacity
            style={[styles.filterChip, { backgroundColor: themeColors.chipBackground, borderColor: themeColors.borderColor }]}
            onPress={clearFilters}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="times" size={12} color={themeColors.textSecondary} />
            <Text style={[styles.filterChipText, { color: themeColors.textSecondary }]}>
              Clear Filters
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.filterChip, styles.filterChipActive, { backgroundColor: themeColors.chipActiveBackground }]}>
            <Text style={[styles.filterChipText, { color: themeColors.alexandriaGold }]}>All</Text>
          </View>
        )}

        {/* Favorites Filter */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            {
              backgroundColor: filters.is_favorite
                ? themeColors.chipActiveBackground
                : themeColors.chipBackground,
              borderColor: themeColors.borderColor,
            },
          ]}
          onPress={toggleFavorites}
          activeOpacity={0.7}
        >
          <FontAwesome5
            name="star"
            size={12}
            color={filters.is_favorite ? themeColors.alexandriaGold : themeColors.textSecondary}
            solid={filters.is_favorite}
          />
          <Text
            style={[
              styles.filterChipText,
              {
                color: filters.is_favorite
                  ? themeColors.alexandriaGold
                  : themeColors.textSecondary,
              },
            ]}
          >
            Favorites
          </Text>
        </TouchableOpacity>

        {/* By Folder (Placeholder) */}
        <TouchableOpacity
          style={[styles.filterChip, { backgroundColor: themeColors.chipBackground, borderColor: themeColors.borderColor }]}
          activeOpacity={0.7}
          onPress={() => {
            // TODO: Implement folder picker
            logger.info('Folder filter coming soon');
          }}
        >
          <FontAwesome5 name="folder" size={12} color={themeColors.textSecondary} />
          <Text style={[styles.filterChipText, { color: themeColors.textSecondary }]}>
            By Folder
          </Text>
        </TouchableOpacity>

        {/* By Date (Placeholder) */}
        <TouchableOpacity
          style={[styles.filterChip, { backgroundColor: themeColors.chipBackground, borderColor: themeColors.borderColor }]}
          activeOpacity={0.7}
          onPress={() => {
            // TODO: Implement date range picker
            logger.info('Date filter coming soon');
          }}
        >
          <FontAwesome5 name="calendar" size={12} color={themeColors.textSecondary} />
          <Text style={[styles.filterChipText, { color: themeColors.textSecondary }]}>
            By Date
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Results Counter */}
      <View style={styles.resultsCounter}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={themeColors.alexandriaGold} />
            <Text style={[styles.resultsText, { color: themeColors.textSecondary }]}>
              Searching...
            </Text>
          </View>
        ) : (
          <Text style={[styles.resultsText, { color: themeColors.textSecondary }]}>
            {searchQuery || hasActiveFilters()
              ? `${resultCount} ${resultCount === 1 ? 'playlist' : 'playlists'} found`
              : `Showing all ${resultCount} ${resultCount === 1 ? 'playlist' : 'playlists'}`}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  sortButton: {
    marginLeft: 12,
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortMenu: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filtersScrollView: {
    marginBottom: 12,
  },
  filtersContainer: {
    gap: 8,
    paddingRight: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterChipActive: {
    borderWidth: 0,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultsCounter: {
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultsText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default AudioStudioSearch;
