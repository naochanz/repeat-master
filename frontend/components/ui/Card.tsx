import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'flat';
}

const Card: React.FC<CardProps> = ({ children, style, variant = 'elevated' }) => {
  return (
    <View style={[styles.base, styles[variant], style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  elevated: {
    ...theme.shadows.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: theme.colors.secondary[200],
  },
  flat: {
    backgroundColor: theme.colors.neutral[50],
  },
});

export default Card;
