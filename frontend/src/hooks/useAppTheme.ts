import { useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';
import { AppTheme, lightTheme, darkTheme } from '../theme';

export const useAppTheme = (): AppTheme & { isDark: boolean } => {
  const paperTheme = usePaperTheme();
  const { themeMode, isDark } = useTheme();
  
  const currentTheme = isDark ? darkTheme : lightTheme;
  
  return {
    ...paperTheme,
    ...currentTheme,
    tokens: currentTheme.tokens,
    isDark,
  } as AppTheme & { isDark: boolean };
};
