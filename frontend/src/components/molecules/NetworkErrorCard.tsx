import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../atoms';
import { useAppTheme } from '../../hooks/useAppTheme';

export type NetworkErrorType = 'network_error' | 'timeout' | 'server_error';

export interface NetworkErrorCardProps {
  visible: boolean;
  message?: string;
  errorType?: NetworkErrorType;
  onRetry?: () => void;
  onDismiss?: () => void;
  position?: 'top' | 'bottom';
  autoDismiss?: boolean;
  autoDismissDelay?: number;
}

const { width } = Dimensions.get('window');

export const NetworkErrorCard: React.FC<NetworkErrorCardProps> = ({
  visible,
  message,
  errorType = 'network_error',
  onRetry,
  onDismiss,
  position = 'top',
  autoDismiss = false,
  autoDismissDelay = 5000,
}) => {
  const { tokens } = useAppTheme();
  const slideAnim = useRef(new Animated.Value(position === 'top' ? -200 : 200)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 15,
          stiffness: 120,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss if enabled
      if (autoDismiss && onDismiss) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoDismissDelay);

        return () => clearTimeout(timer);
      }
    } else {
      // Slide out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: position === 'top' ? -200 : 200,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, autoDismiss, autoDismissDelay, position]);

  const handleDismiss = () => {
    if (onDismiss) {
      // Animate out first
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: position === 'top' ? -200 : 200,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss();
      });
    }
  };

  const getErrorConfig = () => {
    switch (errorType) {
      case 'network_error':
        return {
          icon: 'wifi-off' as const,
          title: 'No Internet Connection',
          defaultMessage: 'Network unavailable. Please check your connection and try again.',
          backgroundColor: tokens.colors.error.main,
        };
      case 'timeout':
        return {
          icon: 'time-outline' as const,
          title: 'Request Timeout',
          defaultMessage: 'The request took too long. Please check your connection and try again.',
          backgroundColor: tokens.colors.warning.main,
        };
      case 'server_error':
        return {
          icon: 'warning-outline' as const,
          title: 'Server Error',
          defaultMessage: 'Unable to reach the server. Please try again in a moment.',
          backgroundColor: tokens.colors.error.main,
        };
      default:
        return {
          icon: 'alert-circle-outline' as const,
          title: 'Error',
          defaultMessage: 'An error occurred. Please try again.',
          backgroundColor: tokens.colors.error.main,
        };
    }
  };

  const config = getErrorConfig();
  const displayMessage = message || config.defaultMessage;

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          [position]: 0,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={`${config.title}: ${displayMessage}`}
      accessibilityLive="assertive"
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: config.backgroundColor,
            borderRadius: tokens.radius.lg,
            padding: tokens.spacing.base,
            ...tokens.shadows.md,
          },
        ]}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name={config.icon} size={24} color={tokens.colors.white} />
          </View>

          {/* Message */}
          <View style={styles.messageContainer}>
            <AppText variant="subtitle2" weight="semibold" style={styles.whiteText}>
              {config.title}
            </AppText>
            <AppText variant="caption" style={styles.whiteText}>
              {displayMessage}
            </AppText>
          </View>

          {/* Dismiss Button */}
          {onDismiss && (
            <TouchableOpacity
              onPress={handleDismiss}
              style={styles.dismissButton}
              accessibilityRole="button"
              accessibilityLabel="Dismiss error"
              accessibilityHint="Closes this error message"
            >
              <Ionicons name="close" size={20} color={tokens.colors.white} />
            </TouchableOpacity>
          )}
        </View>

        {/* Retry Button */}
        {onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            style={[
              styles.retryButton,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: tokens.radius.base,
                padding: tokens.spacing.sm,
                marginTop: tokens.spacing.sm,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Retry"
            accessibilityHint="Retries the failed operation"
          >
            <View style={styles.retryContent}>
              <Ionicons name="refresh" size={18} color={tokens.colors.white} />
              <AppText variant="button" style={[styles.whiteText, { marginLeft: tokens.spacing.xs }]}>
                Try Again
              </AppText>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  card: {
    width: '100%',
    maxWidth: width - 32,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  messageContainer: {
    flex: 1,
    marginRight: 8,
  },
  dismissButton: {
    padding: 4,
  },
  retryButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteText: {
    color: '#ffffff',
  },
});

export default NetworkErrorCard;
