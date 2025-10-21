import React from 'react';
import { View, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { AppText, AppButton } from '../atoms';

export interface PromoBannerProps {
  title: string;
  description?: string;
  buttonText?: string;
  onPress?: () => void;
  backgroundColor?: string;
  backgroundImage?: any;
  variant?: 'default' | 'gradient';
  icon?: React.ReactNode;
  accessibilityLabel?: string;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({
  title,
  description,
  buttonText,
  onPress,
  backgroundColor,
  backgroundImage,
  variant = 'default',
  icon,
  accessibilityLabel,
}) => {
  const { tokens } = useAppTheme();

  const bgColor = backgroundColor || tokens.colors.success.main;

  const content = (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: bgColor,
          borderRadius: tokens.radius.lg,
          padding: tokens.spacing.lg,
          ...tokens.shadows.base,
        },
      ]}
      accessibilityLabel={accessibilityLabel || title}
    >
      <View style={styles.content}>
        {icon && <View style={{ marginRight: tokens.spacing.md }}>{icon}</View>}
        <View style={{ flex: 1 }}>
          <AppText variant="h3" weight="bold" style={{ color: tokens.colors.text.inverse, marginBottom: tokens.spacing.xs }}>
            {title}
          </AppText>
          {description && (
            <AppText variant="body2" style={{ color: tokens.colors.text.inverse, marginBottom: tokens.spacing.md }}>
              {description}
            </AppText>
          )}
          {buttonText && onPress && (
            <AppButton onPress={onPress} variant="outline" size="sm">
              {buttonText}
            </AppButton>
          )}
        </View>
      </View>
    </View>
  );

  if (backgroundImage) {
    return (
      <ImageBackground
        source={backgroundImage}
        style={[
          {
            borderRadius: tokens.radius.lg,
            overflow: 'hidden',
          },
        ]}
        imageStyle={{ borderRadius: tokens.radius.lg }}
      >
        {content}
      </ImageBackground>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default PromoBanner;
