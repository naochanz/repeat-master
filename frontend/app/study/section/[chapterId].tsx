import EditDeleteModal from '@/app/_compornents/EditDeleteModal';
import LoadingOverlay from '@/app/_compornents/LoadingOverlay';
// CustomTabBar removed from section screen
import BottomSheet from '@/components/BottomSheet';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { MoreVertical, Plus, X, CircleCheck, ChevronRight, Play } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SectionList = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { chapterId } = useLocalSearchParams();

  const quizBooks = useQuizBookStore(state => state.quizBooks);
  const isLoading = useQuizBookStore(state => state.isLoading);
  const fetchQuizBooks = useQuizBookStore(state => state.fetchQuizBooks);
  const addSectionToChapter = useQuizBookStore(state => state.addSection);
  const deleteSectionFromChapter = useQuizBookStore(state => state.deleteSection);
  const updateSectionInChapter = useQuizBookStore(state => state.updateSection);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [editingSection, setEditingSection] = useState<any>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { fetchQuizBooks(); }, [fetchQuizBooks]));

  let chapterData: any = null;
  for (const book of quizBooks) {
    const chapter = book.chapters.find((ch: any) => ch.id === chapterId);
    if (chapter) { chapterData = { book, chapter }; break; }
  }

  if (!chapterData) {
    return <View style={styles.container}><Text style={styles.emptyText}>章が見つかりません</Text></View>;
  }

  const { book, chapter } = chapterData;
  const sections = chapter.sections || [];
  const isCompleted = !!book.completedAt;

  const getSectionStats = (section: any) => {
    let answered = 0, correct = 0;
    section.questionAnswers?.forEach((qa: any) => {
      const confirmed = qa.attempts?.filter((a: any) => a.resultConfirmFlg) || [];
      answered += confirmed.length;
      correct += confirmed.filter((a: any) => a.result === '○').length;
    });
    return { answered, correct, rate: answered > 0 ? Math.round((correct / answered) * 100) : 0 };
  };

  const handleSectionPress = (sectionId: string) => {
    if (activeMenu) return;
    router.push({ pathname: '/study/question/[id]', params: { id: sectionId } });
  };

  const handleAddSection = async () => {
    await addSectionToChapter(book.id, chapter.id, sections.length + 1, newSectionTitle.trim() || undefined, 0);
    setNewSectionTitle(''); setShowAddModal(false);
  };

  const handleSaveSection = async (newTitle: string) => {
    if (editingSection && newTitle.trim()) await updateSectionInChapter(book.id, chapter.id, editingSection.id, { title: newTitle.trim() });
    setActiveMenu(null); setEditingSection(null);
  };

  const handleDeleteSection = async () => {
    if (editingSection) await deleteSectionFromChapter(book.id, chapter.id, editingSection.id);
    setActiveMenu(null); setEditingSection(null);
  };

  const chapterTitle = chapter.title?.trim()
    ? `第${chapter.chapterNumber}章 ${chapter.title}`
    : `第${chapter.chapterNumber}章`;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <X size={24} color={theme.colors.secondary[500]} />
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1}>{chapterTitle}</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Progress Card */}
          <View style={styles.heroCard}>
            <View style={styles.progressSection}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>進捗</Text>
                <Text style={styles.progressValue}>{sections.reduce((s: number, sec: any) => s + (getSectionStats(sec).answered > 0 ? 1 : 0), 0)} / {sections.length} 節</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: sections.length > 0 ? `${(sections.reduce((s: number, sec: any) => s + (getSectionStats(sec).answered > 0 ? 1 : 0), 0) / sections.length) * 100}%` : '0%' }]} />
              </View>
            </View>
            <View style={styles.progressSection}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>正答率</Text>
                <Text style={styles.progressValue}>{(() => { let a = 0, c = 0; sections.forEach((sec: any) => { const s = getSectionStats(sec); a += s.answered; c += s.correct; }); return a > 0 ? `${c} / ${a}` : '0 / 0'; })()}</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFillSuccess, { width: (() => { let a = 0, c = 0; sections.forEach((sec: any) => { const s = getSectionStats(sec); a += s.answered; c += s.correct; }); return a > 0 ? `${Math.round((c / a) * 100)}%` : '0%'; })() }]} />
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>節一覧</Text>

          {sections.length === 0 ? (
            <View style={styles.empty}><Text style={styles.emptyText}>節を追加してください</Text></View>
          ) : (
            <View style={styles.sectionList}>
              {sections.map((section: any) => {
                const stats = getSectionStats(section);
                const isActive = stats.rate > 0 && stats.rate < 100;
                return (
                  <TouchableOpacity key={section.id} style={[styles.sectionCard, isActive && styles.sectionCardActive]} onPress={() => handleSectionPress(section.id)} activeOpacity={0.7}>
                    <View style={[styles.sectionNum, isActive && styles.sectionNumActive]}>
                      <Text style={[styles.sectionNumText, isActive && styles.sectionNumTextActive]}>{section.sectionNumber}</Text>
                    </View>
                    <View style={styles.sectionInfo}>
                      <Text style={styles.sectionName} numberOfLines={1}>{section.title || `第${section.sectionNumber}節`}</Text>
                      <Text style={styles.sectionSub}>{section.questionCount}問{stats.rate > 0 ? ` · 正答率 ${stats.rate}%` : ''}</Text>
                    </View>
                    {!isCompleted && (
                      <TouchableOpacity style={styles.sectionMenu} onPress={(e) => { e.stopPropagation(); setEditingSection(section); setActiveMenu(section.id); }} hitSlop={8}>
                        <MoreVertical size={18} color={theme.colors.secondary[400]} />
                      </TouchableOpacity>
                    )}
                    {stats.rate === 100 ? <CircleCheck size={20} color={theme.colors.success[500]} /> : isActive ? <Play size={18} color={theme.colors.primary[600]} /> : <ChevronRight size={18} color={theme.colors.secondary[300]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {!isCompleted && (
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.7}>
              <Plus size={20} color={theme.colors.primary[600]} />
              <Text style={styles.addBtnText}>節を追加</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Add Section */}
        <BottomSheet visible={showAddModal} onClose={() => setShowAddModal(false)}>
          <View style={{ gap: 16 }}>
            <Text style={styles.modalTitle}>節を追加</Text>
            <TextInput style={styles.modalInput} value={newSectionTitle} onChangeText={setNewSectionTitle} placeholder="節名を入力（任意）" placeholderTextColor={theme.colors.secondary[400]} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => { setShowAddModal(false); setNewSectionTitle(''); }}><Text style={styles.cancelBtnText}>キャンセル</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={handleAddSection}>{isLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.confirmBtnText}>追加</Text>}</TouchableOpacity>
            </View>
          </View>
        </BottomSheet>

        <EditDeleteModal visible={!!activeMenu && !!editingSection} onClose={() => { setActiveMenu(null); setEditingSection(null); }} onSave={handleSaveSection} onDelete={handleDeleteSection} title="節の編集" editLabel="節名" editValue={editingSection?.title || ''} editPlaceholder="節名を入力" isLoading={isLoading} />

        {/* TabBar removed */}
        <LoadingOverlay visible={isLoading} />
      </SafeAreaView>
    </>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 52 },
  navTitle: { fontSize: 17, fontWeight: '600', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold', flex: 1, textAlign: 'center', marginHorizontal: 12 },
  content: { padding: 20, gap: 20, paddingBottom: 100 },

  heroCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.colors.secondary[200], gap: 12 },
  progressSection: { gap: 6 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 12, color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Regular' },
  progressValue: { fontSize: 12, fontWeight: '600', color: theme.colors.secondary[700], fontFamily: 'ZenKaku-Bold' },
  progressBg: { height: 8, borderRadius: 4, backgroundColor: theme.colors.secondary[200] },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: theme.colors.primary[600] },
  progressFillSuccess: { height: 8, borderRadius: 4, backgroundColor: theme.colors.success[500] },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold' },
  sectionList: { gap: 8 },
  sectionCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, paddingHorizontal: 16, backgroundColor: theme.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.secondary[200] },
  sectionCardActive: { borderColor: theme.colors.primary[200], borderWidth: 2 },
  sectionNum: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.primary[50], justifyContent: 'center', alignItems: 'center' },
  sectionNumActive: { backgroundColor: theme.colors.primary[200] },
  sectionNumText: { fontSize: 16, fontWeight: '700', color: theme.colors.primary[600], fontFamily: 'ZenKaku-Bold' },
  sectionNumTextActive: { color: theme.colors.primary[600] },
  sectionInfo: { flex: 1, gap: 2 },
  sectionName: { fontSize: 14, fontWeight: '500', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Medium' },
  sectionSub: { fontSize: 11, color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Regular' },
  sectionMenu: { padding: 4 },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, borderWidth: 2, borderColor: theme.colors.primary[200], borderStyle: 'dashed', gap: 8 } as any,
  addBtnText: { fontSize: 14, fontWeight: '700', color: theme.colors.primary[600], fontFamily: 'ZenKaku-Bold' },

  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: theme.colors.secondary[400], fontFamily: 'ZenKaku-Regular' },

  modalTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold' },
  modalInput: { borderWidth: 1, borderColor: theme.colors.secondary[200], borderRadius: 14, padding: 16, fontSize: 16, fontFamily: 'ZenKaku-Regular', color: theme.colors.secondary[900], backgroundColor: theme.colors.background },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: theme.colors.secondary[100] },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: theme.colors.secondary[600], fontFamily: 'ZenKaku-Bold' },
  confirmBtn: { backgroundColor: theme.colors.primary[600] },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', fontFamily: 'ZenKaku-Bold' },
});

export default SectionList;
