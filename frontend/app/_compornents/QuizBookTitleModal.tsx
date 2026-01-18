import { useAppTheme } from '@/hooks/useAppTheme';
import { BookOpen } from 'lucide-react-native';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface QuizBookTitleModalProps {
  visible: boolean;
  categoryName: string;
  initialTitle?: string;
  onConfirm: (title: string) => void;
  onCancel: () => void;
}

const QuizBookTitleModal = ({
  visible,
  categoryName,
  initialTitle = '',
  onConfirm,
  onCancel,
}: QuizBookTitleModalProps) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (visible) {
      setTitle(initialTitle);
    }
  }, [visible, initialTitle]);

  const handleConfirm = () => {
    if (title.trim()) {
      onConfirm(title.trim());
      setTitle('');
    }
  };

  const handleCancel = () => {
    setTitle('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <Pressable style={styles.modalOverlayPressable} onPress={handleCancel}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <BookOpen size={32} color={theme.colors.primary[600]} />
              <Text style={styles.modalTitle}>問題集を追加</Text>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryLabel}>資格:</Text>
                <Text style={styles.categoryName}>{categoryName}</Text>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>問題集名</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="例: 過去問題集2024"
                  placeholderTextColor={theme.colors.secondary[400]}
                  returnKeyType="default"
                  blurOnSubmit={true}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={handleConfirm}
                disabled={!title.trim()}
              >
                <Text style={[
                  styles.confirmButtonText,
                  !title.trim() && styles.disabledButtonText
                ]}>追加</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOverlayPressable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.xl,
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.primary[50],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary[200],
    gap: theme.spacing.sm,
  },
  modalTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
  },
  modalBody: {
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[50],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.secondary[200],
    gap: theme.spacing.sm,
  },
  categoryLabel: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[600],
  },
  categoryName: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.primary[600],
  },
  inputSection: {
    gap: theme.spacing.xs,
  },
  inputLabel: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[700],
  },
  input: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[900],
    borderWidth: 1,
    borderColor: theme.colors.secondary[300],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral.white,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
    paddingTop: 0,
  },
  actionButton: {
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
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[700],
  },
  confirmButton: {
    backgroundColor: theme.colors.primary[600],
  },
  confirmButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.neutral.white,
  },
  disabledButtonText: {
    opacity: 0.5,
  },
});

export default QuizBookTitleModal;
