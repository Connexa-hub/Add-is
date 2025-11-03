
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, SafeAreaView, Pressable } from 'react-native';
import { Appbar, Card, Text, List, Divider, Avatar, Button, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';
import { tokenService } from '../utils/tokenService';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalSpent: 0,
    totalCashback: 0,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = await tokenService.getToken();
      
      if (!token) {
        Alert.alert('Session Expired', 'Please login again');
        navigation.replace('Login');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (response.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        await tokenService.clearToken();
        navigation.replace('Login');
        return;
      }
      
      if (data.success && data.data) {
        setUser(data.data);
        loadUserStats(token);
      } else {
        console.error('No user data received:', data);
        Alert.alert('Error', data.message || 'Failed to load profile data');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async (token) => {
    try {
      // Fetch user's transactions to calculate stats with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/api/transactions/mine?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      
      if (data.success && data.data?.transactions) {
        const transactions = data.data.transactions;
        
        // Calculate stats from transactions
        const totalTransactions = transactions.length;
        const totalSpent = transactions
          .filter(t => t.type === 'debit' && t.status === 'completed')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalCashback = transactions
          .filter(t => t.type === 'cashback')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        setStats({
          totalTransactions,
          totalSpent,
          totalCashback
        });
      }
    } catch (error) {
      // Silently set default stats on error - don't log to avoid console clutter
      setStats({
        totalTransactions: 0,
        totalSpent: 0,
        totalCashback: 0
      });
    }
  };

  const handleCopyAccountNumber = async (accountNumber: string) => {
    try {
      await Clipboard.setStringAsync(accountNumber);
      Alert.alert('Copied!', 'Account number copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy account number');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Profile" />
        </Appbar.Header>

        <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text 
              size={80} 
              label={user?.name?.substring(0, 2).toUpperCase() || 'U'} 
              style={styles.avatar}
            />
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.phone}>{user?.phone || 'No phone number'}</Text>
          </Card.Content>
        </Card>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statValue}>{stats.totalTransactions}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statValue}>₦{(stats.totalSpent || 0).toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statValue}>₦{(stats.totalCashback || 0).toLocaleString()}</Text>
              <Text style={styles.statLabel}>Cashback</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Account Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Account Information</Text>
            <Divider style={styles.divider} />
            
            <List.Item
              title="Wallet Balance"
              description={`₦${(user?.walletBalance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`}
              left={props => <List.Icon {...props} icon="wallet" />}
            />
            
            {user?.monnifyAccounts && user.monnifyAccounts.length > 0 && (
              <>
                <List.Item
                  title="Virtual Account Number"
                  description={user.monnifyAccounts[0].accountNumber}
                  left={props => <List.Icon {...props} icon="bank" />}
                  right={props => (
                    <Pressable 
                      onPress={() => handleCopyAccountNumber(user.monnifyAccounts[0].accountNumber)}
                      style={styles.copyIconButton}
                    >
                      <Ionicons name="copy-outline" size={20} color="#6200ee" />
                    </Pressable>
                  )}
                />
                <List.Item
                  title="Bank Name"
                  description={user.monnifyAccounts[0].bankName}
                  left={props => <List.Icon {...props} icon="office-building" />}
                />
                <List.Item
                  title="Account Name"
                  description={user.monnifyAccounts[0].accountName}
                  left={props => <List.Icon {...props} icon="account" />}
                />
              </>
            )}
            
            <List.Item
              title="Account Status"
              description={user?.isVerified ? 'Verified' : 'Not Verified'}
              left={props => <List.Icon {...props} icon="check-circle" />}
            />
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <Divider style={styles.divider} />
            
            <List.Item
              title="Transaction History"
              left={props => <List.Icon {...props} icon="history" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('History')}
            />
            
            <List.Item
              title="Fund Wallet"
              left={props => <List.Icon {...props} icon="cash-plus" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Wallet')}
            />
            
            <List.Item
              title="Edit Profile"
              description="Update your information"
              left={props => <List.Icon {...props} icon="account-edit" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon')}
            />
            
            <List.Item
              title="Verify Account (KYC)"
              description={user?.kyc?.status === 'approved' ? 'Verified ✓' : user?.kyc?.status === 'pending' ? 'Under review' : 'Not verified - Tap to verify'}
              left={props => <List.Icon {...props} icon="shield-check" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                if (user?.kyc?.status === 'approved') {
                  Alert.alert('Account Verified', 'Your account is already verified.');
                } else if (user?.kyc?.status === 'pending') {
                  Alert.alert('KYC Under Review', 'Your verification is currently being reviewed. You will be notified once complete.');
                } else {
                  navigation.navigate('KYCPersonalInfo');
                }
              }}
            />
            
            <List.Item
              title="Settings"
              left={props => <List.Icon {...props} icon="cog" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Settings')}
            />
          </Card.Content>
        </Card>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatar: {
    backgroundColor: '#6200ee',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  phone: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    marginVertical: 12,
  },
  copyIconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
