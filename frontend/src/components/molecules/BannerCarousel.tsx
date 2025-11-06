import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PromoBanner } from './PromoBanner';
import { API_BASE_URL } from '../../../constants/api';
import { TouchableOpacity, Linking } from 'react-native';
import axios from 'axios';

const { width } = Dimensions.get('window');

interface Banner {
  _id: string;
  title: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: string;
  backgroundColor?: string;
  section: string;
  isActive: boolean;
  targetUrl?: string; // Added targetUrl to the interface
}

interface BannerCarouselProps {
  section: string;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ section }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoSlideInterval = useRef<ReturnType<typeof setInterval> | null>(null);

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
        setBanners(activeBanners);
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
      // Track click
      await axios.post(`${API_BASE_URL}/api/banners/${banner._id}/click`);

      // Open URL if exists
      if (banner.targetUrl) {
        const supported = await Linking.canOpenURL(banner.targetUrl);
        if (supported) {
          await Linking.openURL(banner.targetUrl);
        } else {
          console.error(`Cannot open URL: ${banner.targetUrl}`);
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
            <PromoBanner
              title={banner.title}
              description={banner.description}
              backgroundColor={banner.backgroundColor}
              mediaUrl={banner.mediaUrl} // Pass mediaUrl to PromoBanner if it's used there
              mediaType={banner.mediaType} // Pass mediaType if needed
            />
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
    width: width - 32,
    marginRight: 0,
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