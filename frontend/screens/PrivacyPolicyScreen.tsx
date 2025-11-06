
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { GITHUB_URL } from '../constants/api';

function PrivacyPolicyScreen({ navigation }: any) {
  const { tokens } = useAppTheme();

  const handleGitHubPress = () => {
    if (GITHUB_URL) {
      Linking.openURL(GITHUB_URL);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tokens.colors.background.default }]}>
      <View style={[styles.header, { borderBottomColor: tokens.colors.border.default }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={tokens.colors.text.primary} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold" style={{ marginLeft: tokens.spacing.md }}>
          Privacy & Terms
        </AppText>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ padding: tokens.spacing.lg }}>
        <AppText variant="h2" weight="bold" style={{ marginBottom: tokens.spacing.md }}>
          Privacy Policy
        </AppText>
        
        <AppText variant="caption" color={tokens.colors.text.secondary} style={{ marginBottom: tokens.spacing.xl }}>
          Last Updated: November 6, 2024
        </AppText>

        <View style={{ marginBottom: tokens.spacing.xl }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.sm }}>
            1. Information We Collect
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginBottom: tokens.spacing.md }}>
            Addis Digital Banking ("we", "our", or "us") collects the following information:
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Personal Information: Name, email address, phone number, and date of birth
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Financial Information: Wallet balance, transaction history, and payment methods
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Identity Verification: BVN, NIN, government-issued ID documents
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Device Information: Device type, operating system, and app version
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Biometric Data: Fingerprint or facial recognition (only if you enable this feature)
          </AppText>
        </View>

        <View style={{ marginBottom: tokens.spacing.xl }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.sm }}>
            2. How We Use Your Information
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • To provide and maintain our services
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • To process transactions and payments
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • To verify your identity and prevent fraud
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • To send you notifications about your account
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • To comply with legal obligations
          </AppText>
        </View>

        <View style={{ marginBottom: tokens.spacing.xl }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.sm }}>
            3. Data Security
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            We implement industry-standard security measures to protect your data:
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • End-to-end encryption for sensitive data
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Secure token-based authentication
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Regular security audits and updates
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Biometric data stored locally on your device only
          </AppText>
        </View>

        <View style={{ marginBottom: tokens.spacing.xl }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.sm }}>
            4. Data Sharing
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            We do not sell your personal information. We may share your data with:
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Service providers (payment processors, identity verification services)
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Law enforcement when required by law
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Third parties with your explicit consent
          </AppText>
        </View>

        <View style={{ marginBottom: tokens.spacing.xl }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.sm }}>
            5. Your Rights
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            You have the right to:
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Access your personal data
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Request data correction or deletion
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Opt-out of marketing communications
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Delete your account and all associated data
          </AppText>
        </View>

        <View style={{ marginBottom: tokens.spacing.xl }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.sm }}>
            6. Account Deletion
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            When you delete your account, we permanently remove:
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • All personal information
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Transaction history
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Saved payment methods
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Virtual account numbers
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginTop: tokens.spacing.sm }}>
            Some data may be retained for legal or regulatory compliance for up to 7 years.
          </AppText>
        </View>

        <View style={{ marginBottom: tokens.spacing.xl }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.sm }}>
            7. Terms of Service
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            By using Addis Digital Banking, you agree to:
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Provide accurate and truthful information
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Use the service only for lawful purposes
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Maintain the security of your account credentials
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            • Not engage in fraudulent activities
          </AppText>
        </View>

        <View style={{ marginBottom: tokens.spacing.xl }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.sm }}>
            8. Contact Us
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            For questions about this Privacy Policy or our practices, contact us at:
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            Email: support@addisdigital.com
          </AppText>
        </View>

        <View style={{ marginBottom: tokens.spacing.xl }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.sm }}>
            9. Open Source License
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginBottom: tokens.spacing.sm }}>
            This application is powered by Connexa Tech Hub.
          </AppText>
          {GITHUB_URL ? (
            <TouchableOpacity onPress={handleGitHubPress}>
              <AppText variant="body2" color={tokens.colors.primary.main} style={{ textDecorationLine: 'underline' }}>
                View Source Code on GitHub
              </AppText>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={{ marginBottom: tokens.spacing['2xl'] }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.sm }}>
            10. Changes to This Policy
          </AppText>
          <AppText variant="body2" color={tokens.colors.text.secondary}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
});

export default PrivacyPolicyScreen;
