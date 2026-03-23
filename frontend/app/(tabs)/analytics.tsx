import { useAppTheme } from '@/hooks/useAppTheme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { useUserStore } from '@/stores/userStore';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { ChevronDown, ChevronRight, ArrowUpDown } from 'lucide-react-native';
import AdBanner from '@/components/AdBanner';

type SortKey = 'default' | 'rate' | 'answered';
type SortDir = 'asc' | 'desc';
const SORT_LABELS: Record<SortKey, string> = { default: '登録順', rate: '正答率', answered: '解答数' };

export default function AnalyticsScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const quizBooks = useQuizBookStore(state => state.quizBooks);
  const categories = useQuizBookStore(state => state.categories);
  const fetchQuizBooks = useQuizBookStore(state => state.fetchQuizBooks);
  const fetchCategories = useQuizBookStore(state => state.fetchCategories);
  const activityData = useUserStore(state => state.activityData);
  const fetchActivity = useUserStore(state => state.fetchActivity);
  const { needsRefresh, setNeedsRefresh } = useAnalyticsStore();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!hasLoaded || needsRefresh) {
      setIsLoading(true);
      Promise.all([fetchQuizBooks(), fetchCategories(), fetchActivity()]).finally(() => {
        setIsLoading(false); setHasLoaded(true);
        if (needsRefresh) setNeedsRefresh(false);
      });
    }
  }, [hasLoaded, needsRefresh]));

  const selectedCategory = categories.find(c => c.id === selectedCategoryId) || categories[0];
  const categoryBooks = useMemo(() => quizBooks.filter(b => b.category?.id === selectedCategory?.id), [quizBooks, selectedCategory]);

  const kpis = useMemo(() => {
    let totalAnswered = 0, totalCorrect = 0, totalQuestions = 0;
    quizBooks.forEach(book => book.chapters.forEach(ch => {
      const process = (answers: any[]) => { totalQuestions += answers.length; answers.forEach((qa: any) => {
        const confirmed = qa.attempts?.filter((a: any) => a.resultConfirmFlg) || [];
        totalAnswered += confirmed.length;
        totalCorrect += confirmed.filter((a: any) => a.result === '○').length;
      }); };
      if (ch.sections?.length) ch.sections.forEach(s => { if (s.questionAnswers) process(s.questionAnswers); else totalQuestions += s.questionCount || 0; });
      else if (ch.questionAnswers) process(ch.questionAnswers);
      else totalQuestions += ch.questionCount || 0;
    }));
    let streak = 0;
    for (const d of [...activityData].sort((a, b) => b.date.localeCompare(a.date))) { if (d.count > 0) streak++; else break; }
    return { totalQuestions, totalAnswered, accuracy: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0, streak };
  }, [quizBooks, activityData]);

  const bookStats = useMemo(() => categoryBooks.map(book => {
    let answered = 0, correct = 0;
    book.chapters.forEach(ch => {
      const process = (answers: any[]) => answers.forEach((qa: any) => {
        const confirmed = qa.attempts?.filter((a: any) => a.resultConfirmFlg) || [];
        answered += confirmed.length;
        correct += confirmed.filter((a: any) => a.result === '○').length;
      });
      if (ch.sections?.length) ch.sections.forEach(s => { if (s.questionAnswers) process(s.questionAnswers); });
      else if (ch.questionAnswers) process(ch.questionAnswers);
    });
    return { id: book.id, title: book.title, rate: answered > 0 ? Math.round((correct / answered) * 100) : 0, answered };
  }), [categoryBooks]);

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

  if (isLoading) {
    return <SafeAreaView style={styles.container}><View style={styles.loading}><ActivityIndicator size="large" color={theme.colors.primary[600]} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>分析</Text>

        <View style={styles.kpiRow}>
          <View style={styles.kpiItem}><Text style={[styles.kpiValue, { color: theme.colors.secondary[900] }]}>{kpis.totalQuestions}</Text><Text style={styles.kpiLabel}>総問題数</Text></View>
          <View style={styles.kpiItem}><Text style={[styles.kpiValue, { color: theme.colors.secondary[900] }]}>{kpis.totalAnswered}</Text><Text style={styles.kpiLabel}>総解答数</Text></View>
          <View style={styles.kpiItem}><Text style={[styles.kpiValue, { color: theme.colors.success[500] }]}>{kpis.accuracy}%</Text><Text style={styles.kpiLabel}>正答率</Text></View>
          <View style={styles.kpiItem}><Text style={[styles.kpiValue, { color: theme.colors.primary[600] }]}>{kpis.streak}</Text><Text style={styles.kpiLabel}>日連続</Text></View>
        </View>

        {categories.length > 0 && (
          <TouchableOpacity style={styles.selector} onPress={() => setCategoryPickerVisible(true)} activeOpacity={0.7}>
            <Text style={styles.selectorText}>{selectedCategory?.name || '資格グループを選択'}</Text>
            <ChevronDown size={18} color={theme.colors.primary[600]} />
          </TouchableOpacity>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>問題集別 正答率</Text>
          <View style={styles.sortBar}>
            {(['default', 'rate', 'answered'] as SortKey[]).map(key => (
              <TouchableOpacity key={key} style={[styles.sortBtn, sortKey === key && styles.sortBtnActive]} onPress={() => toggleSort(key)} activeOpacity={0.7}>
                <Text style={[styles.sortBtnText, sortKey === key && styles.sortBtnTextActive]}>{SORT_LABELS[key]}</Text>
                {sortKey === key && <ArrowUpDown size={12} color={theme.colors.primary[600]} />}
              </TouchableOpacity>
            ))}
          </View>
          {bookStats.length === 0 ? <Text style={styles.emptyText}>この資格に問題集がありません</Text> : (
            sortItems(bookStats).map(book => (
              <TouchableOpacity key={book.id} style={styles.barRow} onPress={() => router.push({ pathname: '/book-detail', params: { bookId: book.id } })} activeOpacity={0.7}>
                <View style={styles.barInfo}>
                  <Text style={styles.barBookName}>{book.title}</Text>
                  <View style={styles.barBg}><View style={[styles.barFill, { width: `${book.rate}%`, backgroundColor: barColor(book.rate) }]} /></View>
                </View>
                <Text style={[styles.barValue, { color: barColor(book.rate) }]}>{book.answered > 0 ? `${book.rate}%` : '—'}</Text>
                <ChevronRight size={14} color={theme.colors.secondary[300]} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <AdBanner />

      <Modal visible={categoryPickerVisible} transparent animationType="fade" onRequestClose={() => setCategoryPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setCategoryPickerVisible(false)} />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>資格グループを選択</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map(cat => (
                <TouchableOpacity key={cat.id} style={[styles.pickerItem, selectedCategory?.id === cat.id && styles.pickerItemActive]} onPress={() => { setSelectedCategoryId(cat.id); setSortKey('default'); setCategoryPickerVisible(false); }} activeOpacity={0.7}>
                  <Text style={[styles.pickerItemText, selectedCategory?.id === cat.id && styles.pickerItemTextActive]}>{cat.name}</Text>
                  <Text style={styles.pickerItemCount}>{quizBooks.filter(b => b.category?.id === cat.id).length}冊</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, gap: 20, paddingBottom: 80 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold' },

  kpiRow: { flexDirection: 'row', gap: 10 },
  kpiItem: { flex: 1, alignItems: 'center', gap: 2, backgroundColor: theme.colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: theme.colors.secondary[200] },
  kpiValue: { fontSize: 22, fontWeight: '700', fontFamily: 'ZenKaku-Bold' },
  kpiLabel: { fontSize: 10, color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Regular' },

  selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.secondary[200], paddingHorizontal: 16, paddingVertical: 14 },
  selectorText: { fontSize: 15, fontWeight: '600', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold', flex: 1 },

  card: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, gap: 14, borderWidth: 1, borderColor: theme.colors.secondary[200] },
  cardTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold' },

  sortBar: { flexDirection: 'row', gap: 8 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: theme.colors.background },
  sortBtnActive: { backgroundColor: theme.colors.primary[50] },
  sortBtnText: { fontSize: 11, color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Regular' },
  sortBtnTextActive: { color: theme.colors.primary[600], fontWeight: '600', fontFamily: 'ZenKaku-Bold' },

  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barInfo: { flex: 1, gap: 6 },
  barBookName: { fontSize: 13, fontWeight: '500', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Medium' },
  barBg: { flex: 1, height: 20, borderRadius: 4, backgroundColor: theme.colors.secondary[200] },
  barFill: { height: 20, borderRadius: 4 },
  barValue: { fontSize: 12, fontWeight: '600', fontFamily: 'ZenKaku-Bold', width: 32, textAlign: 'right' },
  emptyText: { fontSize: 13, color: theme.colors.secondary[400], fontFamily: 'ZenKaku-Regular', textAlign: 'center', padding: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: '60%' },
  pickerHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.secondary[200], alignSelf: 'center', marginBottom: 16 },
  pickerTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold', marginBottom: 12 },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4 },
  pickerItemActive: { backgroundColor: theme.colors.primary[50] },
  pickerItemText: { fontSize: 15, color: theme.colors.secondary[700], fontFamily: 'ZenKaku-Regular' },
  pickerItemTextActive: { color: theme.colors.primary[600], fontWeight: '600', fontFamily: 'ZenKaku-Bold' },
  pickerItemCount: { fontSize: 13, color: theme.colors.secondary[400], fontFamily: 'ZenKaku-Regular' },
});
