
import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AppText, AppButton } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { useRef } from 'react';

export default function ShareReceiptScreen() {
  const { tokens } = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { reference, amount, serviceName, recipient, cashbackEarned } = route.params;
  const receiptRef = useRef(null);

  const handleShareAsImage = async () => {
    try {
      const uri = await captureRef(receiptRef, {
        format: 'png',
        quality: 1,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Failed to share:', error);
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  const handleShareAsPDF = () => {
    Alert.alert('Coming Soon', 'PDF export will be available soon');
  };

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.background.default }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: tokens.colors.background.default, paddingTop: 50 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={tokens.colors.text.primary} />
        </Pressable>
        <AppText variant="h3" weight="bold">
          Share Receipt
        </AppText>
      </View>

      <ScrollView contentContainerStyle={{ padding: tokens.spacing.lg, alignItems: 'center' }}>
        {/* Receipt Card */}
        <View 
          ref={receiptRef}
          style={[styles.receiptCard, { backgroundColor: '#FFFFFF' }]}
        >
          {/* Header */}
          <View style={styles.receiptHeader}>
            <AppText variant="h2" weight="bold" color={tokens.colors.primary.main}>
              OPay
            </AppText>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Transaction Receipt
            </AppText>
          </View>

          {/* Amount */}
          <AppText variant="display" weight="bold" color={tokens.colors.success.main} align="center" style={{ marginTop: 24 }}>
            ₦{amount.toLocaleString()}
          </AppText>

          <AppText variant="h3" weight="semibold" color={tokens.colors.success.main} align="center" style={{ marginTop: 8 }}>
            Successful
          </AppText>

          <AppText variant="caption" color={tokens.colors.text.secondary} align="center" style={{ marginTop: 4 }}>
            {new Date().toLocaleString()}
          </AppText>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: tokens.colors.border.default, marginVertical: 24 }]} />

          {/* Details */}
          <View style={styles.detailRow}>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Mobile Network Operators
            </AppText>
            <AppText variant="body2" weight="semibold">
              {serviceName}
            </AppText>
          </View>

          <View style={styles.detailRow}>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Recipient Mobile
            </AppText>
            <AppText variant="body2" weight="semibold">
              {recipient}
            </AppText>
          </View>

          <View style={styles.detailRow}>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Data Bundle
            </AppText>
            <AppText variant="body2" weight="semibold">
              1GB 3-Days Plan
            </AppText>
          </View>

          <View style={styles.detailRow}>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Transaction Type
            </AppText>
            <AppText variant="body2" weight="semibold">
              Mobile Data
            </AppText>
          </View>

          <View style={styles.detailRow}>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Transaction No.
            </AppText>
            <AppText variant="caption" weight="medium">
              {reference}
            </AppText>
          </View>

          {/* Footer Text */}
          <AppText variant="caption" color={tokens.colors.text.secondary} align="center" style={{ marginTop: 24, lineHeight: 18 }}>
            Enjoy a better life with OPay. Get free transfers, withdrawals, bill payments, instant loans, and good annual interest on your savings. OPay is licensed by the Central Bank of Nigeria and insured by the NDIC.
          </AppText>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { backgroundColor: tokens.colors.background.default }]}>
        <Pressable
          style={[styles.shareButton, { backgroundColor: tokens.colors.background.paper }]}
          onPress={handleShareAsImage}
        >
          <Ionicons name="image" size={24} color={tokens.colors.success.main} />
          <AppText variant="body2" weight="semibold" color={tokens.colors.success.main} style={{ marginLeft: 8 }}>
            Share as image
          </AppText>
        </Pressable>

        <Pressable
          style={[styles.shareButton, { backgroundColor: tokens.colors.background.paper, marginLeft: 16 }]}
          onPress={handleShareAsPDF}
        >
          <Ionicons name="document" size={24} color={tokens.colors.success.main} />
          <AppText variant="body2" weight="semibold" color={tokens.colors.success.main} style={{ marginLeft: 8 }}>
            Share as PDF
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  receiptCard: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  receiptHeader: {
    alignItems: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
