import { ViewStyle, TextStyle } from 'react-native';
import { spacing, radius, shadows } from '../../theme';

export const container: ViewStyle = {
  flex: 1,
  padding: spacing.base,
};

export const containerWithScroll: ViewStyle = {
  flex: 1,
};

export const contentContainer: ViewStyle = {
  padding: spacing.base,
};

export const card: ViewStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: radius.md,
  padding: spacing.base,
  ...shadows.base,
};

export const cardElevated: ViewStyle = {
  ...card,
  ...shadows.md,
};

export const section: ViewStyle = {
  marginBottom: spacing.lg,
};

export const sectionTitle: TextStyle = {
  marginBottom: spacing.md,
};

export const row: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
};

export const rowBetween: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
};

export const screenPadding: ViewStyle = {
  paddingHorizontal: spacing.base,
};

export const screenPaddingVertical: ViewStyle = {
  paddingVertical: spacing.base,
};

export const screenPaddingAll: ViewStyle = {
  padding: spacing.base,
};

export const separator: ViewStyle = {
  height: 1,
  backgroundColor: '#E5E7EB',
  marginVertical: spacing.md,
};

export const separatorVertical: ViewStyle = {
  width: 1,
  backgroundColor: '#E5E7EB',
  marginHorizontal: spacing.md,
};

export const overlay: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
};

export const centeredContent: ViewStyle = {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
};

export const inputStyle: ViewStyle = {
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: radius.base,
  padding: spacing.md,
  backgroundColor: '#FFFFFF',
};

export const buttonPrimary: ViewStyle = {
  backgroundColor: '#2BE2FA',
  borderRadius: radius.base,
  padding: spacing.md,
  alignItems: 'center',
  justifyContent: 'center',
  ...shadows.sm,
};

export const buttonSecondary: ViewStyle = {
  backgroundColor: '#10B981',
  borderRadius: radius.base,
  padding: spacing.md,
  alignItems: 'center',
  justifyContent: 'center',
  ...shadows.sm,
};

export const buttonOutline: ViewStyle = {
  backgroundColor: 'transparent',
  borderWidth: 2,
  borderColor: '#2BE2FA',
  borderRadius: radius.base,
  padding: spacing.md,
  alignItems: 'center',
  justifyContent: 'center',
};

export const gridContainer: ViewStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginHorizontal: -spacing.sm,
};

export const gridItem: ViewStyle = {
  width: '50%',
  paddingHorizontal: spacing.sm,
  marginBottom: spacing.base,
};
