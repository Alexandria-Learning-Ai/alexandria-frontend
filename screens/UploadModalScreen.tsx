/**
 * UploadModalScreen - Material upload with progress tracking
 *
 * Features:
 * - File information display (name, size, type)
 * - Upload type selector (Book, Study Guide, Paper)
 * - Upload progress indicator
 * - Cancel button
 * - Error handling
 * - Navigation to BookDetail on success
 * - Alexandria theme styling
 *
 * Navigation:
 * - Navigate to BookDetail with processing status on upload success
 * - Go back on cancel
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import { Colors } from '../constants/Colors';
import { MaterialKind, UploadResult } from '../types/materials';
import ProgressBar from '../components/shared/ProgressBar';
import logger from '../utils/logger';

type RootStackParamList = {
  MaterialLibrary: undefined;
  UploadModal: { file: DocumentPicker.DocumentPickerAsset };
  BookDetail: { materialId: string };
};

type UploadModalScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'UploadModal'
>;

type UploadModalScreenRouteProp = RouteProp<RootStackParamList, 'UploadModal'>;

interface UploadModalScreenProps {
  navigation: UploadModalScreenNavigationProp;
  route: UploadModalScreenRouteProp;
}

const UploadModalScreen: React.FC<UploadModalScreenProps> = ({
  navigation,
  route,
}) => {
  const { file } = route.params;

  // State
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadType, setUploadType] = useState<MaterialKind>('book');

  // Theme colors
  const themeColors = useMemo(
    () => ({
      background: Colors.surface,
      text: Colors.text,
      textSecondary: Colors.textSecondary,
      primary: Colors.primary,
      accent: Colors.accent,
      border: Colors.border,
    }),
    []
  );

  // Upload type options
  const uploadTypes: Array<{ id: MaterialKind; label: string; icon: string }> = [
    { id: 'book', label: 'Book', icon: 'book' },
    { id: 'study_guide', label: 'Study Guide', icon: 'file-alt' },
    { id: 'paper', label: 'Research Paper', icon: 'file-pdf' },
  ];

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Handle upload
  const handleUpload = useCallback(async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert('Error', 'You must be logged in to upload materials.');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();

      // Append file
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType || 'application/pdf',
        name: file.name,
      } as any);

      // CRITICAL: Backend expects 'title' (required), 'kind' (optional), and 'author' (optional)
      // Extract title from filename (remove extension)
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      formData.append('title', fileNameWithoutExt);
      formData.append('kind', uploadType); // Backend expects 'kind', not 'upload_type'

      logger.info('Uploading material', {
        name: file.name,
        title: fileNameWithoutExt,
        kind: uploadType,
        size: file.size,
      });

      const response = await axios.post<UploadResult>(
        `${API_BASE_URL}/api/materials/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-User-ID': user.uid,
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setProgress(percentCompleted);
              logger.debug('Upload progress', { percentCompleted });
            }
          },
        }
      );

      logger.success('Material uploaded successfully', {
        materialId: response.data.material_id,
        jobId: response.data.job_id,
        status: response.data.status,
      });

      // Navigate to BookDetail with material ID
      navigation.replace('BookDetail', {
        materialId: response.data.material_id,
      });
    } catch (error) {
      logger.error('Upload failed', error);

      if (axios.isAxiosError(error)) {
        // Log full error details for debugging
        if (error.response) {
          logger.error('Upload error response', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          });
        }

        if (error.response?.status === 413) {
          Alert.alert('File Too Large', 'Maximum file size is 200MB');
        } else if (error.response?.status === 415) {
          Alert.alert(
            'Unsupported Format',
            'Please upload PDF, DOCX, EPUB, or TXT files'
          );
        } else if (error.response?.status === 422) {
          // Validation error - extract message from backend
          const detail = error.response.data?.detail || 'Invalid request data';
          Alert.alert('Validation Error', detail);
        } else if (error.response?.status === 400) {
          // Bad request - show backend message
          const detail = error.response.data?.detail || 'Invalid request';
          Alert.alert('Upload Error', detail);
        } else if (error.code === 'ECONNABORTED') {
          Alert.alert(
            'Upload Timeout',
            'Please check your connection and try again'
          );
        } else {
          Alert.alert('Upload Failed', 'An error occurred. Please try again.');
        }
      } else {
        Alert.alert('Upload Failed', 'An error occurred. Please try again.');
      }

      setUploading(false);
      setProgress(0);
    }
  }, [file, uploadType, navigation]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (uploading) {
      Alert.alert(
        'Cancel Upload?',
        'Are you sure you want to cancel this upload?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: () => {
              logger.info('Upload canceled');
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [uploading, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.modal}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>
            Upload Material
          </Text>
          <TouchableOpacity onPress={handleCancel} disabled={uploading}>
            <FontAwesome5
              name="times"
              size={24}
              color={uploading ? themeColors.textSecondary : themeColors.text}
            />
          </TouchableOpacity>
        </View>

        {/* File info */}
        <View style={[styles.fileInfo, { borderColor: themeColors.border }]}>
          <FontAwesome5
            name="file"
            size={48}
            color={themeColors.accent}
            style={styles.fileIcon}
          />
          <View style={styles.fileDetails}>
            <Text
              style={[styles.fileName, { color: themeColors.text }]}
              numberOfLines={2}
            >
              {file.name}
            </Text>
            <Text style={[styles.fileSize, { color: themeColors.textSecondary }]}>
              {formatFileSize(file.size || 0)}
            </Text>
          </View>
        </View>

        {/* Upload type selector */}
        {!uploading && (
          <>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Material Type
            </Text>
            <View style={styles.typeSelector}>
              {uploadTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeOption,
                    {
                      backgroundColor:
                        uploadType === type.id
                          ? themeColors.primary
                          : themeColors.border,
                    },
                  ]}
                  onPress={() => setUploadType(type.id)}
                  activeOpacity={0.7}
                >
                  <FontAwesome5
                    name={type.icon}
                    size={24}
                    color={uploadType === type.id ? Colors.textLight : themeColors.text}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      {
                        color:
                          uploadType === type.id
                            ? Colors.textLight
                            : themeColors.text,
                      },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Upload progress */}
        {uploading && (
          <View style={styles.uploadingContainer}>
            <ProgressBar progress={progress / 100} height={12} />
            <Text style={[styles.progressText, { color: themeColors.textSecondary }]}>
              {progress}% uploaded
            </Text>
            <ActivityIndicator
              size="large"
              color={themeColors.accent}
              style={styles.spinner}
            />
          </View>
        )}

        {/* Action buttons */}
        {!uploading && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: themeColors.border }]}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: themeColors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.uploadButton, { backgroundColor: themeColors.primary }]}
              onPress={handleUpload}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="upload" size={16} color={Colors.textLight} style={styles.buttonIcon} />
              <Text style={[styles.buttonText, { color: Colors.textLight }]}>
                Upload & Extract
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  fileInfo: {
    flexDirection: 'row',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 24,
  },
  fileIcon: {
    marginRight: 16,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  uploadingContainer: {
    marginBottom: 24,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  spinner: {
    marginTop: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  cancelButton: {
    borderWidth: 1,
  },
  uploadButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UploadModalScreen;
