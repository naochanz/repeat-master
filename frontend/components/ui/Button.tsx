import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { theme } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? theme.colors.primary[600] : theme.colors.neutral.white} />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`text_${size}`], textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  primary: {
    backgroundColor: theme.colors.primary[600],
  },
  secondary: {
    backgroundColor: theme.colors.secondary[600],
  },
  outline: {
    backgroundColor: theme.colors.neutral.white,
    borderWidth: 1.5,
    borderColor: theme.colors.primary[600],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  size_sm: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 36,
  },
  size_md: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 44,
  },
  size_lg: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    minHeight: 52,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: theme.typography.fontWeights.semibold,
    fontFamily: 'ZenKaku-Medium',
  },
  text_primary: {
    color: theme.colors.neutral.white,
  },
  text_secondary: {
    color: theme.colors.neutral.white,
  },
  text_outline: {
    color: theme.colors.primary[600],
  },
  text_ghost: {
    color: theme.colors.primary[600],
  },
  text_sm: {
    fontSize: theme.typography.fontSizes.sm,
  },
  text_md: {
    fontSize: theme.typography.fontSizes.base,
  },
  text_lg: {
    fontSize: theme.typography.fontSizes.lg,
  },
});

export default Button;
