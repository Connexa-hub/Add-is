
// TVScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Appbar, Modal, Portal } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TVScreen() {
  const [smartcardNumber, setSmartcardNumber] = useState('');
  const [variationCode, setVariationCode] = useState('');
  const [serviceID, setServiceID] = useState('dstv');
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubscribeTV = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(`${process.env.EXPO_PUBLIC_API_BASE}/api/services/subscribe-tv`, { smartcardNumber, variation_code: variationCode, serviceID }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('TV subscription successful!\nReceipt: ' + JSON.stringify(response.data));
      setVisible(true);
    } catch (error) {
      setMessage('Error: ' + (error.response?.data?.message || 'Server error'));
      setVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="TV Subscription" />
      </Appbar.Header>
      <View style={styles.form}>
        <TextInput label="Smartcard Number" value={smartcardNumber} onChangeText={setSmartcardNumber} style={styles.input} mode="outlined" />
        <TextInput label="Variation Code" value={variationCode} onChangeText={setVariationCode} style={styles.input} mode="outlined" />
        <TextInput label="Service ID" value={serviceID} onChangeText={setServiceID} style={styles.input} mode="outlined" />
        <Button mode="contained" onPress={handleSubscribeTV} style={styles.button}>Subscribe</Button>
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

