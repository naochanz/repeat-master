import { useAppTheme } from '@/hooks/useAppTheme';
import { Attempt } from '@/types/QuizBook';
import { getCardColors, getQuestionColor } from '@/src/utils/questionHelpers';
import { TrendingUp, TrendingDown, StickyNote, ChevronDown, ChevronUp } from 'lucide-react-native';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface QuestionViewProps {
  questionNumber: number;
  attempts: Attempt[];
  memo?: string;
  chapterId?: string;
  sectionId?: string | null;
  readOnly?: boolean;
}

const QuestionView = ({ questionNumber, attempts, memo, chapterId, sectionId, readOnly }: QuestionViewProps) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [memoExpanded, setMemoExpanded] = useState(false);

  useEffect(() => { setMemoExpanded(false); }, [questionNumber]);

  const confirmedAttempts = attempts.filter(a => a.resultConfirmFlg);
  const cardColors = getCardColors(confirmedAttempts);

  const insight = useMemo(() => {
    if (confirmedAttempts.length === 0) return null;
    let consecutive = 0;
    for (let i = confirmedAttempts.length - 1; i >= 0; i--) {
      if (confirmedAttempts[i].result === '○') consecutive++;
      else break;
    }
    if (consecutive >= 3) return { text: `${consecutive}連続正解中 — もう大丈夫かも？`, type: 'positive' as const };
    if (consecutive >= 2) return { text: `直近${consecutive}回連続正解中`, type: 'positive' as const };
    let wrongStreak = 0;
    for (let i = confirmedAttempts.length - 1; i >= 0; i--) {
      if (confirmedAttempts[i].result === '×') wrongStreak++;
      else break;
    }
    if (wrongStreak >= 2) return { text: `${wrongStreak}回連続不正解 — 要復習`, type: 'negative' as const };
    return null;
  }, [confirmedAttempts]);

  const dotColor = (color: string) => {
    const map: Record<string, string> = {
      gold: '#D4A643', silver: '#AAAAAA', green: theme.colors.success[500],
      red: theme.colors.error[500], gray: theme.colors.secondary[200],
    };
    return map[color] || theme.colors.secondary[200];
  };

  const handleEditMemo = () => {
    if (readOnly || !chapterId) return;
    router.push({
      pathname: '/memo-edit',
      params: { chapterId, sectionId: sectionId || '', questionNumber: String(questionNumber), initialMemo: memo || '' },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.questionNum}>問 {questionNumber}</Text>
      {confirmedAttempts.length > 0 && (
        <View style={styles.roundBadge}>
          <Text style={styles.roundText}>{confirmedAttempts.length + 1}回目</Text>
        </View>
      )}

      {/* Unified Card: History + Memo */}
      <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
        {/* History Section */}
        {confirmedAttempts.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>これまでの結果</Text>
            <View style={styles.dotRow}>
              {cardColors.map((color, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <Text style={styles.arrow}>→</Text>}
                  <View style={styles.dotItem}>
                    <View style={[styles.dot, { backgroundColor: dotColor(color) }]} />
                    <Text style={styles.dotLabel}>{i + 1}周</Text>
                  </View>
                </React.Fragment>
              ))}
              <Text style={styles.arrow}>→</Text>
              <View style={styles.dotItem}>
                <View style={[styles.dotNext, { borderColor: theme.colors.primary[600] }]} />
                <Text style={[styles.dotLabel, { color: theme.colors.primary[600], fontWeight: '600' }]}>{confirmedAttempts.length + 1}周</Text>
              </View>
            </View>
            {insight && (
              <View style={[styles.insightBadge, { backgroundColor: insight.type === 'positive' ? theme.colors.success[50] : theme.colors.error[50] }]}>
                {insight.type === 'positive'
                  ? <TrendingUp size={13} color={theme.colors.success[500]} />
                  : <TrendingDown size={13} color={theme.colors.error[500]} />}
                <Text style={[styles.insightText, { color: insight.type === 'positive' ? theme.colors.success[500] : theme.colors.error[500] }]}>
                  {insight.text}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Divider */}
        {confirmedAttempts.length > 0 && chapterId && <View style={styles.divider} />}

        {/* Memo Section */}
        {chapterId && (
          <>
            <TouchableOpacity style={styles.memoHeader} onPress={() => setMemoExpanded(!memoExpanded)} activeOpacity={0.7}>
              <View style={styles.memoHeaderLeft}>
                <StickyNote size={14} color={memo ? theme.colors.primary[600] : theme.colors.secondary[400]} />
                <Text style={[styles.memoHeaderText, memo && styles.memoHeaderTextActive]}>{memo ? 'メモ' : 'メモを表示'}</Text>
              </View>
              {memoExpanded ? <ChevronUp size={14} color={theme.colors.secondary[400]} /> : <ChevronDown size={14} color={theme.colors.secondary[400]} />}
            </TouchableOpacity>
            {memoExpanded && (
              <TouchableOpacity onPress={handleEditMemo} activeOpacity={readOnly ? 1 : 0.7}>
                <ScrollView style={styles.memoScroll} nestedScrollEnabled>
                  <Text style={memo ? styles.memoText : styles.memoPlaceholder}>
                    {memo || 'タップしてメモを入力...'}
                  </Text>
                </ScrollView>
              </TouchableOpacity>
            )}
          </>
        )}
      </Pressable>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: { width: '100%', alignItems: 'center', gap: 8 },
  questionNum: { fontSize: 48, fontWeight: '800', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold', letterSpacing: -2 },
  roundBadge: { height: 22, borderRadius: 11, backgroundColor: theme.colors.primary[50], paddingHorizontal: 10, justifyContent: 'center' },
  roundText: { fontSize: 11, fontWeight: '600', color: theme.colors.primary[600], fontFamily: 'ZenKaku-Bold' },

  card: { width: '100%', backgroundColor: theme.colors.surface, borderRadius: 16, padding: 14, paddingHorizontal: 18, gap: 12, borderWidth: 1, borderColor: theme.colors.secondary[200], marginTop: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: theme.colors.secondary[500], letterSpacing: 0.5 },
  dotRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 2 },
  dotItem: { alignItems: 'center', gap: 3 },
  dot: { width: 22, height: 22, borderRadius: 11 },
  dotNext: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderStyle: 'dashed' },
  dotLabel: { fontSize: 8, color: theme.colors.secondary[500] },
  arrow: { fontSize: 12, color: theme.colors.secondary[200], marginHorizontal: 2 },
  insightBadge: { height: 28, borderRadius: 8, flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center' },
  insightText: { fontSize: 11, fontWeight: '500' },

  divider: { height: 1, backgroundColor: theme.colors.secondary[200] },

  memoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  memoHeaderLeft: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  memoHeaderText: { fontSize: 13, color: theme.colors.secondary[400], fontFamily: 'ZenKaku-Regular' },
  memoHeaderTextActive: { color: theme.colors.primary[600], fontWeight: '600', fontFamily: 'ZenKaku-Bold' },
  memoScroll: { maxHeight: 100 },
  memoText: { fontSize: 13, color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Regular', lineHeight: 20 },
  memoPlaceholder: { fontSize: 13, color: theme.colors.secondary[400], fontFamily: 'ZenKaku-Regular' },
});

export default QuestionView;
