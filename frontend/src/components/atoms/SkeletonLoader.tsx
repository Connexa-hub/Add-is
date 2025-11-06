import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { tokens, isDark } = useAppTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? tokens.colors.neutral.gray100 : tokens.colors.neutral.gray200,
          opacity,
        },
        style,
      ]}
    />
  );
};

interface SkeletonCardProps {
  style?: any;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ style }) => {
  const { tokens } = useAppTheme();

  return (
    <View
      style={[
        {
          backgroundColor: tokens.colors.card.background,
          borderRadius: tokens.radius.lg,
          padding: tokens.spacing.base,
          marginBottom: tokens.spacing.base,
        },
        style,
      ]}
    >
      <SkeletonLoader width="60%" height={20} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="40%" height={16} style={{ marginBottom: 12 }} />
      <SkeletonLoader width="100%" height={12} />
    </View>
  );
};

interface SkeletonListProps {
  count?: number;
  style?: any;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ count = 3, style }) => {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
};

interface SkeletonBalanceCardProps {
  style?: any;
}

export const SkeletonBalanceCard: React.FC<SkeletonBalanceCardProps> = ({ style }) => {
  const { tokens } = useAppTheme();

  return (
    <View
      style={[
        {
          backgroundColor: tokens.colors.primary.main,
          borderRadius: tokens.radius.lg,
          padding: tokens.spacing.lg,
          marginBottom: tokens.spacing.base,
        },
        style,
      ]}
    >
      <SkeletonLoader width="50%" height={16} style={{ marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.3)' }} />
      <SkeletonLoader width="70%" height={32} style={{ marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.3)' }} />
      <SkeletonLoader width="40%" height={14} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
    </View>
  );
};

interface SkeletonServiceGridProps {
  style?: any;
}

export const SkeletonServiceGrid: React.FC<SkeletonServiceGridProps> = ({ style }) => {
  const { tokens } = useAppTheme();

  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap' }, style]}>
      {Array.from({ length: 8 }).map((_, index) => (
        <View
          key={index}
          style={{
            width: '22%',
            marginRight: '4%',
            marginBottom: tokens.spacing.base,
            alignItems: 'center',
          }}
        >
          <SkeletonLoader width={60} height={60} borderRadius={12} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="100%" height={12} />
        </View>
      ))}
    </View>
  );
};
