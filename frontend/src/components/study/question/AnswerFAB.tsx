import { useAppTheme } from '@/hooks/useAppTheme';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AnswerFABProps {
  questionNumber: number;
  onAnswer: (questionNumber: number, answer: '○' | '×') => void;
  isLoading?: boolean;
}

const AnswerFAB: React.FC<AnswerFABProps> = ({ questionNumber, onAnswer, isLoading = false }) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // CustomTabBarの高さ(60) + パディング(5)
  const CUSTOM_TAB_BAR_HEIGHT = 15;
  const PADDING_ABOVE_TAB = 5;

  return (
    <View style={[styles.fabContainer, { bottom: CUSTOM_TAB_BAR_HEIGHT + PADDING_ABOVE_TAB }]}>
      <TouchableOpacity
        style={[styles.fab, styles.fabIncorrect, isLoading && styles.fabDisabled]}
        onPress={() => !isLoading && onAnswer(questionNumber, '×')}
        activeOpacity={0.8}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.neutral.white} />
        ) : (
          <>
            <Text style={styles.fabText}>×</Text>
            <Text style={styles.fabLabel}>不正解</Text>
          </>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.fab, styles.fabCorrect, isLoading && styles.fabDisabled]}
        onPress={() => !isLoading && onAnswer(questionNumber, '○')}
        activeOpacity={0.8}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.neutral.white} />
        ) : (
          <>
            <Text style={styles.fabText}>○</Text>
            <Text style={styles.fabLabel}>正解</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    zIndex: 1000,
  },
  fab: {
    width: 100,
    height: 100,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
    elevation: 8,
  },
  fabCorrect: {
    backgroundColor: theme.colors.success[500],
  },
  fabIncorrect: {
    backgroundColor: theme.colors.error[500],
  },
  fabDisabled: {
    opacity: 0.7,
  },
  fabText: {
    fontSize: 32,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.neutral.white,
  },
  fabLabel: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.neutral.white,
    marginTop: 4,
  },
});

export default AnswerFAB;