import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Appbar, List, Text, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../src/hooks/useAppTheme';

export default function TransactionHistoryScreen() {
  const { tokens } = useAppTheme();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const saved = await AsyncStorage.getItem('history');
      if (saved) setHistory(JSON.parse(saved));
    };
    fetchHistory();
  }, []);

  const styles = createStyles(tokens);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Transaction History" titleStyle={{ color: tokens.colors.white }} />
      </Appbar.Header>
      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No transactions found</Text>
        </View>
      ) : (
        <FlatList
          data={history.reverse()}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <>
              <List.Item
                title={item.type}
                titleStyle={{ color: tokens.colors.text.primary }}
                description={`Details: ${JSON.stringify(item.details)}`}
                descriptionStyle={{ color: tokens.colors.text.secondary }}
                right={() => <Text style={styles.dateText}>{new Date(item.details?.date).toLocaleString()}</Text>}
              />
              <Divider style={styles.divider} />
            </>
          )}
        />
      )}
    </View>
  );
}

const createStyles = (tokens: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: tokens.colors.background.default 
  },
  header: {
    backgroundColor: tokens.colors.primary.main,
    elevation: 0,
  },
  empty: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emptyText: {
    color: tokens.colors.text.secondary,
    fontSize: 16,
  },
  dateText: {
    color: tokens.colors.text.secondary,
    fontSize: 12,
  },
  divider: {
    backgroundColor: tokens.colors.border.default,
  },
});
