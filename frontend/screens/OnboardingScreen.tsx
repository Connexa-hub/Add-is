import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { AppText, AppButton } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { API_BASE_URL } from '../constants/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AUTO_SWIPE_INTERVAL = 4000;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

interface OnboardingSlide {
  _id: string;
  title: string;
  description: string;
  mediaType: 'image' | 'video' | 'gif';
  mediaUrl: string;
  backgroundColor: string;
  textColor: string;
  order: number;
  metadata?: {
    titleFontSize?: number;
    descriptionFontSize?: number;
    alignment?: 'left' | 'center' | 'right';
  };
}

interface OnboardingScreenProps {
  navigation: any;
}

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const { tokens } = useAppTheme();
  const [slides, setSlides] = useState<OnboardingSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const autoSwipeTimerRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Load cached slides immediately if available
    loadCachedSlidesFirst();
    return () => {
      if (autoSwipeTimerRef.current) {
        clearTimeout(autoSwipeTimerRef.current);
      }
    };
  }, []);

  const loadCachedSlidesFirst = async () => {
    try {
      const cachedSlides = await AsyncStorage.getItem('onboarding_slides');
      
      if (cachedSlides) {
        // Load cached slides immediately - no loading state
        const cachedData = JSON.parse(cachedSlides);
        setSlides(cachedData);
        setLoading(false);
        console.log('✅ Loaded onboarding slides from cache instantly');
        
        // Fetch fresh data in background
        fetchSlidesInBackground();
      } else {
        // No cache, fetch from API
        await fetchSlidesFromAPI();
      }
    } catch (err) {
      console.error('Error loading cached slides:', err);
      await fetchSlidesFromAPI();
    }
  };

  useEffect(() => {
    if (slides.length > 0 && !loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      startAutoSwipe();
    }
    return () => {
      if (autoSwipeTimerRef.current) {
        clearTimeout(autoSwipeTimerRef.current);
      }
    };
  }, [slides, currentIndex, loading]);

  

  const fetchSlidesInBackground = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/onboarding`, {
        timeout: 5000
      });
      if (response.data.success && response.data.data.length > 0) {
        const sortedSlides = response.data.data.sort((a: OnboardingSlide, b: OnboardingSlide) => a.order - b.order);
        
        // Update cache silently
        await AsyncStorage.setItem('onboarding_slides', JSON.stringify(sortedSlides));
        await AsyncStorage.setItem('onboarding_last_fetch', Date.now().toString());
        
        // Only update UI if slides changed
        const currentSlidesStr = JSON.stringify(slides);
        const newSlidesStr = JSON.stringify(sortedSlides);
        if (currentSlidesStr !== newSlidesStr) {
          setSlides(sortedSlides);
          console.log('🔄 Updated onboarding slides from server');
        }
      }
    } catch (err) {
      console.error('Background fetch error:', err);
    }
  };

  const fetchSlidesFromAPI = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/onboarding`);

      if (response.data.success && response.data.data.length > 0) {
        const sortedSlides = response.data.data.sort((a: OnboardingSlide, b: OnboardingSlide) => a.order - b.order);
        setSlides(sortedSlides);

        await AsyncStorage.setItem('onboarding_slides', JSON.stringify(sortedSlides));
        await AsyncStorage.setItem('onboarding_last_fetch', Date.now().toString());
      } else {
        handleFetchError();
      }
    } catch (err) {
      console.error('API fetch error:', err);
      handleFetchError();
    } finally {
      setLoading(false);
    }
  };

  const handleFetchError = async () => {
    const cachedSlides = await AsyncStorage.getItem('onboarding_slides');
    if (cachedSlides) {
      setSlides(JSON.parse(cachedSlides));
    } else {
      setError('Failed to load onboarding. Please check your connection.');
    }
    setLoading(false);
  };

  const startAutoSwipe = () => {
    if (autoSwipeTimerRef.current) {
      clearTimeout(autoSwipeTimerRef.current);
    }

    autoSwipeTimerRef.current = setTimeout(() => {
      if (currentIndex < slides.length - 1) {
        const nextIndex = currentIndex + 1;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        setCurrentIndex(nextIndex);
      }
    }, AUTO_SWIPE_INTERVAL);
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < slides.length) {
      setCurrentIndex(index);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    navigation.replace('Login');
  };

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      navigation.replace('Login');
    }
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => {
    const alignment = item.metadata?.alignment || 'center';
    const titleFontSize = item.metadata?.titleFontSize || 32;
    const descriptionFontSize = item.metadata?.descriptionFontSize || 16;

    return (
      <View
        style={[
          styles.slide,
          {
            backgroundColor: item.backgroundColor,
            width: SCREEN_WIDTH,
          },
        ]}
      >
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri: item.mediaUrl }}
            style={styles.media}
            resizeMode="contain"
          />
        </View>

        <View
          style={[
            styles.textContainer,
            { alignItems: alignment === 'center' ? 'center' : alignment === 'left' ? 'flex-start' : 'flex-end' },
          ]}
        >
          <AppText
            variant="h1"
            weight="bold"
            color={item.textColor}
            align={alignment}
            style={[styles.title, { fontSize: titleFontSize }]}
          >
            {item.title}
          </AppText>

          <AppText
            variant="body1"
            color={item.textColor}
            align={alignment}
            style={[styles.description, { fontSize: descriptionFontSize }]}
          >
            {item.description}
          </AppText>
        </View>
      </View>
    );
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_item: OnboardingSlide, index: number) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor:
                index === currentIndex
                  ? tokens.colors.primary.main
                  : tokens.colors.neutral.gray300,
              width: index === currentIndex ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  if (loading && slides.length === 0) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: tokens.colors.background.default }]}>
        <ActivityIndicator size="large" color={tokens.colors.primary.main} />
        <AppText variant="body1" color={tokens.colors.text.secondary} style={{ marginTop: tokens.spacing.lg }}>
          Loading...
        </AppText>
      </SafeAreaView>
    );
  }

  if (error && slides.length === 0) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: tokens.colors.background.default }]}>
        <AppText variant="h3" weight="semibold" style={{ marginBottom: tokens.spacing.lg }}>
          {error}
        </AppText>
        <AppButton onPress={fetchSlidesFromAPI} variant="primary">
          Retry
        </AppButton>
        <TouchableOpacity onPress={handleSkip} style={{ marginTop: tokens.spacing.lg }}>
          <AppText variant="body1" color={tokens.colors.primary.main}>
            Skip to Login
          </AppText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (slides.length === 0) {
    handleSkip();
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={[styles.skipButton, { padding: tokens.spacing.md }]}
          onPress={handleSkip}
        >
          <AppText variant="subtitle1" weight="semibold" color={tokens.colors.primary.main}>
            Skip
          </AppText>
        </TouchableOpacity>

        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item._id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          bounces={false}
          onScrollBeginDrag={() => {
            if (autoSwipeTimerRef.current) {
              clearTimeout(autoSwipeTimerRef.current);
            }
          }}
          onScrollEndDrag={startAutoSwipe}
          getItemLayout={(_data: any, index: number) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />

        <View style={[styles.footer, { paddingBottom: tokens.spacing.xl }]}>
          {renderDots()}

          <View style={[styles.buttonContainer, { paddingHorizontal: tokens.spacing.lg }]}>
            <AppButton
              onPress={handleNext}
              variant="primary"
              fullWidth
              size="lg"
            >
              {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </AppButton>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  skipButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  media: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.4,
  },
  textContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  title: {
    marginBottom: 16,
  },
  description: {
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    width: '100%',
  },
});
