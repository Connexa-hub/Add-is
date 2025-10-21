
import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, AppButton } from '../atoms';
import { useAppTheme } from '../../hooks/useAppTheme';

export type ModalType = 'success' | 'error' | 'warning' | 'info';

export interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  type?: ModalType;
  title: string;
  message: string;
  primaryButton?: {
    text: string;
    onPress: () => void;
  };
  secondaryButton?: {
    text: string;
    onPress: () => void;
  };
  dismissable?: boolean;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  type = 'info',
  title,
  message,
  primaryButton,
  secondaryButton,
  dismissable = true,
}) => {
  const { tokens } = useAppTheme();

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle', color: tokens.colors.success.main, bg: tokens.colors.success.light };
      case 'error':
        return { name: 'close-circle', color: tokens.colors.error.main, bg: tokens.colors.error.light };
      case 'warning':
        return { name: 'warning', color: tokens.colors.warning.main, bg: tokens.colors.warning.light };
      default:
        return { name: 'information-circle', color: tokens.colors.info.main, bg: tokens.colors.info.light };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismissable ? onClose : undefined}
    >
      <Pressable style={styles.overlay} onPress={dismissable ? onClose : undefined}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.modal, { backgroundColor: tokens.colors.background.default, borderRadius: tokens.radius.xl }]}>
            {dismissable && (
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={tokens.colors.text.secondary} />
              </TouchableOpacity>
            )}

            <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
              <Ionicons name={iconConfig.name as any} size={48} color={iconConfig.color} />
            </View>

            <AppText variant="h3" weight="bold" align="center" style={{ marginTop: tokens.spacing.lg }}>
              {title}
            </AppText>

            <AppText
              variant="body1"
              color={tokens.colors.text.secondary}
              align="center"
              style={{ marginTop: tokens.spacing.sm, lineHeight: 24 }}
            >
              {message}
            </AppText>

            <View style={{ marginTop: tokens.spacing.xl, gap: tokens.spacing.sm }}>
              {primaryButton && (
                <AppButton
                  onPress={primaryButton.onPress}
                  variant="primary"
                  size="lg"
                  fullWidth
                >
                  {primaryButton.text}
                </AppButton>
              )}

              {secondaryButton && (
                <AppButton
                  onPress={secondaryButton.onPress}
                  variant="outline"
                  size="lg"
                  fullWidth
                >
                  {secondaryButton.text}
                </AppButton>
              )}

              {!primaryButton && !secondaryButton && (
                <AppButton onPress={onClose} variant="primary" size="lg" fullWidth>
                  OK
                </AppButton>
              )}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modal: {
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppModal;
