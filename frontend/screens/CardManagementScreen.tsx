import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Appbar, Card, Text, Button, IconButton, Portal, Modal, TextInput, Divider, Chip } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../constants/api';

interface SavedCard {
  cardId: string;
  last4: string;
  brand: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName?: string;
  isDefault: boolean;
  createdAt: string;
}

interface RevealedCard extends SavedCard {
  maskedPAN: string;
  bin?: string;
}

export default function CardManagementScreen({ navigation }) {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [revealModalVisible, setRevealModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [revealedCardData, setRevealedCardData] = useState<RevealedCard | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/cards`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setCards(data.data);
      } else {
        Alert.alert('Error', data.message || 'Failed to load cards');
      }
    } catch (error) {
      console.error('Error loading cards:', error);
      Alert.alert('Error', 'Failed to load saved cards');
    } finally {
      setLoading(false);
    }
  };

  const getCardIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    switch (brandLower) {
      case 'visa':
        return 'card';
      case 'mastercard':
        return 'card-outline';
      case 'verve':
        return 'card';
      default:
        return 'card';
    }
  };

  const getCardColor = (brand: string) => {
    const brandLower = brand.toLowerCase();
    switch (brandLower) {
      case 'visa':
        return '#1A1F71';
      case 'mastercard':
        return '#EB001B';
      case 'verve':
        return '#F05A28';
      default:
        return '#6200ee';
    }
  };

  const handleSetDefault = async (cardId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/cards/${cardId}/default`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Default card updated');
        loadCards();
      } else {
        Alert.alert('Error', data.message || 'Failed to set default card');
      }
    } catch (error) {
      console.error('Error setting default card:', error);
      Alert.alert('Error', 'Failed to set default card');
    }
  };

  const handleDeleteCard = (cardId: string) => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to delete this card? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteCard(cardId),
        },
      ]
    );
  };

  const confirmDeleteCard = async (cardId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-transaction-pin': pin,
        },
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Card deleted successfully');
        loadCards();
      } else {
        if (data.message.includes('PIN')) {
          Alert.alert('PIN Required', 'Please enter your transaction PIN to delete this card', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Enter PIN',
              onPress: () => {
                setSelectedCard(cardId);
                setPinModalVisible(true);
              },
            },
          ]);
        } else {
          Alert.alert('Error', data.message || 'Failed to delete card');
        }
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      Alert.alert('Error', 'Failed to delete card');
    }
  };

  const handleRevealCard = (cardId: string) => {
    setSelectedCard(cardId);
    setPinModalVisible(true);
  };

  const verifyPinAndReveal = async () => {
    if (!pin || pin.length < 4) {
      Alert.alert('Invalid PIN', 'Please enter your transaction PIN');
      return;
    }

    try {
      setPinLoading(true);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/cards/${selectedCard}/reveal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-transaction-pin': pin,
        },
      });

      const data = await response.json();

      if (data.success) {
        setRevealedCardData(data.data);
        setPinModalVisible(false);
        setRevealModalVisible(true);
        setPin('');
      } else {
        Alert.alert('Error', data.message || 'Failed to verify PIN');
      }
    } catch (error) {
      console.error('Error revealing card:', error);
      Alert.alert('Error', 'Failed to reveal card details');
    } finally {
      setPinLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Saved Cards" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Loading your cards...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Saved Cards" />
        <Appbar.Action icon="refresh" onPress={loadCards} />
      </Appbar.Header>

      <ScrollView style={styles.scrollView}>
        {cards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No saved cards</Text>
            <Text style={styles.emptySubtext}>
              Cards you save during payment will appear here
            </Text>
          </View>
        ) : (
          cards.map((card) => (
            <Card key={card.cardId} style={styles.cardContainer}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.cardBrandRow}>
                    <Ionicons
                      name={getCardIcon(card.brand)}
                      size={24}
                      color={getCardColor(card.brand)}
                    />
                    <Text style={styles.cardBrand}>{card.brand.toUpperCase()}</Text>
                    {card.isDefault && (
                      <Chip icon="star" style={styles.defaultChip} textStyle={styles.defaultChipText}>
                        Default
                      </Chip>
                    )}
                  </View>
                </View>

                <Text style={styles.cardNumber}>
                  **** **** **** {card.last4}
                </Text>

                <View style={styles.cardDetails}>
                  <Text style={styles.cardLabel}>Expires</Text>
                  <Text style={styles.cardExpiry}>
                    {card.expiryMonth}/{card.expiryYear}
                  </Text>
                </View>

                {card.cardholderName && (
                  <Text style={styles.cardholderName}>{card.cardholderName}</Text>
                )}

                <Divider style={styles.divider} />

                <View style={styles.cardActions}>
                  {!card.isDefault && (
                    <Button
                      mode="outlined"
                      onPress={() => handleSetDefault(card.cardId)}
                      style={styles.actionButton}
                      compact
                    >
                      Set as Default
                    </Button>
                  )}
                  
                  <Button
                    mode="outlined"
                    onPress={() => handleRevealCard(card.cardId)}
                    style={styles.actionButton}
                    compact
                    icon="eye"
                  >
                    Reveal
                  </Button>
                  
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor="#d32f2f"
                    onPress={() => handleDeleteCard(card.cardId)}
                  />
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={pinModalVisible}
          onDismiss={() => {
            setPinModalVisible(false);
            setPin('');
          }}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Enter Transaction PIN</Text>
          <Text style={styles.modalSubtitle}>
            Enter your PIN to reveal card details
          </Text>
          
          <TextInput
            label="Transaction PIN"
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            keyboardType="numeric"
            maxLength={6}
            mode="outlined"
            style={styles.pinInput}
            autoFocus
          />
          
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => {
                setPinModalVisible(false);
                setPin('');
              }}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            
            <Button
              mode="contained"
              onPress={verifyPinAndReveal}
              style={styles.modalButton}
              loading={pinLoading}
              disabled={pinLoading}
            >
              Verify
            </Button>
          </View>
        </Modal>

        <Modal
          visible={revealModalVisible}
          onDismiss={() => {
            setRevealModalVisible(false);
            setRevealedCardData(null);
          }}
          contentContainerStyle={styles.revealModalContainer}
        >
          {revealedCardData && (
            <>
              <View style={styles.revealHeader}>
                <Text style={styles.revealTitle}>Card Details</Text>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={() => {
                    setRevealModalVisible(false);
                    setRevealedCardData(null);
                  }}
                />
              </View>

              <View style={styles.revealCard}>
                <View style={styles.revealBrandRow}>
                  <Ionicons
                    name={getCardIcon(revealedCardData.brand)}
                    size={32}
                    color={getCardColor(revealedCardData.brand)}
                  />
                  <Text style={styles.revealBrand}>
                    {revealedCardData.brand.toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.revealCardNumber}>
                  {revealedCardData.maskedPAN}
                </Text>

                <View style={styles.revealDetailsRow}>
                  <View>
                    <Text style={styles.revealLabel}>EXPIRES</Text>
                    <Text style={styles.revealValue}>
                      {revealedCardData.expiryMonth}/{revealedCardData.expiryYear}
                    </Text>
                  </View>
                  
                  {revealedCardData.bin && (
                    <View>
                      <Text style={styles.revealLabel}>BIN</Text>
                      <Text style={styles.revealValue}>{revealedCardData.bin}</Text>
                    </View>
                  )}
                </View>

                {revealedCardData.cardholderName && (
                  <Text style={styles.revealCardholderName}>
                    {revealedCardData.cardholderName}
                  </Text>
                )}
              </View>

              <Text style={styles.revealWarning}>
                ⚠️ Never share your card details with anyone
              </Text>
            </>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  cardContainer: {
    margin: 16,
    marginBottom: 0,
    elevation: 3,
    borderRadius: 12,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  defaultChip: {
    marginLeft: 'auto',
    backgroundColor: '#4caf50',
  },
  defaultChipText: {
    color: '#fff',
    fontSize: 11,
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    letterSpacing: 2,
    marginVertical: 8,
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  cardExpiry: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  cardholderName: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  divider: {
    marginVertical: 16,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    marginRight: 8,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  pinInput: {
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  revealModalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  revealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  revealTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  revealCard: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  revealBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  revealBrand: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  revealCardNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    letterSpacing: 4,
    marginBottom: 20,
  },
  revealDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  revealLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  revealValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  revealCardholderName: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textTransform: 'uppercase',
  },
  revealWarning: {
    fontSize: 12,
    color: '#d32f2f',
    textAlign: 'center',
  },
});
