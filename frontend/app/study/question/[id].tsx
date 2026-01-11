import CustomTabBar from '@/components/CustomTabBar';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Plus, Trash2, Bookmark, Menu, ArrowLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, SafeAreaView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import AnswerFAB from '@/src/components/study/question/AnswerFAB';
import QuestionCard from '@/src/components/study/question/QuestionCard';
import MemoModal from '@/src/components/study/question/MemoModal';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MENU_WIDTH = SCREEN_WIDTH * 0.8;

const QuestionList = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { id } = useLocalSearchParams();

  const quizBooks = useQuizBookStore(state => state.quizBooks);
  const fetchQuizBooks = useQuizBookStore(state => state.fetchQuizBooks);
  const saveAnswer = useQuizBookStore(state => state.saveAnswer);
  const saveMemo = useQuizBookStore(state => state.saveMemo);
  const getQuestionAnswers = useQuizBookStore(state => state.getQuestionAnswers);
  const addQuestionToTarget = useQuizBookStore(state => state.addQuestionToTarget);
  const deleteQuestionFromTarget = useQuizBookStore(state => state.deleteQuestionFromTarget);
  const deleteLatestAttempt = useQuizBookStore(state => state.deleteLatestAttempt);
  const toggleBookmark = useQuizBookStore(state => state.toggleBookmark);
  const isBookmarked = useQuizBookStore(state => state.isBookmarked);

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
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
  const [isAddingQuestions, setIsAddingQuestions] = useState(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [filterBookmarked, setFilterBookmarked] = useState(false);

  const savedFabQuestion = useRef<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const questionRefs = useRef<{ [key: number]: View | null }>({});

  const slideAnim = useSharedValue(MENU_WIDTH);

  const openMenu = () => {
    setMenuModalVisible(true);
    slideAnim.value = withTiming(0, { duration: 250 });
  };

  const closeMenu = () => {
    slideAnim.value = withTiming(MENU_WIDTH, { duration: 200 });
    setTimeout(() => setMenuModalVisible(false), 200);
  };

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnim.value }],
  }));

  const scrollToQuestion = useCallback((questionNumber: number) => {
    const questionView = questionRefs.current[questionNumber];
    if (questionView && scrollViewRef.current) {
      questionView.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, y - 20),
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

  useEffect(() => {
    if (mode === 'view') {
      if (activeFabQuestion !== null) {
        savedFabQuestion.current = activeFabQuestion;
        setExpandedQuestions(prev => {
          const newSet = new Set(prev);
          newSet.add(activeFabQuestion);
          return newSet;
        });
        setActiveFabQuestion(null);
        setTimeout(() => {
          scrollToQuestion(activeFabQuestion);
        }, 150);
      } else {
        setExpandedQuestions(prev => new Set(prev));
      }
    } else if (mode === 'answer') {
      if (savedFabQuestion.current !== null) {
        setActiveFabQuestion(savedFabQuestion.current);
        setTimeout(() => {
          scrollToQuestion(savedFabQuestion.current!);
        }, 100);
        savedFabQuestion.current = null;
      }
    }
  }, [mode, scrollToQuestion]);

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

  const allQuestions = Array.from({ length: displayInfo.questionCount }, (_, i) => i + 1);
  const displayQuestions = filterBookmarked
    ? allQuestions.filter(num => isBookmarked(chapterId, sectionId, num))
    : allQuestions;

  const handleBack = () => {
    router.back();
  };

  const handleCardPress = async (questionNumber: number) => {
    if (mode === 'view') {
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

      if (!wasExpanded) {
        setTimeout(() => {
          scrollToQuestion(questionNumber);
        }, 100);
      }
    } else {
      if (activeFabQuestion === questionNumber) {
        setActiveFabQuestion(null);
      } else {
        setActiveFabQuestion(questionNumber);
        setTimeout(() => {
          scrollToQuestion(questionNumber);
        }, 50);
      }
    }
  }

  const handleAnswerFromFab = async (questionNumber: number, answer: '○' | '×') => {
    setIsLoadingAnswer(true);
    try {
      await saveAnswer(bookId, questionNumber, answer, chapterId, sectionId || undefined);
      setActiveFabQuestion(null);
    } finally {
      setIsLoadingAnswer(false);
    }
  };

  const handleAddQuestion = async () => {
    await addQuestionToTarget(chapterId, sectionId);
  };

  const handleAddMultipleQuestions = async () => {
    setAddMultipleModalVisible(false);
    setIsAddingQuestions(true);
    try {
      for (let i = 0; i < selectedCount; i++) {
        await addQuestionToTarget(chapterId, sectionId);
      }
    } finally {
      setIsAddingQuestions(false);
    }
  };

  const handleOpenAddMultipleModal = () => {
    closeMenu();
    setTimeout(() => {
      setAddMultipleModalVisible(true);
    }, 250);
  };

  const handleDeleteQuestion = (questionNumber: number) => {
    setActiveFabQuestion(null);
    setSelectedQuestionForDelete(questionNumber);
    setDeleteOptionModalVisible(true);
  };

  const handleDeleteLatestCard = async () => {
    if (selectedQuestionForDelete !== null) {
      await deleteLatestAttempt(chapterId, sectionId, selectedQuestionForDelete);
      setDeleteOptionModalVisible(false);
      setSelectedQuestionForDelete(null);
    }
  };

  const handleDeleteAllCards = async () => {
    if (selectedQuestionForDelete !== null) {
      await deleteQuestionFromTarget(chapterId, sectionId, selectedQuestionForDelete);
      setDeleteOptionModalVisible(false);
      setSelectedQuestionForDelete(null);
    }
  };

  const handleSaveMemo = async (text: string) => {
    if (selectedQuestion !== null) {
      await saveMemo(chapterId, sectionId, selectedQuestion, text);
    }
  };

  const handleOpenMemo = (questionNumber: number) => {
    setActiveFabQuestion(null);
    setSelectedQuestion(questionNumber);
    const questionData = getQuestionAnswers(chapterId, sectionId, questionNumber);
    const currentMemo = questionData?.memo || '';
    setMemoText(currentMemo);
    setModalVisible(true);
  };

  const handleToggleBookmark = async (questionNumber: number) => {
    await toggleBookmark(chapterId, sectionId, questionNumber);
  };

  const handleToggleFilterBookmarked = () => {
    setFilterBookmarked(!filterBookmarked);
    closeMenu();
  };

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
            <ArrowLeft size={24} color={theme.colors.secondary[900]} />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {displayInfo.type === 'chapter'
              ? displayInfo.title?.trim()
                ? `第${displayInfo.chapterNumber}章 ${displayInfo.title}`
                : `第${displayInfo.chapterNumber}章`
              : displayInfo.title?.trim()
                ? `第${displayInfo.sectionNumber}節 ${displayInfo.title}`
                : `第${displayInfo.sectionNumber}節`}
          </Text>

          <TouchableOpacity onPress={openMenu} style={styles.headerButton}>
            <Menu size={24} color={theme.colors.secondary[900]} />
          </TouchableOpacity>
        </View>

        {/* メインコンテンツ */}
        <ScrollView 
          ref={scrollViewRef} 
          style={[styles.container, mode === 'view' && styles.viewModeBackground]}
        >
          {displayQuestions.map((num) => {
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
                <View style={styles.labelContainer}>
                  <View style={styles.labelLeft}>
                    <Text style={styles.questionNumberLabel}>問題 {num}</Text>
                  </View>
                  <View style={styles.buttonGroup}>
                    <TouchableOpacity
                      style={styles.bookmarkButton}
                      onPress={() => handleToggleBookmark(num)}
                    >
                      <Bookmark
                        size={22}
                        color={
                          isBookmarked(chapterId, sectionId, num)
                            ? theme.colors.error[600]
                            : theme.colors.secondary[400]
                        }
                        fill={
                          isBookmarked(chapterId, sectionId, num)
                            ? theme.colors.error[600]
                            : 'none'
                        }
                      />
                    </TouchableOpacity>
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

                <View style={[showFab && styles.selectedCardContainer]}>
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

          {/* 空状態 */}
          {filterBookmarked && displayQuestions.length === 0 && (
            <View style={styles.emptyStateContainer}>
              <Bookmark size={48} color={theme.colors.secondary[400]} />
              <Text style={styles.emptyStateTitle}>付箋がついた問題がありません</Text>
              <Text style={styles.emptyStateDescription}>
                問題の横にある付箋アイコンをタップして、復習したい問題をマークしましょう
              </Text>
            </View>
          )}

          {/* 1枚追加ボタン（回答モード + フィルターOFFのみ） */}
          {mode === 'answer' && !filterBookmarked && (
            <TouchableOpacity
              style={styles.addQuestionButton}
              onPress={handleAddQuestion}
              activeOpacity={0.7}
            >
              <Plus size={24} color={theme.colors.primary[600]} strokeWidth={2.5} />
              <Text style={styles.addQuestionButtonText}>問題を追加</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* モーダル群 */}
        <MemoModal
          visible={modalVisible}
          questionNumber={selectedQuestion}
          memoText={memoText}
          onClose={() => setModalVisible(false)}
          onSave={handleSaveMemo}
          onChangeText={setMemoText}
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
      
      {/* 履歴があるかどうかで表示を分岐 */}
      {selectedQuestionForDelete !== null && 
       (getQuestionAnswers(chapterId, sectionId, selectedQuestionForDelete)?.attempts?.length ?? 0) > 0 ? (
        <>
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
        </>
      ) : (
        <TouchableOpacity
          style={[styles.deleteOptionButton, styles.deleteAllButton]}
          onPress={handleDeleteAllCards}
          activeOpacity={0.7}
        >
          <Text style={[styles.deleteOptionText, styles.deleteAllText]}>
            この問題のカードを削除
          </Text>
        </TouchableOpacity>
      )}
      
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
                <Picker
                  selectedValue={selectedCount}
                  onValueChange={(itemValue) => setSelectedCount(itemValue)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
                    <Picker.Item key={num} label={`${num}問`} value={num} />
                  ))}
                </Picker>
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

        {/* メニューモーダル */}
        <Modal
          visible={menuModalVisible}
          transparent
          animationType="none"
          onRequestClose={closeMenu}
        >
          <Pressable
            style={styles.menuModalOverlay}
            onPress={closeMenu}
          >
            <Animated.View
              style={[styles.menuModalContent, menuAnimatedStyle]}
            >
              <SafeAreaView style={styles.menuSafeArea}>
                <View style={styles.menuModalHeader}>
                  <Text style={styles.menuModalTitle}>メニュー</Text>
                  <TouchableOpacity
                    onPress={closeMenu}
                    style={styles.menuModalCloseButton}
                  >
                    <Text style={styles.menuModalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.menuModalBody}>
                  <View style={styles.menuSection}>
                    <Text style={styles.menuSectionTitle}>表示モード</Text>

                    <TouchableOpacity
                      style={[
                        styles.menuItem,
                        mode === 'view' && styles.menuItemActive
                      ]}
                      onPress={() => {
                        setMode('view');
                        closeMenu();
                      }}
                    >
                      <View style={styles.menuItemLeft}>
                        <Text style={styles.menuItemIcon}>👁️</Text>
                        <Text
                          style={[
                            styles.menuItemText,
                            mode === 'view' && styles.menuItemTextActive
                          ]}
                        >
                          閲覧モード
                        </Text>
                      </View>
                      {mode === 'view' && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.menuItem,
                        mode === 'answer' && styles.menuItemActive
                      ]}
                      onPress={() => {
                        setMode('answer');
                        closeMenu();
                      }}
                    >
                      <View style={styles.menuItemLeft}>
                        <Text style={styles.menuItemIcon}>✏️</Text>
                        <Text
                          style={[
                            styles.menuItemText,
                            mode === 'answer' && styles.menuItemTextActive
                          ]}
                        >
                          回答モード
                        </Text>
                      </View>
                      {mode === 'answer' && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.menuDivider} />

                  <View style={styles.menuSection}>
                    <Text style={styles.menuSectionTitle}>フィルター</Text>

                    <TouchableOpacity
                      style={[
                        styles.menuItem,
                        filterBookmarked && styles.menuItemActive
                      ]}
                      onPress={handleToggleFilterBookmarked}
                    >
                      <View style={styles.menuItemLeft}>
                        <Bookmark
                          size={20}
                          color={
                            filterBookmarked
                              ? theme.colors.error[600]
                              : theme.colors.secondary[600]
                          }
                          fill={
                            filterBookmarked
                              ? theme.colors.error[600]
                              : 'none'
                          }
                        />
                        <Text
                          style={[
                            styles.menuItemText,
                            filterBookmarked && styles.menuItemTextActive
                          ]}
                        >
                          付箋のみ表示
                        </Text>
                      </View>
                      {filterBookmarked && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.menuDivider} />

                  {mode === 'answer' && !filterBookmarked && (
                    <View style={styles.menuSection}>
                      <Text style={styles.menuSectionTitle}>問題を追加</Text>

                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleOpenAddMultipleModal}
                      >
                        <View style={styles.menuItemLeft}>
                          <Plus size={20} color={theme.colors.primary[600]} strokeWidth={2.5} />
                          <Text style={styles.menuItemText}>枚数指定で追加</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </SafeAreaView>
            </Animated.View>
          </Pressable>
        </Modal>

        {/* FAB表示 */}
        {mode === 'answer' && activeFabQuestion !== null && (
          <AnswerFAB
            questionNumber={activeFabQuestion}
            onAnswer={handleAnswerFromFab}
            isLoading={isLoadingAnswer}
          />
        )}

        {/* ローディングオーバーレイ */}
        {isAddingQuestions && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary[600]} />
              <Text style={styles.loadingText}>問題を追加中...</Text>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* CustomTabBarはSafeAreaViewの外 */}
      <CustomTabBar />
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary[200],
  },
  headerButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    textAlign: 'center',
    fontFamily: 'ZenKaku-Bold',
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  viewModeBackground: {
    backgroundColor: '#E0E0E0',
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
  bookmarkButton: {
    padding: theme.spacing.xs,
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
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['3xl'],
    paddingHorizontal: theme.spacing.xl,
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[700],
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    fontFamily: 'ZenKaku-Bold',
  },
  emptyStateDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[500],
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'ZenKaku-Regular',
  },
  menuModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  menuModalContent: {
    width: '80%',
    height: '100%',
    backgroundColor: theme.colors.neutral.white,
    position: 'absolute',
    right: 0,
    ...theme.shadows.lg,
  },
  menuSafeArea: {
    flex: 1,
  },
  menuModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary[200],
  },
  menuModalTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
  },
  menuModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.secondary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuModalCloseText: {
    fontSize: theme.typography.fontSizes.xl,
    color: theme.colors.secondary[600],
  },
  menuModalBody: {
    paddingTop: theme.spacing.md,
  },
  menuSection: {
    paddingVertical: theme.spacing.sm,
  },
  menuSectionTitle: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.secondary[500],
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'ZenKaku-Medium',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.neutral.white,
  },
  menuItemActive: {
    backgroundColor: theme.colors.primary[50],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  menuItemIcon: {
    fontSize: 20,
  },
  menuItemText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.medium as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Medium',
  },
  menuItemTextActive: {
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: theme.colors.neutral.white,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.bold as any,
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.secondary[200],
    marginVertical: theme.spacing.md,
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
    fontSize: theme.typography.fontSizes.sm,
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
    borderWidth: 1,
    borderColor: theme.colors.secondary[300],
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 200,
  },
  pickerItem: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontFamily: 'ZenKaku-Regular',
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingContainer: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
    ...theme.shadows.lg,
  },
  loadingText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Medium',
  },
});

export default QuestionList;