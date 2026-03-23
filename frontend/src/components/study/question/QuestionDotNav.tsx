import { useAppTheme } from '@/hooks/useAppTheme';
import { getQuestionColor } from '@/src/utils/questionHelpers';
import { Attempt } from '@/types/QuizBook';
import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface QuestionDotNavProps {
  totalQuestions: number;
  currentIndex: number;
  getAttempts: (questionNumber: number) => Attempt[];
  onSelect: (index: number) => void;
}

const QuestionDotNav = ({ totalQuestions, currentIndex, getAttempts, onSelect }: QuestionDotNavProps) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const dotColor = (color: string) => {
    const map: Record<string, string> = {
      gold: '#D4A643', silver: '#AAAAAA', green: theme.colors.success[500],
      red: theme.colors.error[500], gray: theme.colors.secondary[200],
    };
    return map[color] || theme.colors.secondary[200];
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: totalQuestions }, (_, i) => {
        const isCurrent = i === currentIndex;
        const attempts = getAttempts(i + 1).filter(a => a.resultConfirmFlg);
        const color = getQuestionColor(attempts);
        return (
          <TouchableOpacity key={i} onPress={() => onSelect(i)} hitSlop={4} activeOpacity={0.7}>
            <View style={[
              isCurrent ? styles.dotCurrent : styles.dot,
              { backgroundColor: isCurrent ? theme.colors.primary[600] : dotColor(color) },
            ]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5, paddingHorizontal: 20 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotCurrent: { width: 10, height: 10, borderRadius: 5 },
});

export default QuestionDotNav;
