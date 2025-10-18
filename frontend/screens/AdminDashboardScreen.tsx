
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Dimensions } from 'react-native';
import { AppText, AppButton } from '../src/components/atoms';
import { tokens } from '../src/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen({ navigation }: any) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={[styles.statCard, { backgroundColor: tokens.colors.background.paper }]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <AppText variant="h3" weight="bold" style={{ marginTop: tokens.spacing.md }}>
        {value}
      </AppText>
      <AppText variant="body2" color={tokens.colors.text.secondary}>
        {title}
      </AppText>
    </View>
  );

  const MenuButton = ({ title, icon, onPress, color }: any) => (
    <AppButton
      mode="outlined"
      onPress={onPress}
      style={[styles.menuButton, { borderColor: color }]}
      leftIcon={<Ionicons name={icon} size={20} color={color} />}
    >
      <AppText weight="semibold" color={color}>{title}</AppText>
    </AppButton>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <AppText>Loading dashboard...</AppText>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <AppText variant="h1" weight="bold">Admin Control</AppText>
        <AppText variant="body2" color={tokens.colors.text.secondary}>
          System Management Dashboard
        </AppText>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon="people"
          color={tokens.colors.primary.main}
        />
        <StatCard
          title="Active Users"
          value={stats?.activeUsers || 0}
          icon="person-circle"
          color={tokens.colors.success.main}
        />
        <StatCard
          title="Today's Transactions"
          value={stats?.todayTransactions || 0}
          icon="swap-horizontal"
          color={tokens.colors.info.main}
        />
        <StatCard
          title="Today's Revenue"
          value={`₦${(stats?.todayRevenue || 0).toLocaleString()}`}
          icon="cash"
          color={tokens.colors.warning.main}
        />
      </View>

      <View style={styles.section}>
        <AppText variant="h2" weight="semibold" style={{ marginBottom: tokens.spacing.md }}>
          Quick Actions
        </AppText>
        
        <MenuButton
          title="Manage Users"
          icon="people-outline"
          color={tokens.colors.primary.main}
          onPress={() => navigation.navigate('AdminUsers')}
        />
        <MenuButton
          title="View Transactions"
          icon="receipt-outline"
          color={tokens.colors.info.main}
          onPress={() => navigation.navigate('AdminTransactions')}
        />
        <MenuButton
          title="Send Broadcast"
          icon="notifications-outline"
          color={tokens.colors.warning.main}
          onPress={() => navigation.navigate('AdminBroadcast')}
        />
        <MenuButton
          title="Analytics"
          icon="stats-chart-outline"
          color={tokens.colors.success.main}
          onPress={() => navigation.navigate('AdminAnalytics')}
        />
      </View>

      <View style={styles.revenueSection}>
        <AppText variant="h2" weight="semibold" style={{ marginBottom: tokens.spacing.md }}>
          Revenue Overview
        </AppText>
        <View style={[styles.revenueCard, { backgroundColor: tokens.colors.primary.main }]}>
          <AppText variant="body2" style={{ color: '#fff', opacity: 0.9 }}>
            Total Revenue
          </AppText>
          <AppText variant="h1" weight="bold" style={{ color: '#fff', marginTop: tokens.spacing.sm }}>
            ₦{(stats?.totalRevenue || 0).toLocaleString()}
          </AppText>
          <AppText variant="caption" style={{ color: '#fff', opacity: 0.8, marginTop: tokens.spacing.xs }}>
            All time transactions
          </AppText>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.default,
    padding: tokens.spacing.lg,
  },
  header: {
    marginBottom: tokens.spacing.xl,
    marginTop: tokens.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xl,
  },
  statCard: {
    width: (width - tokens.spacing.lg * 3) / 2,
    padding: tokens.spacing.lg,
    borderRadius: tokens.radius.lg,
    marginBottom: tokens.spacing.md,
    ...tokens.shadows.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: tokens.spacing.xl,
  },
  menuButton: {
    marginBottom: tokens.spacing.sm,
    justifyContent: 'flex-start',
  },
  revenueSection: {
    marginBottom: tokens.spacing.xl,
  },
  revenueCard: {
    padding: tokens.spacing.xl,
    borderRadius: tokens.radius.lg,
    ...tokens.shadows.lg,
  },
});
