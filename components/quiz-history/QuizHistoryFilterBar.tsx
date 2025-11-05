import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';

interface Filter {
  value: string;
  label: string;
  sublabel?: string;
  count: number;
  icon: string;
  color?: string;
}

interface QuizHistoryFilterBarProps {
  showFilters: boolean;
  selectedFilter: string;
  availableFilters: Filter[];
  filteredCount: number;
  currentThemeStyles: any;
  onToggleFilters: () => void;
  onFilterSelect: (filterValue: string) => void;
}

const QuizHistoryFilterBar: React.FC<QuizHistoryFilterBarProps> = ({
  showFilters,
  selectedFilter,
  availableFilters,
  filteredCount,
  currentThemeStyles,
  onToggleFilters,
  onFilterSelect,
}) => {
  const selectedFilterLabel =
    selectedFilter === 'all'
      ? 'All Quizzes'
      : availableFilters.find((f) => f.value === selectedFilter)?.label || 'Filter';

  return (
    <Animatable.View animation="slideInDown" delay={800} style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterButton, currentThemeStyles.filterButton]}
        onPress={onToggleFilters}
      >
        <FontAwesome5 name="filter" size={16} color={currentThemeStyles.filterIcon.color} />
        <Text style={[styles.filterButtonText, currentThemeStyles.filterButtonText]}>
          {selectedFilterLabel}
        </Text>
        <Text style={[styles.filterCount, currentThemeStyles.filterCount]}>
          ({filteredCount})
        </Text>
        <FontAwesome5
          name={showFilters ? 'chevron-up' : 'chevron-down'}
          size={12}
          color={currentThemeStyles.filterIcon.color}
        />
      </TouchableOpacity>

      {showFilters && (
        <Animatable.View animation="fadeInDown" style={styles.filtersDropdown}>
          <FlatList
            data={availableFilters}
            keyExtractor={(item) => item.value}
            renderItem={({ item: filter }) => (
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  currentThemeStyles.filterOption,
                  selectedFilter === filter.value && styles.selectedFilter,
                ]}
                onPress={() => onFilterSelect(filter.value)}
              >
                <View style={styles.filterOptionContent}>
                  <View
                    style={[
                      styles.filterIcon,
                      { backgroundColor: (filter.color || '#D4AF37') + '20' },
                    ]}
                  >
                    <FontAwesome5
                      name={filter.icon}
                      size={14}
                      color={filter.color || '#D4AF37'}
                    />
                  </View>
                  <View style={styles.filterTextContainer}>
                    <Text
                      style={[
                        styles.filterOptionText,
                        currentThemeStyles.filterOptionText,
                        selectedFilter === filter.value && styles.selectedFilterText,
                      ]}
                    >
                      {filter.label}
                    </Text>
                    {filter.sublabel && (
                      <Text style={[styles.filterSublabel, currentThemeStyles.filterSublabel]}>
                        {filter.sublabel}
                      </Text>
                    )}
                  </View>
                  <View style={styles.filterBadge}>
                    <Text style={[styles.filterBadgeText, currentThemeStyles.filterBadgeText]}>
                      {filter.count}
                    </Text>
                  </View>
                </View>
                {selectedFilter === filter.value && (
                  <FontAwesome5
                    name="check"
                    size={16}
                    color="#28a745"
                    style={styles.selectedIcon}
                  />
                )}
              </TouchableOpacity>
            )}
            scrollEnabled={false}
          />
        </Animatable.View>
      )}
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  filterButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  filterCount: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  filtersDropdown: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedFilter: {
    opacity: 1,
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  filterIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTextContainer: {
    flex: 1,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedFilterText: {
    fontWeight: '700',
  },
  filterSublabel: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  filterBadge: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectedIcon: {
    marginLeft: 8,
  },
});

// Memoized export
export default React.memo(QuizHistoryFilterBar);
