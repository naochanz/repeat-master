import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, ScrollView } from 'react-native';
import React, { useState, useMemo } from 'react';
import { useAppTheme } from '@/hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronRight, ChevronLeft } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PHONE_WIDTH = SCREEN_WIDTH * 0.65;
const PHONE_HEIGHT = PHONE_WIDTH * 2.0;

interface OnboardingPage {
  stepNumber: number;
  title: string;
  subtitle: string;
  description: string;
  images: any[];
  accentColor: string;
}

export const ONBOARDING_COMPLETE_KEY = '@repeat_master_onboarding_complete';

// 画像をインポート
const step1Image = require('@/assets/images/onboarding/step1_register.jpg');
const step2Image = require('@/assets/images/onboarding/step2_answer.jpg');
const step3Image1 = require('@/assets/images/onboarding/step3_round1.jpg');
const step3Image2 = require('@/assets/images/onboarding/step3_round2.jpg');
const step4Image1 = require('@/assets/images/onboarding/step4_analytics1.jpg');
const step4Image2 = require('@/assets/images/onboarding/step4_analytics2.jpg');
const step4Image3 = require('@/assets/images/onboarding/step4_analytics3.jpg');

export default function OnboardingScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const pages: OnboardingPage[] = useMemo(() => [
    {
      stepNumber: 1,
      title: '問題集を登録',
      subtitle: 'かんたん登録',
      description: '使っている問題集を登録するだけ。\nカテゴリ分けで整理もラクラク。',
      images: [step1Image],
      accentColor: theme.colors.primary[600],
    },
    {
      stepNumber: 2,
      title: '正誤を記録',
      subtitle: 'ワンタップで記録',
      description: '○×ボタンで解答結果をサクッと記録。\n日付も自動で保存されます。',
      images: [step2Image],
      accentColor: theme.colors.success[600],
    },
    {
      stepNumber: 3,
      title: '周回で実力アップ',
      subtitle: '反復学習',
      description: '1周目より2周目、2周目より3周目。\n繰り返すほど正答率がグングン上昇！',
      images: [step3Image1, step3Image2],
      accentColor: theme.colors.warning[500],
    },
    {
      stepNumber: 4,
      title: '弱点を分析',
      subtitle: '効率的な学習',
      description: 'グラフで成長を実感。\n章ごとの弱点を把握して集中攻略！',
      images: [step4Image1, step4Image2, step4Image3],
      accentColor: theme.colors.error[500],
    },
  ], [theme]);

  const [currentPage, setCurrentPage] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const animationProgress = useSharedValue(0);

  const handleNext = async () => {
    if (currentPage < pages.length - 1) {
      animationProgress.value = withTiming(currentPage + 1, { duration: 300 });
      setCurrentPage(currentPage + 1);
      setImageIndex(0);
    } else {
      await completeOnboarding();
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      animationProgress.value = withTiming(currentPage - 1, { duration: 300 });
      setCurrentPage(currentPage - 1);
      setImageIndex(0);
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
  const hasMultipleImages = page.images.length > 1;

  const handleImageTap = () => {
    if (hasMultipleImages) {
      setImageIndex((prev) => (prev + 1) % page.images.length);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.stepIndicator}>
          <Text style={[styles.stepText, { color: page.accentColor }]}>
            STEP {page.stepNumber}
          </Text>
        </View>
        {currentPage < pages.length - 1 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>スキップ</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.subtitle}>{page.subtitle}</Text>
          <Text style={styles.title}>{page.title}</Text>
        </View>

        {/* Phone Mockup */}
        <TouchableOpacity
          style={styles.phoneContainer}
          onPress={handleImageTap}
          activeOpacity={hasMultipleImages ? 0.9 : 1}
        >
          <View style={[styles.phoneMockup, { borderColor: page.accentColor }]}>
            <View style={styles.phoneNotch} />
            <Animated.View
              key={`${currentPage}-${imageIndex}`}
              entering={FadeIn.duration(300)}
              style={styles.phoneScreen}
            >
              <Image
                source={page.images[imageIndex]}
                style={styles.screenshotImage}
                resizeMode="cover"
              />
            </Animated.View>
          </View>

          {/* Image indicators for multiple images */}
          {hasMultipleImages && (
            <View style={styles.imageIndicators}>
              {page.images.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.imageIndicator,
                    idx === imageIndex && { backgroundColor: page.accentColor, width: 20 },
                  ]}
                />
              ))}
              <Text style={styles.tapHint}>タップで切り替え</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Description */}
        <Text style={styles.description}>{page.description}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Pagination */}
        <View style={styles.pagination}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentPage && [styles.dotActive, { backgroundColor: page.accentColor }],
              ]}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonRow}>
          {currentPage > 0 ? (
            <TouchableOpacity
              style={styles.prevButton}
              onPress={handlePrev}
              activeOpacity={0.8}
            >
              <ChevronLeft size={20} color={theme.colors.secondary[600]} />
              <Text style={styles.prevButtonText}>戻る</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.prevButton} />
          )}

          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: page.accentColor }]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {currentPage === pages.length - 1 ? 'はじめる' : '次へ'}
            </Text>
            <ChevronRight size={20} color={theme.colors.neutral.white} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  stepIndicator: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.neutral.white,
    ...theme.shadows.sm,
  },
  stepText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
    letterSpacing: 1,
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
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  titleSection: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[500],
    fontFamily: 'ZenKaku-Medium',
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    textAlign: 'center',
  },
  phoneContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  phoneMockup: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: 32,
    borderWidth: 4,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  phoneNotch: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -40,
    width: 80,
    height: 24,
    backgroundColor: theme.colors.secondary[900],
    borderRadius: 12,
    zIndex: 10,
  },
  phoneScreen: {
    flex: 1,
    overflow: 'hidden',
  },
  screenshotImage: {
    width: '100%',
    height: '100%',
  },
  imageIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary[300],
  },
  tapHint: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.secondary[400],
    fontFamily: 'ZenKaku-Regular',
    marginLeft: theme.spacing.sm,
  },
  description: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: theme.spacing.md,
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
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
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    minWidth: 100,
  },
  prevButtonText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Medium',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
