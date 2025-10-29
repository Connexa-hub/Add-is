import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  // Load assets
  useEffect(() => {
    async function prepare() {
      try {
        // Preload fonts
        await Font.loadAsync({
          'SpaceMono-Regular': require('./assets/fonts/LilitaOne-Regular.ttf'),
        });
        // Give splash screen time to show (3 seconds minimum for logo effect)
        await new Promise((resolve) => setTimeout(resolve, 3000));
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
      }
    }
    prepare();
  }, []);

  // Don't render anything until ready - let native splash show
  if (!appIsReady) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <AppNavigator />
    </PaperProvider>
  );
}


