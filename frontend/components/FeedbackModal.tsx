import { useAppTheme } from '@/hooks/useAppTheme';
import { MessageCircle, Star, ThumbsDown, ThumbsUp, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { feedbackDomain } from '@/domain/feedbackDomain';

const FEEDBACK_COMPLETED_KEY = '@doriloop/feedback_completed'; // レビュー/フィードバック送信済み（永久非表示）
const FEEDBACK_DISMISSED_AT_KEY = '@doriloop/feedback_dismissed_at'; // ×で閉じた日時
const FEEDBACK_SESSION_COUNT_KEY = '@doriloop/session_count';
const SESSIONS_BEFORE_FEEDBACK = 5;
const DISMISS_COOLDOWN_DAYS = 7;

type FeedbackStep = 'initial' | 'negative_form' | 'thank_you';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

export async function shouldShowFeedback(): Promise<boolean> {
  try {
    // レビュー/フィードバック送信済みなら永久非表示
    const completed = await AsyncStorage.getItem(FEEDBACK_COMPLETED_KEY);
    if (completed === 'true') return false;

    // セッション数が閾値未満なら非表示
    const countStr = await AsyncStorage.getItem(FEEDBACK_SESSION_COUNT_KEY);
    const count = countStr ? parseInt(countStr, 10) : 0;
    const newCount = count + 1;
    await AsyncStorage.setItem(FEEDBACK_SESSION_COUNT_KEY, String(newCount));
    if (newCount < SESSIONS_BEFORE_FEEDBACK) return false;

    // ×で閉じた場合はクールダウン期間中は非表示
    const dismissedAt = await AsyncStorage.getItem(FEEDBACK_DISMISSED_AT_KEY);
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < DISMISS_COOLDOWN_DAYS) return false;
    }

    return true;
  } catch {
    return false;
  }
}

// レビューまたはフィードバック送信完了（永久非表示）
export async function markFeedbackCompleted(): Promise<void> {
  await AsyncStorage.setItem(FEEDBACK_COMPLETED_KEY, 'true');
}

// ×で閉じた（クールダウン後に再表示）
export async function markFeedbackDismissed(): Promise<void> {
  await AsyncStorage.setItem(FEEDBACK_DISMISSED_AT_KEY, String(Date.now()));
}

export default function FeedbackModal({ visible, onClose }: FeedbackModalProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [step, setStep] = useState<FeedbackStep>('initial');
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePositive = async () => {
    await markFeedbackCompleted();
    try {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        await StoreReview.requestReview();
      }
    } catch (e) {
      console.error('Store review error:', e);
    }
    onClose();
    resetState();
  };

  const handleNegative = () => {
    setStep('negative_form');
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return;
    setSubmitting(true);
    try {
      await feedbackDomain.submitFeedback(feedbackText);
    } catch (e) {
      console.error('Failed to send feedback:', e);
    }
    await markFeedbackCompleted();
    setSubmitting(false);
    setStep('thank_you');
  };

  const handleClose = async () => {
    await markFeedbackDismissed();
    onClose();
    resetState();
  };

  const handleThankYouClose = () => {
    onClose();
    resetState();
  };

  const resetState = () => {
    setTimeout(() => {
      setStep('initial');
      setFeedbackText('');
      setSubmitting(false);
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Pressable style={styles.overlay} onPress={Keyboard.dismiss}>
          <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            {/* @ts-ignore */}
            <X size={20} color={theme.colors.secondary[400]} />
          </TouchableOpacity>

          {step === 'initial' && (
            <>
              <View style={styles.iconContainer}>
                {/* @ts-ignore */}
                <Star size={40} color={theme.colors.warning[500]} fill={theme.colors.warning[500]} />
              </View>
              <Text style={styles.title}>DORILOOPはいかがですか？</Text>
              <Text style={styles.subtitle}>あなたのご意見をお聞かせください</Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.choiceButton, styles.negativeButton]}
                  onPress={handleNegative}
                  activeOpacity={0.7}
                >
                  {/* @ts-ignore */}
                  <ThumbsDown size={24} color={theme.colors.secondary[600]} />
                  <Text style={styles.negativeButtonText}>改善してほしい</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.choiceButton, styles.positiveButton]}
                  onPress={handlePositive}
                  activeOpacity={0.7}
                >
                  {/* @ts-ignore */}
                  <ThumbsUp size={24} color={theme.colors.neutral.white} />
                  <Text style={styles.positiveButtonText}>気に入っている</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'negative_form' && (
            <>
              <View style={styles.iconContainer}>
                {/* @ts-ignore */}
                <MessageCircle size={40} color={theme.colors.primary[600]} />
              </View>
              <Text style={styles.title}>ご意見をお聞かせください</Text>
              <Text style={styles.subtitle}>改善のために参考にさせていただきます</Text>

              <TextInput
                style={styles.textInput}
                value={feedbackText}
                onChangeText={setFeedbackText}
                placeholder="改善してほしい点や不具合など..."
                placeholderTextColor={theme.colors.secondary[400]}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.submitButton, !feedbackText.trim() && styles.submitButtonDisabled]}
                onPress={handleSubmitFeedback}
                disabled={!feedbackText.trim() || submitting}
                activeOpacity={0.7}
              >
                {submitting ? (
                  <ActivityIndicator color={theme.colors.neutral.white} />
                ) : (
                  <Text style={styles.submitButtonText}>送信する</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === 'thank_you' && (
            <>
              <View style={styles.iconContainer}>
                {/* @ts-ignore */}
                <Star size={40} color={theme.colors.success[500]} fill={theme.colors.success[500]} />
              </View>
              <Text style={styles.title}>ありがとうございます！</Text>
              <Text style={styles.subtitle}>いただいたご意見は今後の改善に活かしてまいります</Text>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleThankYouClose}
                activeOpacity={0.7}
              >
                <Text style={styles.submitButtonText}>閉じる</Text>
              </TouchableOpacity>
            </>
          )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  container: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    padding: theme.spacing.xs,
    zIndex: 1,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[600],
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  choiceButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  negativeButton: {
    backgroundColor: theme.colors.secondary[100],
  },
  positiveButton: {
    backgroundColor: theme.colors.primary[600],
    ...theme.shadows.sm,
  },
  negativeButtonText: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[700],
  },
  positiveButtonText: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.neutral.white,
  },
  textInput: {
    width: '100%',
    backgroundColor: theme.colors.neutral[50],
    borderWidth: 2,
    borderColor: theme.colors.primary[200],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Regular',
    minHeight: 120,
    marginBottom: theme.spacing.md,
    color: theme.colors.secondary[900],
  },
  submitButton: {
    width: '100%',
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.neutral.white,
  },
});
