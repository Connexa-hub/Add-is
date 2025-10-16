// DataScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Appbar, Modal, Portal } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DataScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [network, setNetwork] = useState('mtn');
  const [plan, setPlan] = useState('mtn-1gb');
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubscribeData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(`${process.env.EXPO_PUBLIC_API_BASE}/api/services/buy-data`, { phoneNumber, plan, network }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Data purchase successful!\nReceipt: ' + JSON.stringify(response.data));
      setVisible(true);
    } catch (error) {
      setMessage('Error: ' + (error.response?.data?.message || 'Server error'));
      setVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Buy Data" />
      </Appbar.Header>
      <View style={styles.form}>
        <TextInput label="Phone Number" value={phoneNumber} onChangeText={setPhoneNumber} style={styles.input} mode="outlined" />
        <TextInput label="Network" value={network} onChangeText={setNetwork} style={styles.input} mode="outlined" />
        <TextInput label="Data Plan" value={plan} onChangeText={setPlan} style={styles.input} mode="outlined" />
        <Button mode="contained" onPress={handleSubscribeData} style={styles.button}>Buy Data</Button>
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
