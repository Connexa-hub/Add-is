import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { AppText, AppButton, AppInput } from '../src/components/atoms';
import { AppModal } from '../src/components/molecules';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { API_BASE_URL } from '../constants/api';

export default function DeleteAccountScreen({ navigation }: any) {
  const { tokens } = useAppTheme();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'warning' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Added for success modal

  const handleDeleteAccount = async () => {
    if (!password) {
      setModalConfig({
        type: 'error',
        title: 'Password Required',
        message: 'Please enter your password to confirm account deletion.',
      });
      setShowModal(true);
      return;
    }

    setModalConfig({
      type: 'warning',
      title: 'Delete Account?',
      message: 'This action cannot be undone. All your data, wallet balance, and transaction history will be permanently deleted.',
    });
    setShowModal(true);
  };

  const confirmDelete = async () => {
    setShowModal(false);
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      console.log('Delete account response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete account');
      }

      const data = await response.json();
      console.log('Delete account response:', data);

      if (data.success) {
        // Clear ALL authentication and user data
        try {
          await SecureStore.deleteItemAsync('auth_token');
        } catch (e) {
          console.log('No auth_token in SecureStore');
        }

        await AsyncStorage.multiRemove([
          'token',
          'userId',
          'userEmail',
          'userName',
          'biometricToken',
          'savedEmail',
          'biometricEnabled',
          'biometric_user_id',
          'sessionTimeout',
          'autoLogoutEnabled',
          'lastActivityTime',
        ]);

        console.log('All user data cleared successfully');

        setShowSuccessModal(true);

        // Navigate to login after showing success
        setTimeout(() => {
          if (navigation?.reset) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' as never }],
            });
          }
        }, 2000);
      } else {
        setModalConfig({
          type: 'error',
          title: 'Delete Failed',
          message: data.message || 'Failed to delete account. Please check your password.',
        });
        setShowModal(true);
      }
    } catch (error) {
      console.error('Delete account error:', error);
      setModalConfig({
        type: 'error',
        title: 'Error',
        message: error.message || 'An error occurred while deleting your account. Please try again.',
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tokens.colors.background.default }]}>
      <View style={[styles.header, { borderBottomColor: tokens.colors.border.default, paddingTop: tokens.spacing.md }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={tokens.colors.text.primary}
            onPress={() => navigation.goBack()}
            style={{ marginRight: tokens.spacing.md }}
          />
          <AppText variant="h3" weight="bold">
            Delete Account
          </AppText>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: tokens.spacing.xxl }}>
        <View style={{ padding: tokens.spacing.lg }}>
          {/* Warning Section */}
          <View style={[styles.warningCard, { backgroundColor: tokens.colors.error.light, borderRadius: tokens.radius.lg, padding: tokens.spacing.lg, marginBottom: tokens.spacing.xl }]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons name="warning" size={24} color={tokens.colors.error.main} style={{ marginRight: tokens.spacing.sm, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <AppText variant="subtitle1" weight="bold" color={tokens.colors.error.main} style={{ marginBottom: tokens.spacing.xs }}>
                  Warning: This is Permanent
                </AppText>
                <AppText variant="body2" color={tokens.colors.error.main}>
                  Once you delete your account, there is no going back. Please be certain.
                </AppText>
              </View>
            </View>
          </View>

          {/* What will be deleted */}
          <View style={{ marginBottom: tokens.spacing.xl }}>
            <AppText variant="subtitle1" weight="bold" style={{ marginBottom: tokens.spacing.md }}>
              The following will be permanently deleted:
            </AppText>

            <View style={[styles.listItem, { marginBottom: tokens.spacing.sm }]}>
              <Ionicons name="checkmark-circle" size={20} color={tokens.colors.error.main} />
              <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginLeft: tokens.spacing.sm, flex: 1 }}>
                Your profile and personal information
              </AppText>
            </View>

            <View style={[styles.listItem, { marginBottom: tokens.spacing.sm }]}>
              <Ionicons name="checkmark-circle" size={20} color={tokens.colors.error.main} />
              <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginLeft: tokens.spacing.sm, flex: 1 }}>
                Wallet balance and all funds
              </AppText>
            </View>

            <View style={[styles.listItem, { marginBottom: tokens.spacing.sm }]}>
              <Ionicons name="checkmark-circle" size={20} color={tokens.colors.error.main} />
              <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginLeft: tokens.spacing.sm, flex: 1 }}>
                Transaction history
              </AppText>
            </View>

            <View style={[styles.listItem, { marginBottom: tokens.spacing.sm }]}>
              <Ionicons name="checkmark-circle" size={20} color={tokens.colors.error.main} />
              <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginLeft: tokens.spacing.sm, flex: 1 }}>
                KYC documents and verification status
              </AppText>
            </View>

            <View style={[styles.listItem, { marginBottom: tokens.spacing.sm }]}>
              <Ionicons name="checkmark-circle" size={20} color={tokens.colors.error.main} />
              <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginLeft: tokens.spacing.sm, flex: 1 }}>
                Saved cards and payment methods
              </AppText>
            </View>
          </View>

          {/* Password Input */}
          <View style={{ marginBottom: tokens.spacing.xl }}>
            <AppText variant="subtitle2" weight="semibold" style={{ marginBottom: tokens.spacing.sm }}>
              Confirm with Password
            </AppText>
            <AppInput
              label="Enter your password"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={tokens.colors.text.secondary} />}
            />
          </View>

          {/* Delete Button */}
          <AppButton
            variant="outline"
            onPress={handleDeleteAccount}
            loading={loading}
            disabled={loading}
            fullWidth
            size="lg"
            style={{ borderColor: tokens.colors.error.main, marginBottom: tokens.spacing.md }}
          >
            <AppText variant="button" color={tokens.colors.error.main}>
              Delete My Account
            </AppText>
          </AppButton>

          <AppButton
            variant="ghost"
            onPress={() => navigation.goBack()}
            fullWidth
            size="lg"
          >
            <AppText variant="button" color={tokens.colors.text.secondary}>
              Cancel
            </AppText>
          </AppButton>
        </View>
      </ScrollView>

      <AppModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        primaryButton={
          modalConfig.type === 'warning' && modalConfig.title === 'Delete Account?'
            ? { text: 'Yes, Delete', onPress: confirmDelete }
            : undefined
        }
        secondaryButton={
          modalConfig.type === 'warning' && modalConfig.title === 'Delete Account?'
            ? { text: 'Cancel', onPress: () => setShowModal(false) }
            : undefined
        }
      />

      {/* Success Modal (if needed, based on your original code structure) */}
      <AppModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        type="success"
        title="Account Deleted"
        message="Your account has been permanently deleted. We're sorry to see you go."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  container: {
    flex: 1,
  },
  warningCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});