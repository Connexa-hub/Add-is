import { useTheme as usePaperTheme } from 'react-native-paper';
import { lightTokens, darkTokens } from '../theme';
import { useTheme } from '../../contexts/ThemeContext';
import type { AppTheme } from '../theme';

export const useAppTheme = () => {
  const paperTheme = usePaperTheme() as AppTheme;
  const { isDark } = useTheme();

  return {
    theme: paperTheme,
    tokens: isDark ? darkTokens : lightTokens,
  };
};