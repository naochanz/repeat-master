import { useAppTheme } from '@/hooks/useAppTheme';
import { getQuestionColor } from '@/src/utils/questionHelpers';
import { Attempt } from '@/types/QuizBook';
import { X } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface QuestionPickerSheetProps {
  visible: boolean;
  totalQuestions: number;
  currentIndex: number;
  getAttempts: (questionNumber: number) => Attempt[];
  onSelect: (index: number) => void;
  onClose: () => void;
}

const COLS = 5;

const QuestionPickerSheet = ({ visible, totalQuestions, currentIndex, getAttempts, onSelect, onClose }: QuestionPickerSheetProps) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      slideAnim.setValue(600);
    }
  }, [visible]);

  const tileStyle = (color: string, isCurrent: boolean) => {
    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
      gold: { bg: '#D4A64320', border: '#D4A64340', text: '#D4A643' },
      silver: { bg: '#AAAAAA20', border: '#AAAAAA40', text: '#AAAAAA' },
      green: { bg: `${theme.colors.success[500]}20`, border: `${theme.colors.success[500]}40`, text: theme.colors.success[500] },
      red: { bg: `${theme.colors.error[500]}20`, border: `${theme.colors.error[500]}40`, text: theme.colors.error[500] },
      gray: { bg: theme.colors.secondary[100], border: theme.colors.secondary[200], text: theme.colors.secondary[400] },
    };
    if (isCurrent) return { bg: `${theme.colors.primary[600]}20`, border: theme.colors.primary[600], text: theme.colors.primary[600] };
    return colorMap[color] || colorMap.gray;
  };

  const rows: number[][] = [];
  for (let i = 0; i < totalQuestions; i += COLS) {
    rows.push(Array.from({ length: Math.min(COLS, totalQuestions - i) }, (_, j) => i + j));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>問題を選択</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={theme.colors.secondary[500]} /></TouchableOpacity>
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: theme.colors.success[500] }]} /><Text style={styles.legendText}>正解</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: theme.colors.error[500] }]} /><Text style={styles.legendText}>不正解</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#D4A643' }]} /><Text style={styles.legendText}>連続正解</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: theme.colors.secondary[200] }]} /><Text style={styles.legendText}>未回答</Text></View>
          </View>

          <ScrollView style={styles.grid} showsVerticalScrollIndicator={false}>
            {rows.map((row, ri) => (
              <View key={ri} style={styles.gridRow}>
                {row.map(idx => {
                  const num = idx + 1;
                  const attempts = getAttempts(num).filter(a => a.resultConfirmFlg);
                  const color = getQuestionColor(attempts);
                  const isCurrent = idx === currentIndex;
                  const ts = tileStyle(color, isCurrent);
                  return (
                    <TouchableOpacity key={idx} style={[styles.tile, { backgroundColor: ts.bg, borderColor: ts.border, borderWidth: isCurrent ? 2 : 1 }]} onPress={() => { onSelect(idx); onClose(); }} activeOpacity={0.7}>
                      <Text style={[styles.tileText, { color: ts.text }]}>{num}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingTop: 20, maxHeight: '70%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.secondary[200], alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold' },

  legend: { flexDirection: 'row', gap: 14, marginBottom: 16, alignItems: 'center' },
  legendItem: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: theme.colors.secondary[500] },

  grid: { gap: 8 },
  gridRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tile: { flex: 1, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  tileText: { fontSize: 18, fontWeight: '700', fontFamily: 'ZenKaku-Bold' },
});

export default QuestionPickerSheet;
