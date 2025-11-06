import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Pressable } from 'react-native';
import { Appbar, Card, Text, Avatar, Button, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';
import { API_BASE_URL } from '../constants/api';
import { BannerCarousel } from '../src/components/molecules';
import { tokenService } from '../utils/tokenService';

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(null);

  // Placeholder for setBalance function as it was used in the changes but not defined in original
  const setBalance = (balance) => {
    setWalletBalance(balance);
  };

  const hasLoadedRef = useRef(false);
  const [lastLoadTime, setLastLoadTime] = React.useState(0);


  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadUserData();
      loadUnreadNotifications();
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Only reload if data is stale (e.g., more than 30 seconds old)
      const now = Date.now();
      if (!lastLoadTime || now - lastLoadTime > 30000) {
        loadUserData();
        loadUnreadNotifications();
      }
    });
    return unsubscribe;
  }, [navigation, lastLoadTime]); // Added lastLoadTime to dependency array

  const loadUserData = async (silentRefresh = false) => {
    try {
      if (!silentRefresh) {
        setLoading(true);
      }

      // Check if user logged out
      const userLoggedOut = await AsyncStorage.getItem('user_logged_out');
      if (userLoggedOut === 'true') {
        console.log('User logged out, clearing flag and redirecting to login');
        await AsyncStorage.removeItem('user_logged_out');
        navigation.replace('Login');
        setLoading(false);
        return;
      }

      // Check both SecureStore and AsyncStorage
      const secureToken = await tokenService.getToken();
      const asyncToken = await AsyncStorage.getItem('token');
      const token = secureToken || asyncToken;

      console.log('Loading user data with token:', token ? 'Token exists' : 'No token');

      if (!token) {
        console.log('No token found');
        setLoading(false);
        // Don't navigate here - let the navigator handle it
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Profile response status:', response.status);

      if (response.status === 401) {
        console.log('Session expired - clearing and redirecting');
        await tokenService.clearToken();
        await AsyncStorage.multiRemove(['userId', 'userEmail', 'userName', 'biometricToken', 'savedEmail']);
        navigation.replace('Login');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Profile data received:', !!data.data);
      console.log('Full profile data:', JSON.stringify(data.data, null, 2));
      console.log('Monnify accounts:', data.data?.monnifyAccounts || []);

      // Log if Monnify accounts are missing
      if (!data.data?.monnifyAccounts || data.data.monnifyAccounts.length === 0) {
        console.error('⚠️ WARNING: User has no Monnify accounts!');
        console.error('User ID:', data.data?.id);
        console.error('User email:', data.data?.email);
        console.error('Monnify account reference:', data.data?.monnifyAccountReference);
        console.log('🔄 Full user data structure:', JSON.stringify(data.data, null, 2));
      } else {
        console.log('✅ Monnify accounts found:', data.data.monnifyAccounts.length);
        data.data.monnifyAccounts.forEach((acc, idx) => {
          console.log(`   ${idx + 1}. ${acc.bankName}: ${acc.accountNumber} (${acc.accountName})`);
        });
      }

      if (data.success && data.data) {
        const userData = data.data;
        setUser(userData);
        setBalance(userData.walletBalance || 0);

        // Store user data for offline access
        await AsyncStorage.setItem('userName', userData.name || '');
        await AsyncStorage.setItem('userEmail', userData.email || '');
        await AsyncStorage.setItem('userId', userData.id || '');
        setLastLoadTime(Date.now()); // Update last load time on successful fetch
      } else {
        console.error('Failed to load profile:', data.message);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        await tokenService.clearToken();
        await AsyncStorage.multiRemove(['userId', 'userEmail', 'userName']);
        navigation.replace('Login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Fetching balance with token:', token ? 'Token exists' : 'No token');

      if (!token) {
        console.log('No token found, redirecting to login');
        await tokenService.clearToken();
        await AsyncStorage.multiRemove(['userId', 'userEmail', 'userName']);
        navigation.replace('Login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/wallet`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Balance response status:', response.status);

      if (response.status === 401) {
        console.log('Unauthorized - clearing session and redirecting to login');
        await tokenService.clearToken();
        await AsyncStorage.multiRemove(['userId', 'userEmail', 'userName', 'biometricToken', 'savedEmail']);
        navigation.replace('Login');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Balance data received:', data.success);

      if (data.success) {
        setBalance(data.data.balance);
      } else {
        console.error('Balance fetch failed:', data.message);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      // Don't redirect on network errors, only on auth errors
      if (error.message.includes('401')) {
        await tokenService.clearToken();
        await AsyncStorage.multiRemove(['userId', 'userEmail', 'userName']);
        navigation.replace('Login');
      }
    }
  };

  const loadRecentTransactions = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/mine?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Transaction parse error:', responseText);
        data = { success: false, data: [] };
      }

      if (data.success) {
        setRecentTransactions(data.data || []);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadUnreadNotifications = async () => {
    try {
      const token = await tokenService.getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/notifications/unread/count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setUnreadNotifications(data.count || 0);
      }
    } catch (error) {
      console.error('Error loading unread notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUserData(true), loadUnreadNotifications()]);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Set logout flag BEFORE clearing tokens (critical for OPay flow)
              await AsyncStorage.setItem('user_logged_out', 'true');

              // Clear all auth-related data
              await tokenService.clearToken();
              await AsyncStorage.multiRemove([
                'token',
                'userId',
                'userEmail',
                'userName',
                'lastActivityTime'
              ]);

              // Navigate to login
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCopyAccountNumber = async (accountNumber: string) => {
    try {
      await Clipboard.setStringAsync(accountNumber);
      setCopiedAccount(accountNumber);
      setTimeout(() => setCopiedAccount(null), 2000);
    } catch (error) {
      console.error('Failed to copy account number:', error);
    }
  };

  // VTU Services organized by VTPass categories
  const vtuServices = [
    {
      id: 'airtime',
      name: 'Airtime',
      icon: 'call',
      color: '#10b981',
      gradient: ['#10b981', '#34d399'],
      screen: 'Airtime',
      category: 'airtime'
    },
    {
      id: 'data',
      name: 'Data Bundle',
      icon: 'wifi',
      color: '#3b82f6',
      gradient: ['#3b82f6', '#60a5fa'],
      screen: 'Data',
      category: 'data'
    },
    {
      id: 'electricity',
      name: 'Electricity',
      icon: 'flash',
      color: '#f59e0b',
      gradient: ['#f59e0b', '#fbbf24'],
      screen: 'Electricity',
      category: 'electricity-bill'
    },
    {
      id: 'tv',
      name: 'Cable TV',
      icon: 'tv',
      color: '#8b5cf6',
      gradient: ['#8b5cf6', '#a78bfa'],
      screen: 'TV',
      category: 'tv-subscription'
    },
  ];

  const billsServices = [
    {
      id: 'internet',
      name: 'Internet',
      icon: 'globe-outline',
      color: '#14b8a6',
      gradient: ['#14b8a6', '#2dd4bf'],
      screen: 'Internet',
      category: 'other-services'
    },
    {
      id: 'betting',
      name: 'Betting',
      icon: 'football',
      color: '#06b6d4',
      gradient: ['#06b6d4', '#22d3ee'],
      screen: 'Betting',
      category: 'other-services'
    },
  ];

  const educationServices = [
    {
      id: 'education',
      name: 'Education',
      icon: 'school',
      color: '#ef4444',
      gradient: ['#ef4444', '#f87171'],
      screen: 'Education',
      category: 'education'
    },
    {
      id: 'insurance',
      name: 'Insurance',
      icon: 'shield-checkmark',
      color: '#ec4899',
      gradient: ['#ec4899', '#f472b6'],
      screen: 'Insurance',
      category: 'insurance'
    },
  ];

  const allServices = [...vtuServices, ...billsServices, ...educationServices];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content
          title={`Hello, ${user?.name?.split(' ')[0] || 'User'}`}
          titleStyle={styles.headerTitle}
        />
        <Appbar.Action
          icon="magnify"
          onPress={() => setSearchQuery('')}
        />
        <View style={{ position: 'relative' }}>
          <Appbar.Action
            icon="bell-outline"
            onPress={() => navigation.navigate('Notifications')}
          />
          {unreadNotifications > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </Text>
            </View>
          )}
        </View>
        <Appbar.Action icon="account-circle" onPress={() => navigation.navigate('Profile')} />
      </Appbar.Header>

      {/* KYC Status Banner */}
      {user?.kyc?.status !== 'approved' && (
        <Pressable
          style={[
            styles.kycBanner,
            {
              backgroundColor:
                user?.kyc?.status === 'rejected'
                  ? '#FFEBEE'
                  : user?.kyc?.status === 'pending'
                  ? '#FFF3E0'
                  : '#E3F2FD',
            },
          ]}
          onPress={() => {
            if (user?.kyc?.status === 'pending') {
              Alert.alert(
                'KYC Under Review',
                'Your verification is being reviewed. You will be notified once complete.'
              );
            } else if (user?.kyc?.status === 'rejected') {
              Alert.Alert(
                'KYC Rejected',
                user?.kyc?.rejectionReason || 'Please resubmit your verification documents.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Resubmit', onPress: () => navigation.navigate('KYCPersonalInfo') },
                ]
              );
            } else {
              navigation.navigate('KYCPersonalInfo');
            }
          }}
        >
          <View style={styles.kycBannerContent}>
            <Ionicons
              name={
                user?.kyc?.status === 'rejected'
                  ? 'close-circle'
                  : user?.kyc?.status === 'pending'
                  ? 'time'
                  : 'shield-checkmark-outline'
              }
              size={24}
              color={
                user?.kyc?.status === 'rejected'
                  ? '#D32F2F'
                  : user?.kyc?.status === 'pending'
                  ? '#F57C00'
                  : '#1976D2'
              }
            />
            <View style={styles.kycBannerTextContainer}>
              <Text style={styles.kycBannerTitle}>
                {user?.kyc?.status === 'rejected'
                  ? 'KYC Rejected'
                  : user?.kyc?.status === 'pending'
                  ? 'KYC Under Review'
                  : 'Account Not Verified'}
              </Text>
              <Text style={styles.kycBannerMessage}>
                {user?.kyc?.status === 'rejected'
                  ? 'Tap to resubmit verification'
                  : user?.kyc?.status === 'pending'
                  ? 'Review in progress - Please wait'
                  : 'Complete KYC to unlock all features'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </View>
        </Pressable>
      )}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet Balance Card - OPay Style */}
        <Card style={styles.balanceCard}>
          <Card.Content>
            <View style={styles.balanceHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.balanceLabel}>  Available Balance</Text>
                <Pressable onPress={() => setBalanceVisible(!balanceVisible)} style={{ marginLeft: 8 }}>
                  <Ionicons name={balanceVisible ? "eye" : "eye-off"} size={16} color="#FFFFFF" />
                </Pressable>
              </View>
              <Pressable onPress={() => navigation.navigate('History')}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.historyText}>Transaction History</Text>
                  <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                </View>
              </Pressable>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>
                {balanceVisible ? `₦${walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` : '****'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </View>

            {/* Compact Account Details - Horizontal Row */}
            {user?.monnifyAccounts && user.monnifyAccounts.length > 0 ? (
              <View style={styles.accountDetails}>
                <View style={styles.accountDetailsRow}>
                  <Ionicons name="business-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.compactAccountText}>{user.monnifyAccounts[0].bankName}</Text>
                  <Text style={styles.accountSeparator}>•</Text>
                  <Text style={styles.compactAccountText}>{user.monnifyAccounts[0].accountNumber}</Text>
                  <Text style={styles.accountSeparator}>•</Text>
                  <Text style={styles.compactAccountText}>{user.monnifyAccounts[0].accountName}</Text>
                  
                  <Pressable
                    onPress={() => handleCopyAccountNumber(user.monnifyAccounts[0].accountNumber)}
                    style={styles.compactCopyButton}
                  >
                    <Ionicons
                      name={copiedAccount === user.monnifyAccounts[0].accountNumber ? "checkmark-circle" : "copy-outline"}
                      size={16}
                      color="#FFFFFF"
                    />
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.accountDetails}>
                <Text style={[styles.accountText, { textAlign: 'center', opacity: 0.8 }]}>
                  Virtual account will be created automatically
                </Text>
              </View>
            )}

            <Button
              mode="contained"
              onPress={() => navigation.navigate('Wallet')}
              style={styles.addFundsBtn}
              labelStyle={styles.addFundsLabel}
              icon={() => <Ionicons name="add" size={16} color="#00B894" />}
            >
              Add Money
            </Button>
          </Card.Content>
        </Card>

        {/* Top Banner Carousel */}
        <BannerCarousel section="home-top" />

        {/* VTU Services Section with Badge */}
        <View style={styles.servicesSection}>
          <View style={styles.servicesGrid}>
            {vtuServices.map((service) => (
              <Pressable
                key={service.id}
                style={styles.serviceCard}
                onPress={() => navigation.navigate(service.screen)}
              >
                <View style={[styles.serviceIconContainer, { backgroundColor: service.color + '20' }]}>
                  <Ionicons name={service.icon} size={28} color={service.color} />
                  {service.id === 'airtime' && (
                    <View style={styles.badgeContainer}>
                      <Text style={styles.badgeText}>Up to 6%</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.serviceName}>{service.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Middle Banner Carousel */}
        <BannerCarousel section="home-middle" />

        {/* Bills & Services Section */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Bills & Services</Text>
          <View style={styles.servicesGrid}>
            {billsServices.map((service) => (
              <Pressable
                key={service.id}
                style={styles.serviceCard}
                onPress={() => navigation.navigate(service.screen)}
              >
                <View style={[styles.serviceIconContainer, { backgroundColor: service.color }]}>
                  <Ionicons name={service.icon} size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.serviceName}>{service.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Education & Insurance Section */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Education & Insurance</Text>
          <View style={styles.servicesGrid}>
            {educationServices.map((service) => (
              <Pressable
                key={service.id}
                style={styles.serviceCard}
                onPress={() => navigation.navigate(service.screen)}
              >
                <View style={[styles.serviceIconContainer, { backgroundColor: service.color }]}>
                  <Ionicons name={service.icon} size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.serviceName}>{service.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Bottom Banner Carousel */}
        <BannerCarousel section="home-bottom" />

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <Button onPress={() => navigation.navigate('History')} compact>
                See All
              </Button>
            </View>
            {recentTransactions.map((transaction, index) => (
              <Card key={index} style={styles.transactionCard}>
                <Card.Content>
                  <View style={styles.transactionRow}>
                    <View style={styles.transactionLeft}>
                      <View style={[styles.transactionIcon, {
                        backgroundColor: transaction.transactionType === 'credit' ? '#E8F5E9' : '#FFEBEE'
                      }]}>
                        <Ionicons
                          name={transaction.transactionType === 'credit' ? 'arrow-down' : 'arrow-up'}
                          size={20}
                          color={transaction.transactionType === 'credit' ? '#2e7d32' : '#d32f2f'}
                        />
                      </View>
                      <View>
                        <Text style={styles.transactionType}>{transaction.type}</Text>
                        <Text style={styles.transactionDate}>
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <Text style={[
                      styles.transactionAmount,
                      { color: transaction.transactionType === 'credit' ? '#2e7d32' : '#d32f2f' }
                    ]}>
                      {transaction.transactionType === 'credit' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#6366f1',
    elevation: 0,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  balanceCard: {
    margin: 16,
    backgroundColor: '#00B894',
    elevation: 4,
    borderRadius: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  historyText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginRight: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  addFundsBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginTop: 12,
  },
  addFundsLabel: {
    color: '#00B894',
    fontWeight: 'bold',
    fontSize: 13,
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  servicesSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1A1A1A',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 20,
  },
  serviceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  serviceName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
  transactionsSection: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionCard: {
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    elevation: 1,
    borderRadius: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  kycBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    elevation: 2,
  },
  kycBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  kycBannerTextContainer: {
    flex: 1,
  },
  kycBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  kycBannerMessage: {
    fontSize: 13,
    color: '#666',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  accountDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  accountDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  accountText: {
    color: '#FFFFFF',
    fontSize: 11,
    marginLeft: 6,
    opacity: 0.9,
  },
  compactAccountText: {
    color: '#FFFFFF',
    fontSize: 11,
    opacity: 0.9,
    marginHorizontal: 2,
  },
  accountSeparator: {
    color: '#FFFFFF',
    fontSize: 11,
    opacity: 0.6,
    marginHorizontal: 4,
  },
  compactCopyButton: {
    marginLeft: 8,
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
  },
  monnifyCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    borderRadius: 16,
  },
  monnifyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monnifyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  monnifyDetails: {
    gap: 12,
  },
  monnifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  monnifyLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  monnifyValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  copyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
  },
  monnifyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 6,
  },
  monnifyFooterText: {
    fontSize: 11,
    color: '#666',
    flex: 1,
  },
});