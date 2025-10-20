import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, AppButton } from '../atoms';
import { useAppTheme } from '../../hooks/useAppTheme';

export interface BiometricModalProps {
  visible: boolean;
  onEnable: () => void;
  onSkip: () => void;
  biometricType?: string;
}

export const BiometricModal: React.FC<BiometricModalProps> = ({
  visible,
  onEnable,
  onSkip,
  biometricType = 'Biometric',
}) => {
  const { tokens } = useAppTheme();
  const slideAnim = new Animated.Value(300);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(300);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onSkip}
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onSkip}
        />
        <Animated.View
          style={[
            styles.modal,
            {
              backgroundColor: tokens.colors.background.paper,
              borderRadius: tokens.radius.xl,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Decorative gradient background */}
          <View style={styles.gradientCircle}>
            <View style={[styles.circle, { backgroundColor: tokens.colors.primary.light }]}>
              <Ionicons 
                name="finger-print" 
                size={80} 
                color={tokens.colors.primary.main} 
              />
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <AppText variant="h2" weight="bold" style={{ textAlign: 'center', marginBottom: tokens.spacing.xs }}>
              Enable {biometricType} Login
            </AppText>
            <AppText 
              variant="body1" 
              color={tokens.colors.text.secondary}
              style={{ textAlign: 'center', marginBottom: tokens.spacing.lg }}
            >
              Unlock faster, more secure access to your account with {biometricType.toLowerCase()} authentication.
            </AppText>

            {/* Features */}
            <View style={styles.features}>
              <View style={styles.feature}>
                <Ionicons name="flash" size={20} color={tokens.colors.success.main} />
                <AppText variant="body2" style={{ marginLeft: tokens.spacing.sm, flex: 1 }}>
                  Quick & convenient login
                </AppText>
              </View>
              <View style={styles.feature}>
                <Ionicons name="shield-checkmark" size={20} color={tokens.colors.success.main} />
                <AppText variant="body2" style={{ marginLeft: tokens.spacing.sm, flex: 1 }}>
                  Enhanced security
                </AppText>
              </View>
              <View style={styles.feature}>
                <Ionicons name="lock-closed" size={20} color={tokens.colors.success.main} />
                <AppText variant="body2" style={{ marginLeft: tokens.spacing.sm, flex: 1 }}>
                  Your data stays secure
                </AppText>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ marginTop: tokens.spacing.lg }}>
              <AppButton
                onPress={onEnable}
                variant="primary"
                size="lg"
                fullWidth
                icon={<Ionicons name="finger-print" size={20} color="#FFFFFF" />}
              >
                Enable {biometricType}
              </AppButton>
              <AppButton
                onPress={onSkip}
                variant="ghost"
                size="lg"
                fullWidth
                style={{ marginTop: tokens.spacing.sm }}
              >
                Maybe Later
              </AppButton>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modal: {
    marginHorizontal: 16,
    marginBottom: 32,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientCircle: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  features: {
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default BiometricModal;
