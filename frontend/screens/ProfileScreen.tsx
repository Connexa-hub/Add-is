import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, SafeAreaView, Pressable } from 'react-native';
import { Appbar, Card, Text, List, Divider, Avatar, Button, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store'; // Import SecureStore
import { API_BASE_URL } from '../constants/api';
import { tokenService } from '../utils/tokenService';
import { useAppTheme } from '../src/hooks/useAppTheme';

export default function ProfileScreen({ navigation }: any) {
  const { tokens } = useAppTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
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

      console.log('Loading profile data with token:', token ? 'Token exists' : 'No token');

      if (!token) {
        console.log('No token found, redirecting to login');
        Alert.alert('Session Expired', 'Please log in again');
        navigation.replace('Login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Profile response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized - clearing token and redirecting to login');
          await tokenService.clearToken();
          await AsyncStorage.multiRemove(['token', 'userId', 'userEmail', 'userName', 'lastActivityTime']);
          Alert.alert('Session Expired', 'Please log in again');
          navigation.replace('Login');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Profile data received:', data.success);

      if (data.success && data.data) {
        setUser(data.data);
        console.log('Monnify accounts:', data.data.monnifyAccounts);
        loadUserStats(token);
      } else {
        console.error('No user data received');
        Alert.alert('Error', 'Failed to load profile data');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try logging in again.');
      navigation.replace('Login');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async (token: string) => {
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
          .filter((t: any) => t.type === 'debit' && t.status === 'completed')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        const totalCashback = transactions
          .filter((t: any) => t.type === 'cashback')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

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
      setCopiedAccount(accountNumber);
      setTimeout(() => setCopiedAccount(null), 2000);
    } catch (error) {
      console.error('Failed to copy account number:', error);
    }
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
              setLoading(true);

              // Clear ONLY auth tokens and session data
              // PRESERVE biometric settings so user can use fingerprint to login again
              await tokenService.clearToken();
              await AsyncStorage.multiRemove([
                'token',
                'userId',
                'userEmail',
                'userName',
                'lastActivityTime'
              ]);

              // IMPORTANT: DO NOT clear these on logout:
              // - 'biometricEnabled' (user wants to keep using biometric)
              // - 'biometric_user_id' (identifies which user's biometric to use)
              // - 'savedEmail' (shows which account to login to)
              // These are only cleared when user explicitly chooses "Switch Account"

              console.log('Logout completed - biometric settings preserved');

              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const styles = createStyles(tokens);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tokens.colors.primary.main} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Profile" />
          <Appbar.Action icon="logout" onPress={handleLogout} />
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
              left={(props: any) => <List.Icon {...props} icon="wallet" />}
            />

            {user?.monnifyAccounts && user.monnifyAccounts.length > 0 && (
              <>
                <List.Item
                  title="Virtual Account Number"
                  description={user.monnifyAccounts[0].accountNumber}
                  left={(props: any) => <List.Icon {...props} icon="bank" />}
                  right={(props: any) => (
                    <Pressable
                      onPress={() => handleCopyAccountNumber(user.monnifyAccounts[0].accountNumber)}
                      style={styles.copyIconButton}
                    >
                      <Ionicons
                        name={copiedAccount === user.monnifyAccounts[0].accountNumber ? "checkmark-circle" : "copy-outline"}
                        size={20}
                        color={copiedAccount === user.monnifyAccounts[0].accountNumber ? "#10b981" : "#6200ee"}
                      />
                    </Pressable>
                  )}
                />
                <List.Item
                  title="Bank Name"
                  description={user.monnifyAccounts[0].bankName}
                  left={(props: any) => <List.Icon {...props} icon="office-building" />}
                />
                <List.Item
                  title="Account Name"
                  description={user.monnifyAccounts[0].accountName}
                  left={(props: any) => <List.Icon {...props} icon="account" />}
                />
              </>
            )}

            <List.Item
              title="Account Status"
              description={user?.isVerified ? 'Verified' : 'Not Verified'}
              left={(props: any) => <List.Icon {...props} icon="check-circle" />}
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
              left={(props: any) => <List.Icon {...props} icon="history" />}
              right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('History')}
            />

            <List.Item
              title="Fund Wallet"
              left={(props: any) => <List.Icon {...props} icon="cash-plus" />}
              right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Wallet')}
            />

            <List.Item
              title="Edit Profile"
              description="Update your information"
              left={(props: any) => <List.Icon {...props} icon="account-edit" />}
              right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon')}
            />

            <List.Item
              title="Verify Account (KYC)"
              description={user?.kyc?.status === 'approved' ? 'Verified ✓' : user?.kyc?.status === 'pending' ? 'Under review' : 'Not verified - Tap to verify'}
              left={(props: any) => <List.Icon {...props} icon="shield-check" />}
              right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
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
              left={(props: any) => <List.Icon {...props} icon="cog" />}
              right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Settings')}
            />
          </Card.Content>
        </Card>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (tokens: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.background.default,
  },
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.default,
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
    backgroundColor: tokens.colors.card.background,
    elevation: 2,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatar: {
    backgroundColor: tokens.colors.primary.main,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    color: tokens.colors.text.primary,
  },
  email: {
    fontSize: 16,
    color: tokens.colors.text.secondary,
    marginTop: 4,
  },
  phone: {
    fontSize: 14,
    color: tokens.colors.text.secondary,
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
    backgroundColor: tokens.colors.card.background,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: tokens.colors.primary.main,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: tokens.colors.card.background,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: tokens.colors.text.primary,
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