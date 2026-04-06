import LoadingOverlay from '@/app/_compornents/LoadingOverlay';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { Attempt } from '@/types/QuizBook';
import QuestionView from '@/src/components/study/question/QuestionView';
import AnswerButtons from '@/src/components/study/question/AnswerButtons';
import QuestionDotNav from '@/src/components/study/question/QuestionDotNav';
import AnswerFeedback from '@/src/components/study/question/AnswerFeedback';
import { recordStudySession } from '@/services/notificationService';
import QuestionPickerSheet from '@/src/components/study/question/QuestionPickerSheet';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AlertCircle, X, Bookmark, Grid3x3, Trash2, Plus, StickyNote, SkipForward } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomSheet from '@/components/BottomSheet';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MEMO_DEFAULT_EXPANDED_KEY = '@repeat_master_memo_default_expanded';
const AUTO_SKIP_KEY = '@repeat_master_auto_skip';

const QuestionScreen = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { id } = useLocalSearchParams();

  const quizBooks = useQuizBookStore(state => state.quizBooks);
  const isLoading = useQuizBookStore(state => state.isLoading);
  const fetchQuizBooks = useQuizBookStore(state => state.fetchQuizBooks);
  const saveAnswer = useQuizBookStore(state => state.saveAnswer);
  const getQuestionAnswers = useQuizBookStore(state => state.getQuestionAnswers);
  const addQuestionToTarget = useQuizBookStore(state => state.addQuestionToTarget);
  const deleteQuestionFromTarget = useQuizBookStore(state => state.deleteQuestionFromTarget);
  const deleteLatestAttempt = useQuizBookStore(state => state.deleteLatestAttempt);
  const toggleBookmark = useQuizBookStore(state => state.toggleBookmark);
  const isBookmarkedFn = useQuizBookStore(state => state.isBookmarked);
  const updateChapter = useQuizBookStore(state => state.updateChapter);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [bulkAddCount, setBulkAddCount] = useState(5);
  const [isAdding, setIsAdding] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<'○' | '×' | null>(null);
  const [memoDefaultExpanded, setMemoDefaultExpanded] = useState(false);
  const [autoSkip, setAutoSkip] = useState(false);
  const [memoExpanded, setMemoExpanded] = useState(false);
  const [mainAreaHeight, setMainAreaHeight] = useState(0);
  const [heroVisible, setHeroVisible] = useState(true);
  const [showConfirmRoundModal, setShowConfirmRoundModal] = useState(false);
  const [unansweredWarning, setUnansweredWarning] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(MEMO_DEFAULT_EXPANDED_KEY).then(v => {
      if (v === 'true') setMemoDefaultExpanded(true);
    });
    AsyncStorage.getItem(AUTO_SKIP_KEY).then(v => {
      if (v === 'true') setAutoSkip(true);
    });
  }, []);

  const toggleMemoDefault = async () => {
    const next = !memoDefaultExpanded;
    setMemoDefaultExpanded(next);
    setMemoExpanded(next);
    await AsyncStorage.setItem(MEMO_DEFAULT_EXPANDED_KEY, String(next));
  };

  const toggleAutoSkip = async () => {
    const next = !autoSkip;
    setAutoSkip(next);
    await AsyncStorage.setItem(AUTO_SKIP_KEY, String(next));
  };

  useFocusEffect(useCallback(() => { fetchQuizBooks(); }, [fetchQuizBooks]));

  const displayInfo = useMemo(() => {
    for (const book of quizBooks) {
      for (const chapter of book.chapters) {
        if (chapter.id === id) {
          return { bookId: book.id, chapterId: chapter.id, sectionId: null as string | null, title: chapter.title || `第${chapter.chapterNumber}章`, questionCount: chapter.questionCount || 0, displayRound: (chapter.currentRound || 0) + 1, isCompleted: !!book.completedAt };
        }
        if (chapter.sections) {
          for (const section of chapter.sections) {
            if (section.id === id) {
              return { bookId: book.id, chapterId: chapter.id, sectionId: section.id, title: `第${chapter.chapterNumber}章 ${section.title || `第${section.sectionNumber}節`}`, questionCount: section.questionCount, displayRound: (chapter.currentRound || 0) + 1, isCompleted: !!book.completedAt };
            }
          }
        }
      }
    }
    return null;
  }, [quizBooks, id]);

  if (!displayInfo) {
    return <View style={styles.container}><Text style={styles.errorText}>データが見つかりません</Text></View>;
  }

  const { bookId, chapterId, sectionId, title, questionCount, displayRound, isCompleted } = displayInfo;
  const isDirectChapter = !sectionId;
  const showHero = isDirectChapter && heroVisible;

  const chapterRoundStats = useMemo(() => {
    if (!isDirectChapter) return null;
    for (const book of quizBooks) {
      const chapter = book.chapters.find(ch => ch.id === chapterId);
      if (chapter) {
        let answered = 0, correct = 0;
        const processAnswers = (answers: any[]) => {
          answers.forEach(qa => {
            const attempt = qa.attempts?.find((a: any) => a.round === displayRound && a.resultConfirmFlg);
            if (attempt) { answered++; if (attempt.result === '○') correct++; }
          });
        };
        if (chapter.questionAnswers) processAnswers(chapter.questionAnswers);
        return { answered, correct, total: chapter.questionCount || 0, currentRound: chapter.currentRound || 0 };
      }
    }
    return null;
  }, [quizBooks, chapterId, displayRound, isDirectChapter]);

  const handleConfirmChapterRound = () => {
    if (!chapterRoundStats) return;
    const totalQ = chapterRoundStats.total;
    const qaAnswered = chapterRoundStats.answered;
    const unanswered = totalQ - qaAnswered;
    setUnansweredWarning(unanswered > 0 ? `第${displayRound}周で未回答の問題が${unanswered}問あります。` : '');
    setShowConfirmRoundModal(true);
  };

  const handleExecuteConfirmChapterRound = async () => {
    if (!chapterRoundStats) return;
    await updateChapter(bookId, chapterId, { currentRound: chapterRoundStats.currentRound + 1 });
    setShowConfirmRoundModal(false);
    setUnansweredWarning('');
  };

  const currentQuestionNumber = currentIndex + 1;

  const getAttempts = (num: number): Attempt[] => {
    return getQuestionAnswers(chapterId, sectionId, num)?.attempts || [];
  };

  const currentAttempts = getAttempts(currentQuestionNumber);
  const currentBookmarked = isBookmarkedFn(chapterId, sectionId, currentQuestionNumber);

  const isAtEnd = currentIndex >= questionCount;
  const goNext = () => {
    if (showHero) { setHeroVisible(false); return; }
    if (currentIndex < questionCount) setCurrentIndex(currentIndex + 1);
  };
  const goPrev = () => {
    if (!showHero && currentIndex === 0 && isDirectChapter) { setHeroVisible(true); return; }
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleTapNavigation = (e: any) => {
    const x = e.nativeEvent.locationX;
    if (x > SCREEN_WIDTH / 2) goNext();
    else goPrev();
  };

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: any) => {
    touchStartRef.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
  };
  const handleTouchEnd = (e: any) => {
    if (!touchStartRef.current) return;
    const dx = Math.abs(e.nativeEvent.pageX - touchStartRef.current.x);
    const dy = Math.abs(e.nativeEvent.pageY - touchStartRef.current.y);
    // 指がほぼ動いてなければタップ
    if (dx < 10 && dy < 10) {
      if (e.nativeEvent.pageX > SCREEN_WIDTH / 2) goNext();
      else goPrev();
    }
    touchStartRef.current = null;
  };

  const handleAnswer = async (result: '○' | '×') => {
    setIsLoadingAnswer(true);
    try {
      await saveAnswer(bookId, currentQuestionNumber, result, chapterId, sectionId || undefined);
      setFeedbackResult(result);
      recordStudySession().catch(() => {});
    } finally {
      setIsLoadingAnswer(false);
    }
  };


  const handleDeleteLatest = async () => {
    await deleteLatestAttempt(chapterId, sectionId, currentQuestionNumber);
    setDeleteModalVisible(false);
  };

  const handleDeleteAll = async () => {
    await deleteQuestionFromTarget(chapterId, sectionId, currentQuestionNumber);
    setDeleteModalVisible(false);
  };

  const handleAddOne = async () => {
    setIsAdding(true);
    try { await addQuestionToTarget(chapterId, sectionId); } finally { setIsAdding(false); }
  };

  const handleAddBulk = async () => {
    setIsAdding(true);
    try { for (let i = 0; i < bulkAddCount; i++) await addQuestionToTarget(chapterId, sectionId); } finally { setIsAdding(false); setAddModalVisible(false); setBulkAddCount(5); }
  };

  const currentHasAttempts = currentAttempts.filter(a => a.resultConfirmFlg).length > 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <AnswerFeedback result={feedbackResult} onComplete={() => { setFeedbackResult(null); if (autoSkip) goNext(); }} />
        {/* Nav Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <X size={24} color={theme.colors.secondary[500]} />
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1}>{title}</Text>
          <View style={styles.navRight}>
            <TouchableOpacity onPress={toggleMemoDefault} hitSlop={8}>
              <StickyNote size={20} color={memoDefaultExpanded ? theme.colors.primary[600] : theme.colors.secondary[400]} fill={memoDefaultExpanded ? theme.colors.primary[100] : 'none'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleBookmark(chapterId, sectionId, currentQuestionNumber)} hitSlop={8}>
              <Bookmark size={20} color={currentBookmarked ? theme.colors.primary[600] : theme.colors.secondary[400]} fill={currentBookmarked ? theme.colors.primary[600] : 'none'} />
            </TouchableOpacity>
            {!isCompleted && (
              <>
                <TouchableOpacity onPress={() => setAddModalVisible(true)} hitSlop={8}>
                  <Plus size={20} color={theme.colors.secondary[400]} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDeleteModalVisible(true)} hitSlop={8}>
                  <Trash2 size={20} color={theme.colors.secondary[400]} />
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity onPress={() => setPickerVisible(true)} hitSlop={8}>
              <Grid3x3 size={20} color={theme.colors.primary[600]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentIndex + 1) / questionCount) * 100}%` }]} />
        </View>

        {/* Main Content */}
        {showHero && chapterRoundStats ? (
          <Pressable style={styles.mainArea} onPress={(e) => { if (e.nativeEvent.locationX > SCREEN_WIDTH / 2) setHeroVisible(false); }}>
            <View style={styles.chapterHeroCard}>
              <Text style={styles.chapterHeroRound}>第{displayRound}周目</Text>
              <View style={styles.chapterHeroProgressSection}>
                <View style={styles.chapterHeroProgressRow}>
                  <Text style={styles.chapterHeroLabel}>進捗</Text>
                  <Text style={styles.chapterHeroValue}>{chapterRoundStats.answered} / {chapterRoundStats.total}</Text>
                </View>
                <View style={styles.chapterHeroProgressBg}>
                  <View style={[styles.chapterHeroProgressFill, { width: chapterRoundStats.total > 0 ? `${(chapterRoundStats.answered / chapterRoundStats.total) * 100}%` : '0%' }]} />
                </View>
              </View>
              <View style={styles.chapterHeroProgressSection}>
                <View style={styles.chapterHeroProgressRow}>
                  <Text style={styles.chapterHeroLabel}>正答率</Text>
                  <Text style={styles.chapterHeroValue}>{chapterRoundStats.correct} / {chapterRoundStats.answered}</Text>
                </View>
                <View style={styles.chapterHeroProgressBg}>
                  <View style={[styles.chapterHeroProgressFillSuccess, { width: chapterRoundStats.answered > 0 ? `${(chapterRoundStats.correct / chapterRoundStats.answered) * 100}%` : '0%' }]} />
                </View>
              </View>
              {!isCompleted && (
                <TouchableOpacity style={styles.chapterHeroConfirmBtn} onPress={handleConfirmChapterRound} activeOpacity={0.7}>
                  <Text style={styles.chapterHeroConfirmBtnText}>この章の周回を確定する</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.chapterHeroGuide}>右側をタップして問題をスタート →</Text>
            </View>
          </Pressable>
        ) : isAtEnd ? (
          <Pressable style={styles.mainArea} onPress={(e) => { if (e.nativeEvent.locationX < SCREEN_WIDTH / 2) goPrev(); }}>
            <Plus size={40} color={theme.colors.secondary[300]} />
            <Text style={styles.addEndTitle}>問題を追加</Text>
            <TouchableOpacity style={styles.addEndBtn} onPress={handleAddOne} disabled={isAdding} activeOpacity={0.7}>
              <Text style={styles.addEndBtnText}>{isAdding ? '追加中...' : '1問追加する'}</Text>
            </TouchableOpacity>
          </Pressable>
        ) : (
          <View style={styles.mainArea} onLayout={(e) => setMainAreaHeight(e.nativeEvent.layout.height)} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <QuestionView questionNumber={currentQuestionNumber} attempts={currentAttempts} memo={getQuestionAnswers(chapterId, sectionId, currentQuestionNumber)?.memo || ''} chapterId={chapterId} sectionId={sectionId} readOnly={isCompleted} defaultMemoExpanded={memoDefaultExpanded} onMemoExpandedChange={setMemoExpanded} availableHeight={mainAreaHeight} />
          </View>
        )}

        {/* Bottom - hidden when memo expanded */}
        {!memoExpanded && (
          <View style={styles.bottomArea}>
            {!isCompleted && !isAtEnd && !showHero && (
              <View style={styles.answerRow}>
                <View style={{ flex: 1 }}>
                  <AnswerButtons onCorrect={() => handleAnswer('○')} onIncorrect={() => handleAnswer('×')} isLoading={isLoadingAnswer} />
                </View>
                <TouchableOpacity style={[styles.autoSkipBtn, autoSkip && styles.autoSkipBtnActive]} onPress={toggleAutoSkip} activeOpacity={0.7} hitSlop={4}>
                  <SkipForward size={16} color={autoSkip ? theme.colors.primary[600] : theme.colors.secondary[400]} />
                </TouchableOpacity>
              </View>
            )}
            <QuestionDotNav totalQuestions={questionCount} currentIndex={currentIndex} getAttempts={getAttempts} onSelect={setCurrentIndex} />
          </View>
        )}

        <LoadingOverlay visible={isLoading} />

        {/* Picker */}
        <QuestionPickerSheet visible={pickerVisible} totalQuestions={questionCount} currentIndex={currentIndex} getAttempts={getAttempts} isBookmarked={(num) => isBookmarkedFn(chapterId, sectionId, num)} onSelect={setCurrentIndex} onClose={() => setPickerVisible(false)} />


        {/* Delete */}
        <BottomSheet visible={deleteModalVisible} onClose={() => setDeleteModalVisible(false)}>
          <View style={{ gap: 10 }}>
            <Text style={styles.modalTitle}>問{currentQuestionNumber} を削除</Text>
            {currentHasAttempts && (
              <TouchableOpacity style={styles.modalBtn} onPress={handleDeleteLatest}>
                <Text style={styles.modalBtnText}>最新のカードを削除</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnDanger]} onPress={handleDeleteAll}>
              <Text style={styles.modalBtnDangerText}>この問題を全て削除</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setDeleteModalVisible(false)}>
              <Text style={styles.modalBtnCancelText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>

        {/* Confirm Chapter Round */}
        <BottomSheet visible={showConfirmRoundModal} onClose={() => setShowConfirmRoundModal(false)}>
          <View style={{ gap: 16 }}>
            <Text style={styles.modalTitle}>章の周回確定</Text>
            <Text style={styles.chapterHeroModalMessage}>{title}の第{displayRound}周を確定しますか？</Text>
            {unansweredWarning !== '' && (
              <View style={styles.chapterHeroWarningBox}>
                <AlertCircle size={18} color={theme.colors.warning[500]} />
                <Text style={styles.chapterHeroWarningText}>{unansweredWarning}</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.colors.secondary[100] }]} onPress={() => { setShowConfirmRoundModal(false); setUnansweredWarning(''); }}><Text style={styles.modalBtnText}>キャンセル</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.colors.primary[600] }]} onPress={handleExecuteConfirmChapterRound}>{isLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', fontFamily: 'ZenKaku-Bold' }}>確定</Text>}</TouchableOpacity>
            </View>
          </View>
        </BottomSheet>

        {/* Add Multiple (Picker) */}
        <BottomSheet visible={addModalVisible} onClose={() => setAddModalVisible(false)}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
              <Text style={styles.pickerCancel}>キャンセル</Text>
            </TouchableOpacity>
            <Text style={styles.pickerTitle}>追加する問題数</Text>
            <TouchableOpacity onPress={handleAddBulk} disabled={isAdding}>
              <Text style={styles.pickerDone}>{isAdding ? '追加中...' : '追加'}</Text>
            </TouchableOpacity>
          </View>
          <Picker
            selectedValue={bulkAddCount}
            onValueChange={(val) => setBulkAddCount(val)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            {Array.from({ length: 50 }, (_, i) => i + 1).map(n => (
              <Picker.Item key={n} label={`${n}問`} value={n} />
            ))}
          </Picker>
        </BottomSheet>

      </SafeAreaView>
    </>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  errorText: { padding: 40, textAlign: 'center', color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Regular' },

  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 52 },
  navTitle: { fontSize: 17, fontWeight: '600', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold', flex: 1, textAlign: 'center', marginHorizontal: 12 },
  navRight: { flexDirection: 'row', gap: 14, alignItems: 'center' },

  progressBar: { height: 3, backgroundColor: theme.colors.secondary[200] },
  progressFill: { height: 3, backgroundColor: theme.colors.primary[600] },

  mainArea: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, overflow: 'hidden' },

  bottomArea: { gap: 16, paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },
  answerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%' },
  autoSkipBtn: { width: 40, height: 56, borderRadius: 14, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.secondary[200], justifyContent: 'center', alignItems: 'center' },
  autoSkipBtnActive: { borderColor: theme.colors.primary[600], backgroundColor: theme.colors.primary[50] },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, width: '100%', maxWidth: 320, gap: 10 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold', textAlign: 'center', marginBottom: 8 },
  modalBtn: { paddingVertical: 14, borderRadius: 12, backgroundColor: theme.colors.secondary[100], alignItems: 'center' },
  modalBtnText: { fontSize: 14, fontWeight: '600', color: theme.colors.secondary[700], fontFamily: 'ZenKaku-Bold' },
  modalBtnDanger: { backgroundColor: theme.colors.error[50] },
  modalBtnDangerText: { fontSize: 14, fontWeight: '600', color: theme.colors.error[500], fontFamily: 'ZenKaku-Bold' },
  modalBtnCancel: { paddingVertical: 12, alignItems: 'center' },
  modalBtnCancelText: { fontSize: 14, color: theme.colors.secondary[400], fontFamily: 'ZenKaku-Regular' },

  addEndTitle: { fontSize: 16, color: theme.colors.secondary[400], fontFamily: 'ZenKaku-Regular', marginTop: 12 },
  addEndBtn: { marginTop: 16, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14, backgroundColor: theme.colors.primary[600] },
  addEndBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', fontFamily: 'ZenKaku-Bold' },

  chapterHeroCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.colors.secondary[200], gap: 12, width: '100%' },
  chapterHeroRound: { fontSize: 13, fontWeight: '600', color: theme.colors.primary[600], fontFamily: 'ZenKaku-Bold' },
  chapterHeroProgressSection: { gap: 6 },
  chapterHeroProgressRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
  chapterHeroLabel: { fontSize: 12, color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Regular' },
  chapterHeroValue: { fontSize: 12, fontWeight: '600', color: theme.colors.secondary[700], fontFamily: 'ZenKaku-Bold' },
  chapterHeroProgressBg: { height: 8, borderRadius: 4, backgroundColor: theme.colors.secondary[200] },
  chapterHeroProgressFill: { height: 8, borderRadius: 4, backgroundColor: theme.colors.primary[600] },
  chapterHeroProgressFillSuccess: { height: 8, borderRadius: 4, backgroundColor: theme.colors.success[500] },
  chapterHeroConfirmBtn: { backgroundColor: theme.colors.primary[600], borderRadius: 12, paddingVertical: 12, alignItems: 'center' as const, marginTop: 4 },
  chapterHeroConfirmBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', fontFamily: 'ZenKaku-Bold' },
  chapterHeroModalMessage: { fontSize: 14, color: theme.colors.secondary[600], fontFamily: 'ZenKaku-Regular', lineHeight: 22 },
  chapterHeroWarningBox: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, backgroundColor: theme.colors.warning[50], padding: 12, borderRadius: 10 },
  chapterHeroWarningText: { flex: 1, fontSize: 13, color: theme.colors.warning[500], fontFamily: 'ZenKaku-Regular' },
  chapterHeroGuide: { fontSize: 13, color: theme.colors.secondary[400], fontFamily: 'ZenKaku-Regular', textAlign: 'center', marginTop: 4 },

  pickerSheet: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, position: 'absolute' as const, bottom: 0, left: 0, right: 0 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.secondary[200] },
  pickerCancel: { fontSize: 15, color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Regular' },
  pickerTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold' },
  pickerDone: { fontSize: 15, fontWeight: '700', color: theme.colors.primary[600], fontFamily: 'ZenKaku-Bold' },
  picker: { height: 200 },
  pickerItem: { fontSize: 20, fontFamily: 'ZenKaku-Regular' },
});

export default QuestionScreen;
