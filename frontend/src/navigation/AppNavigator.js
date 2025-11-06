import React, { useState, useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/api';
import { tokenService } from '../../utils/tokenService';

import OnboardingScreen from '../../screens/OnboardingScreen';
import LoginScreen from '../../screens/LoginScreen';
import RegisterScreen from '../../screens/RegisterScreen';
import ForgotPasswordScreen from '../../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../../screens/ResetPasswordScreen';
import EmailVerificationScreen from '../../screens/EmailVerificationScreen';
import InitialSetupScreen from '../../screens/InitialSetupScreen';

import HomeScreen from '../../screens/HomeScreen';
import WalletFundingScreen from '../../screens/WalletFundingScreen';
import TransactionHistoryScreen from '../../screens/TransactionHistoryScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import SettingsScreen from '../../screens/SettingsScreen';
import DataScreen from '../../screens/DataScreen';
import TVScreen from '../../screens/TVScreen';
import ElectricityScreen from '../../screens/ElectricityScreen';
import AirtimeScreen from '../../screens/AirtimeScreen';
import AdminDashboardScreen from '../../screens/AdminDashboardScreen';
import AdminUsersScreen from '../../screens/AdminUsersScreen';
import CardManagementScreen from '../../screens/CardManagementScreen';

import KYCPersonalInfoScreen from '../../screens/KYCPersonalInfoScreen';
import KYCDocumentsScreen from '../../screens/KYCDocumentsScreen';
import KYCSelfieScreen from '../../screens/KYCSelfieScreen';
import KYCReviewScreen from '../../screens/KYCReviewScreen';

import PINSetupScreen from '../../screens/PINSetupScreen';
import PINVerifyScreen from '../../screens/PINVerifyScreen';
import PINChangeScreen from '../../screens/PINChangeScreen';
import PINForgotScreen from '../../screens/PINForgotScreen';

import InternetScreen from '../../screens/InternetScreen';
import EducationScreen from '../../screens/EducationScreen';
import BettingScreen from '../../screens/BettingScreen';
import InsuranceScreen from '../../screens/InsuranceScreen';

import SupportScreen from '../../screens/SupportScreen';
import NotificationsScreen from '../../screens/NotificationsScreen';
import DeleteAccountScreen from '../../screens/DeleteAccountScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Wallet') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Wallet" component={WalletFundingScreen} />
      <Tab.Screen name="History" component={TransactionHistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const hasCheckedAuth = useRef(false);

  // Preload onboarding slides during splash
  const preloadOnboardingSlides = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/onboarding`, {
        timeout: 3000 // 3 second timeout
      });

      if (response.data.success && response.data.data.length > 0) {
        const sortedSlides = response.data.data.sort((a, b) => a.order - b.order);
        await AsyncStorage.setItem('onboarding_slides', JSON.stringify(sortedSlides));
        await AsyncStorage.setItem('onboarding_last_fetch', Date.now().toString());
        console.log('✅ Onboarding slides preloaded successfully');
      }
    } catch (error) {
      console.log('Onboarding preload skipped:', error.message);
      // Don't block app loading if onboarding fetch fails
    }
  };

  useEffect(() => {
    async function checkAuth() {
      if (hasCheckedAuth.current) return;
      hasCheckedAuth.current = true;

      try {
        // Preload onboarding slides immediately
        preloadOnboardingSlides();

        const hasSeenOnboarding = await AsyncStorage.getItem('onboarding_completed');
        const hasCompletedInitialSetup = await AsyncStorage.getItem('initialSetupComplete');

        // Check token from both sources
        const secureToken = await tokenService.getToken();
        const asyncToken = await AsyncStorage.getItem('token');
        const token = secureToken || asyncToken;

        console.log('Navigator auth check:', {
          hasOnboarded: !!hasSeenOnboarding,
          hasToken: !!token,
          hasCompletedInitialSetup: !!hasCompletedInitialSetup,
          tokenSource: secureToken ? 'SecureStore' : (asyncToken ? 'AsyncStorage' : 'none')
        });

        if (!hasSeenOnboarding) {
          console.log('→ Route: Onboarding (first time user)');
          setInitialRoute('Onboarding');
        } else if (!hasCompletedInitialSetup && token) {
          // If user has token but not completed setup, redirect to setup
          console.log('→ Route: InitialSetup (has token, no setup)');
          setInitialRoute('InitialSetup');
        } else if (token) {
          // Check if session timed out
          const hasTimedOut = await checkSessionTimeout(token);

          if (hasTimedOut) {
            console.log('→ Route: Login (session timeout)');
            await tokenService.clearToken();
            await AsyncStorage.multiRemove(['token', 'userId', 'userEmail', 'userName', 'lastActivityTime']);
            setInitialRoute('Login');
          } else {
            // Try to validate token - BUT don't auto-navigate to Main
            // Let LoginScreen handle biometric authentication
            try {
              const isValid = await validateToken(token);
              if (isValid) {
                // Update last activity time
                await AsyncStorage.setItem('lastActivityTime', Date.now().toString());
                console.log('→ Route: Main (valid session)');
                setInitialRoute('Main');
              } else {
                console.log('→ Route: Login (invalid token)');
                await tokenService.clearToken();
                await AsyncStorage.multiRemove(['token', 'userId', 'userEmail', 'userName']);
                setInitialRoute('Login');
              }
            } catch (validationError) {
              // If validation fails due to network/rate limit, show login
              console.error('Token validation error:', validationError);
              console.log('→ Route: Login (validation error)');
              setInitialRoute('Login');
            }
          }
        } else {
          console.log('→ Route: Login (no token)');
          setInitialRoute('Login');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setInitialRoute('Login');
      } finally {
        setIsReady(true);
      }
    }

    checkAuth();
  }, []);

  const validateToken = async (token) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 200) {
        const data = await response.json();
        return data.success && data.data ? true : false;
      }

      console.log('Token validation failed - Status:', response.status);
      return false;
    } catch (error) {
      console.log('Token validation error:', error.message);
      return false;
    }
  };

  const checkSessionTimeout = async (token) => {
    try {
      const autoLogoutEnabled = await AsyncStorage.getItem('autoLogoutEnabled');
      if (autoLogoutEnabled !== 'true') {
        return false; // Session timeout disabled
      }

      const lastActivityTime = await AsyncStorage.getItem('lastActivityTime');
      const sessionTimeout = await AsyncStorage.getItem('sessionTimeout') || '15';

      if (!lastActivityTime) {
        await AsyncStorage.setItem('lastActivityTime', Date.now().toString());
        return false;
      }

      const timeoutMs = parseInt(sessionTimeout) * 60 * 1000;
      const elapsed = Date.now() - parseInt(lastActivityTime);

      return elapsed > timeoutMs;
    } catch (error) {
      console.error('Error checking session timeout:', error);
      return false;
    }
  };

  if (!isReady) {
    // Return null to let native splash screen continue showing
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        {/* Onboarding */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />

        {/* Auth flow */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="InitialSetup" component={InitialSetupScreen} options={{ headerShown: false }} />

        {/* Main App */}
        <Stack.Screen name="Main" component={MainTabs} />

        {/* Service Screens */}
        <Stack.Screen name="Airtime" component={AirtimeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Data" component={DataScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TV" component={TVScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Electricity" component={ElectricityScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Internet" component={InternetScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Education" component={EducationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Betting" component={BettingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Insurance" component={InsuranceScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="CardManagement" component={CardManagementScreen} options={{ headerShown: false }} />

        {/* KYC Screens */}
        <Stack.Screen name="KYCPersonalInfo" component={KYCPersonalInfoScreen} options={{ headerShown: false }} />
        <Stack.Screen name="KYCDocuments" component={KYCDocumentsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="KYCSelfie" component={KYCSelfieScreen} options={{ headerShown: false }} />
        <Stack.Screen name="KYCReview" component={KYCReviewScreen} options={{ headerShown: false }} />

        {/* PIN Screens */}
        <Stack.Screen name="PINSetup" component={PINSetupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PINVerify" component={PINVerifyScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PINChange" component={PINChangeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PINForgot" component={PINForgotScreen} options={{ headerShown: false }} />

        {/* Admin Screens */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />

        {/* Support & Notifications */}
        <Stack.Screen name="Support" component={SupportScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} options={{ headerShown: false }} />

        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="WalletFunding" component={WalletFundingScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}