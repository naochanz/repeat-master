import ConfirmDialog from '@/app/_compornents/ConfirmDialog';
import CustomTabBar from '@/components/CustomTabBar';
import { theme } from '@/constants/theme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AnswerFAB from '@/src/components/study/question/AnswerFAB';
import QuestionCard from '@/src/components/study/question/QuestionCard';
import MemoModal from '@/src/components/study/question/MemoModal';

const QuestionList = () => {
  const { id } = useLocalSearchParams();

  const quizBooks = useQuizBookStore(state => state.quizBooks);
  const fetchQuizBooks = useQuizBookStore(state => state.fetchQuizBooks);
  const saveAnswer = useQuizBookStore(state => state.saveAnswer);
  const saveMemo = useQuizBookStore(state => state.saveMemo);
  const getQuestionAnswers = useQuizBookStore(state => state.getQuestionAnswers);
  const addQuestionToTarget = useQuizBookStore(state => state.addQuestionToTarget);
  const deleteQuestionFromTarget = useQuizBookStore(state => state.deleteQuestionFromTarget);

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteTargetNumber, setDeleteTargetNumber] = useState<number | null>(null);
  const [deleteOptionModalVisible, setDeleteOptionModalVisible] = useState(false);
  const [selectedQuestionForDelete, setSelectedQuestionForDelete] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [memoText, setMemoText] = useState('');
  const [mode, setMode] = useState<'view' | 'answer'>('answer');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [activeFabQuestion, setActiveFabQuestion] = useState<number | null>(null);
  const [addMultipleModalVisible, setAddMultipleModalVisible] = useState(false);
  const [selectedCount, setSelectedCount] = useState(5);

  // FABの状態を保持（モード切り替え時に復元するため）
  const savedFabQuestion = useRef<number | null>(null);

  // スクロール用
  const scrollViewRef = useRef<ScrollView>(null);
  const questionRefs = useRef<{ [key: number]: View | null }>({});

  // スクロール関数
  const scrollToQuestion = useCallback((questionNumber: number) => {
    const questionView = questionRefs.current[questionNumber];
    if (questionView && scrollViewRef.current) {
      questionView.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, y - 20), // 20pxの余白
            animated: true,
          });
        },
        () => { }
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchQuizBooks();
    }, [fetchQuizBooks])
  );

  // モード切り替え時の処理
  useEffect(() => {
    if (mode === 'view') {
      // 閲覧モードに切り替え
      // FABが表示されている場合、その問題番号を保存して展開
      if (activeFabQuestion !== null) {
        savedFabQuestion.current = activeFabQuestion;
        setExpandedQuestions(prev => {
          const newSet = new Set(prev);
          newSet.add(activeFabQuestion);
          return newSet;
        });
        setActiveFabQuestion(null);
        // スクロール
        setTimeout(() => {
          scrollToQuestion(activeFabQuestion);
        }, 150);
      }
    } else if (mode === 'answer') {
      // 回答モードに切り替え
      // 保存されたFAB状態を復元
      if (savedFabQuestion.current !== null) {
        setActiveFabQuestion(savedFabQuestion.current);
        // スクロール
        setTimeout(() => {
          scrollToQuestion(savedFabQuestion.current!);
        }, 100);
        savedFabQuestion.current = null;
      }
    }
  }, [mode]);

  let chapterData = null;
  let sectionData = null;

  for (const book of quizBooks) {
    const chapter = book.chapters.find(ch => ch.id === id);
    if (chapter) {
      chapterData = { book, chapter };
      break;
    }

    for (const chapter of book.chapters) {
      const section = chapter.sections?.find(sec => sec.id === id);
      if (section) {
        sectionData = { book, chapter, section };
        break;
      }
    }
    if (sectionData) break;
  }

  const chapterId = chapterData?.chapter.id || sectionData?.chapter.id || '';
  const sectionId = sectionData?.section.id || null;
  const bookId = chapterData?.book.id || sectionData?.book.id || '';

  const displayInfo = chapterData
    ? {
      type: 'chapter' as const,
      chapterNumber: chapterData.chapter.chapterNumber,
      title: chapterData.chapter.title,
      questionCount: chapterData.chapter.questionCount || 0
    }
    : sectionData
      ? {
        type: 'section' as const,
        chapterNumber: sectionData.chapter.chapterNumber,
        chapterTitle: sectionData.chapter.title,
        sectionNumber: sectionData.section.sectionNumber,
        title: sectionData.section.title,
        questionCount: sectionData.section.questionCount
      }
      : null;

  if (!displayInfo) {
    return (
      <View style={styles.container}>
        <Text>データが見つかりません</Text>
      </View>
    );
  }

  const handleBack = () => {
    router.back();
  };

  const handleCardPress = async (questionNumber: number) => {
    if (mode === 'view') {
      // 閲覧モード: 履歴の展開/折りたたみ
      const wasExpanded = expandedQuestions.has(questionNumber);
      setExpandedQuestions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(questionNumber)) {
          newSet.delete(questionNumber)
        } else {
          newSet.add(questionNumber);
        }
        return newSet;
      });

      // 展開する場合のみスクロール
      if (!wasExpanded) {
        // アニメーション完了後にスクロール
        setTimeout(() => {
          scrollToQuestion(questionNumber);
        }, 100);
      }
    } else {
      // 回答モード: FABの表示/非表示をトグル
      if (activeFabQuestion === questionNumber) {
        setActiveFabQuestion(null);
      } else {
        setActiveFabQuestion(questionNumber);
        // FAB表示時にスクロール
        setTimeout(() => {
          scrollToQuestion(questionNumber);
        }, 50);
      }
    }
  }

  const handleAnswerFromFab = async (questionNumber: number, answer: '○' | '×') => {
    await saveAnswer(bookId, questionNumber, answer, chapterId, sectionId || undefined);
    setActiveFabQuestion(null);
  };


  const handleAddQuestion = async () => {
    await addQuestionToTarget(chapterId, sectionId);
  };

  const handleAddMultipleQuestions = async () => {
    for (let i = 0; i < selectedCount; i++) {
      await addQuestionToTarget(chapterId, sectionId);
    }
    setAddMultipleModalVisible(false);
  };

  const handleDeleteQuestion = (questionNumber: number) => {
    // FABを非表示にする
    setActiveFabQuestion(null);
    setSelectedQuestionForDelete(questionNumber);
    setDeleteOptionModalVisible(true);
  };

  const handleDeleteLatestCard = () => {
    if (selectedQuestionForDelete !== null) {
      setDeleteTargetNumber(selectedQuestionForDelete);
      setDeleteOptionModalVisible(false);
      setDeleteDialogVisible(true);
    }
  };

  const handleDeleteAllCards = async () => {
    if (selectedQuestionForDelete !== null) {
      // 全てのカードを削除
      await deleteQuestionFromTarget(chapterId, sectionId, selectedQuestionForDelete);
      setDeleteOptionModalVisible(false);
      setSelectedQuestionForDelete(null);
    }
  };

  const confirmDelete = async () => {
    if (deleteTargetNumber !== null) {
      await deleteQuestionFromTarget(chapterId, sectionId, deleteTargetNumber);
      setDeleteDialogVisible(false);
      setDeleteTargetNumber(null);
    }
  };

  const handleSaveMemo = async (text: string) => {
    if (selectedQuestion !== null) {
      await saveMemo(chapterId, sectionId, selectedQuestion, text);
    }
  };

  const handleOpenMemo = (questionNumber: number) => {
    // FABを非表示にする
    setActiveFabQuestion(null);
    setSelectedQuestion(questionNumber);
    const questionData = getQuestionAnswers(chapterId, sectionId, questionNumber);
    const currentMemo = questionData?.memo || '';
    setMemoText(currentMemo);
    setModalVisible(true);
  };

  return (
    <>
      <View style={[styles.safeArea, mode === 'view' && styles.viewModeBackground]}>
        <Stack.Screen
          options={{
            headerTitle: () => (
              <View style={styles.headerTitleContainer}>
                <Text style={styles.questionCount}>
                  全{displayInfo.questionCount}問
                </Text>
              </View>
            ),
            headerLeft: () => (
              <TouchableOpacity
                onPress={handleBack}
                style={{ marginLeft: 8 }}
              >
                <ArrowLeft size={24} color={theme.colors.secondary[900]} />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <View style={styles.modeToggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.modeToggleButton,
                    mode === 'view' && styles.modeToggleButtonActive
                  ]}
                  onPress={() => setMode('view')}
                >
                  <Text style={[
                    styles.modeToggleText,
                    mode === 'view' && styles.modeToggleTextActive
                  ]}>
                    閲覧
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeToggleButton,
                    mode === 'answer' && styles.modeToggleButtonActive
                  ]}
                  onPress={() => setMode('answer')}
                >
                  <Text
                    style={[
                      styles.modeToggleText,
                      mode === 'answer' && styles.modeToggleTextActive
                    ]}>
                    回答
                  </Text>
                </TouchableOpacity>
              </View>
            ),
            gestureEnabled: false,
          }}
        />
        <ScrollView ref={scrollViewRef} style={styles.container}>
          {Array.from({ length: displayInfo.questionCount }, (_, i) => i + 1).map((num) => {
            const questionData = getQuestionAnswers(chapterId, sectionId, num);
            const history = questionData?.attempts || [];
            const isExpanded = expandedQuestions.has(num);
            const showFab = mode === 'answer' && activeFabQuestion === num;

            return (
              <View
                key={num}
                style={styles.questionGroup}
                ref={(ref) => {
                  questionRefs.current[num] = ref;
                }}
              >
                {/* ラベル部分（MEMO、削除ボタン） */}
                <View style={styles.labelContainer}>
                  <View style={styles.labelLeft}>
                    <Text style={styles.questionNumberLabel}>問題 {num}</Text>
                    {mode === 'view' && (
                      <TouchableOpacity
                        style={styles.expansionToggleButton}
                        onPress={() => handleCardPress(num)}
                      >
                        <Text style={styles.expansionToggleText}>
                          {isExpanded ? '▼' : '▶'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.buttonGroup}>
                    <TouchableOpacity
                      style={styles.memoButton}
                      onPress={() => handleOpenMemo(num)}
                    >
                      <Text style={styles.memoText}>MEMO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteQuestion(num)}
                    >
                      <Trash2 size={16} color={theme.colors.error[600]} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* カード表示 */}
                <View style={showFab && styles.selectedCardContainer}>
                  <QuestionCard
                    questionNumber={num}
                    mode={mode}
                    isExpanded={isExpanded}
                    showFab={showFab}
                    history={history}
                    onPress={handleCardPress}
                  />
                </View>
              </View>
            );
          })}

          {/* 問題追加ボタン（回答モードのみ） */}
          {mode === 'answer' && (
            <View style={styles.addButtonContainer}>
              <TouchableOpacity
                style={styles.addQuestionButtonHalf}
                onPress={handleAddQuestion}
                activeOpacity={0.7}
              >
                <Plus size={24} color={theme.colors.primary[600]} strokeWidth={2.5} />
                <Text style={styles.addQuestionButtonText}>問題を追加</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addQuestionButtonHalf}
                onPress={() => setAddMultipleModalVisible(true)}
                activeOpacity={0.7}
              >
                <Plus size={24} color={theme.colors.primary[600]} strokeWidth={2.5} />
                <Text style={styles.addQuestionButtonText}>枚数指定</Text>
              </TouchableOpacity>
            </View>
          )}

          <MemoModal
            visible={modalVisible}
            questionNumber={selectedQuestion}
            memoText={memoText}
            onClose={() => setModalVisible(false)}
            onSave={handleSaveMemo}
            onChangeText={setMemoText}
          />

          <ConfirmDialog
            visible={deleteDialogVisible}
            title="問題を削除"
            message="この問題を削除してもよろしいですか？この操作は取り消せません。"
            onConfirm={confirmDelete}
            onCancel={() => setDeleteDialogVisible(false)}
          />

          {/* 削除オプション選択モーダル */}
          <Modal
            visible={deleteOptionModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setDeleteOptionModalVisible(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setDeleteOptionModalVisible(false)}
            >
              <Pressable
                style={styles.deleteOptionModal}
                onPress={(e) => e.stopPropagation()}
              >
                <Text style={styles.deleteOptionTitle}>削除方法を選択</Text>
                <TouchableOpacity
                  style={styles.deleteOptionButton}
                  onPress={handleDeleteLatestCard}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteOptionText}>最新のカードを削除</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteOptionButton, styles.deleteAllButton]}
                  onPress={handleDeleteAllCards}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.deleteOptionText, styles.deleteAllText]}>
                    この問題の全てのカードを削除
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelOptionButton}
                  onPress={() => setDeleteOptionModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelOptionText}>キャンセル</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>

          {/* 枚数指定追加モーダル */}
          <Modal
            visible={addMultipleModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setAddMultipleModalVisible(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setAddMultipleModalVisible(false)}
            >
              <Pressable
                style={styles.addMultipleModal}
                onPress={(e) => e.stopPropagation()}
              >
                <Text style={styles.addMultipleTitle}>追加する問題数を選択</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView
                    style={styles.pickerScroll}
                    showsVerticalScrollIndicator={true}
                    snapToInterval={50}
                    decelerationRate="fast"
                  >
                    {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
                      <TouchableOpacity
                        key={num}
                        style={[
                          styles.pickerItem,
                          selectedCount === num && styles.pickerItemSelected
                        ]}
                        onPress={() => setSelectedCount(num)}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            selectedCount === num && styles.pickerItemTextSelected
                          ]}
                        >
                          {num}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.addMultipleActions}>
                  <TouchableOpacity
                    style={styles.cancelAddButton}
                    onPress={() => setAddMultipleModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelAddText}>キャンセル</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmAddButton}
                    onPress={handleAddMultipleQuestions}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.confirmAddText}>
                      {selectedCount}問追加
                    </Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </ScrollView>

        {/* FAB表示（回答モード + アクティブな問題がある場合のみ） */}
        {mode === 'answer' && activeFabQuestion !== null && (
          <AnswerFAB
            questionNumber={activeFabQuestion}
            onAnswer={handleAnswerFromFab}
          />
        )}

        <CustomTabBar />
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  viewModeBackground: {
    backgroundColor: '#E0E0E0',
  },
  container: {
    flex: 1,
  },
  questionCount: {
    fontSize: theme.typography.fontSizes.lg,
    color: theme.colors.secondary[600],
    fontWeight: 'bold',
    fontFamily: 'ZenKaku-Regular',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.md,
    padding: 2,
    marginRight: 8,
  },
  modeToggleButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  modeToggleButtonActive: {
    backgroundColor: theme.colors.primary[600],
  },
  modeToggleText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.secondary[600],
  },
  modeToggleTextActive: {
    color: theme.colors.neutral.white,
  },
  questionGroup: {
    marginTop: theme.spacing.lg,
  },
  selectedCardContainer: {
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.xs,
    borderWidth: 2,
    borderColor: theme.colors.primary[400],
  },
  questionNumberLabel: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.secondary[900],
    fontFamily: theme.typography.fontFamilies.bold,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  labelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  expansionToggleButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.secondary[300],
  },
  expansionToggleText: {
    fontSize: 12,
    color: theme.colors.secondary[600],
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  memoButton: {
    backgroundColor: theme.colors.neutral.white,
    borderColor: theme.colors.primary[600],
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  memoText: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.primary[600],
    fontFamily: 'ZenKaku-Bold',
  },
  deleteButton: {
    backgroundColor: theme.colors.neutral.white,
    borderColor: theme.colors.error[600],
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  addButtonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.lg,
  },
  addQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.lg,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
    borderStyle: 'dashed',
    gap: theme.spacing.sm,
  },
  addQuestionButtonHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
    borderStyle: 'dashed',
    gap: theme.spacing.xs,
  },
  addQuestionButtonText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteOptionModal: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '85%',
    maxWidth: 400,
    ...theme.shadows.lg,
  },
  deleteOptionTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    fontFamily: 'ZenKaku-Bold',
  },
  deleteOptionButton: {
    backgroundColor: theme.colors.neutral.white,
    borderWidth: 2,
    borderColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
  },
  deleteAllButton: {
    borderColor: theme.colors.error[600],
  },
  deleteOptionText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.primary[600],
    fontFamily: 'ZenKaku-Medium',
  },
  deleteAllText: {
    color: theme.colors.error[600],
  },
  cancelOptionButton: {
    backgroundColor: theme.colors.secondary[100],
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    alignItems: 'center',
  },
  cancelOptionText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.secondary[700],
    fontFamily: 'ZenKaku-Medium',
  },
  addMultipleModal: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '85%',
    maxWidth: 400,
    ...theme.shadows.lg,
  },
  addMultipleTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    fontFamily: 'ZenKaku-Bold',
  },
  pickerContainer: {
    height: 200,
    borderWidth: 1,
    borderColor: theme.colors.secondary[300],
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
  },
  pickerScroll: {
    flex: 1,
  },
  pickerItem: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary[200],
  },
  pickerItemSelected: {
    backgroundColor: theme.colors.primary[50],
  },
  pickerItemText: {
    fontSize: theme.typography.fontSizes['2xl'],
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
  },
  pickerItemTextSelected: {
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
  },
  addMultipleActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  cancelAddButton: {
    flex: 1,
    backgroundColor: theme.colors.secondary[100],
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  confirmAddButton: {
    flex: 1,
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  cancelAddText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.secondary[700],
    fontFamily: 'ZenKaku-Medium',
  },
  confirmAddText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.neutral.white,
    fontFamily: 'ZenKaku-Medium',
  },
});

export default QuestionList;
