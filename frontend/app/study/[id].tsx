import EditDeleteModal from '@/app/_compornents/EditDeleteModal';
import LoadingOverlay from '@/app/_compornents/LoadingOverlay';
// CustomTabBar removed from study screen
import { useAppTheme } from '@/hooks/useAppTheme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AlertCircle, MoreVertical, Plus, X, CircleCheck, ChevronRight, Play } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BottomSheet from '@/components/BottomSheet';
import { Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGuideStore } from '@/stores/guideStore';
import GuideOverlay from '@/components/GuideOverlay';
import { usePulse } from '@/hooks/usePulse';

const StudyHome = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { id } = useLocalSearchParams();

  const quizBooks = useQuizBookStore(state => state.quizBooks);
  const isLoading = useQuizBookStore(state => state.isLoading);
  const fetchQuizBooks = useQuizBookStore(state => state.fetchQuizBooks);
  const addChapterToQuizBook = useQuizBookStore(state => state.addChapter);
  const deleteChapterFromQuizBook = useQuizBookStore(state => state.deleteChapter);
  const updateChapterInQuizBook = useQuizBookStore(state => state.updateChapter);
  const updateQuizBook = useQuizBookStore(state => state.updateQuizBook);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showConfirmRoundModal, setShowConfirmRoundModal] = useState(false);
  const [unansweredWarning, setUnansweredWarning] = useState('');
  const guideStep = useGuideStore(state => state.currentStep);
  const advanceGuide = useGuideStore(state => state.advance);
  const addPulse = usePulse(guideStep === 'study_tap_add_chapter');
  const chapPulse = usePulse(guideStep === 'study_tap_chapter');

  useFocusEffect(useCallback(() => { fetchQuizBooks(); }, [fetchQuizBooks]));

  const quizBook = quizBooks.find(book => book.id === id);
  const isCompleted = !!quizBook?.completedAt;

  if (!quizBook) {
    return <View style={styles.container}><Text style={styles.emptyText}>問題集が存在しません</Text></View>;
  }

  const displayRound = (quizBook.currentRound || 0) + 1;

  const getChapterTotalQuestions = (chapter: typeof quizBook.chapters[0]) => {
    if (chapter.sections?.length) return chapter.sections.reduce((sum, s) => sum + s.questionCount, 0);
    return chapter.questionCount || 0;
  };

  const getChapterRate = (chapter: typeof quizBook.chapters[0]) => {
    const chapterDisplayRound = (chapter.currentRound || 0) + 1;
    let total = 0, correct = 0;
    const processAnswers = (answers: any[]) => {
      answers.forEach(qa => {
        const attempt = qa.attempts?.find((a: any) => a.round === chapterDisplayRound && a.resultConfirmFlg);
        if (attempt) { total++; if (attempt.result === '○') correct++; }
      });
    };
    if (chapter.sections?.length) chapter.sections.forEach(s => { if (s.questionAnswers) processAnswers(s.questionAnswers); });
    else if (chapter.questionAnswers) processAnswers(chapter.questionAnswers);
    return total === 0 ? 0 : Math.round((correct / total) * 100);
  };

  const totalQuestions = useMemo(() => quizBook.chapters.reduce((sum, ch) => sum + getChapterTotalQuestions(ch), 0), [quizBook]);

  const roundStats = useMemo(() => {
    let answered = 0, correct = 0;
    const process = (answers: any[]) => {
      answers.forEach(qa => {
        const attempt = qa.attempts?.find((a: any) => a.round === displayRound && a.resultConfirmFlg);
        if (attempt) { answered++; if (attempt.result === '○') correct++; }
      });
    };
    quizBook.chapters.forEach(ch => {
      if (ch.sections?.length) ch.sections.forEach(s => { if (s.questionAnswers) process(s.questionAnswers); });
      else if (ch.questionAnswers) process(ch.questionAnswers);
    });
    return { answered, correct };
  }, [quizBook, displayRound]);

  const handleChapterPress = (chapter: typeof quizBook.chapters[0]) => {
    if (activeMenu) return;
    if (guideStep === 'study_tap_chapter') advanceGuide();
    if (quizBook.useSections) router.push({ pathname: '/study/section/[chapterId]', params: { chapterId: chapter.id } });
    else router.push({ pathname: '/study/question/[id]', params: { id: chapter.id } });
  };

  const handleAddChapter = async () => {
    await addChapterToQuizBook(quizBook.id, quizBook.chapters.length + 1, newChapterTitle.trim() || undefined);
    setNewChapterTitle(''); setShowAddModal(false);
    if (guideStep === 'study_tap_add_chapter') advanceGuide(); // → study_tap_chapter
  };

  const handleSaveChapter = async (newTitle: string) => {
    if (editingChapter && newTitle.trim()) await updateChapterInQuizBook(quizBook.id, editingChapter.id, { title: newTitle.trim() });
    setActiveMenu(null); setEditingChapter(null);
  };

  const handleDeleteChapter = async () => {
    if (editingChapter) await deleteChapterFromQuizBook(quizBook.id, editingChapter.id);
    setActiveMenu(null); setEditingChapter(null);
  };

  const handleConfirmRound = () => {
    let unanswered = 0;
    quizBook.chapters.forEach(ch => {
      const check = (answers: any[]) => answers.forEach(qa => { if (!qa.attempts?.some((a: any) => a.round === displayRound)) unanswered++; });
      if (ch.sections?.length) ch.sections.forEach(s => { if (s.questionAnswers) check(s.questionAnswers); });
      else if (ch.questionAnswers) check(ch.questionAnswers);
    });
    setUnansweredWarning(unanswered > 0 ? `第${displayRound}周で未回答の問題が${unanswered}問あります。` : '');
    setShowConfirmRoundModal(true);
  };

  const handleExecuteConfirmRound = async () => {
    await updateQuizBook(quizBook.id, { currentRound: (quizBook.currentRound || 0) + 1 });
    setShowConfirmRoundModal(false); setUnansweredWarning('');
  };

  return (
    <>
      <Stack.Screen options={{
        headerTitle: () => <Text numberOfLines={1} style={styles.headerTitle}>{quizBook.title}</Text>,
        headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}><X size={24} color={theme.colors.secondary[500]} /></TouchableOpacity>,
        headerStyle: { backgroundColor: theme.colors.background },
        headerShadowVisible: false,
      }} />
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Card */}
          <View style={styles.heroCard}>
            <Text style={styles.heroRound}>第{displayRound}周目</Text>

            <View style={styles.progressSection}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>進捗</Text>
                <Text style={styles.progressValue}>{roundStats.answered} / {totalQuestions}</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: totalQuestions > 0 ? `${(roundStats.answered / totalQuestions) * 100}%` : '0%' }]} />
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>正答率</Text>
                <Text style={styles.progressValue}>{roundStats.correct} / {roundStats.answered}</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFillSuccess, { width: roundStats.answered > 0 ? `${(roundStats.correct / roundStats.answered) * 100}%` : '0%' }]} />
              </View>
            </View>
            {!isCompleted && (
              <TouchableOpacity style={styles.confirmRoundBtn} onPress={handleConfirmRound} activeOpacity={0.7}>
                <Text style={styles.confirmRoundBtnText}>周回を確定する</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Chapter List */}
          <Text style={styles.sectionTitle}>章一覧</Text>
          {quizBook.chapters.length === 0 ? (
            <View style={styles.empty}><Text style={styles.emptyText}>章を追加してください</Text></View>
          ) : (
            <View style={styles.chapterList}>
              {quizBook.chapters.map(chapter => {
                const rate = getChapterRate(chapter);
                const questions = getChapterTotalQuestions(chapter);
                const isActive = rate > 0 && rate < 100;
                return (
                  <Animated.View key={chapter.id} style={[guideStep === 'study_tap_chapter' && { opacity: chapPulse }]}>
                  <TouchableOpacity style={[styles.chapterCard, isActive && styles.chapterCardActive, guideStep === 'study_tap_chapter' && styles.chapterCardActive]} onPress={() => handleChapterPress(chapter)} activeOpacity={0.7}>
                    <View style={[styles.chapterNum, isActive && styles.chapterNumActive]}>
                      <Text style={[styles.chapterNumText, isActive && styles.chapterNumTextActive]}>{chapter.chapterNumber}</Text>
                    </View>
                    <View style={styles.chapterInfo}>
                      <Text style={styles.chapterTitle} numberOfLines={1}>{chapter.title || `第${chapter.chapterNumber}章`}</Text>
                      <Text style={styles.chapterSub}>{questions}問{rate > 0 ? ` · 正答率 ${rate}%` : ''}</Text>
                    </View>
                    {!isCompleted && (
                      <TouchableOpacity style={styles.chapterMenu} onPress={(e) => { e.stopPropagation(); setEditingChapter(chapter); setActiveMenu(chapter.id); }} hitSlop={8}>
                        <MoreVertical size={18} color={theme.colors.secondary[400]} />
                      </TouchableOpacity>
                    )}
                    {rate === 100 ? <CircleCheck size={20} color={theme.colors.success[500]} /> : isActive ? <Play size={18} color={theme.colors.primary[600]} /> : <ChevronRight size={18} color={theme.colors.secondary[300]} />}
                  </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}

          {guideStep === 'study_tap_add_chapter' && (
            <GuideOverlay step={3} total={4} title="章を追加しよう" description="問題集に章を追加して、問題の管理を始めましょう。" />
          )}

          {!isCompleted && (
            <Animated.View style={[guideStep === 'study_tap_add_chapter' && { opacity: addPulse }]}>
              <TouchableOpacity style={[styles.addBtn, guideStep === 'study_tap_add_chapter' && styles.addBtnHighlight]} onPress={() => setShowAddModal(true)} activeOpacity={0.7}>
                <Plus size={20} color={theme.colors.primary[600]} />
                <Text style={styles.addBtnText}>章を追加</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {guideStep === 'study_tap_chapter' && (
            <GuideOverlay step={4} total={4} title="章をタップしよう" description="章をタップして問題画面に入りましょう。問題を解いたら○×で記録してくださいね！" />
          )}
        </ScrollView>

        {/* Add Chapter */}
        <BottomSheet visible={showAddModal} onClose={() => setShowAddModal(false)}>
          <View style={{ gap: 16 }}>
            <Text style={styles.modalTitle}>章を追加</Text>
            <TextInput style={styles.modalInput} value={newChapterTitle} onChangeText={setNewChapterTitle} placeholder="章名を入力（任意）" placeholderTextColor={theme.colors.secondary[400]} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => { setShowAddModal(false); setNewChapterTitle(''); }}><Text style={styles.cancelBtnText}>キャンセル</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={handleAddChapter}>{isLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.confirmBtnText}>追加</Text>}</TouchableOpacity>
            </View>
          </View>
        </BottomSheet>

        {/* Edit/Delete Chapter */}
        <EditDeleteModal visible={!!activeMenu && !!editingChapter} onClose={() => { setActiveMenu(null); setEditingChapter(null); }} onSave={handleSaveChapter} onDelete={handleDeleteChapter} title="章の編集" editLabel="章名" editValue={editingChapter?.title || ''} editPlaceholder="章名を入力" isLoading={isLoading} />

        {/* Confirm Round */}
        <BottomSheet visible={showConfirmRoundModal} onClose={() => setShowConfirmRoundModal(false)}>
          <View style={{ gap: 16 }}>
            <Text style={styles.modalTitle}>周回確定</Text>
            <Text style={styles.modalMessage}>{quizBook.title}の第{displayRound}周を確定しますか？</Text>
            {unansweredWarning !== '' && (
              <View style={styles.warningBox}>
                <AlertCircle size={18} color={theme.colors.warning[500]} />
                <Text style={styles.warningText}>{unansweredWarning}</Text>
              </View>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => { setShowConfirmRoundModal(false); setUnansweredWarning(''); }}><Text style={styles.cancelBtnText}>キャンセル</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={handleExecuteConfirmRound}>{isLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.confirmBtnText}>確定</Text>}</TouchableOpacity>
            </View>
          </View>
        </BottomSheet>

        {/* TabBar removed */}
        <LoadingOverlay visible={isLoading} />
      </SafeAreaView>
    </>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, gap: 20, paddingBottom: 100 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold', textAlign: 'center', maxWidth: 250 },

  heroCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.colors.secondary[200], gap: 12 },
  heroRound: { fontSize: 13, fontWeight: '600', color: theme.colors.primary[600], fontFamily: 'ZenKaku-Bold' },
  progressSection: { gap: 6 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 12, color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Regular' },
  progressValue: { fontSize: 12, fontWeight: '600', color: theme.colors.secondary[700], fontFamily: 'ZenKaku-Bold' },
  progressBg: { height: 8, borderRadius: 4, backgroundColor: theme.colors.secondary[200] },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: theme.colors.primary[600] },
  progressFillSuccess: { height: 8, borderRadius: 4, backgroundColor: theme.colors.success[500] },
  confirmRoundBtn: { backgroundColor: theme.colors.primary[600], borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  confirmRoundBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', fontFamily: 'ZenKaku-Bold' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold' },
  chapterList: { gap: 8 },
  chapterCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, paddingHorizontal: 16, backgroundColor: theme.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.secondary[200] },
  chapterCardActive: { borderColor: theme.colors.primary[200], borderWidth: 2 },
  chapterNum: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.primary[50], justifyContent: 'center', alignItems: 'center' },
  chapterNumActive: { backgroundColor: theme.colors.primary[200] },
  chapterNumText: { fontSize: 16, fontWeight: '700', color: theme.colors.primary[600], fontFamily: 'ZenKaku-Bold' },
  chapterNumTextActive: { color: theme.colors.primary[600] },
  chapterInfo: { flex: 1, gap: 2 },
  chapterTitle: { fontSize: 14, fontWeight: '500', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Medium' },
  chapterSub: { fontSize: 11, color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Regular' },
  chapterMenu: { padding: 4 },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, borderWidth: 2, borderColor: theme.colors.primary[200], borderStyle: 'dashed', gap: 8 } as any,
  addBtnHighlight: { borderColor: theme.colors.primary[600], borderStyle: 'solid', backgroundColor: theme.colors.primary[50] },
  addBtnText: { fontSize: 14, fontWeight: '700', color: theme.colors.primary[600], fontFamily: 'ZenKaku-Bold' },

  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: theme.colors.secondary[400], fontFamily: 'ZenKaku-Regular' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold', marginBottom: 16 },
  modalMessage: { fontSize: 14, color: theme.colors.secondary[600], fontFamily: 'ZenKaku-Regular', lineHeight: 22, marginBottom: 12 },
  modalInput: { borderWidth: 1, borderColor: theme.colors.secondary[200], borderRadius: 14, padding: 16, fontSize: 16, fontFamily: 'ZenKaku-Regular', color: theme.colors.secondary[900], backgroundColor: theme.colors.background, marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: theme.colors.secondary[100] },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: theme.colors.secondary[600], fontFamily: 'ZenKaku-Bold' },
  confirmBtn: { backgroundColor: theme.colors.primary[600] },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', fontFamily: 'ZenKaku-Bold' },
  warningBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.warning[50], padding: 12, borderRadius: 10, marginBottom: 12 },
  warningText: { flex: 1, fontSize: 13, color: theme.colors.warning[500], fontFamily: 'ZenKaku-Regular' },
});

export default StudyHome;
