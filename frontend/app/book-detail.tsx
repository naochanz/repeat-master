import { useAppTheme } from '@/hooks/useAppTheme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { X, ArrowUpDown } from 'lucide-react-native';

type SortKey = 'default' | 'rate' | 'answered';
type SortDir = 'asc' | 'desc';
const SORT_LABELS: Record<SortKey, string> = { default: '登録順', rate: '正答率', answered: '解答数' };

export default function BookDetailScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { bookId } = useLocalSearchParams<{ bookId: string }>();

  const quizBooks = useQuizBookStore(state => state.quizBooks);
  const categories = useQuizBookStore(state => state.categories);
  const book = quizBooks.find(b => b.id === bookId);
  const category = categories.find(c => c.id === book?.categoryId);

  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  if (!book) return <View style={styles.container}><Text>データが見つかりません</Text></View>;

  // Collect rounds
  const allRounds = new Set<number>();
  book.chapters.forEach(ch => {
    const collect = (answers: any[]) => answers.forEach((qa: any) => {
      qa.attempts?.filter((a: any) => a.resultConfirmFlg).forEach((a: any) => allRounds.add(a.round));
    });
    if (ch.sections?.length) ch.sections.forEach(s => { if (s.questionAnswers) collect(s.questionAnswers); });
    else if (ch.questionAnswers) collect(ch.questionAnswers);
  });
  const rounds = [...allRounds].sort((a, b) => a - b);
  const latestRound = rounds[rounds.length - 1] || 1;

  const getChapterStatsForRound = (round: number) => book.chapters.map(ch => {
    let answered = 0, correct = 0;
    const process = (answers: any[]) => answers.forEach((qa: any) => {
      const attempt = qa.attempts?.find((a: any) => a.round === round && a.resultConfirmFlg);
      if (attempt) { answered++; if (attempt.result === '○') correct++; }
    });
    if (ch.sections?.length) ch.sections.forEach(s => { if (s.questionAnswers) process(s.questionAnswers); });
    else if (ch.questionAnswers) process(ch.questionAnswers);
    return { chapterNumber: ch.chapterNumber, title: ch.title, rate: answered > 0 ? Math.round((correct / answered) * 100) : 0, answered };
  });

  // Current chapter stats (all attempts)
  const chapterStats = book.chapters.map(ch => {
    let answered = 0, correct = 0;
    const process = (answers: any[]) => answers.forEach((qa: any) => {
      const confirmed = qa.attempts?.filter((a: any) => a.resultConfirmFlg) || [];
      answered += confirmed.length;
      correct += confirmed.filter((a: any) => a.result === '○').length;
    });
    if (ch.sections?.length) ch.sections.forEach(s => { if (s.questionAnswers) process(s.questionAnswers); });
    else if (ch.questionAnswers) process(ch.questionAnswers);
    return { chapterNumber: ch.chapterNumber, title: ch.title, rate: answered > 0 ? Math.round((correct / answered) * 100) : 0, answered };
  });

  const sortItems = <T extends { rate: number; answered: number }>(items: T[]): T[] => {
    if (sortKey === 'default') return items;
    return [...items].sort((a, b) => {
      const va = sortKey === 'rate' ? a.rate : a.answered;
      const vb = sortKey === 'rate' ? b.rate : b.answered;
      return sortDir === 'asc' ? va - vb : vb - va;
    });
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const barColor = (rate: number) => {
    if (rate >= 80) return theme.colors.success[500];
    if (rate >= 50) return theme.colors.primary[600];
    return theme.colors.error[500];
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.subtitle}>{category?.name}</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <X size={24} color={theme.colors.secondary[500]} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Sort */}
          <View style={styles.sortBar}>
            {(['default', 'rate', 'answered'] as SortKey[]).map(key => (
              <TouchableOpacity key={key} style={[styles.sortBtn, sortKey === key && styles.sortBtnActive]} onPress={() => toggleSort(key)} activeOpacity={0.7}>
                <Text style={[styles.sortBtnText, sortKey === key && styles.sortBtnTextActive]}>{SORT_LABELS[key]}</Text>
                {sortKey === key && <ArrowUpDown size={12} color={theme.colors.primary[600]} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Chapter Bars */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>章別 正答率</Text>
            {sortItems(chapterStats).map(ch => (
              <View key={ch.chapterNumber} style={styles.barRow}>
                <Text style={styles.barLabel}>第{ch.chapterNumber}章</Text>
                <View style={styles.barBg}><View style={[styles.barFill, { width: `${ch.rate}%`, backgroundColor: barColor(ch.rate) }]} /></View>
                <Text style={[styles.barValue, { color: barColor(ch.rate) }]}>{ch.answered > 0 ? `${ch.rate}%` : '—'}</Text>
              </View>
            ))}
          </View>

          {/* Round Comparison */}
          {rounds.length >= 2 && (() => {
            const prevRound = rounds[rounds.length - 2];
            const prevStats = getChapterStatsForRound(prevRound);
            const currStats = getChapterStatsForRound(latestRound);
            return (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>前回比較（{prevRound}周目 → {latestRound}周目）</Text>
                {currStats.map((ch, i) => {
                  const prev = prevStats[i];
                  const diff = ch.rate - (prev?.rate || 0);
                  const hasBoth = ch.answered > 0 && (prev?.answered || 0) > 0;
                  if (!hasBoth) return null;
                  return (
                    <View key={ch.chapterNumber} style={styles.compareRow}>
                      <View style={styles.compareHeader}>
                        <Text style={styles.compareChapter}>第{ch.chapterNumber}章</Text>
                        <Text style={[styles.compareDiff, { color: diff >= 0 ? theme.colors.success[500] : theme.colors.error[500] }]}>{diff >= 0 ? '+' : ''}{diff}%</Text>
                      </View>
                      <View style={styles.compareBars}>
                        <View style={styles.compareBarWrap}>
                          <View style={styles.barBg}><View style={[styles.compareBarOld, { width: `${prev.rate}%` }]} /></View>
                          <Text style={styles.compareBarLabel}>{prev.rate}%</Text>
                        </View>
                        <View style={styles.compareBarWrap}>
                          <View style={styles.barBg}><View style={[styles.barFill, { width: `${ch.rate}%`, backgroundColor: barColor(ch.rate) }]} /></View>
                          <Text style={[styles.barValue, { color: barColor(ch.rate) }]}>{ch.rate}%</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })()}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 12 },
  headerLeft: { flex: 1, gap: 4, marginRight: 16 },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold' },
  subtitle: { fontSize: 14, color: theme.colors.primary[600], fontFamily: 'ZenKaku-Regular' },
  content: { padding: 20, paddingTop: 0, gap: 16, paddingBottom: 40 },

  sortBar: { flexDirection: 'row', gap: 8 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: [6, 10] as any, borderRadius: 8, backgroundColor: theme.colors.background },
  sortBtnActive: { backgroundColor: theme.colors.primary[50] },
  sortBtnText: { fontSize: 11, color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Regular' },
  sortBtnTextActive: { color: theme.colors.primary[600], fontWeight: '600', fontFamily: 'ZenKaku-Bold' },

  card: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, gap: 14, borderWidth: 1, borderColor: theme.colors.secondary[200] },
  cardTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { fontSize: 11, color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Regular', width: 40 },
  barBg: { flex: 1, height: 20, borderRadius: 4, backgroundColor: theme.colors.secondary[200] },
  barFill: { height: 20, borderRadius: 4 },
  barValue: { fontSize: 12, fontWeight: '600', fontFamily: 'ZenKaku-Bold', width: 32, textAlign: 'right' },

  compareRow: { gap: 6 },
  compareHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compareChapter: { fontSize: 13, fontWeight: '500', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Medium' },
  compareDiff: { fontSize: 13, fontWeight: '700', fontFamily: 'ZenKaku-Bold' },
  compareBars: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  compareBarWrap: { flex: 1, flexDirection: 'row', gap: 4, alignItems: 'center' },
  compareBarOld: { height: 20, borderRadius: 4, backgroundColor: theme.colors.secondary[300] },
  compareBarLabel: { fontSize: 10, color: theme.colors.secondary[400], width: 28, textAlign: 'right' },
});
