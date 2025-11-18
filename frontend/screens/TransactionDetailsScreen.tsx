
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { AppText, AppButton } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { API_BASE_URL } from '../constants/api';

export default function TransactionDetailsScreen() {
  const { tokens } = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { reference } = route.params;
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactionDetails();
  }, [reference]);

  const fetchTransactionDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/transactions/${reference}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setTransaction(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
      Alert.alert('Error', 'Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  };

  const handleShareReceipt = () => {
    navigation.navigate('ShareReceipt', {
      reference: transaction.reference,
      amount: transaction.amount,
      serviceName: transaction.transactionType,
      recipient: transaction.recipient,
      cashbackEarned: transaction.metadata?.cashbackEarned || 0,
    });
  };

  if (loading || !transaction) {
    return (
      <View style={[styles.container, { backgroundColor: tokens.colors.background.default, justifyContent: 'center', alignItems: 'center' }]}>
        <AppText>Loading...</AppText>
      </View>
    );
  }

  const cashbackEarned = transaction.metadata?.cashbackEarned || 0;

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.background.default }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: tokens.colors.background.default, paddingTop: 50 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={tokens.colors.text.primary} />
        </Pressable>
        <AppText variant="h3" weight="bold" style={{ flex: 1 }}>
          Transaction Details
        </AppText>
        <Pressable onPress={() => {}}>
          <Ionicons name="help-circle-outline" size={24} color={tokens.colors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: tokens.spacing.lg }}>
        {/* Service Icon & Name */}
        <View style={styles.serviceHeader}>
          <View style={[styles.serviceIcon, { backgroundColor: tokens.colors.success.light }]}>
            <Ionicons name="phone-portrait" size={32} color={tokens.colors.success.main} />
          </View>
          <AppText variant="h3" weight="bold" align="center" style={{ marginTop: tokens.spacing.sm }}>
            {transaction.category || 'Service'}
          </AppText>
        </View>

        {/* Amount */}
        <AppText variant="display" weight="bold" align="center" style={{ marginTop: tokens.spacing.md }}>
          ₦{transaction.amount.toLocaleString()}
        </AppText>

        {/* Status */}
        <View style={{ alignItems: 'center', marginTop: tokens.spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons 
              name={transaction.status === 'completed' ? 'checkmark-circle' : 'close-circle'} 
              size={20} 
              color={transaction.status === 'completed' ? tokens.colors.success.main : tokens.colors.error.main} 
            />
            <AppText 
              variant="h3" 
              weight="semibold" 
              color={transaction.status === 'completed' ? tokens.colors.success.main : tokens.colors.error.main}
              style={{ marginLeft: 4 }}
            >
              {transaction.status === 'completed' ? 'Successful' : 'Failed'}
            </AppText>
          </View>
        </View>

        {/* Cashback Earned */}
        {cashbackEarned > 0 && (
          <View style={[styles.cashbackCard, { backgroundColor: tokens.colors.warning.light, marginTop: tokens.spacing.lg }]}>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Bonus Earned
            </AppText>
            <AppText variant="h3" weight="bold" color={tokens.colors.warning.main}>
              +₦{cashbackEarned.toFixed(2)} Cashback
            </AppText>
          </View>
        )}

        {/* Transaction Details Card */}
        <View style={[styles.detailsCard, { backgroundColor: tokens.colors.background.paper, marginTop: tokens.spacing.xl }]}>
          <AppText variant="h3" weight="bold" style={{ marginBottom: tokens.spacing.md }}>
            Transaction Details
          </AppText>

          <View style={styles.detailRow}>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Recipient Mobile
            </AppText>
            <AppText variant="body2" weight="semibold">
              {transaction.recipient || 'N/A'}
            </AppText>
          </View>

          <View style={styles.detailRow}>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Data Bundle
            </AppText>
            <AppText variant="body2" weight="semibold">
              {transaction.details?.purchased_code || 'N/A'}
            </AppText>
          </View>

          <View style={styles.detailRow}>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Transaction Type
            </AppText>
            <AppText variant="body2" weight="semibold">
              {transaction.transactionType}
            </AppText>
          </View>

          <View style={styles.detailRow}>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Payment Method
            </AppText>
            <AppText variant="body2" weight="semibold">
              Wallet
            </AppText>
          </View>

          <View style={styles.detailRow}>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Transaction No.
            </AppText>
            <AppText variant="caption" weight="medium" numberOfLines={1}>
              {transaction.reference}
            </AppText>
          </View>

          <View style={styles.detailRow}>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Transaction Date
            </AppText>
            <AppText variant="body2" weight="semibold">
              {new Date(transaction.createdAt).toLocaleString()}
            </AppText>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { backgroundColor: tokens.colors.background.default }]}>
        <AppButton
          variant="ghost"
          size="lg"
          fullWidth
          style={{ flex: 1, marginRight: 8 }}
          onPress={() => Alert.alert('Report Issue', 'This feature is coming soon')}
        >
          Report Issue
        </AppButton>
        <AppButton
          variant="primary"
          size="lg"
          fullWidth
          style={{ flex: 1, marginLeft: 8 }}
          onPress={handleShareReceipt}
        >
          Share Receipt
        </AppButton>
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
  serviceHeader: {
    alignItems: 'center',
    marginTop: 24,
  },
  serviceIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cashbackCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  detailsCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
});
