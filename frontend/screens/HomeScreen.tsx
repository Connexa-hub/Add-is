import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Pressable } from 'react-native';
import { Appbar, Card, Text, Avatar, Button, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');

      if (!token || !userId) {
        navigation.replace('Login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setUser(data.data);
        setWalletBalance(data.data.walletBalance || 0);
        await loadRecentTransactions(token);
      } else {
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentTransactions = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setRecentTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  const services = [
    { 
      id: 'airtime', 
      name: 'Airtime', 
      icon: 'phone-portrait', 
      color: '#FF6B35',
      gradient: ['#FF6B35', '#FF8C42'],
      screen: 'Airtime'
    },
    { 
      id: 'data', 
      name: 'Data', 
      icon: 'wifi', 
      color: '#4ECDC4',
      gradient: ['#4ECDC4', '#44A08D'],
      screen: 'Data'
    },
    { 
      id: 'electricity', 
      name: 'Electricity', 
      icon: 'flash', 
      color: '#FFD93D',
      gradient: ['#FFD93D', '#F4A261'],
      screen: 'Electricity'
    },
    { 
      id: 'tv', 
      name: 'TV & Cable', 
      icon: 'tv', 
      color: '#6C5CE7',
      gradient: ['#6C5CE7', '#A29BFE'],
      screen: 'TV'
    },
    { 
      id: 'internet', 
      name: 'Internet', 
      icon: 'globe', 
      color: '#00B894',
      gradient: ['#00B894', '#55EFC4'],
      screen: 'Internet'
    },
    { 
      id: 'education', 
      name: 'Education', 
      icon: 'school', 
      color: '#E17055',
      gradient: ['#E17055', '#FDCB6E'],
      screen: 'Education'
    },
    { 
      id: 'betting', 
      name: 'Betting', 
      icon: 'trophy', 
      color: '#0984E3',
      gradient: ['#0984E3', '#74B9FF'],
      screen: 'Betting'
    },
    { 
      id: 'insurance', 
      name: 'Insurance', 
      icon: 'shield-checkmark', 
      color: '#FD79A8',
      gradient: ['#FD79A8', '#FDCB6E'],
      screen: 'Insurance'
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5c27d9" />
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
        <Appbar.Action icon="bell-outline" onPress={() => navigation.navigate('Notifications')} />
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
              Alert.alert(
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
      >
        {/* Wallet Balance Card */}
        <Card style={styles.balanceCard}>
          <Card.Content>
            <Text style={styles.balanceLabel}>Wallet Balance</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>
                ₦{walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Wallet')}
                style={styles.addFundsBtn}
                labelStyle={styles.addFundsLabel}
                compact
              >
                + Add Funds
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Services Grid */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesGrid}>
            {services.map((service) => (
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
    backgroundColor: '#6366f1',
    elevation: 4,
    borderRadius: 16,
  },
  balanceLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  addFundsBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  addFundsLabel: {
    color: '#6366f1',
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
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
});