import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Switch, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppText, AppButton, AppDivider } from '../src/components/atoms';
import { AppModal } from '../src/components/molecules';
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
  const [notifications, setNotifications] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Session Management States
  const [sessionTimeout, setSessionTimeout] = useState('15'); // Default 15 minutes
  const [autoLogoutEnabled, setAutoLogoutEnabled] = useState(true);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [tempTimeout, setTempTimeout] = useState('15');

  // Modal states
  const [modal, setModal] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    primaryButton?: { text: string; onPress: () => void };
    secondaryButton?: { text: string; onPress: () => void };
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  useEffect(() => {
    if (!isBiometricLoading) {
      loadSettings();
      loadSessionPreferences();
    }
  }, [isBiometricLoading]);

  const loadSettings = async () => {
    try {
      setLoading(true);

      let bio = false;
      try {
        bio = await isBiometricEnabled();
      } catch (error) {
        console.error('Error checking biometric status:', error);
      }

      const [dark, notif, twoFA, id, email] = await Promise.all([
        AsyncStorage.getItem('darkMode').catch(() => null),
        AsyncStorage.getItem('notifications').catch(() => null),
        AsyncStorage.getItem('twoFactorAuth').catch(() => null),
        AsyncStorage.getItem('userId').catch(() => null),
        AsyncStorage.getItem('userEmail').catch(() => null),
      ]);

      setBiometricEnabled(bio);
      setDarkMode(dark === 'true');
      setNotifications(notif !== 'false');
      setTwoFactorAuth(twoFA === 'true');
      setUserId(id || '');
      setUserEmail(email || '');
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert(
        'Error Loading Settings',
        'Some settings could not be loaded. Using default values.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadSessionPreferences = async () => {
    try {
      const timeout = await AsyncStorage.getItem('sessionTimeout');
      const autoLogout = await AsyncStorage.getItem('autoLogoutEnabled');

      if (timeout) setSessionTimeout(timeout);
      if (autoLogout !== null) setAutoLogoutEnabled(autoLogout === 'true');
    } catch (error) {
      console.error('Error loading session preferences:', error);
    }
  };

  const handleSessionTimeoutChange = async (value: string) => {
    try {
      const minutes = parseInt(value);
      if (minutes < 1) {
        Alert.alert('Invalid Value', 'Timeout must be at least 1 minute');
        return;
      }
      setSessionTimeout(value);
      setTempTimeout(value);
      await AsyncStorage.setItem('sessionTimeout', value);
      setShowTimeoutModal(false);
      showModal({
        visible: true,
        type: 'success',
        title: 'Success',
        message: `Session timeout set to ${value} minute${value === '1' ? '' : 's'}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update session timeout');
    }
  };

  const toggleAutoLogout = async () => {
    try {
      const newValue = !autoLogoutEnabled;
      setAutoLogoutEnabled(newValue);
      await AsyncStorage.setItem('autoLogoutEnabled', newValue.toString());
      await AsyncStorage.setItem('lastActivityTime', Date.now().toString());
      
      if (newValue) {
        showModal({
          visible: true,
          type: 'success',
          title: 'Auto-Logout Enabled',
          message: `Your session will automatically logout after ${sessionTimeout} minute${sessionTimeout === '1' ? '' : 's'} of inactivity`,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update auto-logout setting');
    }
  };

  const showModal = (config: typeof modal) => {
    setModal({ ...config, visible: true });
  };

  const hideModal = () => {
    setModal({ ...modal, visible: false });
  };

  const toggleBiometric = async () => {
    if (!capabilities.isAvailable) {
      showModal({
        visible: true,
        type: 'warning',
        title: 'Biometric Unavailable',
        message: capabilities.isEnrolled
          ? 'Biometric authentication is not supported on this device'
          : `Please set up ${capabilities.biometricType || 'biometric authentication'} in your device settings first.`,
      });
      return;
    }

    setLoading(true);
    try {
      if (!biometricEnabled) {
        const success = await enableBiometric(userId);
        if (success) {
          await saveCredentials(userId, userEmail);
          setBiometricEnabled(true);
          showModal({
            visible: true,
            type: 'success',
            title: 'Success!',
            message: `${capabilities.biometricType || 'Biometric'} authentication has been enabled successfully.`,
          });
        }
      } else {
        showModal({
          visible: true,
          type: 'warning',
          title: 'Disable Biometric',
          message: `Are you sure you want to disable ${capabilities.biometricType || 'biometric'} authentication?`,
          primaryButton: {
            text: 'Disable',
            onPress: async () => {
              const success = await disableBiometric();
              if (success) {
                setBiometricEnabled(false);
                hideModal();
                showModal({
                  visible: true,
                  type: 'success',
                  title: 'Disabled',
                  message: 'Biometric authentication has been disabled.',
                });
              }
            },
          },
          secondaryButton: {
            text: 'Cancel',
            onPress: hideModal,
          },
        });
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      showModal({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to update biometric settings. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = async () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    await AsyncStorage.setItem('darkMode', newVal.toString());
    showModal({
      visible: true,
      type: 'info',
      title: 'Theme Updated',
      message: `Dark mode ${newVal ? 'enabled' : 'disabled'}. Restart the app to see changes.`,
    });
  };

  const toggleNotifications = async () => {
    const newVal = !notifications;
    setNotifications(newVal);
    await AsyncStorage.setItem('notifications', newVal.toString());
  };

  const handleLogout = async () => {
    showModal({
      visible: true,
      type: 'warning',
      title: 'Logout',
      message: 'Are you sure you want to logout from your account?',
      primaryButton: {
        text: 'Logout',
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(['token', 'userId', 'userEmail', 'userName', 'savedEmail', 'biometricEnabled', 'biometricToken']);
            if (navigation?.reset) {
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            }
          } catch (error) {
            console.error('Error during logout:', error);
            Alert.alert('Logout Error', 'An error occurred during logout. Please try again.');
          }
        },
      },
      secondaryButton: {
        text: 'Cancel',
        onPress: hideModal,
      },
    });
  };

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{ marginBottom: tokens.spacing.xl }}>
      <AppText variant="subtitle2" weight="semibold" color={tokens.colors.text.secondary} style={{ marginBottom: tokens.spacing.base, paddingHorizontal: 4 }}>
        {title}
      </AppText>
      <View style={[styles.section, { backgroundColor: tokens.colors.background.paper, borderRadius: tokens.radius.lg }]}>
        {children}
      </View>
    </View>
  );

  const SettingRow = ({
    icon,
    iconColor,
    iconBg,
    title,
    subtitle,
    onPress,
    rightComponent,
    showDivider = true,
  }: {
    icon: string;
    iconColor: string;
    iconBg: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showDivider?: boolean;
  }) => {
    const Content = (
      <>
        <View style={styles.settingRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
              <Ionicons name={icon as any} size={20} color={iconColor} />
            </View>
            <View style={{ flex: 1, marginLeft: tokens.spacing.sm }}>
              <AppText variant="body1" weight="semibold">
                {title}
              </AppText>
              {subtitle && (
                <AppText variant="caption" color={tokens.colors.text.secondary} style={{ marginTop: 2 }}>
                  {subtitle}
                </AppText>
              )}
            </View>
          </View>
          {rightComponent}
        </View>
        {showDivider && <AppDivider style={{ marginVertical: tokens.spacing.sm }} />}
      </>
    );

    if (onPress) {
      return <TouchableOpacity onPress={onPress}>{Content}</TouchableOpacity>;
    }

    return <View>{Content}</View>;
  };

  if (loading || isBiometricLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: tokens.colors.background.default }]}>
        <ActivityIndicator size="large" color={tokens.colors.primary.main} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tokens.colors.background.default }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={{ padding: tokens.spacing.lg }}>
          <View style={{ marginBottom: tokens.spacing.xl }}>
            <AppText variant="h2" weight="bold">
              Settings
            </AppText>
            <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginTop: tokens.spacing.xs }}>
              Manage your account preferences and security
            </AppText>
          </View>

          {/* Security Section */}
          <SettingSection title="SECURITY">
            {capabilities.isAvailable && (
              <SettingRow
                icon="finger-print"
                iconColor={tokens.colors.primary.main}
                iconBg={tokens.colors.primary.light}
                title={`${capabilities.biometricType || 'Biometric'} Login`}
                subtitle={`Use ${capabilities.biometricType?.toLowerCase() || 'biometric'} for quick login`}
                rightComponent={
                  <Switch
                    value={biometricEnabled}
                    onValueChange={toggleBiometric}
                    disabled={!capabilities.isAvailable || loading}
                    color={tokens.colors.primary.main}
                  />
                }
              />
            )}

            <SettingRow
              icon="lock-closed"
              iconColor={tokens.colors.warning.main}
              iconBg={tokens.colors.warning.light}
              title="Change PIN"
              subtitle="Update your transaction PIN"
              onPress={() => {
                showModal({
                  visible: true,
                  type: 'warning',
                  title: 'Change Transaction PIN',
                  message: 'Do you remember your current PIN?',
                  primaryButton: {
                    text: 'I Know My PIN',
                    onPress: () => {
                      hideModal();
                      navigation.navigate('PINChange');
                    },
                  },
                  secondaryButton: {
                    text: 'Forgot PIN',
                    onPress: () => {
                      hideModal();
                      navigation.navigate('PINForgot');
                    },
                  },
                });
              }}
              rightComponent={<Ionicons name="chevron-forward" size={20} color={tokens.colors.text.secondary} />}
              showDivider={false}
            />

             

          </SettingSection>

          {/* Session Management Section */}
          <SettingSection title="SESSION MANAGEMENT">
            <SettingRow
              icon="timer"
              iconColor={tokens.colors.info.main}
              iconBg={tokens.colors.info.light}
              title="Auto-Logout"
              subtitle={`Logout after ${sessionTimeout} min of inactivity`}
              rightComponent={
                <Switch
                  value={autoLogoutEnabled}
                  onValueChange={toggleAutoLogout}
                  disabled={loading}
                  color={tokens.colors.primary.main}
                />
              }
            />
            {autoLogoutEnabled && (
              <SettingRow
                icon="alarm"
                iconColor={tokens.colors.primary.main}
                iconBg={tokens.colors.primary.light}
                title="Timeout Duration"
                subtitle={`Current: ${sessionTimeout} minute${sessionTimeout === '1' ? '' : 's'}`}
                onPress={() => {
                  setTempTimeout(sessionTimeout);
                  setShowTimeoutModal(true);
                }}
                rightComponent={<Ionicons name="chevron-forward" size={20} color={tokens.colors.text.secondary} />}
                showDivider={false}
              />
            )}
          </SettingSection>

          {/* Appearance Section */}
          <SettingSection title="APPEARANCE">
            <SettingRow
              icon="moon"
              iconColor={tokens.colors.info.main}
              iconBg={tokens.colors.info.light}
              title="Dark Mode"
              subtitle="Switch to dark theme"
              rightComponent={
                <Switch
                  value={darkMode}
                  onValueChange={toggleDarkMode}
                  disabled={loading}
                  color={tokens.colors.primary.main}
                />
              }
              showDivider={false}
            />
          </SettingSection>

          {/* Notifications Section */}
          <SettingSection title="NOTIFICATIONS">
            <SettingRow
              icon="notifications"
              iconColor={tokens.colors.success.main}
              iconBg={tokens.colors.success.light}
              title="Push Notifications"
              subtitle="Receive transaction alerts"
              rightComponent={
                <Switch
                  value={notifications}
                  onValueChange={toggleNotifications}
                  disabled={loading}
                  color={tokens.colors.primary.main}
                />
              }
              showDivider={false}
            />
          </SettingSection>

          {/* Account Section */}
          <SettingSection title="ACCOUNT">
            <SettingRow
              icon="shield-checkmark"
              iconColor={tokens.colors.primary.main}
              iconBg={tokens.colors.primary.light}
              title="KYC Verification"
              subtitle="Verify your identity"
              onPress={() => navigation.navigate('KYCPersonalInfo')}
              rightComponent={<Ionicons name="chevron-forward" size={20} color={tokens.colors.text.secondary} />}
            />

            <SettingRow
              icon="card"
              iconColor={tokens.colors.secondary.main}
              iconBg={tokens.colors.secondary.light}
              title="Saved Cards"
              subtitle="Manage payment methods"
              onPress={() => navigation.navigate('CardManagement')}
              rightComponent={<Ionicons name="chevron-forward" size={20} color={tokens.colors.text.secondary} />}
            />

            <SettingRow
              icon="help-circle"
              iconColor={tokens.colors.info.main}
              iconBg={tokens.colors.info.light}
              title="Help & Support"
              subtitle="Get help with your account"
              onPress={() => navigation.navigate('Support')}
              rightComponent={<Ionicons name="chevron-forward" size={20} color={tokens.colors.text.secondary} />}
            />

            <SettingRow
              icon="document-text"
              iconColor={tokens.colors.neutral.gray600}
              iconBg={tokens.colors.neutral.gray200}
              title="Terms & Conditions"
              subtitle="View our terms of service"
              onPress={() => {}}
              rightComponent={<Ionicons name="chevron-forward" size={20} color={tokens.colors.text.secondary} />}
            />

            <SettingRow
              icon="trash"
              iconColor={tokens.colors.error.main}
              iconBg={tokens.colors.error.light}
              title="Delete Account"
              subtitle="Permanently delete your account"
              onPress={() => navigation.navigate('DeleteAccount')}
              rightComponent={<Ionicons name="chevron-forward" size={20} color={tokens.colors.text.secondary} />}
              showDivider={false}
            />
          </SettingSection>

          {/* Logout Button */}
          <View style={{ marginTop: tokens.spacing.lg, marginBottom: tokens.spacing.xl }}>
            <AppButton
              variant="outline"
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
            <View style={[styles.infoCard, { backgroundColor: tokens.colors.info.light, borderRadius: tokens.radius.lg, padding: tokens.spacing.base }]}>
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

      {/* Session Timeout Modal */}
      <Modal
        visible={showTimeoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimeoutModal(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setShowTimeoutModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: tokens.colors.background.paper,
              borderRadius: tokens.radius.xl,
              padding: tokens.spacing.xl,
              width: '85%',
              maxWidth: 400,
              ...tokens.shadows.lg,
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: tokens.spacing.lg }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: tokens.colors.primary.light,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: tokens.spacing.base,
                }}
              >
                <Ionicons name="timer" size={32} color={tokens.colors.primary.main} />
              </View>
              <AppText variant="h3" weight="bold" style={{ marginBottom: tokens.spacing.xs }}>
                Set Timeout Duration
              </AppText>
              <AppText variant="body2" color={tokens.colors.text.secondary} align="center">
                Choose how long before automatic logout
              </AppText>
            </View>

            <View style={{ marginBottom: tokens.spacing.lg }}>
              <AppInput
                label="Minutes"
                placeholder="Enter minutes (minimum 1)"
                value={tempTimeout}
                onChangeText={setTempTimeout}
                keyboardType="numeric"
                leftIcon={<Ionicons name="time-outline" size={20} color={tokens.colors.text.secondary} />}
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm, marginTop: tokens.spacing.base }}>
                {['1', '5', '10', '15', '30', '60'].map((min) => (
                  <TouchableOpacity
                    key={min}
                    onPress={() => setTempTimeout(min)}
                    style={{
                      paddingHorizontal: tokens.spacing.base,
                      paddingVertical: tokens.spacing.sm,
                      borderRadius: tokens.radius.md,
                      borderWidth: 1,
                      borderColor: tempTimeout === min ? tokens.colors.primary.main : tokens.colors.border.default,
                      backgroundColor: tempTimeout === min ? tokens.colors.primary.light : 'transparent',
                    }}
                  >
                    <AppText
                      variant="body2"
                      weight="semibold"
                      color={tempTimeout === min ? tokens.colors.primary.main : tokens.colors.text.secondary}
                    >
                      {min} min
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
              <AppButton
                variant="outline"
                onPress={() => setShowTimeoutModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </AppButton>
              <AppButton
                onPress={() => handleSessionTimeoutChange(tempTimeout)}
                style={{ flex: 1 }}
              >
                Save
              </AppButton>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modern Modal */}
      <AppModal
        visible={modal.visible}
        onClose={hideModal}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        primaryButton={modal.primaryButton}
        secondaryButton={modal.secondaryButton}
      />
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
    padding: 16,
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
    marginTop: 16,
  },
});