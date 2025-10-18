import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const scale = useSharedValue(1); // For pulsing animation

  // Animation setup
  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.2, { duration: 600 }), // Scale up
      -1, // Infinite loop
      true // Reverse (scale down)
    );
  }, [scale]);

  // Load assets
  useEffect(() => {
    async function prepare() {
      try {
        // Preload fonts
        await Font.loadAsync({
          'SpaceMono-Regular': require('./assets/fonts/LilitaOne-Regular.ttf'),
        });
        // Simulate additional loading (e.g., API calls, images)
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2-second delay for demo
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
      }
    }
    prepare();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!appIsReady) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.logoContainer, animatedStyle]}>
          <Image
            source={require('./assets/images/splash-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <AppNavigator />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Match app.json splash background
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});
