import { theme } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AnswerFABProps {
  questionNumber: number;
  onAnswer: (questionNumber: number, answer: '○' | '×') => void;
}

const AnswerFAB: React.FC<AnswerFABProps> = ({ questionNumber, onAnswer }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.fabContainer, { bottom: 60 + insets.bottom + 15 }]}>
      <TouchableOpacity
        style={[styles.fab, styles.fabIncorrect]}
        onPress={() => onAnswer(questionNumber, '×')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>×</Text>
        <Text style={styles.fabLabel}>不正解</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.fab, styles.fabCorrect]}
        onPress={() => onAnswer(questionNumber, '○')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>○</Text>
        <Text style={styles.fabLabel}>正解</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
