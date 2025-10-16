import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Appbar, List, Text, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TransactionHistoryScreen() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const saved = await AsyncStorage.getItem('history');
      if (saved) setHistory(JSON.parse(saved));
    };
    fetchHistory();
  }, []);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Transaction History" />
      </Appbar.Header>
      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text>No transactions found</Text>
        </View>
      ) : (
        <FlatList
          data={history.reverse()}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <>
              <List.Item
                title={item.type}
                description={`Details: ${JSON.stringify(item.details)}`}
                right={() => <Text>{new Date(item.details?.date).toLocaleString()}</Text>}
              />
              <Divider />
            </>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
