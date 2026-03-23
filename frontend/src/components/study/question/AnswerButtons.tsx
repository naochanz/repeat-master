import { useAppTheme } from '@/hooks/useAppTheme';
import { Check, X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AnswerButtonsProps {
  onCorrect: () => void;
  onIncorrect: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

const AnswerButtons = ({ onCorrect, onIncorrect, isLoading, disabled }: AnswerButtonsProps) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.wrongBtn} onPress={onIncorrect} activeOpacity={0.7} disabled={disabled || isLoading}>
        {isLoading ? <ActivityIndicator size="small" color={theme.colors.error[500]} /> : (
          <>
            <X size={22} color={theme.colors.error[500]} />
            <Text style={styles.wrongLabel}>不正解</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.correctBtn} onPress={onCorrect} activeOpacity={0.7} disabled={disabled || isLoading}>
        {isLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
          <>
            <Check size={22} color="#FFFFFF" />
            <Text style={styles.correctLabel}>正解</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, width: '100%' },
  wrongBtn: {
    flex: 1, height: 56, borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.secondary[200],
    flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center',
  },
  wrongLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.error[500], fontFamily: 'ZenKaku-Bold' },
  correctBtn: {
    flex: 1, height: 56, borderRadius: 14,
    backgroundColor: theme.colors.primary[600],
    flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center',
  },
  correctLabel: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', fontFamily: 'ZenKaku-Bold' },
});

export default AnswerButtons;
