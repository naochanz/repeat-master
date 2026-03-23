import LoadingOverlay from '@/app/_compornents/LoadingOverlay';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { Attempt } from '@/types/QuizBook';
import QuestionView from '@/src/components/study/question/QuestionView';
import AnswerButtons from '@/src/components/study/question/AnswerButtons';
import QuestionDotNav from '@/src/components/study/question/QuestionDotNav';
import AnswerFeedback from '@/src/components/study/question/AnswerFeedback';
import QuestionPickerSheet from '@/src/components/study/question/QuestionPickerSheet';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { X, Bookmark, Grid3x3, Trash2, Plus } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomSheet from '@/components/BottomSheet';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;

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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [bulkAddCount, setBulkAddCount] = useState(5);
  const [isAdding, setIsAdding] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<'○' | '×' | null>(null);

  useFocusEffect(useCallback(() => { fetchQuizBooks(); }, [fetchQuizBooks]));

  const displayInfo = useMemo(() => {
    for (const book of quizBooks) {
      for (const chapter of book.chapters) {
        if (chapter.id === id) {
          return { bookId: book.id, chapterId: chapter.id, sectionId: null as string | null, title: chapter.title || `第${chapter.chapterNumber}章`, questionCount: chapter.questionCount || 0, displayRound: (book.currentRound || 0) + 1, isCompleted: !!book.completedAt };
        }
        if (chapter.sections) {
          for (const section of chapter.sections) {
            if (section.id === id) {
              return { bookId: book.id, chapterId: chapter.id, sectionId: section.id, title: `第${chapter.chapterNumber}章 ${section.title || `第${section.sectionNumber}節`}`, questionCount: section.questionCount, displayRound: (book.currentRound || 0) + 1, isCompleted: !!book.completedAt };
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
  const currentQuestionNumber = currentIndex + 1;

  const getAttempts = (num: number): Attempt[] => {
    return getQuestionAnswers(chapterId, sectionId, num)?.attempts || [];
  };

  const currentAttempts = getAttempts(currentQuestionNumber);
  const currentBookmarked = isBookmarkedFn(chapterId, sectionId, currentQuestionNumber);

  const isAtEnd = currentIndex >= questionCount;
  const goNext = () => { if (currentIndex < questionCount) setCurrentIndex(currentIndex + 1); };
  const goPrev = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };

  const handleTapNavigation = (e: any) => {
    const x = e.nativeEvent.locationX;
    if (x > SCREEN_WIDTH / 2) goNext();
    else goPrev();
  };

  const handleAnswer = async (result: '○' | '×') => {
    setIsLoadingAnswer(true);
    try {
      await saveAnswer(bookId, currentQuestionNumber, result, chapterId, sectionId || undefined);
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
        {/* Nav Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <X size={24} color={theme.colors.secondary[500]} />
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1}>{title}</Text>
          <View style={styles.navRight}>
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
        {isAtEnd ? (
          <Pressable style={styles.mainArea} onPress={(e) => { if (e.nativeEvent.locationX < SCREEN_WIDTH / 2) goPrev(); }}>
            <Plus size={40} color={theme.colors.secondary[300]} />
            <Text style={styles.addEndTitle}>問題を追加</Text>
            <TouchableOpacity style={styles.addEndBtn} onPress={handleAddOne} disabled={isAdding} activeOpacity={0.7}>
              <Text style={styles.addEndBtnText}>{isAdding ? '追加中...' : '1問追加する'}</Text>
            </TouchableOpacity>
          </Pressable>
        ) : (
          <Pressable style={styles.mainArea} onPress={handleTapNavigation}>
            <QuestionView questionNumber={currentQuestionNumber} attempts={currentAttempts} memo={getQuestionAnswers(chapterId, sectionId, currentQuestionNumber)?.memo || ''} chapterId={chapterId} sectionId={sectionId} readOnly={isCompleted} />
          </Pressable>
        )}

        {/* Bottom */}
        <View style={styles.bottomArea}>
          {!isCompleted && !isAtEnd && (
            <AnswerButtons onCorrect={() => handleAnswer('○')} onIncorrect={() => handleAnswer('×')} isLoading={isLoadingAnswer} />
          )}
          <QuestionDotNav totalQuestions={questionCount} currentIndex={currentIndex} getAttempts={getAttempts} onSelect={setCurrentIndex} />
        </View>

        <LoadingOverlay visible={isLoading} />

        {/* Picker */}
        <QuestionPickerSheet visible={pickerVisible} totalQuestions={questionCount} currentIndex={currentIndex} getAttempts={getAttempts} onSelect={setCurrentIndex} onClose={() => setPickerVisible(false)} />


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

  mainArea: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 50 },

  bottomArea: { gap: 16, paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },

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

  pickerSheet: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, position: 'absolute' as const, bottom: 0, left: 0, right: 0 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.secondary[200] },
  pickerCancel: { fontSize: 15, color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Regular' },
  pickerTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold' },
  pickerDone: { fontSize: 15, fontWeight: '700', color: theme.colors.primary[600], fontFamily: 'ZenKaku-Bold' },
  picker: { height: 200 },
  pickerItem: { fontSize: 20, fontFamily: 'ZenKaku-Regular' },
});

export default QuestionScreen;
