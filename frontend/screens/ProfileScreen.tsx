import React, { useEffect, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Avatar, Text, Button, TextInput, ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function ProfileScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  // Fetch profile on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }
        const res = await axios.get(`${process.env.EXPO_PUBLIC_API_BASE}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsername(res.data.username);
        setEmail(res.data.email);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUpdate = async () => {
    setUpdating(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
      await axios.put(
        `${process.env.EXPO_PUBLIC_API_BASE}/api/users/profile`,
        { username },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setError('Profile updated successfully!');
    } catch {
      setError('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Avatar.Icon icon="account" size={120} style={styles.avatar} />
      <Text variant="titleLarge" style={styles.emailText}>{email}</Text>

      <TextInput
        label="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        mode="outlined"
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button
        mode="contained"
        onPress={handleUpdate}
        loading={updating}
        disabled={updating}
        style={styles.button}
      >
        Update Profile
      </Button>

      <Button mode="outlined" onPress={handleLogout} style={styles.logoutButton}>
        Logout
      </Button>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center', backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatar: { marginBottom: 20 },
  emailText: { marginBottom: 20, fontSize: 16, color: '#666' },
  input: { width: '100%', marginBottom: 20 },
  button: { width: '100%', marginBottom: 10, backgroundColor: '#6200ee' },
  logoutButton: { width: '100%', backgroundColor: '#d32f2f' },
  errorText: { color: 'red', marginBottom: 10 },
});
