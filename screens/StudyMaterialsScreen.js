import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    StatusBar,
    TextInput,
    Alert,
    ActivityIndicator,
    Animated,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import NavigationHelper from '../utils/NavigationHelper';
import logger from '../utils/logger';
import axios from 'axios';

export default function StudyMaterialsScreen({ navigation }) {
    const { t } = useTranslation();

    // State management
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all'); // all, recent, high_quality
    const [showFilters, setShowFilters] = useState(false);

    // Animation refs
    const containerAnim = useRef(new Animated.Value(1)).current;
    const filterAnim = useRef(new Animated.Value(0)).current;

    // Helper function to determine file type
    const getFileType = (filename) => {
        const extension = filename.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf': return 'pdf';
            case 'txt': return 'text';
            case 'png':
            case 'jpg':
            case 'jpeg': return 'image';
            default: return 'text';
        }
    };

    // Load materials on screen focus
    useFocusEffect(
        useCallback(() => {
            loadStudyMaterials();
        }, [])
    );

    // Reload materials when search query or filter changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (materials.length > 0 || searchQuery || selectedFilter !== 'all') {
                loadStudyMaterials();
            }
        }, 500); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedFilter]);

    // Load study materials from backend
    const loadStudyMaterials = async (refresh = false) => {
        try {
            if (refresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const user = auth.currentUser;
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Build query parameters
            const params = new URLSearchParams({
                user_id: user.uid,
                page: '1',
                limit: '50'
            });

            // Add filter-specific parameters
            if (selectedFilter === 'high_quality') {
                params.append('min_quality', '90');
            }

            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim());
            }

            // Call study materials API
            const response = await axios.get(`${API_BASE_URL}/api/study/materials?${params.toString()}`, {
                headers: {
                    'X-User-ID': user.uid,
                },
                timeout: 30000,
            });

            if (response.data && response.data.materials) {
                // Transform API response to match our component format
                const transformedMaterials = response.data.materials.map(material => ({
                    id: material.id,
                    title: material.title,
                    fileName: material.filename,
                    extractedText: material.extracted_text,
                    extractionQuality: material.extraction_quality,
                    characterCount: material.character_count,
                    subject: material.subject || 'General',
                    course: material.course || '',
                    uploadDate: material.upload_date,
                    hasAudio: material.has_audio || false,
                    hasSummary: material.has_summary || false,
                    hasFlashcards: false, // Not implemented yet
                    type: getFileType(material.filename),
                }));

                setMaterials(transformedMaterials);
                logger.info(`📚 Loaded ${transformedMaterials.length} study materials from API`);

                // Show empty state message if no materials found
                if (transformedMaterials.length === 0 && !searchQuery && selectedFilter === 'all') {
                    logger.info('📚 No study materials found - user hasn\'t uploaded any documents with Study Mode enabled');
                }

            } else {
                throw new Error('Invalid response format from server');
            }

        } catch (error) {
            logger.error('❌ Error loading study materials:', error);

            // Handle specific error cases
            if (error.response?.status === 401) {
                Alert.alert('Authentication Error', 'Please log in again to access your study materials.');
            } else if (error.response?.status === 404) {
                // 404 means the API endpoint doesn't exist (server not running) - fail gracefully
                logger.info('📚 Study Materials API not available (404) - showing empty state');
                // Don't show an alert for 404, just set empty materials
            } else if (error.response?.status === 0 || error.code === 'NETWORK_ERROR') {
                // Only show network error for actual network issues, not 404s
                logger.info('📚 Network connection issue - showing empty state');
            } else {
                Alert.alert('Error', 'Failed to load study materials. Please try again.');
            }

            // Set empty materials on error
            setMaterials([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Apply client-side filtering for cases not handled by backend
    const filteredMaterials = materials.filter(material => {
        // Backend handles search and high_quality filtering
        // Only handle 'recent' filter client-side
        if (selectedFilter === 'recent') {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return new Date(material.uploadDate) > weekAgo;
        }

        // For other filters, backend has already filtered the results
        return true;
    });

    // Toggle filter panel
    const toggleFilters = () => {
        setShowFilters(!showFilters);
        Animated.timing(filterAnim, {
            toValue: showFilters ? 0 : 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    // Get file icon based on file type
    const getFileIcon = (fileName) => {
        const extension = fileName.split('.').pop().toLowerCase();
        switch (extension) {
            case 'pdf': return 'file-pdf';
            case 'txt': return 'file-alt';
            case 'doc':
            case 'docx': return 'file-word';
            case 'jpg':
            case 'jpeg':
            case 'png': return 'file-image';
            default: return 'file';
        }
    };

    // Get quality color based on extraction quality
    const getQualityColor = (quality) => {
        if (quality >= 90) return '#28a745'; // Green
        if (quality >= 70) return '#ffc107'; // Yellow
        return '#dc3545'; // Red
    };

    // Handle material selection
    const handleMaterialSelect = (material) => {
        // Navigate to Material Viewer with default read mode
        navigation.navigate('MaterialViewer', { material, mode: 'read' });
    };

    // Handle action button clicks
    const handleActionPress = (material, mode) => {
        navigation.navigate('MaterialViewer', { material, mode });
    };

    // Handle material deletion
    const handleDeleteMaterial = async (materialId) => {
        try {
            Alert.alert(
                'Delete Study Material',
                'Are you sure you want to delete this study material? This action cannot be undone.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                const user = auth.currentUser;
                                if (!user) {
                                    Alert.alert('Error', 'Please log in again to delete materials.');
                                    return;
                                }

                                await axios.delete(`${API_BASE_URL}/api/study/materials/${materialId}`, {
                                    headers: {
                                        'X-User-ID': user.uid,
                                    },
                                    params: {
                                        user_id: user.uid,
                                    },
                                    timeout: 30000,
                                });

                                // Remove from local state
                                setMaterials(prev => prev.filter(material => material.id !== materialId));

                                logger.info(`🗑️ Deleted study material: ${materialId}`);

                                // Show success message
                                Alert.alert('Success', 'Study material deleted successfully.');

                            } catch (error) {
                                logger.error('❌ Error deleting study material:', error);
                                Alert.alert('Error', 'Failed to delete study material. Please try again.');
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            logger.error('❌ Error in delete confirmation:', error);
        }
    };

    // Render individual material item
    const renderMaterialItem = ({ item, index }) => (
        <Animatable.View
            animation="slideInRight"
            delay={index * 100}
            style={styles.materialCard}
        >
            <TouchableOpacity
                onPress={() => handleMaterialSelect(item)}
                activeOpacity={0.8}
            >
                <View style={styles.materialHeader}>
                    <View style={styles.fileIconContainer}>
                        <FontAwesome5
                            name={getFileIcon(item.fileName)}
                            size={20}
                            color="#D4AF37"
                        />
                    </View>
                    <View style={styles.materialInfo}>
                        <Text style={styles.materialTitle} numberOfLines={2}>
                            {item.title}
                        </Text>
                        <Text style={styles.materialCourse}>
                            {item.course} • {item.subject}
                        </Text>
                    </View>
                    <View style={styles.materialHeaderRight}>
                        <View style={styles.qualityBadge}>
                            <Text style={[
                                styles.qualityText,
                                { color: getQualityColor(item.extractionQuality) }
                            ]}>
                                {item.extractionQuality}%
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleDeleteMaterial(item.id);
                            }}
                        >
                            <FontAwesome5 name="trash" size={16} color="#E74C3C" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.materialStats}>
                    <View style={styles.statItem}>
                        <FontAwesome5 name="file-alt" size={12} color="#CBD5E0" />
                        <Text style={styles.statText}>
                            {item.characterCount.toLocaleString()} chars
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <FontAwesome5 name="calendar" size={12} color="#CBD5E0" />
                        <Text style={styles.statText}>
                            {new Date(item.uploadDate).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                <View style={styles.materialActions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleActionPress(item, 'read')}
                    >
                        <FontAwesome5 name="book-open" size={12} color="#D4AF37" />
                        <Text style={styles.actionText}>Read</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleActionPress(item, 'deep_study')}
                    >
                        <FontAwesome5 name="brain" size={12} color="#D4AF37" />
                        <Text style={styles.actionText}>Deep Study</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleActionPress(item, 'quick_review')}
                    >
                        <FontAwesome5 name="bolt" size={12} color="#D4AF37" />
                        <Text style={styles.actionText}>Quick Review</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleActionPress(item, 'listen')}
                    >
                        <FontAwesome5 name="headphones" size={12} color="#D4AF37" />
                        <Text style={styles.actionText}>Listen</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.extractPreview} numberOfLines={2}>
                    {item.extractedText}
                </Text>
            </TouchableOpacity>
        </Animatable.View>
    );

    // Render empty state
    const renderEmptyState = () => {
        if (loading) {
            return (
                <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color="#D4AF37" />
                    <Text style={styles.loadingText}>Loading your study materials...</Text>
                </View>
            );
        }

        const hasSearchOrFilter = searchQuery.trim() || selectedFilter !== 'all';

        return (
            <Animatable.View animation="fadeIn" style={styles.emptyState}>
                <FontAwesome5
                    name={hasSearchOrFilter ? "search" : "book-reader"}
                    size={64}
                    color="#CBD5E0"
                />
                <Text style={styles.emptyStateTitle}>
                    {hasSearchOrFilter ? 'No Results Found' : 'Start Your Study Library'}
                </Text>
                <Text style={styles.emptyStateText}>
                    {hasSearchOrFilter
                        ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                        : 'Upload documents with Study Mode enabled to automatically extract text for reading, summaries, and audio playback.'
                    }
                </Text>
                {!hasSearchOrFilter && (
                    <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={() => navigation.navigate('Upload')}
                    >
                        <LinearGradient colors={["#D4AF37", "#B8941F"]} style={styles.uploadButtonGradient}>
                            <FontAwesome5 name="plus" size={16} color="#1A2C5B" />
                            <Text style={styles.uploadButtonText}>Upload Materials</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </Animatable.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1A2C5B" />

            <LinearGradient colors={["#1A2C5B", "#2C467D"]} style={styles.innerContainer}>
                <Animated.View style={[
                    styles.animatedContainer,
                    {
                        opacity: containerAnim,
                        transform: [{ scale: containerAnim }]
                    }
                ]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => NavigationHelper.safeGoBack(navigation)}
                            activeOpacity={0.8}
                        >
                            <FontAwesome5 name="arrow-left" size={20} color="#F8F4E3" />
                        </TouchableOpacity>

                        <View style={styles.headerContent}>
                            <Text style={styles.title}>Study Materials</Text>
                            <Text style={styles.subtitle}>
                                {materials.length} document{materials.length !== 1 ? 's' : ''} with extracted text
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.filterButton}
                            onPress={toggleFilters}
                            activeOpacity={0.8}
                        >
                            <FontAwesome5 name="filter" size={20} color="#D4AF37" />
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <FontAwesome5 name="search" size={16} color="#CBD5E0" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search materials, subjects, or courses..."
                            placeholderTextColor="#CBD5E0"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setSearchQuery('')}
                                style={styles.clearSearchButton}
                            >
                                <FontAwesome5 name="times" size={14} color="#CBD5E0" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Filter Panel */}
                    {showFilters && (
                        <Animated.View style={[
                            styles.filterPanel,
                            {
                                opacity: filterAnim,
                                transform: [{
                                    translateY: filterAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-20, 0],
                                    }),
                                }],
                            }
                        ]}>
                            <Text style={styles.filterLabel}>Filter by:</Text>
                            <View style={styles.filterOptions}>
                                {[
                                    { key: 'all', label: 'All Materials', icon: 'th-list' },
                                    { key: 'recent', label: 'Recent (7 days)', icon: 'clock' },
                                    { key: 'high_quality', label: 'High Quality (90%+)', icon: 'star' },
                                ].map((filter) => (
                                    <TouchableOpacity
                                        key={filter.key}
                                        style={[
                                            styles.filterOption,
                                            selectedFilter === filter.key && styles.filterOptionActive
                                        ]}
                                        onPress={() => setSelectedFilter(filter.key)}
                                    >
                                        <FontAwesome5
                                            name={filter.icon}
                                            size={14}
                                            color={selectedFilter === filter.key ? "#1A2C5B" : "#F8F4E3"}
                                        />
                                        <Text style={[
                                            styles.filterOptionText,
                                            selectedFilter === filter.key && styles.filterOptionTextActive
                                        ]}>
                                            {filter.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>
                    )}

                    {/* Materials List */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#D4AF37" />
                            <Text style={styles.loadingText}>Loading study materials...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredMaterials}
                            keyExtractor={(item) => item.id}
                            renderItem={renderMaterialItem}
                            contentContainerStyle={styles.materialsList}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={() => loadStudyMaterials(true)}
                                    tintColor="#D4AF37"
                                />
                            }
                            ListEmptyComponent={renderEmptyState}
                        />
                    )}
                </Animated.View>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
    },
    animatedContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    backButton: {
        padding: 8,
        marginRight: 16,
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#F8F4E3',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#CBD5E0',
    },
    filterButton: {
        padding: 8,
    },

    // Search Styles
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderRadius: 12,
        marginHorizontal: 20,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#F8F4E3',
    },
    clearSearchButton: {
        padding: 4,
    },

    // Filter Styles
    filterPanel: {
        backgroundColor: 'rgba(248, 244, 227, 0.15)',
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: 'rgba(212, 175, 55, 0.5)',
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F8F4E3',
        marginBottom: 12,
    },
    filterOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(212, 175, 55, 0.15)',
        borderWidth: 1.5,
        borderColor: 'rgba(212, 175, 55, 0.5)',
        gap: 6,
    },
    filterOptionActive: {
        backgroundColor: '#D4AF37',
        borderColor: '#D4AF37',
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
    },
    filterOptionText: {
        fontSize: 13,
        color: '#F8F4E3',
        fontWeight: '600',
    },
    filterOptionTextActive: {
        color: '#1A2C5B',
        fontWeight: '700',
    },

    // Materials List Styles
    materialsList: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    materialCard: {
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        padding: 16,
    },
    materialHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 8,
    },
    materialHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
    },
    fileIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    materialInfo: {
        flex: 1,
        minWidth: 0,
    },
    materialTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F8F4E3',
        marginBottom: 4,
        lineHeight: 22,
    },
    materialCourse: {
        fontSize: 12,
        color: '#CBD5E0',
    },
    qualityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        minWidth: 50,
        alignItems: 'center',
    },
    deleteButton: {
        padding: 10,
        borderRadius: 8,
        backgroundColor: 'rgba(231, 76, 60, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(231, 76, 60, 0.3)',
    },
    qualityText: {
        fontSize: 12,
        fontWeight: '700',
    },

    // Stats and Actions
    materialStats: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 12,
        color: '#CBD5E0',
    },
    materialActions: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.4)',
        gap: 6,
    },
    actionButtonDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    actionText: {
        fontSize: 12,
        color: '#D4AF37',
        fontWeight: '500',
    },
    actionTextDisabled: {
        color: '#CBD5E0',
    },
    extractPreview: {
        fontSize: 14,
        color: '#F8F4E3',
        lineHeight: 20,
        opacity: 0.8,
    },

    // Loading State
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 16,
        color: '#CBD5E0',
        marginTop: 16,
    },

    // Loading State
    loadingState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 16,
        color: '#CBD5E0',
        marginTop: 16,
        textAlign: 'center',
    },

    // Empty State
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    emptyStateTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#F8F4E3',
        marginTop: 24,
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        color: '#CBD5E0',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    uploadButton: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    uploadButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        gap: 8,
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A2C5B',
    },
});