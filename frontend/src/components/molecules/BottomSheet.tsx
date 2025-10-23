import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../atoms';
import { useAppTheme } from '../../hooks/useAppTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  height?: number | string;
  scrollable?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  showBackButton = false,
  onBack,
  height = '75%',
  scrollable = true,
}) => {
  const { tokens } = useAppTheme();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const sheetHeight = typeof height === 'number' ? height : 
    (height.includes('%') ? (SCREEN_HEIGHT * parseInt(height) / 100) : SCREEN_HEIGHT * 0.75);

  const Content = scrollable ? ScrollView : View;
  const contentProps = scrollable ? { 
    showsVerticalScrollIndicator: false,
    bounces: false,
  } : {};

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.bottomSheet,
                {
                  backgroundColor: tokens.colors.background.default,
                  borderTopLeftRadius: tokens.radius.xxl,
                  borderTopRightRadius: tokens.radius.xxl,
                  height: sheetHeight,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.handleBar}>
                <View style={[styles.handle, { backgroundColor: tokens.colors.border.default }]} />
              </View>

              {(title || showBackButton) && (
                <View style={[styles.header, { borderBottomColor: tokens.colors.border.default }]}>
                  {showBackButton && onBack && (
                    <Pressable onPress={onBack} style={styles.backButton}>
                      <Ionicons name="arrow-back" size={24} color={tokens.colors.text.primary} />
                    </Pressable>
                  )}
                  {title && (
                    <AppText variant="h3" weight="bold" style={{ flex: 1 }}>
                      {title}
                    </AppText>
                  )}
                  <Pressable onPress={handleClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={tokens.colors.text.secondary} />
                  </Pressable>
                </View>
              )}

              <Content style={styles.content} {...contentProps}>
                {children}
              </Content>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    maxHeight: SCREEN_HEIGHT * 0.95,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
});

export default BottomSheet;
