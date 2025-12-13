import ConfirmDialog from '@/app/compornents/ConfirmDialog';
import CustomTabBar from '@/components/CustomTabBar';
import { theme } from '@/constants/theme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AnswerFAB from './components/AnswerFAB';
import QuestionCard from './components/QuestionCard';
import MemoModal from './compornent/MemoModal';

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
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [memoText, setMemoText] = useState('');
  const [mode, setMode] = useState<'view' | 'answer'>('answer');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [activeFabQuestion, setActiveFabQuestion] = useState<number | null>(null);

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
    await saveAnswer(chapterId, sectionId, questionNumber, answer);
    setActiveFabQuestion(null);
  };


  const handleAddQuestion = async () => {
    await addQuestionToTarget(chapterId, sectionId);
  };

  const handleDeleteQuestion = (questionNumber: number) => {
    setDeleteTargetNumber(questionNumber);
    setDeleteDialogVisible(true);
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
            <TouchableOpacity
              style={styles.addQuestionButton}
              onPress={handleAddQuestion}
              activeOpacity={0.7}
            >
              <Plus size={24} color={theme.colors.primary[600]} strokeWidth={2.5} />
              <Text style={styles.addQuestionButtonText}>問題を追加</Text>
            </TouchableOpacity>
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
  addQuestionButtonText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
  },
});

export default QuestionList;
