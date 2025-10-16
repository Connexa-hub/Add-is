// File: /addis-app/frontend/screens/LoginScreen.js import React, { useState } from 'react'; import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native'; import AsyncStorage from '@react-native-async-storage/async-storage'; import axios from 'axios'; import { APP_URL } from '../utils/constants';

const LoginScreen = ({ navigation }) => { const [email, setEmail] = useState(''); const [password, setPassword] = useState('');

const handleLogin = async () => { try { const res = await axios.post(${APP_URL}/api/auth/login, { email, password }); await AsyncStorage.setItem('token', res.data.token); navigation.replace('Home'); } catch (err) { Alert.alert('Login Failed', err.response?.data?.message || err.message); } };

return ( <View style={styles.container}> <Text style={styles.header}>Login</Text> <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} /> <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} /> <Button title="Login" onPress={handleLogin} /> <Text style={styles.link} onPress={() => navigation.navigate('Register')}>Don't have an account? Register</Text> </View> ); };

export default LoginScreen;

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', padding: 20 }, header: { fontSize: 24, marginBottom: 20, fontWeight: 'bold' }, input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 10, padding: 10, borderRadius: 5 }, link: { color: 'blue', marginTop: 15, textAlign: 'center' } });

