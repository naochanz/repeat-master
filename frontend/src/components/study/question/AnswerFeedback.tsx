import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Check, X } from 'lucide-react-native';

interface AnswerFeedbackProps {
  result: '○' | '×' | null;
  onComplete: () => void;
}

const AnswerFeedback = ({ result, onComplete }: AnswerFeedbackProps) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (result) {
      progress.value = withSequence(
        withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) })
      );
      const timer = setTimeout(() => {
        onComplete();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.15]),
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.5, 1.2, 1]) },
    ],
  }));

  if (!result) return null;

  const isCorrect = result === '○';
  const bgColor = isCorrect ? '#22C55E' : '#EF4444';

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.overlay, { backgroundColor: bgColor }, overlayStyle]} />
      <Animated.View style={[styles.iconWrap, iconStyle]}>
        <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
          {isCorrect ? (
            <Check size={48} color="#FFFFFF" strokeWidth={3} />
          ) : (
            <X size={48} color="#FFFFFF" strokeWidth={3} />
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  iconWrap: {
    position: 'absolute',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
});

export default AnswerFeedback;
