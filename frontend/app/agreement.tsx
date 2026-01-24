import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState, useMemo } from 'react';
import { useAppTheme } from '@/hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check, ExternalLink } from 'lucide-react-native';

export default function AgreementScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const canProceed = termsAgreed && privacyAgreed;

  const handleProceed = () => {
    router.replace('/signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>ご利用にあたって</Text>
        <Text style={styles.description}>
          サービスをご利用いただくには、{'\n'}以下の規約への同意が必要です。
        </Text>

        <View style={styles.agreementList}>
          {/* Terms of Service */}
          <View style={styles.agreementRow}>
            <TouchableOpacity
              style={styles.agreementLink}
              onPress={() => router.push('/terms')}
            >
              <Text style={styles.agreementLinkText}>利用規約</Text>
              <ExternalLink size={16} color={theme.colors.primary[600]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.checkbox, termsAgreed && styles.checkboxChecked]}
              onPress={() => setTermsAgreed(!termsAgreed)}
            >
              {termsAgreed && <Check size={16} color={theme.colors.neutral.white} />}
            </TouchableOpacity>
          </View>

          {/* Privacy Policy */}
          <View style={styles.agreementRow}>
            <TouchableOpacity
              style={styles.agreementLink}
              onPress={() => router.push('/privacy-policy')}
            >
              <Text style={styles.agreementLinkText}>プライバシーポリシー</Text>
              <ExternalLink size={16} color={theme.colors.primary[600]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.checkbox, privacyAgreed && styles.checkboxChecked]}
              onPress={() => setPrivacyAgreed(!privacyAgreed)}
            >
              {privacyAgreed && <Check size={16} color={theme.colors.neutral.white} />}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.hint}>
          各項目を確認し、チェックを入れてください
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.proceedButton, !canProceed && styles.proceedButtonDisabled]}
          onPress={handleProceed}
          disabled={!canProceed}
        >
          <Text style={styles.proceedButtonText}>同意してはじめる</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing['2xl'],
  },
  title: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
    textAlign: 'center',
    marginBottom: theme.spacing['2xl'],
    lineHeight: 24,
  },
  agreementList: {
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  agreementLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  agreementLinkText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.primary[600],
    fontFamily: 'ZenKaku-Medium',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.secondary[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },
  hint: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[400],
    fontFamily: 'ZenKaku-Regular',
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  proceedButton: {
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  proceedButtonDisabled: {
    backgroundColor: theme.colors.secondary[300],
  },
  proceedButtonText: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.neutral.white,
    fontFamily: 'ZenKaku-Bold',
  },
});
