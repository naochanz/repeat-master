import { useAppTheme } from '@/hooks/useAppTheme';
import { useUserStore } from '@/stores/userStore';
import { useAuthStore } from '@/stores/authStore';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { Edit3, Target } from 'lucide-react-native';
import React, { useCallback, useState, useMemo, useRef } from 'react';
import { ActivityIndicator, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { CommonActions } from '@react-navigation/native';

export default function DashboardScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // ✅ バックエンドから取得
  const user = useUserStore(state => state.user);
  const recentStudyRecords = useUserStore(state => state.recentStudyRecords);
  const fetchUser = useUserStore(state => state.fetchUser);
  const fetchRecentStudyRecords = useUserStore(state => state.fetchRecentStudyRecords);
  const updateUserGoal = useUserStore(state => state.updateUserGoal);

  // ユーザープロファイル
  const profile = useAuthStore(state => state.profile);

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const navigation = useNavigation();
  const opacity = useSharedValue(0);

  // 時間帯による挨拶
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = profile?.name || 'ゲスト';

    if (hour >= 5 && hour < 12) {
      return `おはようございます、${name}さん`;
    } else if (hour >= 12 && hour < 18) {
      return `こんにちは、${name}さん`;
    } else {
      return `おかえりなさい、${name}さん`;
    }
  }, [profile?.name]);

  // ✅ 画面フォーカス時にデータを取得
  useFocusEffect(
    useCallback(() => {
      opacity.value = 0;

      // データ取得
      const loadData = async () => {
        if (!hasLoadedOnce.current) {
          setIsInitialLoading(true);
        }
        try {
          await Promise.all([fetchUser(), fetchRecentStudyRecords()]);
        } finally {
          setIsInitialLoading(false);
          hasLoadedOnce.current = true;
        }
      };
      loadData();

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

      const timer = setTimeout(() => {
        opacity.value = withTiming(1, { duration: 50 });
      }, 16);

      return () => clearTimeout(timer);
    }, [fetchUser, fetchRecentStudyRecords])
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const handleEditGoal = () => {
    setTempGoal(user?.goal || '');
    setIsEditingGoal(true);
  };

  const handleSaveGoal = async () => {
    try {
      await updateUserGoal(tempGoal);
      setIsEditingGoal(false);
    } catch (error) {
      console.error('Failed to save goal:', error);
      alert('目標の保存に失敗しました');
    }
  };

  // ✅ バックエンドから取得したデータを使用
  const handleRecentStudyPress = (record: any) => {
    if (record.sectionId) {
      router.push(`/study/question/${record.sectionId}` as any);
    } else {
      router.push(`/study/question/${record.chapterId}` as any);
    }
  };

  if (isInitialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 挨拶 */}
          <Text style={styles.greeting}>{greeting}</Text>

          <TouchableOpacity
            style={styles.goalCard}
            onPress={handleEditGoal}
            activeOpacity={0.7}
          >
            <View style={styles.goalHeader}>
              <View style={styles.goalTitleContainer}>
                {/* @ts-ignore */}
                <Target size={20} color={theme.colors.neutral.white} />
                <Text style={styles.goalTitle}>目標</Text>
              </View>
              {/* @ts-ignore */}
              <Edit3 size={20} color={theme.colors.secondary[100]} />
            </View>
            <Text style={styles.goalText}>
              {user?.goal || '目標を設定しましょう'}
            </Text>
          </TouchableOpacity>

          {/* ✅ バックエンドから取得したデータを表示（問題集ごと） */}
          {recentStudyRecords.length > 0 && (
            <View style={styles.recentStudySection}>
              <Text style={styles.sectionTitle}>最近の学習</Text>
              <View style={styles.recentCardsVertical}>
                {recentStudyRecords.map((record) => (
                  <TouchableOpacity
                    key={record.id}
                    style={styles.recentCardVertical}
                    onPress={() => handleRecentStudyPress(record)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.recentCardTop}>
                      <View style={styles.recentCardPathContainer}>
                        <Text style={styles.recentCardBookTitle} numberOfLines={1} ellipsizeMode="tail">
                          {record.quizBook.title}
                        </Text>
                        <Text style={styles.recentCardLocation}>
                          {' '}第{record.chapterNumber}章{record.sectionNumber ? ` 第${record.sectionNumber}節` : ''} 問{record.questionNumber}
                        </Text>
                      </View>
                      <Text style={styles.recentCardQuestion}>
                        {record.result}
                      </Text>
                    </View>

                    <View style={styles.recentCardBottom}>
                      <Text style={styles.recentCardDate}>
                        {new Date(record.answeredAt).toLocaleDateString('ja-JP', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                      <Text style={styles.recentCardCategory}>
                        {record.quizBook.category.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
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
              {/* @ts-ignore */}
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

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  greeting: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
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
  recentCardPathContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  recentCardBookTitle: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    flexShrink: 1,
    maxWidth: 100,
  },
  recentCardLocation: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    flexShrink: 0,
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
