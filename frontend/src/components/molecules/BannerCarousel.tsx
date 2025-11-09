import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PromoBanner } from './PromoBanner';
import { API_BASE_URL } from '../../../constants/api';
import axios from 'axios';

const { width } = Dimensions.get('window');

// Standard banner dimensions following OPay/Google Play mini banner style
const BANNER_WIDTH = width - 32; // 16px padding on each side
const BANNER_HEIGHT = 120; // Standard compact height
const BANNER_ASPECT_RATIO = BANNER_WIDTH / BANNER_HEIGHT;

interface Banner {
  _id: string;
  title: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: string;
  backgroundColor?: string;
  section: string;
  isActive: boolean;
  targetUrl?: string;
  weight?: number;
}

interface BannerCarouselProps {
  section: string;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ section }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoSlideInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Shuffle array using Fisher-Yates algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    fetchBanners();
    return () => {
      if (autoSlideInterval.current) {
        clearInterval(autoSlideInterval.current);
      }
    };
  }, [section]);

  useEffect(() => {
    if (banners.length > 1) {
      startAutoSlide();
    }
    return () => {
      if (autoSlideInterval.current) {
        clearInterval(autoSlideInterval.current);
      }
    };
  }, [banners, currentIndex]);

  const fetchBanners = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/banners?section=${section}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.data && Array.isArray(data.data)) {
        const activeBanners = data.data.filter((banner: Banner) => banner.isActive);
        // Auto-shuffle banners on fetch to randomize display order
        const shuffledBanners = shuffleArray(activeBanners);
        setBanners(shuffledBanners);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  };

  const startAutoSlide = () => {
    if (autoSlideInterval.current) {
      clearInterval(autoSlideInterval.current);
    }

    autoSlideInterval.current = setInterval(() => {
      setCurrentIndex((prevIndex: number) => {
        const nextIndex = (prevIndex + 1) % banners.length;
        scrollToIndex(nextIndex);
        return nextIndex;
      });
    }, 4000);
  };

  const scrollToIndex = (index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * (width - 32),
        animated: true,
      });
    }
  };

  const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (width - 32));
    if (index !== currentIndex && index >= 0 && index < banners.length) {
      setCurrentIndex(index);
    }
  };

  // Track impressions for each banner
  useEffect(() => {
    banners.forEach(async (banner) => {
      try {
        await axios.post(`${API_BASE_URL}/api/banners/${banner._id}/impression`);
      } catch (error) {
        console.error('Failed to track impression:', error);
      }
    });
  }, [banners]);

  // Handle banner press for clicks and URL opening
  const handleBannerPress = async (banner: Banner) => {
    try {
      // Track click asynchronously (don't block user interaction)
      axios.post(`${API_BASE_URL}/api/banners/${banner._id}/click`).catch(err => 
        console.warn('Failed to track banner click:', err)
      );

      // Open URL if exists and valid
      if (banner.targetUrl && banner.targetUrl.trim()) {
        try {
          const supported = await Linking.canOpenURL(banner.targetUrl);
          if (supported) {
            await Linking.openURL(banner.targetUrl);
          } else {
            Alert.alert('Invalid Link', 'This banner link cannot be opened on your device.');
          }
        } catch (linkError) {
          console.error('URL opening error:', linkError);
          Alert.alert('Error', 'Could not open the link. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Failed to handle banner press:', error);
    }
  };

  if (banners.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {banners.map((banner: Banner) => (
          <TouchableOpacity
            key={banner._id}
            style={styles.bannerWrapper}
            onPress={() => handleBannerPress(banner)}
            activeOpacity={banner.targetUrl ? 0.7 : 1}
            disabled={!banner.targetUrl}
          >
            <View style={styles.bannerContainer}>
              {/* Display banner image if available */}
              {banner.mediaUrl && banner.mediaType === 'image' && (
                <Image
                  source={{ uri: banner.mediaUrl }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              )}
              {/* Overlay text content */}
              <View style={styles.bannerTextOverlay}>
                <PromoBanner
                  title={banner.title}
                  description={banner.description}
                  backgroundColor={banner.mediaUrl ? 'transparent' : (banner.backgroundColor || '#6366f1')}
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {banners.length > 1 && (
        <View style={styles.pagination}>
          {banners.map((_: Banner, index: number) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollView: {
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingRight: 16,
  },
  bannerWrapper: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    marginRight: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  bannerTextOverlay: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#6366f1',
    width: 24,
  },
});

export default BannerCarousel;