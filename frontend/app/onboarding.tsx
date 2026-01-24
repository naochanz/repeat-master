import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppTheme } from '@/hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronRight, ChevronLeft } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH * 0.75;
const IMAGE_HEIGHT = IMAGE_WIDTH * 1.8;

interface OnboardingPage {
  stepNumber: number;
  title: string;
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
      description: '使っている問題集をカテゴリ分けして登録',
      images: [step1Image],
      accentColor: theme.colors.primary[600],
    },
    {
      stepNumber: 2,
      title: '正誤を記録',
      description: '○×ボタンで解答結果をサクッと記録',
      images: [step2Image],
      accentColor: theme.colors.success[600],
    },
    {
      stepNumber: 3,
      title: '周回で実力アップ',
      description: '繰り返すほど正答率がグングン上昇',
      images: [step3Image1, step3Image2],
      accentColor: theme.colors.warning[500],
    },
    {
      stepNumber: 4,
      title: '分析で弱点克服',
      description: 'グラフで成長を実感、弱点を集中攻略',
      images: [step4Image1, step4Image2, step4Image3],
      accentColor: theme.colors.error[500],
    },
  ], [theme]);

  const [currentPage, setCurrentPage] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const imageTimerRef = useRef<NodeJS.Timeout | null>(null);

  const page = pages[currentPage];
  const hasMultipleImages = page.images.length > 1;

  // 画像の自動切り替え（2.5秒ごと）
  useEffect(() => {
    if (hasMultipleImages) {
      imageTimerRef.current = setInterval(() => {
        setImageIndex((prev) => (prev + 1) % page.images.length);
      }, 2500);
    }

    return () => {
      if (imageTimerRef.current) {
        clearInterval(imageTimerRef.current);
      }
    };
  }, [currentPage, hasMultipleImages, page.images.length]);

  const handleNext = async () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
      setImageIndex(0);
    } else {
      await completeOnboarding();
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      setImageIndex(0);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const handleDotPress = (index: number) => {
    setCurrentPage(index);
    setImageIndex(0);
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
    }
    router.replace('/agreement');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.stepBadge, { backgroundColor: page.accentColor }]}>
          <Text style={styles.stepBadgeText}>STEP {page.stepNumber}/4</Text>
        </View>
        {currentPage < pages.length - 1 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>スキップ</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title and Description - 上部に配置 */}
        <View style={styles.textSection}>
          <Text style={[styles.title, { color: page.accentColor }]}>{page.title}</Text>
          <Text style={styles.description}>{page.description}</Text>
        </View>

        {/* Screenshot with auto-switching */}
        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper}>
            <Animated.Image
              key={`${currentPage}-${imageIndex}`}
              entering={FadeIn.duration(400)}
              exiting={FadeOut.duration(200)}
              source={page.images[imageIndex]}
              style={styles.screenshot}
              resizeMode="contain"
            />

            {/* Image indicators - overlay on image */}
            {hasMultipleImages && (
              <View style={styles.imageDots}>
                {page.images.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.imageDot,
                      idx === imageIndex && styles.imageDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Page dots */}
        <View style={styles.pagination}>
          {pages.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleDotPress(index)}
              hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
              style={[
                styles.pageDot,
                index === currentPage && { backgroundColor: page.accentColor, width: 24 },
              ]}
            />
          ))}
        </View>

        {/* Navigation buttons */}
        <View style={styles.buttonRow}>
          {currentPage > 0 ? (
            <TouchableOpacity
              style={styles.prevButton}
              onPress={handlePrev}
              activeOpacity={0.7}
            >
              <ChevronLeft size={18} color={theme.colors.secondary[500]} />
              <Text style={styles.prevButtonText}>戻る</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.prevButtonPlaceholder} />
          )}

          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: page.accentColor }]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {currentPage === pages.length - 1 ? 'はじめる' : '次へ'}
            </Text>
            <ChevronRight size={18} color={theme.colors.neutral.white} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    height: 48,
  },
  stepBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  stepBadgeText: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.neutral.white,
    letterSpacing: 0.5,
  },
  skipButton: {
    padding: theme.spacing.sm,
  },
  skipText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[400],
    fontFamily: 'ZenKaku-Medium',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  textSection: {
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  description: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[500],
    fontFamily: 'ZenKaku-Regular',
    textAlign: 'center',
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    position: 'relative',
  },
  screenshot: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  imageDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  imageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  imageDotActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: 16,
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary[200],
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.md,
  },
  prevButtonPlaceholder: {
    width: 70,
  },
  prevButtonText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[500],
    fontFamily: 'ZenKaku-Medium',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
  },
  nextButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.neutral.white,
    fontFamily: 'ZenKaku-Bold',
  },
});
