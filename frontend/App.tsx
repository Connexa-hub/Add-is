import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme';
import { tokenService } from './utils/tokenService';
import { API_BASE_URL } from './constants/api';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.3))[0];

  useEffect(() => {
    async function prepare() {
      try {
        // Start logo animation
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }),
        ]).start();

        // Check if user account still exists (if logged in)
        await checkAccountStatus();

        // Preload fonts
        await Font.loadAsync({
          'SpaceMono-Regular': require('./assets/fonts/LilitaOne-Regular.ttf'),
        });

        // Keep splash visible for 3 seconds
        await new Promise((resolve) => setTimeout(resolve, 3000));

        setAppIsReady(true);

        // Fade out splash
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setShowSplash(false);
          SplashScreen.hideAsync();
        });
      } catch (e) {
        console.warn(e);
        setShowSplash(false);
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const checkAccountStatus = async () => {
    try {
      const token = await tokenService.getToken();
      
      if (token) {
        // Verify account still exists
        const response = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.data.success) {
          // Account doesn't exist, clear all data
          await clearAllUserData();
        }
      }
    } catch (error) {
      // If 401/404, account was deleted or token invalid
      if (error.response?.status === 401 || error.response?.status === 404) {
        console.log('Account no longer exists, clearing all data');
        await clearAllUserData();
      }
    }
  };

  const clearAllUserData = async () => {
    try {
      // Clear token service
      await tokenService.clearToken();

      // Clear all AsyncStorage data
      await AsyncStorage.multiRemove([
        'token',
        'userId',
        'userEmail',
        'userName',
        'biometricToken',
        'savedEmail',
        'biometricEnabled',
        'biometric_user_id',
        'sessionTimeout',
        'autoLogoutEnabled',
        'lastActivityTime',
        'initialSetupComplete',
      ]);

      console.log('All user data cleared - account was deleted');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  };

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <Image
            source={require('./assets/images/splash-icon.png')}
            style={styles.splashLogo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    );
  }

  if (!appIsReady) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <AppNavigator />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 150,
    height: 150,
  },
});