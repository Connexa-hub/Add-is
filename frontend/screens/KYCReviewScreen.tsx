import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import { AppText, AppButton } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';

export default function KYCReviewScreen({ navigation, route }) {
  const { tokens } = useAppTheme();
  const { personalInfo, documents } = route.params;
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const token = await AsyncStorage.getItem('token');

      const kycData = {
        personal: {
          fullName: personalInfo.fullName,
          dateOfBirth: personalInfo.dateOfBirth,
          address: personalInfo.address,
          idNumber: personalInfo.idNumber,
          nationality: personalInfo.nationality,
          phoneNumber: personalInfo.phoneNumber,
          state: personalInfo.state,
          city: personalInfo.city,
        },
        documents: [
          {
            type: 'id_front',
            url: documents.idFront.url,
            filename: documents.idFront.filename,
          },
          {
            type: 'id_back',
            url: documents.idBack.url,
            filename: documents.idBack.filename,
          },
          {
            type: 'selfie',
            url: documents.selfie.url,
            filename: documents.selfie.filename,
          },
        ],
      };

      const response = await axios.post(
        `${API_BASE_URL}/kyc/submit`,
        kycData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        Alert.alert(
          'KYC Submitted Successfully',
          'Your verification documents have been submitted. You will be notified once your account is reviewed.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Main'),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Submission Failed',
        error.response?.data?.message || 'Failed to submit KYC. Please try again.'
      );
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
      <AppText variant="body2" color={tokens.colors.text.secondary}>
        {label}
      </AppText>
      <AppText variant="body1" weight="semibold" style={{ flex: 1, textAlign: 'right' }}>
        {value}
      </AppText>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { backgroundColor: tokens.colors.background.default, borderBottomColor: tokens.colors.border.default }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={tokens.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <AppText variant="h2" weight="bold">
            Review & Submit
          </AppText>
          <AppText variant="caption" color={tokens.colors.text.secondary}>
            Verify your information before submitting
          </AppText>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={{ padding: tokens.spacing.lg }}>
          <View
            style={[
              styles.infoBox,
              { backgroundColor: tokens.colors.warning.light, marginBottom: tokens.spacing.xl },
            ]}
          >
            <Ionicons name="information-circle" size={20} color={tokens.colors.warning.main} />
            <AppText variant="body2" color={tokens.colors.warning.main} style={{ flex: 1, marginLeft: tokens.spacing.sm }}>
              Please review all information carefully. Your submission will be reviewed within 24-48 hours.
            </AppText>
          </View>

          <View style={[styles.section, { backgroundColor: tokens.colors.background.paper, marginBottom: tokens.spacing.lg }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: tokens.colors.border.default }]}>
              <Ionicons name="person" size={20} color={tokens.colors.primary.main} />
              <AppText variant="subtitle1" weight="semibold" style={{ marginLeft: tokens.spacing.sm }}>
                Personal Information
              </AppText>
            </View>
            <View style={{ padding: tokens.spacing.base }}>
              <InfoRow label="Full Name" value={personalInfo.fullName} />
              <InfoRow label="Date of Birth" value={personalInfo.dateOfBirth} />
              <InfoRow label="ID Number" value={personalInfo.idNumber} />
              <InfoRow label="Phone Number" value={personalInfo.phoneNumber} />
              <InfoRow label="Address" value={personalInfo.address} />
              <InfoRow label="City" value={personalInfo.city} />
              <InfoRow label="State" value={personalInfo.state} />
              <InfoRow label="Nationality" value={personalInfo.nationality} />
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: tokens.colors.background.paper, marginBottom: tokens.spacing.xl }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: tokens.colors.border.default }]}>
              <Ionicons name="document" size={20} color={tokens.colors.primary.main} />
              <AppText variant="subtitle1" weight="semibold" style={{ marginLeft: tokens.spacing.sm }}>
                Uploaded Documents
              </AppText>
            </View>
            <View style={{ padding: tokens.spacing.base }}>
              <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginBottom: tokens.spacing.base }}>
                ID Front
              </AppText>
              <Image
                source={{ uri: documents.idFront.uri }}
                style={[styles.documentImage, { borderColor: tokens.colors.border.default, marginBottom: tokens.spacing.base }]}
              />

              <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginBottom: tokens.spacing.base }}>
                ID Back
              </AppText>
              <Image
                source={{ uri: documents.idBack.uri }}
                style={[styles.documentImage, { borderColor: tokens.colors.border.default, marginBottom: tokens.spacing.base }]}
              />

              <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginBottom: tokens.spacing.base }}>
                Selfie
              </AppText>
              <Image
                source={{ uri: documents.selfie.uri }}
                style={[styles.documentImage, { borderColor: tokens.colors.border.default }]}
              />
            </View>
          </View>

          <View style={[styles.disclaimer, { backgroundColor: tokens.colors.neutral.gray100, marginBottom: tokens.spacing.lg }]}>
            <Ionicons name="shield-checkmark" size={20} color={tokens.colors.text.secondary} />
            <AppText variant="caption" color={tokens.colors.text.secondary} style={{ flex: 1, marginLeft: tokens.spacing.sm }}>
              Your information is encrypted and secure. We comply with all data protection regulations and will only use your information for verification purposes.
            </AppText>
          </View>

          <AppButton
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            fullWidth
            size="lg"
            style={{ marginBottom: tokens.spacing.base }}
          >
            Submit KYC for Review
          </AppButton>

          <TouchableOpacity
            style={{ alignItems: 'center', padding: tokens.spacing.base }}
            onPress={() => navigation.navigate('KYCPersonalInfo')}
          >
            <AppText variant="body2" color={tokens.colors.primary.main}>
              Edit Information
            </AppText>
          </TouchableOpacity>
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
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  section: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 12,
  },
  documentImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    borderWidth: 1,
    resizeMode: 'cover',
  },
  disclaimer: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
});
