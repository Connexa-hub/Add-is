// src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Welcome to Addis</Text>

      <View style={styles.serviceRow}>
        <TouchableOpacity onPress={() => navigation.navigate('BuyData')}>
          <Text style={styles.card}>Buy Data</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('SubscribeTV')}>
          <Text style={styles.card}>TV Subscription</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.profileBtn}>My Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { backgroundColor: '#007bff', padding: 20, borderRadius: 10, color: '#fff' },
  profileBtn: { marginTop: 20, textAlign: 'center', color: 'blue' }
});
