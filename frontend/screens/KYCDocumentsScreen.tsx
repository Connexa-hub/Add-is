import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import { AppText, AppButton } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';

export default function KYCDocumentsScreen({ navigation, route }) {
  const { tokens } = useAppTheme();
  const { personalInfo } = route.params;
  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ idFront: false, idBack: false });

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Media library permission is required to select photos.');
      return false;
    }
    return true;
  };

  const pickImage = async (type: 'idFront' | 'idBack', source: 'camera' | 'library') => {
    try {
      if (source === 'camera') {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;
      } else {
        const hasPermission = await requestMediaLibraryPermission();
        if (!hasPermission) return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        await uploadDocument(imageUri, type);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture/select image. Please try again.');
      console.error(error);
    }
  };

  const uploadDocument = async (uri: string, type: 'idFront' | 'idBack') => {
    try {
      setUploadProgress({ ...uploadProgress, [type]: true });
      
      const filename = uri.split('/').pop() || `${type}.jpg`;
      
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onloadend = async () => {
        const base64data = reader.result;
        
        const token = await AsyncStorage.getItem('token');
        
        const uploadResponse = await axios.post(
          `${API_BASE_URL}/uploads`,
          {
            file: base64data,
            filename,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (uploadResponse.data.success) {
          const uploadedData = {
            uri,
            url: uploadResponse.data.data.url,
            filename: uploadResponse.data.data.filename,
          };

          if (type === 'idFront') {
            setIdFront(uploadedData);
          } else {
            setIdBack(uploadedData);
          }
        }
        
        setUploadProgress({ ...uploadProgress, [type]: false });
      };
    } catch (error) {
      setUploadProgress({ ...uploadProgress, [type]: false });
      Alert.alert('Upload Failed', 'Failed to upload document. Please try again.');
      console.error(error);
    }
  };

  const showImageSourceOptions = (type: 'idFront' | 'idBack') => {
    Alert.alert(
      'Select Image Source',
      'Choose where to get the image from',
      [
        {
          text: 'Camera',
          onPress: () => pickImage(type, 'camera'),
        },
        {
          text: 'Gallery',
          onPress: () => pickImage(type, 'library'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleNext = () => {
    if (!idFront || !idBack) {
      Alert.alert('Missing Documents', 'Please upload both front and back of your ID.');
      return;
    }

    navigation.navigate('KYCSelfie', {
      personalInfo,
      documents: {
        idFront,
        idBack,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { backgroundColor: tokens.colors.background.default, borderBottomColor: tokens.colors.border.default }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={tokens.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <AppText variant="h2" weight="bold">
            KYC Verification
          </AppText>
          <AppText variant="caption" color={tokens.colors.text.secondary}>
            Step 2 of 3: ID Documents
          </AppText>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={{ padding: tokens.spacing.lg }}>
          <View
            style={[
              styles.progressContainer,
              { backgroundColor: tokens.colors.neutral.gray200, marginBottom: tokens.spacing.xl },
            ]}
          >
            <View
              style={[
                styles.progressBar,
                { width: '66%', backgroundColor: tokens.colors.primary.main },
              ]}
            />
          </View>

          <View style={{ marginBottom: tokens.spacing.xl }}>
            <View
              style={[
                styles.infoBox,
                { backgroundColor: tokens.colors.primary.light, marginBottom: tokens.spacing.lg },
              ]}
            >
              <Ionicons name="information-circle" size={20} color={tokens.colors.primary.main} />
              <AppText variant="body2" color={tokens.colors.primary.main} style={{ flex: 1, marginLeft: tokens.spacing.sm }}>
                Upload clear photos of your ID card. Ensure all text is readable and the photo is not blurry.
              </AppText>
            </View>
          </View>

          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.base }}>
            ID Card Front
          </AppText>
          <TouchableOpacity
            style={[
              styles.uploadBox,
              { borderColor: tokens.colors.border.default, marginBottom: tokens.spacing.xl },
            ]}
            onPress={() => showImageSourceOptions('idFront')}
          >
            {uploadProgress.idFront ? (
              <ActivityIndicator size="large" color={tokens.colors.primary.main} />
            ) : idFront ? (
              <>
                <Image source={{ uri: idFront.uri }} style={styles.previewImage} />
                <View style={[styles.changeButton, { backgroundColor: tokens.colors.primary.main }]}>
                  <Ionicons name="refresh" size={16} color="#FFFFFF" />
                  <AppText variant="caption" color="#FFFFFF" style={{ marginLeft: 4 }}>
                    Change Photo
                  </AppText>
                </View>
              </>
            ) : (
              <>
                <Ionicons name="image-outline" size={48} color={tokens.colors.text.secondary} />
                <AppText variant="body1" color={tokens.colors.text.secondary} style={{ marginTop: tokens.spacing.sm }}>
                  Tap to upload ID front
                </AppText>
                <AppText variant="caption" color={tokens.colors.text.tertiary}>
                  Camera or Gallery
                </AppText>
              </>
            )}
          </TouchableOpacity>

          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.base }}>
            ID Card Back
          </AppText>
          <TouchableOpacity
            style={[
              styles.uploadBox,
              { borderColor: tokens.colors.border.default, marginBottom: tokens.spacing.xl },
            ]}
            onPress={() => showImageSourceOptions('idBack')}
          >
            {uploadProgress.idBack ? (
              <ActivityIndicator size="large" color={tokens.colors.primary.main} />
            ) : idBack ? (
              <>
                <Image source={{ uri: idBack.uri }} style={styles.previewImage} />
                <View style={[styles.changeButton, { backgroundColor: tokens.colors.primary.main }]}>
                  <Ionicons name="refresh" size={16} color="#FFFFFF" />
                  <AppText variant="caption" color="#FFFFFF" style={{ marginLeft: 4 }}>
                    Change Photo
                  </AppText>
                </View>
              </>
            ) : (
              <>
                <Ionicons name="image-outline" size={48} color={tokens.colors.text.secondary} />
                <AppText variant="body1" color={tokens.colors.text.secondary} style={{ marginTop: tokens.spacing.sm }}>
                  Tap to upload ID back
                </AppText>
                <AppText variant="caption" color={tokens.colors.text.tertiary}>
                  Camera or Gallery
                </AppText>
              </>
            )}
          </TouchableOpacity>

          <AppButton
            onPress={handleNext}
            fullWidth
            size="lg"
            disabled={!idFront || !idBack}
            style={{ marginTop: tokens.spacing.base }}
          >
            Continue to Selfie
          </AppButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  progressContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  uploadBox: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
});
