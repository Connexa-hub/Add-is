import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { AppText, AppDivider } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { API_BASE_URL } from '../constants/api';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  data?: any;
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { tokens } = useAppTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/notifications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      if (!refreshing) {
        Alert.alert('Error', 'Failed to load notifications. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error: any) {
      console.error('Failed to mark as read:', error);
      Alert.alert('Error', 'Failed to update notification status.');
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    } catch (error: any) {
      console.error('Failed to mark all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read.');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(
        `${API_BASE_URL}/api/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
    } catch (error: any) {
      console.error('Failed to delete notification:', error);
      Alert.alert('Error', 'Failed to delete notification. Please try again.');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'alert-circle';
      default:
        return 'information-circle';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return tokens.colors.success.main;
      case 'warning':
        return tokens.colors.warning.main;
      case 'error':
        return tokens.colors.error.main;
      default:
        return tokens.colors.info.main;
    }
  };

  const renderNotification = (notification: Notification) => (
    <Pressable
      key={notification._id}
      onPress={() => !notification.isRead && markAsRead(notification._id)}
      style={[
        styles.notificationCard,
        {
          backgroundColor: notification.isRead
            ? tokens.colors.background.paper
            : tokens.colors.primary.light + '30',
          borderRadius: tokens.radius.base,
          padding: tokens.spacing.md,
          marginBottom: tokens.spacing.sm,
          borderLeftWidth: 4,
          borderLeftColor: getNotificationColor(notification.type),
        },
      ]}
    >
      <View style={styles.notificationContent}>
        <View style={{ flex: 1 }}>
          <View style={styles.notificationHeader}>
            <Ionicons
              name={getNotificationIcon(notification.type) as any}
              size={20}
              color={getNotificationColor(notification.type)}
              style={{ marginRight: tokens.spacing.sm }}
            />
            <AppText variant="subtitle2" weight="semibold" style={{ flex: 1 }}>
              {notification.title}
            </AppText>
            {!notification.isRead && (
              <View
                style={[
                  styles.unreadBadge,
                  {
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: tokens.colors.primary.main,
                  },
                ]}
              />
            )}
          </View>
          <AppText variant="body2" style={{ color: tokens.colors.text.secondary, marginTop: tokens.spacing.xs }}>
            {notification.message}
          </AppText>
          <AppText variant="caption" style={{ color: tokens.colors.text.disabled, marginTop: tokens.spacing.xs }}>
            {new Date(notification.createdAt).toLocaleString()}
          </AppText>
        </View>
        <Pressable
          onPress={() => {
            Alert.alert(
              'Delete Notification',
              'Are you sure you want to delete this notification?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteNotification(notification._id) },
              ]
            );
          }}
          style={{ marginLeft: tokens.spacing.sm }}
        >
          <Ionicons name="trash-outline" size={20} color={tokens.colors.error.main} />
        </Pressable>
      </View>
    </Pressable>
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.background.default }]}>
      <View style={[styles.header, { paddingTop: tokens.spacing.xl, paddingHorizontal: tokens.spacing.lg }]}>
        <Pressable onPress={() => navigation.goBack()} style={{ marginRight: tokens.spacing.md }}>
          <Ionicons name="arrow-back" size={24} color={tokens.colors.text.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="h2" weight="bold">
            Notifications
          </AppText>
          {unreadCount > 0 && (
            <AppText variant="caption" style={{ color: tokens.colors.text.secondary }}>
              {unreadCount} unread
            </AppText>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable
            onPress={markAllAsRead}
            style={[
              {
                paddingHorizontal: tokens.spacing.md,
                paddingVertical: tokens.spacing.sm,
                borderRadius: tokens.radius.base,
              },
            ]}
          >
            <AppText variant="body2" weight="semibold" style={{ color: tokens.colors.primary.main }}>
              Mark all read
            </AppText>
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: tokens.spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={tokens.colors.primary.main} />
            <AppText variant="body2" style={{ color: tokens.colors.text.secondary, marginTop: tokens.spacing.md }}>
              Loading notifications...
            </AppText>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={tokens.colors.neutral.gray400} />
            <AppText variant="h3" weight="semibold" style={{ marginTop: tokens.spacing.lg }}>
              No Notifications
            </AppText>
            <AppText variant="body2" style={{ color: tokens.colors.text.secondary, marginTop: tokens.spacing.sm, textAlign: 'center' }}>
              You're all caught up! Check back later for new updates.
            </AppText>
          </View>
        ) : (
          <View>
            {notifications.map(renderNotification)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  notificationCard: {
    overflow: 'hidden',
  },
  notificationContent: {
    flexDirection: 'row',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadBadge: {
    marginLeft: 8,
  },
});
