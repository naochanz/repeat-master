import { useAppTheme } from '@/hooks/useAppTheme';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface GuideOverlayProps {
  step: number;
  total: number;
  title: string;
  description: string;
}

const GuideOverlay = ({ step, total, title, description }: GuideOverlayProps) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>STEP {step}/{total}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </Animated.View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 4,
    borderWidth: 2,
    borderColor: theme.colors.primary[600],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary[50],
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: theme.colors.primary[600], letterSpacing: 0.5 },
  title: { fontSize: 15, fontWeight: '700', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold' },
  description: { fontSize: 12, color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Regular', lineHeight: 18 },
});

export default GuideOverlay;
