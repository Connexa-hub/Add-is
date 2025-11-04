import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.3))[0];

  useEffect(() => {
    async function prepare() {
      try {
        // Start logo animation
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }),
        ]).start();

        // Preload fonts
        await Font.loadAsync({
          'SpaceMono-Regular': require('./assets/fonts/LilitaOne-Regular.ttf'),
        });

        // Keep splash visible for 3 seconds
        await new Promise((resolve) => setTimeout(resolve, 3000));

        setAppIsReady(true);

        // Fade out splash
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setShowSplash(false);
          SplashScreen.hideAsync();
        });
      } catch (e) {
        console.warn(e);
        setShowSplash(false);
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <Image
            source={require('./assets/images/splash-icon.png')}
            style={styles.splashLogo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    );
  }

  if (!appIsReady) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <AppNavigator />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 150,
    height: 150,
  },
});