import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { AppButton } from '../src/components/atoms';

export default function BiometricLoginScreen({ navigation }) {
  const { tokens } = useAppTheme();
  const [userName, setUserName] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    const getUserData = async () => {
      const name = await AsyncStorage.getItem('userName');
      const picture = await AsyncStorage.getItem('profilePicture');
      setUserName(name || 'User');
      setProfilePicture(picture);
    };
    getUserData();
    handleBiometricAuth();
  }, []);

  const handleBiometricAuth = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      Alert.alert('Biometrics not available');
      navigation.replace('Login');
      return;
    }

    const { success } = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Log in with your fingerprint',
    });

    if (success) {
      navigation.replace('Main');
    }
  };

  const renderAvatar = () => {
    if (profilePicture) {
      return <Image source={{ uri: profilePicture }} style={styles.avatar} />;
    }
    return (
      <View style={[styles.avatar, styles.avatarIcon]}>
        <Ionicons name="person" size={50} color={tokens.colors.text.secondary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tokens.colors.background.default }]}>
      <View style={styles.container}>
        {renderAvatar()}
        <Text style={styles.welcomeText}>Welcome back, {userName}</Text>
        <TouchableOpacity onPress={handleBiometricAuth} style={styles.fingerprintContainer}>
          <Ionicons name="finger-print" size={64} color={tokens.colors.primary.main} />
        </TouchableOpacity>
        <AppButton variant="ghost" onPress={() => navigation.replace('Login')}>
          Login with Password
        </AppButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  avatarIcon: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  fingerprintContainer: {
    padding: 20,
    borderRadius: 100,
    backgroundColor: '#f0f0f0',
    marginBottom: 20,
  },
});
