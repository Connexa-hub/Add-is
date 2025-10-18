import { useTheme } from 'react-native-paper';
import { AppTheme } from '../theme';

export const useAppTheme = (): AppTheme => {
  const theme = useTheme<AppTheme>();
  return theme as AppTheme;
};
