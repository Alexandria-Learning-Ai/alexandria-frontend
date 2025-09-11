/**
 * OfflineIndicator - Visual indicator for network status
 * Shows when the app is offline and provides sync status
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
  ScrollView
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useOffline } from '../hooks/useOffline';
import logger from '../utils/logger';


const OfflineIndicator = ({ style = {} }) => {
  const { 
    isOnline, 
    networkInfo, 
    getCacheStats, 
    cleanupExpiredCache 
  } = useOffline();
  
  const [showDetails, setShowDetails] = useState(false);
  const [cacheStats, setCacheStats] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate indicator when going offline
    if (!isOnline) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline]);

  const loadCacheStats = async () => {
    try {
      const stats = await getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      logger.error('Error loading cache stats:', error);
    }
  };

  const handleCleanupCache = async () => {
    try {
      const cleanedCount = await cleanupExpiredCache();
      await loadCacheStats(); // Refresh stats
      logger.info(`Cleaned ${cleanedCount} expired cache entries`);
    } catch (error) {
      logger.error('Error cleaning cache:', error);
    }
  };

  const getConnectionIcon = () => {
    if (isOnline) {
      return 'wifi';
    }
    return 'wifi-slash';
  };

  const getConnectionColor = () => {
    if (isOnline) {
      return '#28a745';
    }
    return '#dc3545';
  };

  const getConnectionText = () => {
    if (isOnline) {
      return 'Online';
    }
    return 'Offline';
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isOnline) {
    // Show minimal indicator when online
    return (
      <TouchableOpacity
        style={[styles.onlineIndicator, style]}
        onPress={() => {
          setShowDetails(true);
          loadCacheStats();
        }}
        activeOpacity={0.7}
      >
        <FontAwesome5 
          name={getConnectionIcon()} 
          size={12} 
          color={getConnectionColor()} 
        />
      </TouchableOpacity>
    );
  }

  return (
    <>
      <Animated.View style={[styles.offlineContainer, style, { opacity: fadeAnim }]}>
        <Animatable.View 
          animation="pulse" 
          iterationCount="infinite"
          duration={2000}
          style={styles.offlineIndicator}
        >
          <TouchableOpacity
            style={styles.offlineContent}
            onPress={() => {
              setShowDetails(true);
              loadCacheStats();
            }}
            activeOpacity={0.8}
          >
            <FontAwesome5 
              name={getConnectionIcon()} 
              size={16} 
              color="#FFFFFF" 
            />
            <Text style={styles.offlineText}>{getConnectionText()}</Text>
            <Text style={styles.offlineSubtext}>Using cached data</Text>
          </TouchableOpacity>
        </Animatable.View>
      </Animated.View>

      {/* Network Status Modal */}
      <Modal
        visible={showDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Network Status</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetails(false)}
              >
                <FontAwesome5 name="times" size={18} color="#4A5568" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {/* Connection Status */}
              <View style={styles.statusSection}>
                <View style={styles.statusRow}>
                  <FontAwesome5 
                    name={getConnectionIcon()} 
                    size={20} 
                    color={getConnectionColor()} 
                  />
                  <Text style={[styles.statusText, { color: getConnectionColor() }]}>
                    {getConnectionText()}
                  </Text>
                </View>
                
                {networkInfo && (
                  <View style={styles.networkDetails}>
                    <Text style={styles.networkDetailText}>
                      Type: {networkInfo.type || 'Unknown'}
                    </Text>
                    {networkInfo.timestamp && (
                      <Text style={styles.networkDetailText}>
                        Last updated: {new Date(networkInfo.timestamp).toLocaleTimeString()}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Cache Statistics */}
              {cacheStats && (
                <View style={styles.cacheSection}>
                  <Text style={styles.sectionTitle}>Cache Statistics</Text>
                  
                  <View style={styles.cacheStatsGrid}>
                    <View style={styles.cacheStatItem}>
                      <Text style={styles.cacheStatNumber}>{cacheStats.totalCacheEntries}</Text>
                      <Text style={styles.cacheStatLabel}>Total Entries</Text>
                    </View>
                    
                    <View style={styles.cacheStatItem}>
                      <Text style={styles.cacheStatNumber}>{cacheStats.validEntries}</Text>
                      <Text style={styles.cacheStatLabel}>Valid</Text>
                    </View>
                    
                    <View style={styles.cacheStatItem}>
                      <Text style={styles.cacheStatNumber}>{cacheStats.expiredEntries}</Text>
                      <Text style={styles.cacheStatLabel}>Expired</Text>
                    </View>
                  </View>

                  <View style={styles.cacheSizeContainer}>
                    <Text style={styles.cacheSizeText}>
                      Cache Size: {formatBytes(cacheStats.totalSize)}
                    </Text>
                  </View>

                  {cacheStats.expiredEntries > 0 && (
                    <TouchableOpacity
                      style={styles.cleanupButton}
                      onPress={handleCleanupCache}
                    >
                      <FontAwesome5 name="broom" size={16} color="#FFFFFF" />
                      <Text style={styles.cleanupButtonText}>
                        Clean Up Expired Cache
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Offline Features */}
              <View style={styles.featuresSection}>
                <Text style={styles.sectionTitle}>Offline Features</Text>
                <View style={styles.featureList}>
                  <View style={styles.featureItem}>
                    <FontAwesome5 name="check-circle" size={16} color="#28a745" />
                    <Text style={styles.featureText}>Quiz history available offline</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <FontAwesome5 name="check-circle" size={16} color="#28a745" />
                    <Text style={styles.featureText}>Cached flashcards accessible</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <FontAwesome5 name="check-circle" size={16} color="#28a745" />
                    <Text style={styles.featureText}>Profile data cached locally</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <FontAwesome5 name="check-circle" size={16} color="#28a745" />
                    <Text style={styles.featureText}>Auto-sync when reconnected</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  onlineIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  offlineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  offlineIndicator: {
    backgroundColor: '#dc3545',
    marginHorizontal: 16,
    marginTop: 50,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  offlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
  },
  offlineText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  offlineSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginLeft: 'auto',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2C5B',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
  },
  modalScrollView: {
    maxHeight: 400,
  },

  // Status Section
  statusSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  networkDetails: {
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 8,
  },
  networkDetailText: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 4,
  },

  // Cache Section
  cacheSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2C5B',
    marginBottom: 16,
  },
  cacheStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  cacheStatItem: {
    alignItems: 'center',
  },
  cacheStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2C5B',
  },
  cacheStatLabel: {
    fontSize: 12,
    color: '#4A5568',
    marginTop: 4,
  },
  cacheSizeContainer: {
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  cacheSizeText: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
  },
  cleanupButton: {
    backgroundColor: '#dc3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  cleanupButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // Features Section
  featuresSection: {
    padding: 20,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#4A5568',
    flex: 1,
  },
});

export default OfflineIndicator;