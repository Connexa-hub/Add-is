import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Appbar, Card, Text, Avatar, Button, ActivityIndicator } from 'react-native-paper';
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

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setWalletBalance(data.user.walletBalance || 0);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Home" />
        <Appbar.Action icon="cog" onPress={() => navigation.navigate('Settings')} />
        <Appbar.Action icon="logout" onPress={handleLogout} />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* User Welcome Card */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <View style={styles.welcomeContent}>
              <Avatar.Text
                size={50}
                label={user?.name?.substring(0, 2).toUpperCase() || 'U'}
                style={styles.avatar}
              />
              <View style={styles.welcomeText}>
                <Text style={styles.greeting}>Welcome back,</Text>
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Wallet Balance Card */}
        <Card style={styles.balanceCard}>
          <Card.Content>
            <Text style={styles.balanceLabel}>Wallet Balance</Text>
            <Text style={styles.balanceAmount}>
              ₦{walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Wallet')}
              style={styles.fundButton}
              labelStyle={styles.fundButtonLabel}
            >
              + Add Funds
            </Button>
          </Card.Content>
        </Card>

        {/* Quick Services */}
        <Text style={styles.sectionTitle}>Quick Services</Text>
        <View style={styles.servicesGrid}>
          <Card style={styles.serviceCard} onPress={() => navigation.navigate('Data')}>
            <Card.Content style={styles.serviceContent}>
              <Avatar.Icon size={48} icon="wifi" style={styles.serviceIcon} />
              <Text style={styles.serviceTitle}>Buy Data</Text>
            </Card.Content>
          </Card>

          <Card style={styles.serviceCard} onPress={() => navigation.navigate('TV')}>
            <Card.Content style={styles.serviceContent}>
              <Avatar.Icon size={48} icon="television" style={styles.serviceIcon} />
              <Text style={styles.serviceTitle}>TV Subscription</Text>
            </Card.Content>
          </Card>

          <Card style={styles.serviceCard} onPress={() => navigation.navigate('Electricity')}>
            <Card.Content style={styles.serviceContent}>
              <Avatar.Icon size={48} icon="lightbulb" style={styles.serviceIcon} />
              <Text style={styles.serviceTitle}>Electricity</Text>
            </Card.Content>
          </Card>

          <Card style={styles.serviceCard} onPress={() => navigation.navigate('History')}>
            <Card.Content style={styles.serviceContent}>
              <Avatar.Icon size={48} icon="history" style={styles.serviceIcon} />
              <Text style={styles.serviceTitle}>History</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {recentTransactions.map((transaction, index) => (
              <Card key={index} style={styles.transactionCard}>
                <Card.Content>
                  <View style={styles.transactionRow}>
                    <View>
                      <Text style={styles.transactionType}>{transaction.type}</Text>
                      <Text style={styles.transactionDate}>
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </Text>
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
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  welcomeCard: {
    margin: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#6200ee',
  },
  welcomeText: {
    marginLeft: 16,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  balanceCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#6200ee',
    elevation: 4,
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  fundButton: {
    marginTop: 8,
    backgroundColor: '#fff',
  },
  fundButtonLabel: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    color: '#333',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  serviceCard: {
    width: '47%',
    margin: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
  serviceContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  serviceIcon: {
    backgroundColor: '#e8eaf6',
  },
  serviceTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  transactionCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    elevation: 1,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});