import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import React, { useState, useRef } from 'react';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookOpen, BarChart3, Trophy, ChevronRight } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingPage {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const pages: OnboardingPage[] = [
  {
    icon: <BookOpen size={80} color={theme.colors.primary[600]} strokeWidth={1.5} />,
    title: '問題集を登録',
    description: '使っている問題集を登録して\n解答履歴を記録しましょう',
    color: theme.colors.primary[100],
  },
  {
    icon: <BarChart3 size={80} color={theme.colors.success[600]} strokeWidth={1.5} />,
    title: '学習を分析',
    description: '正答率や学習時間を可視化して\n効率的に弱点を克服',
    color: theme.colors.success[100],
  },
  {
    icon: <Trophy size={80} color={theme.colors.warning[500]} strokeWidth={1.5} />,
    title: '目標を達成',
    description: '反復学習で着実にマスター\nあなたの合格をサポートします',
    color: theme.colors.warning[100],
  },
];

export const ONBOARDING_COMPLETE_KEY = '@repeat_master_onboarding_complete';

export default function OnboardingScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const progress = useSharedValue(0);

  const handleNext = async () => {
    if (currentPage < pages.length - 1) {
      progress.value = withTiming(currentPage + 1, { duration: 300 });
      setCurrentPage(currentPage + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
    }
    router.replace('/login');
  };

  const page = pages[currentPage];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {currentPage < pages.length - 1 ? (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>スキップ</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipButton} />
        )}
      </View>

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: page.color }]}>
          {page.icon}
        </View>

        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.description}>{page.description}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentPage && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {currentPage === pages.length - 1 ? 'はじめる' : '次へ'}
          </Text>
          <ChevronRight size={20} color={theme.colors.neutral.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  skipButton: {
    padding: theme.spacing.sm,
  },
  skipText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[500],
    fontFamily: 'ZenKaku-Medium',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl * 2,
  },
  title: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: theme.typography.fontSizes.lg,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
    textAlign: 'center',
    lineHeight: 28,
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary[200],
  },
  dotActive: {
    width: 24,
    backgroundColor: theme.colors.primary[600],
  },
  nextButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
  },
  nextButtonText: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.neutral.white,
    fontFamily: 'ZenKaku-Bold',
  },
});
