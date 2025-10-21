
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Switch, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppText, AppButton, AppDivider } from '../src/components/atoms';
import { AppModal } from '../src/components/molecules';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { useBiometric } from '../hooks/useBiometric';

export default function SettingsScreen({ route, navigation }: any) {
  const { tokens } = useAppTheme();
  const setupMode = route.params?.setupMode || false;

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
  const [autoLogout, setAutoLogout] = useState('Never');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
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
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [bio, dark, notif, id, email, logout] = await Promise.all([
        isBiometricEnabled(),
        AsyncStorage.getItem('darkMode'),
        AsyncStorage.getItem('notifications'),
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('userEmail'),
        AsyncStorage.getItem('autoLogout'),
      ]);

      setBiometricEnabled(bio);
      setDarkMode(dark === 'true');
      setNotifications(notif !== 'false');
      setUserId(id || '');
      setUserEmail(email || '');
      setAutoLogout(logout || 'Never');
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
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
          await AsyncStorage.multiRemove(['token', 'userId', 'userEmail', 'userName']);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
      secondaryButton: {
        text: 'Cancel',
        onPress: hideModal,
      },
    });
  };

  const handleContinue = () => {
    navigation.replace('Main');
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

  if (loading && isBiometricLoading) {
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
              {setupMode ? 'Setup Login Preferences' : 'Settings'}
            </AppText>
            <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginTop: tokens.spacing.xs }}>
              {setupMode ? 'Secure your account and enable quick login options.' : 'Manage your account preferences and security'}
            </AppText>
          </View>

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
              icon="time-outline"
              iconColor={tokens.colors.info.main}
              iconBg={tokens.colors.info.light}
              title="Auto-logout"
              subtitle={autoLogout}
              onPress={() => showModal({
                  visible: true,
                  type: 'info',
                  title: 'Auto-logout',
                  message: 'This feature is under development.'
              })}
              rightComponent={<Ionicons name="chevron-forward" size={20} color={tokens.colors.text.secondary} />}
            />
            {!setupMode && (
              <SettingRow
                icon="lock-closed"
                iconColor={tokens.colors.warning.main}
                iconBg={tokens.colors.warning.light}
                title="Change PIN"
                subtitle="Update your transaction PIN"
                onPress={() => navigation.navigate('PINChange')}
                rightComponent={<Ionicons name="chevron-forward" size={20} color={tokens.colors.text.secondary} />}
                showDivider={false}
              />
            )}
          </SettingSection>

          {!setupMode && (
            <>
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
                  onPress={() => {}}
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
                  showDivider={false}
                />
              </SettingSection>
            </>
          )}

          <View style={{ marginTop: tokens.spacing.lg, marginBottom: tokens.spacing.xl }}>
            {setupMode ? (
              <AppButton onPress={handleContinue} fullWidth size="lg">
                Continue
              </AppButton>
            ) : (
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
            )}
          </View>
        </View>
      </ScrollView>

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
