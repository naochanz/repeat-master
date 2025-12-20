import { theme } from '@/constants/theme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { AlertCircle, BookOpen, ChevronDown, ChevronRight, ChevronUp, Edit3, Target } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { RecentStudyItem } from '@/types/QuizBook';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { CommonActions } from '@react-navigation/native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - (theme.spacing.lg * 4);
const MAX_BAR_HEIGHT = 120;


interface QualificationStats {
  category: string;
  totalBooks: number;
  avgCorrectRate: number;
  totalRounds: number;
  books: any[];
}

export default function DashboardScreen() {
  const quizBooks = useQuizBookStore(state => state.quizBooks);
  const getRecentStudyItems = useQuizBookStore(state => state.getRecentStudyItems);
  const recentStudies = getRecentStudyItems();
  const [goal, setGoal] = useState('');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const navigation = useNavigation();
  const opacity = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      // 初期状態は透明
      opacity.value = 0;

      // スタディスタックの履歴をリセット
      const rootState = navigation.getState();
      if (rootState && rootState.routes) {
        const studyRoute = rootState.routes.find((route: any) => route.name === 'study');
        if (studyRoute && studyRoute.state) {
          navigation.dispatch(
            CommonActions.reset({
              ...rootState,
              routes: rootState.routes.map((route: any) => {
                if (route.name === 'study') {
                  return { ...route, state: undefined };
                }
                return route;
              }),
            })
          );
        }
      }

      // レンダリング完了後にフェードイン開始
      const timer = setTimeout(() => {
        opacity.value = withTiming(1, { duration: 50 });
      }, 16); // 1フレーム待つ（約16ms）

      return () => clearTimeout(timer);
    }, [])
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });


  useEffect(() => {
    loadGoal();
  }, []);

  const loadGoal = async () => {
    try {
      const savedGoal = await AsyncStorage.getItem('userGoal');
      if (savedGoal) {
        setGoal(savedGoal);
      }
    } catch (error) {
      console.error('Failed to load goal:', error);
    }
  };

  const saveGoal = async (newGoal: string) => {
    try {
      await AsyncStorage.setItem('userGoal', newGoal);
      setGoal(newGoal);
    } catch (error) {
      console.error('Failed to save goal:', error);
    }
  };

  const handleEditGoal = () => {
    setTempGoal(goal);
    setIsEditingGoal(true);
  };

  const handleSaveGoal = () => {
    saveGoal(tempGoal);
    setIsEditingGoal(false);
  };

  const qualificationStats = useMemo(() => {
    const statsMap: { [key: string]: QualificationStats } = {};

    quizBooks.forEach(book => {
      const category = book.category?.name || '未分類';
      if (!statsMap[category]) {
        statsMap[category] = {
          category,
          totalBooks: 0,
          avgCorrectRate: 0,
          totalRounds: 0,
          books: [],
        };
      }

      statsMap[category].totalBooks += 1;
      statsMap[category].totalRounds += (book.currentRound || 0);
      statsMap[category].books.push(book);
    });

    Object.keys(statsMap).forEach(category => {
      const books = statsMap[category].books;
      const totalCorrectRate = books.reduce((sum, book) => sum + (book.correctRate || 0), 0);
      statsMap[category].avgCorrectRate = books.length > 0
        ? Math.round(totalCorrectRate / books.length)
        : 0;
    });

    return Object.values(statsMap).sort((a, b) => b.avgCorrectRate - a.avgCorrectRate);
  }, [quizBooks]);

  // ✅ qualificationStats が変わった時に自動で開く
  useEffect(() => {
    if (qualificationStats.length === 1) {
      // 資格が1つしかない場合は自動で開く
      setExpandedCategories(new Set([qualificationStats[0].category]));
    }
  }, [qualificationStats]);

  const handleQualificationPress = (category: string) => {
    router.push({
      pathname: '/dashboard/qualification/[category]' as any,
      params: { category },
    });
  };

  const handleRecentStudyPress = (item: RecentStudyItem) => {
    if (item.type === 'section') {
      // 節がある場合 → 問題リストへ
      router.push(`/study/question/${item.sectionId}` as any);
    } else {
      // 節がない場合 → 問題リストへ
      router.push(`/study/question/${item.chapterId}` as any);
    }
  };

  const toggleCategoryExpanded = (category: string) => {
    // ✅ 資格が2つ以上の場合のみトグル可能
    if (qualificationStats.length > 1) {
      setExpandedCategories(prev => {
        const newSet = new Set(prev);
        if (newSet.has(category)) {
          newSet.delete(category);
        } else {
          newSet.add(category);
        }
        return newSet;
      });
    }
  };

  const handleNavigateToLibrary = () => {
    router.push('/(tabs)/library' as any);
  };

  const getCorrectRateColor = (rate: number) => {
    if (rate >= 80) return theme.colors.success[600];
    if (rate >= 60) return theme.colors.warning[600];
    return theme.colors.error[600];
  };

  const renderBarChart = (books: any[]) => {
    if (books.length === 0) return null;

    const maxRate = Math.max(...books.map(b => b.correctRate || 0), 100);
    const calculatedWidth = (CHART_WIDTH / books.length) - 8;
    const maxBarWidth = CHART_WIDTH / 3;
    const barWidth = Math.min(Math.max(calculatedWidth, 30), maxBarWidth);

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartBars}>
          {books.map((book, index) => {
            const rate = book.correctRate || 0;
            const barHeight = (rate / maxRate) * MAX_BAR_HEIGHT;

            return (
              <View key={book.id} style={[styles.barContainer, { width: barWidth }]}>
                <Text style={styles.barValue}>{rate}%</Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(barHeight, 10),
                      backgroundColor: getCorrectRateColor(rate),
                    }
                  ]}
                />
                <Text style={styles.barLabel} numberOfLines={1}>
                  {book.title?.substring(0, 6) || `問${index + 1}`}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <TouchableOpacity
          style={styles.goalCard}
          onPress={handleEditGoal}
          activeOpacity={0.7}
        >
          <View style={styles.goalHeader}>
            <View style={styles.goalTitleContainer}>
              <Target size={20} color={theme.colors.neutral.white} />
              <Text style={styles.goalTitle}>目標</Text>
            </View>
            <Edit3 size={20} color={theme.colors.secondary[100]} />
          </View>
          <Text style={styles.goalText}>
            {goal || '目標を設定してください'}
          </Text>
        </TouchableOpacity>

        {recentStudies.length > 0 && (
          <View style={styles.recentStudySection}>
            <Text style={styles.sectionTitle}>最近の学習</Text>
            <View style={styles.recentCardsVertical}>
              {recentStudies.map((item, index) => (
                <TouchableOpacity
                  key={`${item.chapterId}-${item.sectionId || 'chapter'}-${index}`}
                  style={styles.recentCardVertical}
                  onPress={() => handleRecentStudyPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.recentCardTop}>
                    <Text style={styles.recentCardPath} numberOfLines={1}>
                      {item.bookTitle} 第{item.chapterNumber}章
                      {item.sectionTitle && ` ${item.sectionNumber}節`}
                    </Text>
                    <Text style={styles.recentCardQuestion}>
                      問題{item.lastQuestionNumber} {item.lastResult}
                    </Text>

                  </View>


                  <View style={styles.recentCardBottom}>
                    <Text style={styles.recentCardDate}>
                      {new Date(item.lastAnsweredAt).toLocaleDateString('ja-JP', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                    <Text style={styles.recentCardCategory}>{item.category}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {qualificationStats.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.sectionTitle}>学習の分析</Text>
            <AlertCircle size={64} color={theme.colors.primary[300]} />
            <Text style={styles.emptyTitle}>まだ資格が登録されていません</Text>
            <Text style={styles.emptyDescription}>
              ライブラリから資格と問題集を追加して{'\n'}学習を始めましょう
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleNavigateToLibrary}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyButtonText}>ライブラリへ移動</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.qualificationList}>
            <Text style={styles.sectionTitle}>学習の分析</Text>
            {qualificationStats.map((qual) => {
              // ✅ 資格が1つの場合は常に展開、2つ以上の場合はトグル状態を見る
              const isExpanded = qualificationStats.length === 1 || expandedCategories.has(qual.category);

              return (
                <View key={qual.category} style={styles.qualificationCard}>
                  <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => toggleCategoryExpanded(qual.category)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardTitleContainer}>
                      <Text style={styles.cardTitle}>{qual.category}</Text>
                      <View style={styles.bookCountBadge}>
                        <BookOpen size={14} color={theme.colors.primary[700]} />
                        <Text style={styles.bookCountText}>{qual.totalBooks}</Text>
                      </View>
                    </View>
                    {/* ✅ 資格が2つ以上の場合のみシェブロンアイコン表示 */}
                    {qualificationStats.length > 1 && (
                      isExpanded ? (
                        <ChevronUp size={24} color={theme.colors.secondary[600]} />
                      ) : (
                        <ChevronDown size={24} color={theme.colors.secondary[600]} />
                      )
                    )}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.cardBody}>
                      {renderBarChart(qual.books)}

                      <View style={styles.buttonRow}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleQualificationPress(qual.category)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.actionButtonText}>正答率遷移を確認</Text>
                          <ChevronRight size={16} color={theme.colors.neutral.white} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
      </Animated.View>

      <Modal
        visible={isEditingGoal}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditingGoal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Target size={24} color={theme.colors.primary[600]} />
              <Text style={styles.modalTitle}>目標を設定</Text>
            </View>

            <TextInput
              style={styles.modalInput}
              value={tempGoal}
              onChangeText={setTempGoal}
              placeholder="例: 簿記2級合格"
              multiline
              maxLength={100}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsEditingGoal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveGoal}
                activeOpacity={0.7}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  goalCard: {
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  goalTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.neutral.white,
    fontFamily: 'ZenKaku-Bold',
  },
  goalText: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.neutral.white,
    fontFamily: 'ZenKaku-Bold',
    minHeight: 28,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 3,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  emptyDescription: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary[600],
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.md,
  },
  emptyButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.neutral.white,
    fontFamily: 'ZenKaku-Bold',
  },
  qualificationList: {
    gap: theme.spacing.lg,
  },
  qualificationCard: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary[50],
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary[200],
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  cardTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
  },
  bookCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.neutral.white,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary[300],
  },
  bookCountText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.primary[700],
    fontFamily: 'ZenKaku-Bold',
  },
  cardBody: {
    padding: theme.spacing.lg,
  },
  chartContainer: {
    marginBottom: theme.spacing.md,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: theme.spacing.md,
  },
  barContainer: {
    alignItems: 'center',
    gap: 4,
  },
  barValue: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: theme.borderRadius.sm,
    borderTopRightRadius: theme.borderRadius.sm,
    minHeight: 10,
  },
  barLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonRow: {
    gap: theme.spacing.sm,
  },
  actionButton: {
    backgroundColor: theme.colors.primary[600],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.neutral.white,
    fontFamily: 'ZenKaku-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...theme.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
  },
  modalInput: {
    backgroundColor: theme.colors.neutral[50],
    borderWidth: 2,
    borderColor: theme.colors.primary[200],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Regular',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.secondary[100],
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[700],
    fontFamily: 'ZenKaku-Bold',
  },
  saveButton: {
    backgroundColor: theme.colors.primary[600],
    ...theme.shadows.sm,
  },
  saveButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.neutral.white,
    fontFamily: 'ZenKaku-Bold',
  },
  recentStudySection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    marginBottom: theme.spacing.md,
  },
  recentCardsVertical: {
    gap: theme.spacing.sm,
  },
  recentCardVertical: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
    borderWidth: 2,
    borderColor: theme.colors.primary[200],
    height: 70, // ✅ 固定高さ
  },
  recentCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  recentCardPath: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    flex: 1,
  },
  recentCardDate: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.secondary[500],
    fontFamily: 'ZenKaku-Regular',
    marginLeft: theme.spacing.sm,
  },
  recentCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentCardQuestion: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[700],
    fontFamily: 'ZenKaku-Bold',
  },
  recentCardCategory: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary[600],
    fontFamily: 'ZenKaku-Bold',
  },
});
