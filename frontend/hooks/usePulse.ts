import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export const usePulse = (active: boolean) => {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (active) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      anim.setValue(1);
    }
  }, [active]);

  return anim;
};
