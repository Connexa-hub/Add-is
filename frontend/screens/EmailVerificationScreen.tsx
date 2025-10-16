// File: src/screens/EmailVerificationScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

export default function EmailVerificationScreen({ route, navigation }) {
  const { email } = route.params;
  const [otp, setOtp] = useState('');

  const handleVerify = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/verify-email`, { email, otp });
      Alert.alert('Verified', 'Email successfully verified!');
      navigation.navigate('Login');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Invalid or expired code');
    }
  };

  const handleResend = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/resend-verification`, { email });
      Alert.alert('OTP Sent', 'A new OTP has been sent to your email');
    } catch (err) {
      Alert.alert('Error', 'Could not resend OTP');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Email Verification</Text>
      <TextInput placeholder="Enter OTP" keyboardType="numeric" value={otp} onChangeText={setOtp} style={styles.input} />
      <TouchableOpacity onPress={handleVerify} style={styles.button}>
        <Text style={styles.buttonText}>Verify</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleResend}>
        <Text style={styles.link}>Resend OTP</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 12, borderRadius: 8 },
  button: { backgroundColor: '#0a84ff', padding: 12, borderRadius: 8 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  link: { marginTop: 12, textAlign: 'center', color: '#0a84ff' }
});
