import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, AppInput, AppButton } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';

export default function KYCPersonalInfoScreen({ navigation, route }) {
  const { tokens } = useAppTheme();
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    address: '',
    idNumber: '',
    bvn: '',
    nin: '',
    nationality: 'Nigeria',
    phoneNumber: '',
    state: '',
    city: '',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Full name must be at least 3 characters';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'ID number is required (NIN, Driver License, etc.)';
    } else if (formData.idNumber.trim().length < 5) {
      newErrors.idNumber = 'ID number must be at least 5 characters';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^0\d{10}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Phone number must be 11 digits starting with 0';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.bvn.trim() && !formData.nin.trim()) {
      newErrors.bvn = 'Either BVN or NIN is required (CBN regulation)';
      newErrors.nin = 'Either BVN or NIN is required (CBN regulation)';
    } else {
      if (formData.bvn.trim() && formData.bvn.trim().length !== 11) {
        newErrors.bvn = 'BVN must be exactly 11 digits';
      }
      if (formData.nin.trim() && formData.nin.trim().length !== 11) {
        newErrors.nin = 'NIN must be exactly 11 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      navigation.navigate('KYCDocuments', { personalInfo: formData });
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
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
              Step 1 of 3: Personal Information
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
                  { width: '33%', backgroundColor: tokens.colors.primary.main },
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
                  Please provide accurate information including either your BVN or NIN (required by CBN for virtual account creation). Your details will be verified against your ID documents.
                </AppText>
              </View>
            </View>

            <View style={{ marginBottom: tokens.spacing.lg }}>
              <AppInput
                label="Full Legal Name"
                placeholder="As it appears on your ID"
                value={formData.fullName}
                onChangeText={(text) => updateField('fullName', text)}
                autoCapitalize="words"
                error={errors.fullName}
                leftIcon={<Ionicons name="person-outline" size={20} color={tokens.colors.text.secondary} />}
              />
            </View>

            <View style={{ marginBottom: tokens.spacing.lg }}>
              <AppInput
                label="Date of Birth"
                placeholder="DD/MM/YYYY (e.g., 15/05/1990)"
                value={formData.dateOfBirth}
                onChangeText={(text) => updateField('dateOfBirth', text)}
                keyboardType="numeric"
                error={errors.dateOfBirth}
                leftIcon={<Ionicons name="calendar-outline" size={20} color={tokens.colors.text.secondary} />}
              />
              <AppText variant="caption" color={tokens.colors.text.secondary} style={{ marginTop: 4 }}>
                Format: DD/MM/YYYY
              </AppText>
            </View>

            <View style={{ marginBottom: tokens.spacing.lg }}>
              <AppInput
                label="ID Number"
                placeholder="NIN, Driver License, or Passport"
                value={formData.idNumber}
                onChangeText={(text) => updateField('idNumber', text)}
                autoCapitalize="characters"
                error={errors.idNumber}
                leftIcon={<Ionicons name="card-outline" size={20} color={tokens.colors.text.secondary} />}
              />
            </View>

            <View style={{ marginBottom: tokens.spacing.lg }}>
              <AppInput
                label="BVN (Bank Verification Number)"
                placeholder="12345678901 (11 digits)"
                value={formData.bvn}
                onChangeText={(text) => updateField('bvn', text.replace(/\D/g, ''))}
                keyboardType="number-pad"
                maxLength={11}
                error={errors.bvn}
                leftIcon={<Ionicons name="shield-checkmark-outline" size={20} color={tokens.colors.text.secondary} />}
              />
              <AppText variant="caption" color={tokens.colors.text.secondary} style={{ marginTop: 4 }}>
                Required for virtual account (provide either BVN or NIN)
              </AppText>
            </View>

            <View style={{ marginBottom: tokens.spacing.lg }}>
              <AppInput
                label="NIN (National Identification Number)"
                placeholder="12345678901 (11 digits)"
                value={formData.nin}
                onChangeText={(text) => updateField('nin', text.replace(/\D/g, ''))}
                keyboardType="number-pad"
                maxLength={11}
                error={errors.nin}
                leftIcon={<Ionicons name="shield-checkmark-outline" size={20} color={tokens.colors.text.secondary} />}
              />
              <AppText variant="caption" color={tokens.colors.text.secondary} style={{ marginTop: 4 }}>
                Alternative to BVN (provide either BVN or NIN)
              </AppText>
            </View>

            <View style={{ marginBottom: tokens.spacing.lg }}>
              <AppInput
                label="Phone Number"
                placeholder="0801234567"
                value={formData.phoneNumber}
                onChangeText={(text) => updateField('phoneNumber', text)}
                keyboardType="phone-pad"
                error={errors.phoneNumber}
                leftIcon={<Ionicons name="call-outline" size={20} color={tokens.colors.text.secondary} />}
              />
            </View>

            <View style={{ marginBottom: tokens.spacing.lg }}>
              <AppInput
                label="Residential Address"
                placeholder="Enter your full address"
                value={formData.address}
                onChangeText={(text) => updateField('address', text)}
                multiline
                numberOfLines={3}
                error={errors.address}
                leftIcon={<Ionicons name="home-outline" size={20} color={tokens.colors.text.secondary} />}
              />
            </View>

            <View style={{ marginBottom: tokens.spacing.lg }}>
              <AppInput
                label="State"
                placeholder="e.g., Lagos"
                value={formData.state}
                onChangeText={(text) => updateField('state', text)}
                autoCapitalize="words"
                error={errors.state}
                leftIcon={<Ionicons name="location-outline" size={20} color={tokens.colors.text.secondary} />}
              />
            </View>

            <View style={{ marginBottom: tokens.spacing.lg }}>
              <AppInput
                label="City"
                placeholder="e.g., Ikeja"
                value={formData.city}
                onChangeText={(text) => updateField('city', text)}
                autoCapitalize="words"
                error={errors.city}
                leftIcon={<Ionicons name="business-outline" size={20} color={tokens.colors.text.secondary} />}
              />
            </View>

            <View style={{ marginBottom: tokens.spacing.lg }}>
              <AppInput
                label="Nationality"
                placeholder="Nigeria"
                value={formData.nationality}
                onChangeText={(text) => updateField('nationality', text)}
                autoCapitalize="words"
                leftIcon={<Ionicons name="flag-outline" size={20} color={tokens.colors.text.secondary} />}
              />
            </View>

            <AppButton onPress={handleNext} fullWidth size="lg" style={{ marginTop: tokens.spacing.base }}>
              Continue to ID Upload
            </AppButton>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
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
});