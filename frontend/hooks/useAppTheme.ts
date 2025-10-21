import { useTheme } from 'react-native-paper';
import { AppTheme, theme as defaultTheme } from '../theme';

export const useAppTheme = (): AppTheme => {
  const paperTheme = useTheme();
  
  // Ensure the theme always has the tokens property
  // by merging with our default theme
  return {
    ...paperTheme,
    ...defaultTheme,
    tokens: defaultTheme.tokens
  } as AppTheme;
};
