import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, Text, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { BannerCarousel } from '../src/components/molecules';

export default function BettingScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#FFFFFF" />
        <Appbar.Content title="Betting Services" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <BannerCarousel section="betting" />

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Ionicons name="trophy" size={64} color="#0984E3" />
            <Text style={styles.title}>Betting Services</Text>
            <Text style={styles.subtitle}>Coming Soon!</Text>
            <Text style={styles.description}>
              Fund your betting accounts easily. Bet9ja, Sportybet, 1xBet and more 
              will be available here soon!
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#0984E3',
    elevation: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  card: {
    margin: 20,
    borderRadius: 16,
    elevation: 3,
  },
  cardContent: {
    alignItems: 'center',
    padding: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 18,
    color: '#0984E3',
    marginTop: 8,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
});
