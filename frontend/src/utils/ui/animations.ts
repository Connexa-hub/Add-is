import { withTiming, withSpring, Easing, WithTimingConfig, WithSpringConfig } from 'react-native-reanimated';

export const animationDurations = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

export const easings = {
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
  linear: Easing.linear,
  bounce: Easing.bounce,
} as const;

export const timingConfig = {
  fast: {
    duration: animationDurations.fast,
    easing: easings.easeOut,
  } as WithTimingConfig,
  normal: {
    duration: animationDurations.normal,
    easing: easings.easeInOut,
  } as WithTimingConfig,
  slow: {
    duration: animationDurations.slow,
    easing: easings.easeInOut,
  } as WithTimingConfig,
};

export const springConfig = {
  gentle: {
    damping: 20,
    stiffness: 90,
  } as WithSpringConfig,
  moderate: {
    damping: 15,
    stiffness: 120,
  } as WithSpringConfig,
  bouncy: {
    damping: 10,
    stiffness: 100,
  } as WithSpringConfig,
};

export const fadeIn = (duration = animationDurations.normal) => ({
  from: { opacity: 0 },
  to: { opacity: 1 },
  config: { duration, easing: easings.easeOut },
});

export const fadeOut = (duration = animationDurations.normal) => ({
  from: { opacity: 1 },
  to: { opacity: 0 },
  config: { duration, easing: easings.easeIn },
});

export const slideUp = (distance = 20, duration = animationDurations.normal) => ({
  from: { opacity: 0, translateY: distance },
  to: { opacity: 1, translateY: 0 },
  config: { duration, easing: easings.easeOut },
});

export const slideDown = (distance = 20, duration = animationDurations.normal) => ({
  from: { opacity: 0, translateY: -distance },
  to: { opacity: 1, translateY: 0 },
  config: { duration, easing: easings.easeOut },
});

export const slideLeft = (distance = 20, duration = animationDurations.normal) => ({
  from: { opacity: 0, translateX: distance },
  to: { opacity: 1, translateX: 0 },
  config: { duration, easing: easings.easeOut },
});

export const slideRight = (distance = 20, duration = animationDurations.normal) => ({
  from: { opacity: 0, translateX: -distance },
  to: { opacity: 1, translateX: 0 },
  config: { duration, easing: easings.easeOut },
});

export const scaleIn = (duration = animationDurations.normal) => ({
  from: { opacity: 0, scale: 0.8 },
  to: { opacity: 1, scale: 1 },
  config: { duration, easing: easings.easeOut },
});

export const scaleOut = (duration = animationDurations.normal) => ({
  from: { opacity: 1, scale: 1 },
  to: { opacity: 0, scale: 0.8 },
  config: { duration, easing: easings.easeIn },
});

export const pulse = (scale = 1.05, duration = animationDurations.fast) => ({
  from: { scale: 1 },
  to: { scale },
  config: { duration, easing: easings.easeInOut },
});
