import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState, useMemo } from 'react';
import { useAppTheme } from '@/hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookOpen, Library, Play } from 'lucide-react-native';

export const ONBOARDING_COMPLETE_KEY = '@repeat_master_onboarding_complete';

const STEPS = [
  { title: '問題集の周回を\nもっと効率的に', description: '正誤を記録して、弱点を可視化。\n繰り返すほど実力が伸びる学習アプリです。', icon: BookOpen },
  { title: 'ライブラリに\n問題集を追加しよう', description: 'ホーム画面からライブラリへ移動して、\n問題集を登録するところから始めましょう。', icon: Library },
  { title: '学習をスタート！', description: '登録した問題集をタップすると\n章ごとに学習を進められます。', icon: Play },
] as const;

export default function OnboardingScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  const handleNext = async () => {
    if (isLast) {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      router.replace('/signup');
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    router.replace('/signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Step Progress */}
      <View style={styles.progressRow}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.progressBar, i <= step && styles.progressBarActive]} />
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.stepLabel}>STEP {step + 1} / {STEPS.length}</Text>

        <View style={styles.iconWrap}>
          <Icon size={40} color={theme.colors.primary[600]} />
        </View>

        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.description}>{current.description}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.7}>
          <Text style={styles.nextBtnText}>{isLast ? 'はじめる' : '次へ進む'}</Text>
        </TouchableOpacity>
        {!isLast && (
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={1}>
            <Text style={styles.skipBtnText}>スキップ</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  progressRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 24, paddingTop: 16 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: theme.colors.secondary[200] },
  progressBarActive: { backgroundColor: theme.colors.primary[600] },

  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40, gap: 16 },
  stepLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.primary[600], fontFamily: 'ZenKaku-Bold', letterSpacing: 1.5 },
  iconWrap: { width: 72, height: 72, borderRadius: 20, backgroundColor: theme.colors.primary[50], justifyContent: 'center', alignItems: 'center', marginVertical: 8 },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold', lineHeight: 34 },
  description: { fontSize: 14, color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Regular', lineHeight: 22 },

  footer: { paddingHorizontal: 24, paddingBottom: 32, gap: 12 },
  nextBtn: { height: 54, borderRadius: 14, backgroundColor: theme.colors.primary[600], justifyContent: 'center', alignItems: 'center' },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', fontFamily: 'ZenKaku-Bold' },
  skipBtn: { height: 44, justifyContent: 'center', alignItems: 'center' },
  skipBtnText: { fontSize: 14, color: theme.colors.secondary[400], fontFamily: 'ZenKaku-Regular' },
});
