import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Dimensions, ActivityIndicator } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AppButton } from '../components/atoms/AppButton';
import { useAppTheme } from '../hooks/useAppTheme';
import { getBanners } from '../services/api';
import AppText from '../components/atoms/AppText';

const WelcomeScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { tokens } = useAppTheme();
  const width = Dimensions.get('window').width;
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await getBanners();
        setBanners(data);
      } catch (error) {
        console.error('Failed to fetch banners', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleCreateAccount = () => {
    navigation.navigate('Register');
  };

  const renderCarousel = () => {
    if (loading) {
      return <ActivityIndicator size="large" />;
    }

    if (banners.length === 0) {
      return <AppText>No banners to display</AppText>;
    }

    return (
      <Carousel
        loop
        width={width}
        height={width / 2}
        autoPlay={true}
        data={banners}
        scrollAnimationDuration={1000}
        renderItem={({ item }) => (
          <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} />
        )}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/splash-icon.png')} style={styles.logo} />
      <View style={styles.carouselContainer}>{renderCarousel()}</View>
      <View style={styles.buttonContainer}>
        <AppButton onPress={handleCreateAccount} fullWidth>
          Create a new account
        </AppButton>
        <View style={{ height: tokens.spacing.md }} />
        <AppButton onPress={handleLogin} variant="outline" fullWidth>
          Login
        </AppButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 80,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  carouselContainer: {
    height: Dimensions.get('window').width / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
});

export default WelcomeScreen;
