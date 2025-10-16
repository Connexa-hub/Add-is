// ElectricityScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Appbar, Modal, Portal } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ElectricityScreen() {
  const [meterNumber, setMeterNumber] = useState('');
  const [variationCode, setVariationCode] = useState('prepaid');
  const [serviceID, setServiceID] = useState('ikeja-electric');
  const [amount, setAmount] = useState('');
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  const handlePayElectricity = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(`${process.env.EXPO_PUBLIC_API_BASE}/api/services/pay-electricity`, { meterNumber, variation_code: variationCode, serviceID, amount }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Electricity bill paid successfully!\nReceipt: ' + JSON.stringify(response.data));
      setVisible(true);
    } catch (error) {
      setMessage('Error: ' + (error.response?.data?.message || 'Server error'));
      setVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Electricity Payment" />
      </Appbar.Header>
      <View style={styles.form}>
        <TextInput label="Meter Number" value={meterNumber} onChangeText={setMeterNumber} style={styles.input} mode="outlined" />
        <TextInput label="Variation Code" value={variationCode} onChangeText={setVariationCode} style={styles.input} mode="outlined" />
        <TextInput label="Service ID" value={serviceID} onChangeText={setServiceID} style={styles.input} mode="outlined" />
        <TextInput label="Amount" value={amount} onChangeText={setAmount} style={styles.input} keyboardType="numeric" mode="outlined" />
        <Button mode="contained" onPress={handlePayElectricity} style={styles.button}>Pay</Button>
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
