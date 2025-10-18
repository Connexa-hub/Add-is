import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

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
import AdminDashboardScreen from '../../screens/AdminDashboardScreen';
import AdminUsersScreen from '../../screens/AdminUsersScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
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
        <Stack.Screen name="Data" component={DataScreen} />
        <Stack.Screen name="TV" component={TVScreen} />
        <Stack.Screen name="Electricity" component={ElectricityScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        
        {/* Admin Screens */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
