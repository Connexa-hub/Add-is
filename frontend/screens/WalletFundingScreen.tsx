import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, TextInput, Button, Portal, Modal, Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WalletFundingScreen() {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  const handleFundWallet = async () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setMessage('Invalid amount');
      setVisible(true);
      return;
    }

    const transaction = {
      type: 'Wallet Funding',
      details: {
        amount: num,
        method: 'Simulated Payment',
        date: new Date(),
      },
    };

    const history = JSON.parse(await AsyncStorage.getItem('history') || '[]');
    history.push(transaction);
    await AsyncStorage.setItem('history', JSON.stringify(history));

    setMessage('Wallet funded successfully with ₦' + num);
    setVisible(true);
    setAmount('');
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Fund Wallet (Simulated)" />
      </Appbar.Header>

      <View style={styles.form}>
        <TextInput
          label="Amount (₦)"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          style={styles.input}
          mode="outlined"
        />
        <Button mode="contained" onPress={handleFundWallet} style={styles.button}>
          Fund Wallet
        </Button>
      </View>

      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modal}>
          <Text>{message}</Text>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  form: { padding: 20 },
  input: { marginBottom: 10 },
  button: { marginVertical: 10, backgroundColor: '#6200ee' },
  modal: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 10, elevation: 4 },
});
