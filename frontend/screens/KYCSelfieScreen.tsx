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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import { AppText, AppButton } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';

export default function KYCSelfieScreen({ navigation, route }) {
  const { tokens } = useAppTheme();
  const { personalInfo, documents } = route.params;
  const [selfie, setSelfie] = useState(null);
  const [uploading, setUploading] = useState(false);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to capture your selfie.');
      return false;
    }
    return true;
  };

  const captureSelfie = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        await uploadSelfie(imageUri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture selfie. Please try again.');
      console.error(error);
    }
  };

  const uploadSelfie = async (uri: string) => {
    try {
      setUploading(true);
      
      const filename = `selfie_${Date.now()}.jpg`;
      
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
          setSelfie({
            uri,
            url: uploadResponse.data.data.url,
            filename: uploadResponse.data.data.filename,
          });
        }
        
        setUploading(false);
      };
    } catch (error) {
      setUploading(false);
      Alert.alert('Upload Failed', 'Failed to upload selfie. Please try again.');
      console.error(error);
    }
  };

  const handleNext = () => {
    if (!selfie) {
      Alert.alert('Selfie Required', 'Please capture your selfie to continue.');
      return;
    }

    navigation.navigate('KYCReview', {
      personalInfo,
      documents: {
        ...documents,
        selfie,
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
            Step 3 of 3: Selfie Capture
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
                { width: '100%', backgroundColor: tokens.colors.primary.main },
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
                Take a clear selfie. Ensure your face is clearly visible and matches your ID photo.
              </AppText>
            </View>
          </View>

          <View style={[styles.tipsContainer, { borderColor: tokens.colors.border.default, marginBottom: tokens.spacing.xl }]}>
            <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.base }}>
              Selfie Guidelines:
            </AppText>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={20} color={tokens.colors.success.main} />
              <AppText variant="body2" color={tokens.colors.text.secondary} style={{ flex: 1, marginLeft: tokens.spacing.sm }}>
                Face clearly visible without obstruction
              </AppText>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={20} color={tokens.colors.success.main} />
              <AppText variant="body2" color={tokens.colors.text.secondary} style={{ flex: 1, marginLeft: tokens.spacing.sm }}>
                Remove sunglasses, hats, or masks
              </AppText>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={20} color={tokens.colors.success.main} />
              <AppText variant="body2" color={tokens.colors.text.secondary} style={{ flex: 1, marginLeft: tokens.spacing.sm }}>
                Good lighting (avoid dark or overly bright areas)
              </AppText>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={20} color={tokens.colors.success.main} />
              <AppText variant="body2" color={tokens.colors.text.secondary} style={{ flex: 1, marginLeft: tokens.spacing.sm }}>
                Neutral expression, looking at camera
              </AppText>
            </View>
          </View>

          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.base }}>
            Your Selfie
          </AppText>
          <TouchableOpacity
            style={[
              styles.uploadBox,
              { borderColor: tokens.colors.border.default, marginBottom: tokens.spacing.xl },
            ]}
            onPress={captureSelfie}
          >
            {uploading ? (
              <ActivityIndicator size="large" color={tokens.colors.primary.main} />
            ) : selfie ? (
              <>
                <Image source={{ uri: selfie.uri }} style={styles.previewImage} />
                <View style={[styles.changeButton, { backgroundColor: tokens.colors.primary.main }]}>
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                  <AppText variant="caption" color="#FFFFFF" style={{ marginLeft: 4 }}>
                    Retake Selfie
                  </AppText>
                </View>
              </>
            ) : (
              <>
                <View style={[styles.cameraIcon, { backgroundColor: tokens.colors.primary.light }]}>
                  <Ionicons name="camera" size={48} color={tokens.colors.primary.main} />
                </View>
                <AppText variant="body1" color={tokens.colors.text.secondary} style={{ marginTop: tokens.spacing.base }}>
                  Tap to capture selfie
                </AppText>
                <AppText variant="caption" color={tokens.colors.text.tertiary}>
                  Uses front camera
                </AppText>
              </>
            )}
          </TouchableOpacity>

          <AppButton
            onPress={handleNext}
            fullWidth
            size="lg"
            disabled={!selfie}
            style={{ marginTop: tokens.spacing.base }}
          >
            Review & Submit
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
  tipsContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  uploadBox: {
    height: 300,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cameraIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
