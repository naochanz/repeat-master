import { useAppTheme } from '@/hooks/useAppTheme';
import { useUserStore } from '@/stores/userStore';
import { useAuthStore } from '@/stores/authStore';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { useGuideStore } from '@/stores/guideStore';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { Edit3, ChevronRight, BookOpen } from 'lucide-react-native';
import React, { useCallback, useState, useMemo, useRef } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BottomSheet from '@/components/BottomSheet';
import { CommonActions } from '@react-navigation/native';
import FeedbackModal, { shouldShowFeedback } from '@/components/FeedbackModal';
import AdBanner from '@/components/AdBanner';

export default function DashboardScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const user = useUserStore(state => state.user);
  const recentStudyRecords = useUserStore(state => state.recentStudyRecords);
  const activityData = useUserStore(state => state.activityData);
  const fetchUser = useUserStore(state => state.fetchUser);
  const fetchRecentStudyRecords = useUserStore(state => state.fetchRecentStudyRecords);
  const fetchActivity = useUserStore(state => state.fetchActivity);
  const updateUserGoal = useUserStore(state => state.updateUserGoal);
  const profile = useAuthStore(state => state.profile);

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const hasLoadedOnce = useRef(false);
  const navigation = useNavigation();

  const greetingLine = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'おはようございます';
    if (hour >= 12 && hour < 18) return 'こんにちは';
    return 'おかえりなさい';
  }, []);

  const streak = useMemo(() => {
    let days = 0;
    let answers = 0;
    const sorted = [...activityData].sort((a, b) => b.date.localeCompare(a.date));
    for (const d of sorted) {
      if (d.count > 0) {
        days++;
        answers += d.count;
      } else {
        break;
      }
    }
    return { days, answers };
  }, [activityData]);

  const quizBooks = useQuizBookStore(state => state.quizBooks);
  const guideInitialize = useGuideStore(state => state.initialize);
  const guideIsActive = useGuideStore(state => state.isActive);
  const guideChecked = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!guideChecked.current) {
        guideChecked.current = true;
        guideInitialize().then(() => {
          const { isActive } = useGuideStore.getState();
          if (isActive && quizBooks.length === 0) {
            router.push('/library');
          }
        });
      }
    }, [quizBooks])
  );

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        if (!hasLoadedOnce.current) setIsInitialLoading(true);
        try {
          await Promise.all([fetchUser(), fetchRecentStudyRecords(), fetchActivity()]);
        } finally {
          setIsInitialLoading(false);
          hasLoadedOnce.current = true;
        }
      };
      loadData();
      shouldShowFeedback().then(s => { if (s) setShowFeedback(true); });

      const rootState = navigation.getState();
      if (rootState?.routes) {
        const studyRoute = rootState.routes.find((r: any) => r.name === 'study');
        if (studyRoute?.state) {
          navigation.dispatch(CommonActions.reset({
            ...rootState,
            routes: rootState.routes.map((r: any) => r.name === 'study' ? { ...r, state: undefined } : r),
          }));
        }
      }
    }, [fetchUser, fetchRecentStudyRecords, fetchActivity])
  );

  const handleSaveGoal = async () => {
    try {
      await updateUserGoal(tempGoal);
      setIsEditingGoal(false);
    } catch { /* handled by store */ }
  };

  const handleRecentStudyPress = (record: any) => {
    router.push(`/study/question/${record.sectionId ?? record.chapterId}` as any);
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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View>
          <Text style={styles.greetingSub}>{greetingLine}</Text>
          <Text style={styles.greetingName}>{profile?.name || 'ゲスト'}</Text>
        </View>

        {/* Goal Card */}
        <TouchableOpacity style={styles.goalCard} onPress={() => { setTempGoal(user?.goal || ''); setIsEditingGoal(true); }} activeOpacity={0.7}>
          <Text style={styles.goalLabel}>目標</Text>
          <Text style={styles.goalText}>{user?.goal || '目標を設定しましょう'}</Text>
        </TouchableOpacity>

        {/* Streak */}
        <View style={styles.streakCard}>
          <View style={styles.streakItem}>
            <Text style={styles.streakValue}>{streak.days}</Text>
            <Text style={styles.streakUnit}>日連続</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakItem}>
            <Text style={styles.streakValue}>{streak.answers}</Text>
            <Text style={styles.streakUnit}>問解答</Text>
          </View>
        </View>

        {/* Recent Study */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>最近の学習</Text>
            {recentStudyRecords.length > 0 && <Text style={styles.seeAll}>すべて見る</Text>}
          </View>
          {recentStudyRecords.length > 0 ? (
            recentStudyRecords.slice(0, 5).map((record) => (
              <TouchableOpacity key={record.id} style={styles.recentCard} onPress={() => handleRecentStudyPress(record)} activeOpacity={0.7}>
                <View style={styles.recentIcon}>
                  <BookOpen size={20} color={theme.colors.primary[600]} />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentTitle} numberOfLines={1}>{record.quizBook.title}</Text>
                  <Text style={styles.recentDetail}>
                    第{record.chapterNumber}章{record.sectionNumber ? ` 第${record.sectionNumber}節` : ''} · {record.result}
                  </Text>
                </View>
                <ChevronRight size={18} color={theme.colors.secondary[300]} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.recentEmpty}>
              <Text style={styles.recentEmptyText}>まだ学習記録がありません</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <AdBanner />
      <FeedbackModal visible={showFeedback} onClose={() => setShowFeedback(false)} />

      {/* Goal Edit */}
      <BottomSheet visible={isEditingGoal} onClose={() => setIsEditingGoal(false)}>
        <View style={{ gap: 16 }}>
          <Text style={styles.modalTitle}>目標を設定</Text>
          <TextInput style={styles.modalInput} value={tempGoal} onChangeText={setTempGoal} placeholder="例: 簿記2級合格" placeholderTextColor={theme.colors.secondary[400]} multiline maxLength={100} />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setIsEditingGoal(false)}>
              <Text style={styles.cancelBtnText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleSaveGoal}>
              <Text style={styles.saveBtnText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingTop: 16, gap: 24 },

  greetingSub: { fontSize: 13, color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Regular' },
  greetingName: { fontSize: 22, fontWeight: '700', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold' },

  goalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.secondary[200],
    gap: 12,
  },
  goalLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.primary[600], fontFamily: 'ZenKaku-Bold', letterSpacing: 1 },
  goalText: { fontSize: 20, fontWeight: '700', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold' },
  streakCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.secondary[200],
    alignItems: 'center',
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  streakValue: { fontSize: 32, fontWeight: '700', color: theme.colors.primary[600], fontFamily: 'ZenKaku-Bold' },
  streakUnit: { fontSize: 12, color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Regular' },
  streakDivider: { width: 1, height: 40, backgroundColor: theme.colors.secondary[200] },

  recentSection: { gap: 14 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold' },
  seeAll: { fontSize: 12, color: theme.colors.primary[600], fontFamily: 'ZenKaku-Regular' },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.secondary[200],
  },
  recentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentInfo: { flex: 1, gap: 3 },
  recentTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold' },
  recentDetail: { fontSize: 12, color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Regular' },
  recentEmpty: {
    padding: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.secondary[200],
    alignItems: 'center',
  },
  recentEmptyText: { fontSize: 13, color: theme.colors.secondary[400], fontFamily: 'ZenKaku-Regular' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold', marginBottom: 16, textAlign: 'center' },
  modalInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.secondary[200],
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[900],
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: theme.colors.secondary[100] },
  cancelBtnText: { fontSize: 16, fontWeight: '700', color: theme.colors.secondary[600], fontFamily: 'ZenKaku-Bold' },
  saveBtn: { backgroundColor: theme.colors.primary[600] },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', fontFamily: 'ZenKaku-Bold' },
});
