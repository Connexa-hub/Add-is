import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert, Clipboard } from 'react-native';
import { Appbar, TextInput, Button, Portal, Modal, Text, Card, Divider, IconButton, Checkbox } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { API_BASE_URL } from '../constants/api';

export default function WalletFundingScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [virtualAccount, setVirtualAccount] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [user, setUser] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [savedCards, setSavedCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);

  useEffect(() => {
    loadUserData();
    loadSavedCards();
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
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        const userData = data.data || data.user;
        setUser(userData);
        setWalletBalance(userData.walletBalance || 0);

        // Load Monnify virtual account
        await loadMonnifyAccount(token);
      } else {
        throw new Error(data.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', error.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const loadMonnifyAccount = async (token) => {
    try {
      // First try to get existing account
      let response = await fetch(`${API_BASE_URL}/api/payment/virtual-account`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      let data = await response.json();

      // If no account exists, create one
      if (data.success && !data.data) {
        response = await fetch(`${API_BASE_URL}/api/payment/virtual-account/create`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        data = await response.json();
      }

      if (data.success && data.data && data.data.length > 0) {
        const account = data.data[0]; // Use first account
        setVirtualAccount({
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          bankName: account.bankName,
        });
      }
    } catch (error) {
      console.error('Error loading Monnify account:', error);
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

      // Refresh user profile to get updated wallet balance
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        const userData = data.data || data.user;
        if (userData) {
          setWalletBalance(userData.walletBalance || 0);
          Alert.alert('Success', 'Wallet balance updated!');
        }
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

      const response = await fetch(`${API_BASE_URL}/api/wallet/funding/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: num, saveCard }),
      });

      const data = await response.json();

      if (data.success && data.data.checkoutUrl) {
        setCheckoutUrl(data.data.checkoutUrl);
        setPaymentReference(data.data.paymentReference);
        setPaymentModalVisible(true);
      } else {
        Alert.alert('Error', data.message || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      Alert.alert('Error', 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewNavigationStateChange = async (navState) => {
    const { url } = navState;
    console.log('WebView navigation:', url);

    // Check if user closed the payment page
    if (url.includes('checkout') && url.includes('close=true')) {
      setPaymentModalVisible(false);
      setProcessingPayment(false);
      return;
    }

    if (url.includes('payment/callback') || url.includes('status=success') || url.includes('status=completed')) {
      if (!processingPayment) {
        setProcessingPayment(true);
        await verifyPayment();
      }
    } else if (url.includes('status=failed') || url.includes('status=cancelled')) {
      setPaymentModalVisible(false);
      setProcessingPayment(false);
      Alert.alert('Payment Failed', 'Your payment was not completed. Please try again.');
    }
  };

  const verifyPayment = async (retryCount = 0) => {
    const maxRetries = 20; // Max 1 minute of retries (20 * 3 seconds)

    try {
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/wallet/funding/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentReference }),
      });

      const data = await response.json();

      if (data.success && data.data.status === 'completed') {
        setWalletBalance(data.data.newBalance);

        if (saveCard && data.data.cardData) {
          await saveCardAfterPayment(data.data.cardData);
        }

        setPaymentModalVisible(false);
        setProcessingPayment(false);
        setAmount('');
        setSaveCard(false);
        Alert.alert('Success', `Your wallet has been funded with ₦${data.data.amount.toLocaleString()}`);
      } else if (retryCount < maxRetries) {
        // Retry after 3 seconds
        setTimeout(async () => {
          await verifyPayment(retryCount + 1);
        }, 3000);
      } else {
        // Max retries reached
        setPaymentModalVisible(false);
        setProcessingPayment(false);
        Alert.alert(
          'Verification Timeout',
          'Payment verification is taking longer than expected. Please check your wallet balance or contact support.',
          [
            { text: 'OK', onPress: () => loadUserData() }
          ]
        );
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setPaymentModalVisible(false);
      setProcessingPayment(false);
      Alert.alert('Error', 'Failed to verify payment. Please check your wallet balance.');
    }
  };

  const saveCardAfterPayment = async (cardData) => {
    try {
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/wallet/funding/save-card`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentReference,
          cardDetails: cardData
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('Card saved successfully');
        loadSavedCards();
      }
    } catch (error) {
      console.error('Error saving card:', error);
    }
  };

  const loadSavedCards = async () => {
    try {
      setLoadingCards(true);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/cards`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSavedCards(data.data || []);
      }
    } catch (error) {
      console.error('Error loading saved cards:', error);
    } finally {
      setLoadingCards(false);
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
          <ActivityIndicator size="large" color="#6366f1" />
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
              <Text style={styles.cardTitle}>Your Personal Account Number</Text>
              <Text style={styles.cardSubtitle}>
                Transfer to this account from any bank app
              </Text>
              <Divider style={styles.divider} />

              <View style={styles.accountRow}>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountLabel}>Bank Name</Text>
                  <Text style={styles.accountValue}>{virtualAccount.bankName}</Text>
                </View>
                <IconButton
                  icon="content-copy"
                  size={20}
                  onPress={() => copyToClipboard(virtualAccount.bankName, 'Bank Name')}
                />
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
                <IconButton
                  icon="content-copy"
                  size={20}
                  onPress={() => copyToClipboard(virtualAccount.accountName, 'Account Name')}
                />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>✓ Transfer any amount 24/7</Text>
                <Text style={styles.infoText}>✓ Instant wallet credit</Text>
                <Text style={styles.infoText}>✓ Free transfers (No charges)</Text>
                <Text style={styles.infoText}>✓ Works with all Nigerian banks</Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Card Payment Option */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Pay with Card</Text>
            <Text style={styles.cardSubtitle}>
              Alternative: Quick payment using debit/credit card
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

            <View style={styles.checkboxRow}>
              <Checkbox
                status={saveCard ? 'checked' : 'unchecked'}
                onPress={() => setSaveCard(!saveCard)}
              />
              <Text style={styles.checkboxLabel} onPress={() => setSaveCard(!saveCard)}>
                Save this card for future payments
              </Text>
            </View>

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

      <Portal>
        <Modal
          visible={paymentModalVisible}
          onDismiss={() => {
            if (!processingPayment) {
              setPaymentModalVisible(false);
            }
          }}
          contentContainerStyle={styles.paymentModal}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complete Payment</Text>
            {!processingPayment && (
              <IconButton
                icon="close"
                size={24}
                onPress={() => setPaymentModalVisible(false)}
              />
            )}
          </View>

          {processingPayment ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.processingText}>Verifying payment...</Text>
              <Text style={styles.processingSubtext}>This may take a few moments</Text>
              <Button
                mode="outlined"
                onPress={() => {
                  Alert.alert(
                    'Cancel Verification?',
                    'Your payment may still be processing. You can check your wallet balance later.',
                    [
                      { text: 'Continue Waiting', style: 'cancel' },
                      {
                        text: 'Close',
                        onPress: () => {
                          setPaymentModalVisible(false);
                          setProcessingPayment(false);
                        }
                      }
                    ]
                  );
                }}
                style={{ marginTop: 20 }}
              >
                Cancel Verification
              </Button>
            </View>
          ) : (
            <WebView
              source={{ uri: checkoutUrl }}
              style={styles.webview}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webviewLoading}>
                  <ActivityIndicator size="large" color="#6366f1" />
                </View>
              )}
            />
          )}
        </Modal>
      </Portal>
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  paymentModal: {
    backgroundColor: 'white',
    height: '80%',
    marginTop: 'auto',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  processingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
});