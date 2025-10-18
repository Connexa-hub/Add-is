
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { AppText, AppButton, AppInput } from '../src/components/atoms';
import { tokens } from '../src/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';

export default function AdminUsersScreen({ navigation }: any) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/admin/users?page=${page}&search=${search}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const handleUserAction = (userId: string, action: string) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await fetch(`${API_BASE_URL}/admin/users/${userId}/${action}`, {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              fetchUsers();
            } catch (error) {
              console.error('Error:', error);
            }
          }
        }
      ]
    );
  };

  const UserCard = ({ user }: any) => (
    <View style={[styles.userCard, { backgroundColor: tokens.colors.background.paper }]}>
      <View style={styles.userHeader}>
        <View>
          <AppText variant="subtitle1" weight="semibold">{user.name}</AppText>
          <AppText variant="caption" color={tokens.colors.text.secondary}>{user.email}</AppText>
        </View>
        <View style={[
          styles.badge,
          { backgroundColor: user.isActive ? tokens.colors.success.light : tokens.colors.error.light }
        ]}>
          <AppText variant="caption" weight="semibold" color={user.isActive ? tokens.colors.success.main : tokens.colors.error.main}>
            {user.isActive ? 'Active' : 'Inactive'}
          </AppText>
        </View>
      </View>

      <View style={styles.userInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="wallet-outline" size={16} color={tokens.colors.text.secondary} />
          <AppText variant="body2" style={{ marginLeft: tokens.spacing.xs }}>
            ₦{user.walletBalance?.toLocaleString() || 0}
          </AppText>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="shield-outline" size={16} color={tokens.colors.text.secondary} />
          <AppText variant="body2" style={{ marginLeft: tokens.spacing.xs }}>
            {user.role}
          </AppText>
        </View>
      </View>

      <View style={styles.actions}>
        <AppButton
          mode="text"
          onPress={() => navigation.navigate('AdminUserDetails', { userId: user._id })}
          style={{ flex: 1 }}
        >
          <AppText color={tokens.colors.primary.main}>View Details</AppText>
        </AppButton>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={tokens.colors.text.primary} />
        </TouchableOpacity>
        <AppText variant="h2" weight="bold" style={{ marginLeft: tokens.spacing.md }}>
          Manage Users
        </AppText>
      </View>

      <View style={styles.searchContainer}>
        <AppInput
          placeholder="Search users..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Ionicons name="search" size={20} color={tokens.colors.text.secondary} />}
        />
      </View>

      <ScrollView style={styles.usersList}>
        {users.map((user: any) => (
          <UserCard key={user._id} user={user} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.default,
    padding: tokens.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
    marginTop: tokens.spacing.lg,
  },
  searchContainer: {
    marginBottom: tokens.spacing.lg,
  },
  usersList: {
    flex: 1,
  },
  userCard: {
    padding: tokens.spacing.lg,
    borderRadius: tokens.radius.lg,
    marginBottom: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.md,
  },
  badge: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.sm,
  },
  userInfo: {
    flexDirection: 'row',
    gap: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.default,
    paddingTop: tokens.spacing.md,
  },
});
