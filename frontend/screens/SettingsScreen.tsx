import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Switch, Text, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation }: any) {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Load settings from AsyncStorage if needed
    (async () => {
      const bio = await AsyncStorage.getItem('biometricEnabled');
      const dark = await AsyncStorage.getItem('darkMode');
      if (bio !== null) setBiometricEnabled(bio === 'true');
      if (dark !== null) setDarkMode(dark === 'true');
    })();
  }, []);

  const toggleBiometric = async () => {
    const newVal = !biometricEnabled;
    setBiometricEnabled(newVal);
    await AsyncStorage.setItem('biometricEnabled', newVal.toString());
  };

  const toggleDarkMode = async () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    await AsyncStorage.setItem('darkMode', newVal.toString());
    // You can extend this to update app theme context or state
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={styles.container}>
      <View style={styles.settingRow}>
        <Text>Enable Biometric Login</Text>
        <Switch value={biometricEnabled} onValueChange={toggleBiometric} />
      </View>
      <View style={styles.settingRow}>
        <Text>Enable Dark Mode</Text>
        <Switch value={darkMode} onValueChange={toggleDarkMode} />
      </View>
      <Button mode="contained" onPress={handleLogout} style={styles.logoutButton}>
        Logout
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logoutButton: { marginTop: 40, backgroundColor: '#d32f2f' },
});
