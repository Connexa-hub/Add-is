
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { AppText, AppButton, AppDivider } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { useBiometric } from '../hooks/useBiometric';

export default function InitialSetupScreen({ navigation, route }) {
  const { tokens } = useAppTheme();
  const { capabilities, enableBiometric } = useBiometric();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('15');
  const [loading, setLoading] = useState(false);

  const { userId, email, token } = route.params || {};

  const timeoutOptions = [
    { label: '5 minutes', value: '5' },
    { label: '10 minutes', value: '10' },
    { label: '15 minutes (Recommended)', value: '15' },
    { label: '30 minutes', value: '30' },
    { label: 'Never', value: 'never' },
  ];

  const handleComplete = async () => {
    try {
      setLoading(true);

      // Save session timeout preference
      await AsyncStorage.setItem('sessionTimeout', sessionTimeout);
      await AsyncStorage.setItem('autoLogoutEnabled', sessionTimeout !== 'never' ? 'true' : 'false');
      await AsyncStorage.setItem('lastActivityTime', Date.now().toString());

      // Setup biometric if enabled
      if (biometricEnabled && capabilities.isAvailable && userId) {
        await enableBiometric(userId, token);
      }

      // Mark initial setup as complete
      await AsyncStorage.setItem('initialSetupComplete', 'true');

      // Navigate to Main
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.error('Setup completion error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background.default }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={{ padding: tokens.spacing.lg }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: tokens.spacing['2xl'] }}>
            <View style={[styles.iconContainer, { backgroundColor: tokens.colors.primary.light }]}>
              <Ionicons name="settings-outline" size={48} color={tokens.colors.primary.main} />
            </View>
            <AppText variant="h2" weight="bold" style={{ marginTop: tokens.spacing.lg, marginBottom: tokens.spacing.sm }}>
              Let's Set Up Your Account
            </AppText>
            <AppText variant="body1" color={tokens.colors.text.secondary} align="center">
              Customize your security preferences for a better experience
            </AppText>
          </View>

          {/* Biometric Setup */}
          {capabilities.isAvailable && (
            <View style={[styles.section, { backgroundColor: tokens.colors.background.paper }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: tokens.spacing.base }}>
                <View style={[styles.sectionIcon, { backgroundColor: tokens.colors.primary.light }]}>
                  <Ionicons name="finger-print" size={24} color={tokens.colors.primary.main} />
                </View>
                <View style={{ flex: 1, marginLeft: tokens.spacing.base }}>
                  <AppText variant="subtitle1" weight="semibold">
                    {capabilities.biometricType} Login
                  </AppText>
                  <AppText variant="caption" color={tokens.colors.text.secondary}>
                    Enable quick and secure login
                  </AppText>
                </View>
                <View style={styles.switch}>
                  <AppButton
                    variant={biometricEnabled ? 'primary' : 'outline'}
                    onPress={() => setBiometricEnabled(!biometricEnabled)}
                    style={{ paddingHorizontal: tokens.spacing.base, paddingVertical: tokens.spacing.xs }}
                  >
                    <AppText variant="caption" color={biometricEnabled ? '#fff' : tokens.colors.primary.main}>
                      {biometricEnabled ? 'ON' : 'OFF'}
                    </AppText>
                  </AppButton>
                </View>
              </View>
              <AppDivider style={{ marginVertical: tokens.spacing.sm }} />
              <AppText variant="caption" color={tokens.colors.text.secondary}>
                You can use your {capabilities.biometricType?.toLowerCase()} to login instead of entering your password every time.
              </AppText>
            </View>
          )}

          {/* Session Timeout */}
          <View style={[styles.section, { backgroundColor: tokens.colors.background.paper, marginTop: tokens.spacing.lg }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: tokens.spacing.base }}>
              <View style={[styles.sectionIcon, { backgroundColor: tokens.colors.warning.light }]}>
                <Ionicons name="timer-outline" size={24} color={tokens.colors.warning.main} />
              </View>
              <View style={{ flex: 1, marginLeft: tokens.spacing.base }}>
                <AppText variant="subtitle1" weight="semibold">
                  Auto-Logout Timer
                </AppText>
                <AppText variant="caption" color={tokens.colors.text.secondary}>
                  How long before automatic logout?
                </AppText>
              </View>
            </View>
            <AppDivider style={{ marginVertical: tokens.spacing.sm }} />
            
            {timeoutOptions.map((option) => (
              <View
                key={option.value}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: tokens.spacing.sm,
                  paddingHorizontal: tokens.spacing.base,
                  borderRadius: tokens.radius.md,
                  backgroundColor: sessionTimeout === option.value ? tokens.colors.primary.light : 'transparent',
                  marginBottom: tokens.spacing.xs,
                }}
                onTouchEnd={() => setSessionTimeout(option.value)}
              >
                <View style={[
                  styles.radio,
                  {
                    borderColor: sessionTimeout === option.value ? tokens.colors.primary.main : tokens.colors.border.default,
                    backgroundColor: sessionTimeout === option.value ? tokens.colors.primary.main : 'transparent',
                  }
                ]}>
                  {sessionTimeout === option.value && (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  )}
                </View>
                <AppText
                  variant="body2"
                  weight={sessionTimeout === option.value ? 'semibold' : 'regular'}
                  color={sessionTimeout === option.value ? tokens.colors.primary.main : tokens.colors.text.primary}
                  style={{ marginLeft: tokens.spacing.sm }}
                >
                  {option.label}
                </AppText>
              </View>
            ))}
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: tokens.colors.info.light, marginTop: tokens.spacing.lg }]}>
            <Ionicons name="information-circle" size={20} color={tokens.colors.info.main} />
            <AppText variant="caption" color={tokens.colors.info.main} style={{ marginLeft: tokens.spacing.sm, flex: 1 }}>
              You can change these settings anytime from your profile settings.
            </AppText>
          </View>

          {/* Action Buttons */}
          <View style={{ marginTop: tokens.spacing['2xl'] }}>
            <AppButton
              onPress={handleComplete}
              loading={loading}
              disabled={loading}
              fullWidth
              size="lg"
            >
              Complete Setup
            </AppButton>
            
            <AppButton
              variant="outline"
              onPress={handleComplete}
              disabled={loading}
              fullWidth
              size="lg"
              style={{ marginTop: tokens.spacing.md }}
            >
              Skip for Now
            </AppButton>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 16,
    borderRadius: 16,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
  },
});
