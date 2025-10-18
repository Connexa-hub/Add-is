
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert, Clipboard } from 'react-native';
import { Appbar, TextInput, Button, Portal, Modal, Text, Card, Divider, IconButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';

export default function WalletFundingScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [virtualAccount, setVirtualAccount] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');

      if (!token || !userId) {
        navigation.replace('Login');
        return;
      }

      // Fetch user profile
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setWalletBalance(data.user.walletBalance || 0);
        
        // Check if user has virtual account
        if (data.user.virtualAccountNumber) {
          setVirtualAccount({
            accountNumber: data.user.virtualAccountNumber,
            accountName: data.user.virtualAccountName,
            bankName: data.user.virtualBankName,
          });
        } else {
          // Create virtual account
          await createVirtualAccount(token);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const createVirtualAccount = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/create-virtual-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setVirtualAccount({
          accountNumber: data.accountNumber,
          accountName: data.accountName,
          bankName: data.bankName,
        });
      }
    } catch (error) {
      console.error('Error creating virtual account:', error);
    }
  };

  const copyToClipboard = (text, field) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', `${field} copied to clipboard`);
  };

  const checkPaymentStatus = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/payment/verify-payment`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setWalletBalance(data.walletBalance);
        Alert.alert('Success', 'Wallet balance updated!');
      }
    } catch (error) {
      console.error('Error checking payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const initiateCardPayment = async () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 100) {
      Alert.alert('Invalid Amount', 'Please enter a minimum of ₦100');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/payment/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: num }),
      });

      const data = await response.json();
      
      if (data.success && data.paymentUrl) {
        // In a real implementation, open payment URL in WebView
        Alert.alert(
          'Payment Initiated',
          'In production, this would open the payment page. For now, use the virtual account to fund your wallet.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      Alert.alert('Error', 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !virtualAccount) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Fund Wallet" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Loading payment details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Fund Wallet" />
        <Appbar.Action icon="refresh" onPress={checkPaymentStatus} />
      </Appbar.Header>

      <ScrollView style={styles.scrollView}>
        {/* Wallet Balance Card */}
        <Card style={styles.balanceCard}>
          <Card.Content>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>
              ₦{walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </Text>
          </Card.Content>
        </Card>

        {/* Virtual Account Details */}
        {virtualAccount && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Bank Transfer (Recommended)</Text>
              <Text style={styles.cardSubtitle}>
                Transfer to your dedicated account number below
              </Text>
              <Divider style={styles.divider} />
              
              <View style={styles.accountRow}>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountLabel}>Bank Name</Text>
                  <Text style={styles.accountValue}>{virtualAccount.bankName}</Text>
                </View>
              </View>

              <View style={styles.accountRow}>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountLabel}>Account Number</Text>
                  <Text style={styles.accountValue}>{virtualAccount.accountNumber}</Text>
                </View>
                <IconButton
                  icon="content-copy"
                  size={20}
                  onPress={() => copyToClipboard(virtualAccount.accountNumber, 'Account Number')}
                />
              </View>

              <View style={styles.accountRow}>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountLabel}>Account Name</Text>
                  <Text style={styles.accountValue}>{virtualAccount.accountName}</Text>
                </View>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  ✅ Instant credit (within 2 minutes)
                </Text>
                <Text style={styles.infoText}>
                  ✅ Transfer from any bank app
                </Text>
                <Text style={styles.infoText}>
                  ✅ No transaction fees
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Card Payment Option */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Pay with Card</Text>
            <Text style={styles.cardSubtitle}>
              Quick payment using debit/credit card
            </Text>
            <Divider style={styles.divider} />
            
            <TextInput
              label="Amount (₦)"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Affix text="₦" />}
            />
            
            <Button 
              mode="contained" 
              onPress={initiateCardPayment} 
              style={styles.button}
              loading={loading}
              disabled={loading}
            >
              Pay with Card
            </Button>
            
            <Text style={styles.feeText}>
              Transaction fee: 1.5% + ₦100
            </Text>
          </Card.Content>
        </Card>

        {/* Instructions */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>How to Fund</Text>
            <Text style={styles.instructionText}>
              1. Open your bank app{'\n'}
              2. Transfer any amount to the account number above{'\n'}
              3. Your wallet will be credited automatically{'\n'}
              4. Refresh to see updated balance
            </Text>
          </Card.Content>
        </Card>
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
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  balanceCard: {
    margin: 16,
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
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  card: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#fff',
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountInfo: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  accountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoBox: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#2e7d32',
    marginBottom: 4,
  },
  input: { 
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: { 
    marginVertical: 8,
    backgroundColor: '#6200ee',
  },
  feeText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 24,
    marginTop: 8,
  },
});
