import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { AppText, AppButton } from '../src/components/atoms';
import { BalanceCard, ServiceCard, PromoBanner, InfoRow } from '../src/components/molecules';
import { API_BASE_URL } from '../constants/api';

interface WalletData {
  balance: number;
  virtualAccountNumber: string;
  currency: string;
}

interface Transaction {
  _id: string;
  type: string;
  transactionType: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
  recipient?: string;
}

const HomeScreen = () => {
  const navigation = useNavigation();
  const { tokens } = useAppTheme();
  
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoBannerVisible, setPromoBannerVisible] = useState(true);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('Login' as never);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [walletResponse, transactionsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/auth/wallet`, { headers }),
        fetch(`${API_BASE_URL}/transactions/recent?limit=5`, { headers }),
      ]);

      if (walletResponse.ok) {
        const walletJson = await walletResponse.json();
        setWalletData(walletJson);
      }

      if (transactionsResponse.ok) {
        const transactionsJson = await transactionsResponse.json();
        setTransactions(transactionsJson);
      }

      setError(null);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleFundWallet = () => {
    navigation.navigate('Wallet' as never);
  };

  const handleWithdraw = () => {
    console.log('Withdraw functionality coming soon');
  };

  const services = [
    {
      title: 'Buy Data',
      icon: <Ionicons name="phone-portrait" size={28} color={tokens.colors.primary.main} />,
      screen: 'Data',
    },
    {
      title: 'TV Subscription',
      icon: <Ionicons name="tv" size={28} color={tokens.colors.primary.main} />,
      screen: 'TV',
    },
    {
      title: 'Pay Electricity',
      icon: <Ionicons name="flash" size={28} color={tokens.colors.primary.main} />,
      screen: 'Electricity',
    },
    {
      title: 'Airtime Recharge',
      icon: <Ionicons name="call" size={28} color={tokens.colors.primary.main} />,
      screen: 'Data',
      badge: 'Popular',
    },
    {
      title: 'Transfer Money',
      icon: <Ionicons name="swap-horizontal" size={28} color={tokens.colors.primary.main} />,
      screen: 'Wallet',
    },
    {
      title: 'Pay Bills',
      icon: <Ionicons name="receipt" size={28} color={tokens.colors.primary.main} />,
      screen: 'History',
    },
    {
      title: 'Rewards',
      icon: <Ionicons name="gift" size={28} color={tokens.colors.primary.main} />,
      screen: 'Profile',
      badge: 'New',
    },
    {
      title: 'More',
      icon: <Ionicons name="grid" size={28} color={tokens.colors.primary.main} />,
      screen: 'Settings',
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatAmount = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return tokens.colors.success.main;
      case 'pending':
        return tokens.colors.warning.main;
      case 'failed':
        return tokens.colors.error.main;
      default:
        return tokens.colors.text.secondary;
    }
  };

  const getTransactionIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      'data': 'phone-portrait',
      'tv': 'tv',
      'electricity': 'flash',
      'airtime': 'call',
      'transfer': 'swap-horizontal',
      'wallet': 'wallet',
    };
    return iconMap[type.toLowerCase()] || 'receipt';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: tokens.colors.background.default }]}>
        <ActivityIndicator size="large" color={tokens.colors.primary.main} />
        <AppText variant="body1" style={{ marginTop: tokens.spacing.md }}>
          Loading...
        </AppText>
      </View>
    );
  }

  if (error && !walletData) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: tokens.colors.background.default }]}>
        <Ionicons name="alert-circle" size={64} color={tokens.colors.error.main} />
        <AppText variant="h3" style={{ marginTop: tokens.spacing.md, marginBottom: tokens.spacing.sm }}>
          Oops!
        </AppText>
        <AppText variant="body1" color={tokens.colors.text.secondary} style={{ marginBottom: tokens.spacing.lg }}>
          {error}
        </AppText>
        <AppButton onPress={fetchData}>Try Again</AppButton>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tokens.colors.background.default }]}
      contentContainerStyle={{ paddingBottom: tokens.spacing.xl }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.primary.main} />
      }
    >
      <View style={{ padding: tokens.spacing.lg }}>
        <AppText variant="h2" weight="bold" style={{ marginBottom: tokens.spacing.xs }}>
          Welcome Back!
        </AppText>
        <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginBottom: tokens.spacing.lg }}>
          Manage your finances easily
        </AppText>

        <BalanceCard
          balance={walletData?.balance || 0}
          currency={walletData?.currency || '₦'}
          label="Wallet Balance"
          showAddFunds={false}
        />

        <View style={{ marginTop: tokens.spacing.md }}>
          <AppText variant="caption" color={tokens.colors.text.inverse} style={{ marginBottom: tokens.spacing.xs, paddingHorizontal: tokens.spacing.sm }}>
            Virtual Account: {walletData?.virtualAccountNumber || 'N/A'}
          </AppText>
        </View>

        <View style={[styles.actionButtons, { marginTop: tokens.spacing.md, gap: tokens.spacing.md }]}>
          <View style={{ flex: 1 }}>
            <AppButton 
              onPress={handleFundWallet} 
              variant="primary" 
              size="md"
              icon={<Ionicons name="add-circle" size={20} color={tokens.colors.text.inverse} />}
            >
              Fund Wallet
            </AppButton>
          </View>
          <View style={{ flex: 1 }}>
            <AppButton 
              onPress={handleWithdraw} 
              variant="outline" 
              size="md"
              icon={<Ionicons name="arrow-up-circle" size={20} color={tokens.colors.primary.main} />}
            >
              Withdraw
            </AppButton>
          </View>
        </View>

        <AppText variant="h3" weight="bold" style={{ marginTop: tokens.spacing.xl, marginBottom: tokens.spacing.md }}>
          Quick Actions
        </AppText>

        <View style={styles.servicesGrid}>
          {services.map((service, index) => (
            <View key={index} style={[styles.serviceCardContainer, { marginBottom: tokens.spacing.md }]}>
              <ServiceCard
                title={service.title}
                icon={service.icon}
                badge={service.badge}
                onPress={() => navigation.navigate(service.screen as never)}
              />
            </View>
          ))}
        </View>

        {promoBannerVisible && (
          <View style={{ marginTop: tokens.spacing.lg, position: 'relative' }}>
            <PromoBanner
              title="Get 5% Cashback!"
              description="On all data purchases this week"
              buttonText="Learn More"
              onPress={() => console.log('Promo clicked')}
              icon={<Ionicons name="gift" size={32} color={tokens.colors.text.inverse} />}
            />
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: tokens.spacing.sm,
                right: tokens.spacing.sm,
                backgroundColor: 'rgba(255,255,255,0.3)',
                borderRadius: tokens.radius.full,
                padding: tokens.spacing.xs,
              }}
              onPress={() => setPromoBannerVisible(false)}
            >
              <Ionicons name="close" size={20} color={tokens.colors.text.inverse} />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.sectionHeader, { marginTop: tokens.spacing.xl, marginBottom: tokens.spacing.md }]}>
          <AppText variant="h3" weight="bold">
            Recent Transactions
          </AppText>
          <TouchableOpacity onPress={() => navigation.navigate('History' as never)}>
            <AppText variant="subtitle2" color={tokens.colors.primary.main}>
              View All
            </AppText>
          </TouchableOpacity>
        </View>

        {transactions.length > 0 ? (
          <View
            style={{
              backgroundColor: tokens.colors.background.paper,
              borderRadius: tokens.radius.lg,
              padding: tokens.spacing.md,
              ...tokens.shadows.sm,
            }}
          >
            {transactions.map((transaction, index) => (
              <InfoRow
                key={transaction._id}
                label={transaction.transactionType || transaction.type || 'Transaction'}
                value={formatAmount(transaction.amount)}
                icon={
                  <Ionicons
                    name={getTransactionIcon(transaction.type) as any}
                    size={24}
                    color={tokens.colors.primary.main}
                  />
                }
                rightIcon={
                  <View style={{ alignItems: 'flex-end' }}>
                    <AppText variant="caption" color={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </AppText>
                    <AppText variant="caption" color={tokens.colors.text.secondary}>
                      {formatDate(transaction.createdAt)}
                    </AppText>
                  </View>
                }
                showDivider={index < transactions.length - 1}
                onPress={() => console.log('Transaction details:', transaction._id)}
              />
            ))}
          </View>
        ) : (
          <View
            style={{
              backgroundColor: tokens.colors.background.paper,
              borderRadius: tokens.radius.lg,
              padding: tokens.spacing.xl,
              alignItems: 'center',
              ...tokens.shadows.sm,
            }}
          >
            <Ionicons name="receipt-outline" size={48} color={tokens.colors.text.disabled} />
            <AppText variant="body1" color={tokens.colors.text.secondary} style={{ marginTop: tokens.spacing.md }}>
              No transactions yet
            </AppText>
            <AppText variant="caption" color={tokens.colors.text.disabled} style={{ marginTop: tokens.spacing.xs }}>
              Your transaction history will appear here
            </AppText>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCardContainer: {
    width: '48%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default HomeScreen;
