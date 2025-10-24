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
import { AppText, AppInput, AppButton, AppDivider } from '../src/components/atoms';
import { AppModal } from '../src/components/molecules';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { API_BASE_URL } from '../constants/api';

interface Ticket {
  _id: string;
  subject: string;
  message: string;
  category: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  response?: string;
  createdAt: string;
  resolvedAt?: string;
}

const CATEGORIES = [
  { id: 'payment', label: 'Payment Issue', icon: 'card' },
  { id: 'transaction', label: 'Transaction Failed', icon: 'swap-horizontal' },
  { id: 'account', label: 'Account Problem', icon: 'person' },
  { id: 'technical', label: 'Technical Issue', icon: 'bug' },
  { id: 'general', label: 'General Inquiry', icon: 'help-circle' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export default function SupportScreen() {
  const navigation = useNavigation();
  const { tokens } = useAppTheme();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showTicketDetailModal, setShowTicketDetailModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'general',
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/support/user`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setTickets(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const handleSubmitTicket = async () => {
    if (!formData.subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }
    if (!formData.message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/support`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Your support ticket has been submitted. We will get back to you soon!');
        setShowNewTicketModal(false);
        setFormData({ subject: '', message: '', category: 'general' });
        fetchTickets();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return tokens.colors.info.main;
      case 'in-progress':
        return tokens.colors.warning.main;
      case 'resolved':
        return tokens.colors.success.main;
      case 'closed':
        return tokens.colors.neutral.gray500;
      default:
        return tokens.colors.neutral.gray500;
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.id === category);
    return cat ? cat.icon : 'help-circle';
  };

  const renderTicketCard = (ticket: Ticket) => (
    <Pressable
      key={ticket._id}
      onPress={() => {
        setSelectedTicket(ticket);
        setShowTicketDetailModal(true);
      }}
      style={[
        styles.ticketCard,
        {
          backgroundColor: tokens.colors.background.paper,
          borderRadius: tokens.radius.lg,
          padding: tokens.spacing.lg,
          marginBottom: tokens.spacing.md,
          ...tokens.shadows.sm,
        },
      ]}
    >
      <View style={styles.ticketHeader}>
        <View style={{ flex: 1 }}>
          <AppText variant="h3" weight="semibold" numberOfLines={1}>
            {ticket.subject}
          </AppText>
          <View style={styles.ticketMeta}>
            <Ionicons name={getCategoryIcon(ticket.category) as any} size={14} color={tokens.colors.text.secondary} />
            <AppText variant="caption" style={{ color: tokens.colors.text.secondary, marginLeft: 4 }}>
              {ticket.category}
            </AppText>
            <AppText variant="caption" style={{ color: tokens.colors.text.secondary, marginLeft: 12 }}>
              {new Date(ticket.createdAt).toLocaleDateString()}
            </AppText>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: getStatusColor(ticket.status) + '20',
              paddingHorizontal: tokens.spacing.sm,
              paddingVertical: tokens.spacing.xs,
              borderRadius: tokens.radius.sm,
            },
          ]}
        >
          <AppText
            variant="caption"
            weight="semibold"
            style={{ color: getStatusColor(ticket.status), textTransform: 'capitalize' }}
          >
            {ticket.status}
          </AppText>
        </View>
      </View>
      <AppText variant="body2" numberOfLines={2} style={{ color: tokens.colors.text.secondary, marginTop: tokens.spacing.sm }}>
        {ticket.message}
      </AppText>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.background.default }]}>
      <View style={[styles.header, { paddingTop: tokens.spacing.xl, paddingHorizontal: tokens.spacing.lg }]}>
        <Pressable onPress={() => navigation.goBack()} style={{ marginRight: tokens.spacing.md }}>
          <Ionicons name="arrow-back" size={24} color={tokens.colors.text.primary} />
        </Pressable>
        <AppText variant="h2" weight="bold" style={{ flex: 1 }}>
          Support
        </AppText>
        <Pressable
          onPress={() => setShowNewTicketModal(true)}
          style={[
            {
              backgroundColor: tokens.colors.primary.main,
              paddingHorizontal: tokens.spacing.md,
              paddingVertical: tokens.spacing.sm,
              borderRadius: tokens.radius.base,
            },
          ]}
        >
          <Ionicons name="add" size={20} color={tokens.colors.white} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: tokens.spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={tokens.colors.primary.main} />
            <AppText variant="body2" style={{ color: tokens.colors.text.secondary, marginTop: tokens.spacing.md }}>
              Loading tickets...
            </AppText>
          </View>
        ) : tickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={tokens.colors.neutral.gray400} />
            <AppText variant="h3" weight="semibold" style={{ marginTop: tokens.spacing.lg }}>
              No Support Tickets
            </AppText>
            <AppText variant="body2" style={{ color: tokens.colors.text.secondary, marginTop: tokens.spacing.sm, textAlign: 'center' }}>
              You haven't submitted any support tickets yet.{'\n'}Tap the + button to create one.
            </AppText>
          </View>
        ) : (
          tickets.map(renderTicketCard)
        )}
      </ScrollView>

      <AppModal visible={showNewTicketModal} onClose={() => setShowNewTicketModal(false)} title="New Support Ticket">
        <ScrollView>
          <View style={{ marginBottom: tokens.spacing.base }}>
            <AppText variant="subtitle2" weight="semibold" style={{ marginBottom: tokens.spacing.sm }}>
              Category
            </AppText>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setFormData({ ...formData, category: cat.id })}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor:
                        formData.category === cat.id ? tokens.colors.primary.light : tokens.colors.background.paper,
                      borderWidth: 1,
                      borderColor:
                        formData.category === cat.id ? tokens.colors.primary.main : tokens.colors.border.default,
                      borderRadius: tokens.radius.base,
                      padding: tokens.spacing.sm,
                    },
                  ]}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={20}
                    color={formData.category === cat.id ? tokens.colors.primary.main : tokens.colors.text.secondary}
                  />
                  <AppText
                    variant="caption"
                    weight={formData.category === cat.id ? 'semibold' : 'regular'}
                    style={{
                      color: formData.category === cat.id ? tokens.colors.primary.main : tokens.colors.text.secondary,
                      marginTop: tokens.spacing.xs,
                      textAlign: 'center',
                    }}
                  >
                    {cat.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: tokens.spacing.base }}>
            <AppText variant="subtitle2" weight="semibold" style={{ marginBottom: tokens.spacing.sm }}>
              Subject
            </AppText>
            <AppInput
              value={formData.subject}
              onChangeText={(text) => setFormData({ ...formData, subject: text })}
              placeholder="Brief description of your issue"
            />
          </View>

          <View style={{ marginBottom: tokens.spacing.lg }}>
            <AppText variant="subtitle2" weight="semibold" style={{ marginBottom: tokens.spacing.sm }}>
              Message
            </AppText>
            <AppInput
              value={formData.message}
              onChangeText={(text) => setFormData({ ...formData, message: text })}
              placeholder="Provide detailed information about your issue"
              multiline
              numberOfLines={6}
              style={{ minHeight: 120, textAlignVertical: 'top' }}
            />
          </View>

          <AppButton onPress={handleSubmitTicket} loading={submitting}>
            Submit Ticket
          </AppButton>
        </ScrollView>
      </AppModal>

      <AppModal
        visible={showTicketDetailModal}
        onClose={() => setShowTicketDetailModal(false)}
        title="Ticket Details"
      >
        {selectedTicket && (
          <ScrollView>
            <View style={{ marginBottom: tokens.spacing.md }}>
              <AppText variant="caption" style={{ color: tokens.colors.text.secondary, marginBottom: tokens.spacing.xs }}>
                Status
              </AppText>
              <View
                style={[
                  {
                    backgroundColor: getStatusColor(selectedTicket.status) + '20',
                    paddingHorizontal: tokens.spacing.md,
                    paddingVertical: tokens.spacing.sm,
                    borderRadius: tokens.radius.base,
                    alignSelf: 'flex-start',
                  },
                ]}
              >
                <AppText variant="body2" weight="semibold" style={{ color: getStatusColor(selectedTicket.status), textTransform: 'capitalize' }}>
                  {selectedTicket.status}
                </AppText>
              </View>
            </View>

            <AppDivider />

            <View style={{ marginTop: tokens.spacing.md, marginBottom: tokens.spacing.md }}>
              <AppText variant="caption" style={{ color: tokens.colors.text.secondary, marginBottom: tokens.spacing.xs }}>
                Subject
              </AppText>
              <AppText variant="h3" weight="semibold">
                {selectedTicket.subject}
              </AppText>
            </View>

            <View style={{ marginBottom: tokens.spacing.md }}>
              <AppText variant="caption" style={{ color: tokens.colors.text.secondary, marginBottom: tokens.spacing.xs }}>
                Category
              </AppText>
              <AppText variant="body2" style={{ textTransform: 'capitalize' }}>
                {selectedTicket.category}
              </AppText>
            </View>

            <View style={{ marginBottom: tokens.spacing.md }}>
              <AppText variant="caption" style={{ color: tokens.colors.text.secondary, marginBottom: tokens.spacing.xs }}>
                Created
              </AppText>
              <AppText variant="body2">
                {new Date(selectedTicket.createdAt).toLocaleString()}
              </AppText>
            </View>

            <AppDivider />

            <View style={{ marginTop: tokens.spacing.md, marginBottom: tokens.spacing.md }}>
              <AppText variant="subtitle2" weight="semibold" style={{ marginBottom: tokens.spacing.sm }}>
                Your Message
              </AppText>
              <AppText variant="body2" style={{ color: tokens.colors.text.secondary }}>
                {selectedTicket.message}
              </AppText>
            </View>

            {selectedTicket.response && (
              <>
                <AppDivider />
                <View
                  style={[
                    {
                      marginTop: tokens.spacing.md,
                      backgroundColor: tokens.colors.success.light,
                      padding: tokens.spacing.md,
                      borderRadius: tokens.radius.base,
                    },
                  ]}
                >
                  <AppText variant="subtitle2" weight="semibold" style={{ marginBottom: tokens.spacing.sm }}>
                    Support Response
                  </AppText>
                  <AppText variant="body2">{selectedTicket.response}</AppText>
                  {selectedTicket.resolvedAt && (
                    <AppText variant="caption" style={{ color: tokens.colors.text.secondary, marginTop: tokens.spacing.sm }}>
                      Resolved on {new Date(selectedTicket.resolvedAt).toLocaleString()}
                    </AppText>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        )}
      </AppModal>
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
  ticketCard: {
    overflow: 'hidden',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusBadge: {
    marginLeft: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryButton: {
    width: '31%',
    margin: 4,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
