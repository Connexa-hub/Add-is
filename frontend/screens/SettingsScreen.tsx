import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Switch, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppText, AppButton, AppDivider } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { useBiometric } from '../hooks/useBiometric';

export default function SettingsScreen({ navigation }: any) {
  const { tokens } = useAppTheme();
  const {
    capabilities,
    isLoading: isBiometricLoading,
    isBiometricEnabled,
    enableBiometric,
    disableBiometric,
    saveCredentials,
  } = useBiometric();

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [bio, dark, id, email] = await Promise.all([
        isBiometricEnabled(),
        AsyncStorage.getItem('darkMode'),
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('userEmail'),
      ]);

      setBiometricEnabled(bio);
      setDarkMode(dark === 'true');
      setUserId(id || '');
      setUserEmail(email || '');
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBiometric = async () => {
    if (!capabilities.isAvailable) {
      Alert.alert(
        'Biometric Unavailable',
        capabilities.isEnrolled
          ? 'Biometric authentication is not supported on this device'
          : `Please set up ${capabilities.biometricType || 'biometric authentication'} in your device settings first.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      if (!biometricEnabled) {
        const success = await enableBiometric(userId);
        if (success) {
          await saveCredentials(userId, userEmail);
          setBiometricEnabled(true);
          Alert.alert(
            'Success',
            `${capabilities.biometricType || 'Biometric'} authentication enabled successfully!`
          );
        }
      } else {
        Alert.alert(
          'Disable Biometric',
          `Are you sure you want to disable ${capabilities.biometricType || 'biometric'} authentication?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                const success = await disableBiometric();
                if (success) {
                  setBiometricEnabled(false);
                  Alert.alert('Success', 'Biometric authentication disabled');
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      Alert.alert('Error', 'Failed to update biometric settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = async () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    await AsyncStorage.setItem('darkMode', newVal.toString());
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['token', 'userId', 'userEmail', 'userName']);
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ]
    );
  };

  if (loading && isBiometricLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={tokens.colors.primary.main} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tokens.colors.background.default }]}>
      <ScrollView style={styles.container}>
        <View style={{ padding: tokens.spacing.lg }}>
          <View style={{ marginBottom: tokens.spacing.xl }}>
            <AppText variant="h2" weight="bold">
              Settings
            </AppText>
            <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginTop: tokens.spacing.xs }}>
              Manage your account preferences
            </AppText>
          </View>

          <View style={[styles.section, { backgroundColor: tokens.colors.background.paper, borderRadius: tokens.radius.lg, padding: tokens.spacing.base }]}>
            <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.base }}>
              Security
            </AppText>

            {capabilities.isAvailable && (
              <View style={styles.settingRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={[styles.iconWrapper, { backgroundColor: tokens.colors.primary.light }]}>
                    <Ionicons name="finger-print" size={20} color={tokens.colors.primary.main} />
                  </View>
                  <View style={{ flex: 1, marginLeft: tokens.spacing.sm }}>
                    <AppText variant="body1" weight="semibold">
                      {capabilities.biometricType || 'Biometric'} Login
                    </AppText>
                    <AppText variant="caption" color={tokens.colors.text.secondary}>
                      {capabilities.isAvailable
                        ? `Use ${capabilities.biometricType?.toLowerCase() || 'biometric'} for quick login`
                        : 'Not available on this device'}
                    </AppText>
                  </View>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={toggleBiometric}
                  disabled={!capabilities.isAvailable || loading}
                  color={tokens.colors.primary.main}
                />
              </View>
            )}

            <AppDivider style={{ marginVertical: tokens.spacing.sm }} />

            <View style={styles.settingRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[styles.iconWrapper, { backgroundColor: tokens.colors.warning.light }]}>
                  <Ionicons name="moon" size={20} color={tokens.colors.warning.main} />
                </View>
                <View style={{ flex: 1, marginLeft: tokens.spacing.sm }}>
                  <AppText variant="body1" weight="semibold">
                    Dark Mode
                  </AppText>
                  <AppText variant="caption" color={tokens.colors.text.secondary}>
                    Switch to dark theme
                  </AppText>
                </View>
              </View>
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode}
                disabled={loading}
                color={tokens.colors.primary.main}
              />
            </View>
          </View>

          <View style={{ marginTop: tokens.spacing.xl }}>
            <AppButton
              variant="outlined"
              onPress={() => navigation.navigate('PINChange')}
              fullWidth
              size="lg"
              icon={<Ionicons name="lock-closed-outline" size={20} color={tokens.colors.primary.main} />}
            >
              Change PIN
            </AppButton>
          </View>

          <View style={{ marginTop: tokens.spacing.xl }}>
            <AppButton
              variant="outlined"
              onPress={handleLogout}
              fullWidth
              size="lg"
              style={{ borderColor: tokens.colors.error.main }}
              icon={<Ionicons name="log-out-outline" size={20} color={tokens.colors.error.main} />}
            >
              <AppText variant="button" color={tokens.colors.error.main}>
                Logout
              </AppText>
            </AppButton>
          </View>

          {capabilities.isAvailable && (
            <View style={[styles.infoCard, { backgroundColor: tokens.colors.info.light, borderRadius: tokens.radius.lg, padding: tokens.spacing.base, marginTop: tokens.spacing.lg }]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Ionicons name="information-circle" size={20} color={tokens.colors.info.main} style={{ marginTop: 2 }} />
                <View style={{ flex: 1, marginLeft: tokens.spacing.sm }}>
                  <AppText variant="body2" color={tokens.colors.info.main}>
                    {capabilities.biometricType} Enabled
                  </AppText>
                  <AppText variant="caption" color={tokens.colors.info.main}>
                    Your device supports {capabilities.biometricType?.toLowerCase()} authentication for secure and convenient access.
                  </AppText>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    marginBottom: 16,
  },
});