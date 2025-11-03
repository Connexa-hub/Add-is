import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { AppText, AppInput, AppButton, AppDivider } from '../src/components/atoms';
import { AppModal } from '../src/components/molecules';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { API_BASE_URL } from '../constants/api';
import { tokenService } from '../utils/tokenService';

interface Reply {
  userId: {
    _id: string;
    name: string;
    role: string;
  };
  message: string;
  isAdmin: boolean;
  createdAt: string;
}

interface Ticket {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  subject: string;
  message: string;
  category: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority?: string;
  replies?: Reply[];
  createdAt: string;
  updatedAt?: string;
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
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketDetails, setTicketDetails] = useState<Ticket | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: '',
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = await tokenService.getToken();
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/support/user`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setTickets(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch tickets:', error);
      if (!refreshing) {
        Alert.alert('Error', 'Failed to load support tickets. Please check your connection and try again.');
      }
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
    if (!formData.category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
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
      const token = await tokenService.getToken();
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/support`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShowNewTicketModal(false);
        setFormData({ subject: '', message: '', category: '' });
        fetchTickets();
        Alert.alert('Success', 'Your support ticket has been submitted. We will get back to you soon!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const token = await tokenService.getToken();
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/support/${ticketId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setTicketDetails(response.data.data);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error: any) {
      console.error('Failed to fetch ticket details:', error);
      Alert.alert('Error', 'Failed to load ticket details');
    }
  };

  const handleOpenChat = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowChatModal(true);
    await fetchTicketDetails(ticket._id);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !ticketDetails) return;

    setSendingReply(true);
    try {
      const token = await tokenService.getToken();
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/support/${ticketDetails._id}/reply`,
        { message: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setReplyText('');
        await fetchTicketDetails(ticketDetails._id);
        fetchTickets();
      }
    } catch (error: any) {
      console.error('Failed to send reply:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      onPress={() => handleOpenChat(ticket)}
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
              onChangeText={(text: string) => setFormData({ ...formData, subject: text })}
              placeholder="Brief description of your issue"
            />
          </View>

          <View style={{ marginBottom: tokens.spacing.lg }}>
            <AppText variant="subtitle2" weight="semibold" style={{ marginBottom: tokens.spacing.sm }}>
              Message
            </AppText>
            <AppInput
              value={formData.message}
              onChangeText={(text: string) => setFormData({ ...formData, message: text })}
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
        visible={showChatModal}
        onClose={() => {
          setShowChatModal(false);
          setTicketDetails(null);
          setReplyText('');
        }}
        title={selectedTicket?.subject || 'Support Chat'}
      >
        {ticketDetails ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, maxHeight: '80vh' as any }}
          >
            <View style={{ marginBottom: tokens.spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, flexWrap: 'wrap' }}>
                <View
                  style={{
                    backgroundColor: getStatusColor(ticketDetails.status) + '20',
                    paddingHorizontal: tokens.spacing.sm,
                    paddingVertical: tokens.spacing.xs,
                    borderRadius: tokens.radius.sm,
                  }}
                >
                  <AppText
                    variant="caption"
                    weight="semibold"
                    style={{ color: getStatusColor(ticketDetails.status), textTransform: 'capitalize' }}
                  >
                    {ticketDetails.status}
                  </AppText>
                </View>
                <AppText variant="caption" style={{ color: tokens.colors.text.secondary }}>
                  {ticketDetails.category}
                </AppText>
              </View>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1, marginBottom: tokens.spacing.md }}
              contentContainerStyle={{ paddingBottom: tokens.spacing.md }}
            >
              <View
                style={{
                  backgroundColor: tokens.colors.background.paper,
                  padding: tokens.spacing.md,
                  borderRadius: tokens.radius.base,
                  marginBottom: tokens.spacing.md,
                  ...tokens.shadows.xs,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: tokens.spacing.xs }}>
                  <AppText variant="subtitle2" weight="semibold" style={{ color: tokens.colors.primary.main }}>
                    You
                  </AppText>
                  <AppText variant="caption" style={{ color: tokens.colors.text.secondary }}>
                    {formatTime(ticketDetails.createdAt)}
                  </AppText>
                </View>
                <AppText variant="body2">{ticketDetails.message}</AppText>
              </View>

              {ticketDetails.replies && ticketDetails.replies.length > 0 && ticketDetails.replies.map((reply: Reply, index: number) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: reply.isAdmin ? tokens.colors.primary.light : tokens.colors.background.paper,
                    padding: tokens.spacing.md,
                    borderRadius: tokens.radius.base,
                    marginBottom: tokens.spacing.md,
                    alignSelf: reply.isAdmin ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    ...tokens.shadows.xs,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: tokens.spacing.xs }}>
                    <AppText
                      variant="subtitle2"
                      weight="semibold"
                      style={{ color: reply.isAdmin ? tokens.colors.primary.main : tokens.colors.text.primary }}
                    >
                      {reply.isAdmin ? 'Support Team' : (reply.userId?.name || 'You')}
                    </AppText>
                    <AppText variant="caption" style={{ color: tokens.colors.text.secondary, marginLeft: tokens.spacing.sm }}>
                      {formatTime(reply.createdAt)}
                    </AppText>
                  </View>
                  <AppText variant="body2">{reply.message}</AppText>
                </View>
              ))}
            </ScrollView>

            <View style={{ borderTopWidth: 1, borderTopColor: tokens.colors.border.default, paddingTop: tokens.spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: tokens.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <AppInput
                    value={replyText}
                    onChangeText={setReplyText}
                    placeholder="Type your message..."
                    multiline
                    numberOfLines={2}
                    style={{ minHeight: 60, textAlignVertical: 'top' }}
                  />
                </View>
                <Pressable
                  onPress={handleSendReply}
                  disabled={!replyText.trim() || sendingReply}
                  style={{
                    backgroundColor: !replyText.trim() || sendingReply ? tokens.colors.neutral.gray300 : tokens.colors.primary.main,
                    padding: tokens.spacing.md,
                    borderRadius: tokens.radius.base,
                    justifyContent: 'center',
                    alignItems: 'center',
                    minWidth: 50,
                    minHeight: 50,
                  }}
                >
                  {sendingReply ? (
                    <ActivityIndicator size="small" color={tokens.colors.white} />
                  ) : (
                    <Ionicons name="send" size={20} color={tokens.colors.white} />
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        ) : (
          <View style={{ padding: tokens.spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={tokens.colors.primary.main} />
            <AppText variant="body2" style={{ color: tokens.colors.text.secondary, marginTop: tokens.spacing.md }}>
              Loading conversation...
            </AppText>
          </View>
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