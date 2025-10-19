import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../../screens/LoginScreen';
import RegisterScreen from '../../screens/RegisterScreen';
import ForgotPasswordScreen from '../../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../../screens/ResetPasswordScreen';
import EmailVerificationScreen from '../../screens/EmailVerificationScreen';

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
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
        {/* Auth flow */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

        {/* Main App */}
        <Stack.Screen name="Main" component={MainTabs} />

        {/* Service Screens */}
        <Stack.Screen name="Airtime" component={AirtimeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Data" component={DataScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TV" component={TVScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Electricity" component={ElectricityScreen} options={{ headerShown: false }} />
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

        {/* Admin Screens */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}