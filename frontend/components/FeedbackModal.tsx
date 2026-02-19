import { useAppTheme } from '@/hooks/useAppTheme';
import { MessageCircle, Star, ThumbsDown, ThumbsUp, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/services/api';

const FEEDBACK_STORAGE_KEY = '@doriloop/feedback_shown';
const FEEDBACK_SESSION_COUNT_KEY = '@doriloop/session_count';
const SESSIONS_BEFORE_FEEDBACK = 5;

type FeedbackStep = 'initial' | 'negative_form' | 'thank_you';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

export async function shouldShowFeedback(): Promise<boolean> {
  try {
    const alreadyShown = await AsyncStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (alreadyShown === 'true') return false;

    const countStr = await AsyncStorage.getItem(FEEDBACK_SESSION_COUNT_KEY);
    const count = countStr ? parseInt(countStr, 10) : 0;
    const newCount = count + 1;
    await AsyncStorage.setItem(FEEDBACK_SESSION_COUNT_KEY, String(newCount));

    return newCount >= SESSIONS_BEFORE_FEEDBACK;
  } catch {
    return false;
  }
}

export async function markFeedbackShown(): Promise<void> {
  await AsyncStorage.setItem(FEEDBACK_STORAGE_KEY, 'true');
}

export default function FeedbackModal({ visible, onClose }: FeedbackModalProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [step, setStep] = useState<FeedbackStep>('initial');
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePositive = async () => {
    await markFeedbackShown();
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
      await api.post('/feedback', { message: feedbackText.trim() });
    } catch (e) {
      console.error('Failed to send feedback:', e);
    }
    await markFeedbackShown();
    setSubmitting(false);
    setStep('thank_you');
  };

  const handleClose = async () => {
    await markFeedbackShown();
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
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
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
        </View>
      </View>
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
