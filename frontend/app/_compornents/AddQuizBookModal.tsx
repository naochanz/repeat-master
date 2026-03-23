import { useAppTheme } from '@/hooks/useAppTheme';
import { Category } from '@/types/QuizBook';
import { Check, ScanBarcode, X } from 'lucide-react-native';
import React, { useState, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface QuizBookConfirmParams {
  categoryId?: string;
  newCategoryName?: string;
  title: string;
  isbn?: string;
  thumbnail?: string;
}

interface AddQuizBookModalProps {
  visible: boolean;
  categories: Category[];
  initialTitle?: string;
  initialIsbn?: string;
  initialThumbnail?: string;
  onConfirm: (params: QuizBookConfirmParams) => Promise<void>;
  onScanBarcode: () => void;
  onClose: () => void;
}

const AddQuizBookModal = ({
  visible,
  categories,
  initialTitle = '',
  initialIsbn = '',
  initialThumbnail = '',
  onConfirm,
  onScanBarcode,
  onClose,
}: AddQuizBookModalProps) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [title, setTitle] = useState('');
  const [isbn, setIsbn] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens, using initial values if provided (e.g. from barcode scan)
  useEffect(() => {
    if (visible) {
      setSelectedCategoryId('');
      setIsAddingNewCategory(categories.length === 0);
      setNewCategoryName('');
      setTitle(initialTitle);
      setIsbn(initialIsbn);
      setThumbnail(initialThumbnail);
      setIsSubmitting(false);
    }
  }, [visible]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleConfirm = async () => {
    const params: QuizBookConfirmParams = { title: title.trim() };
    if (isAddingNewCategory && newCategoryName.trim()) {
      params.newCategoryName = newCategoryName.trim();
    } else {
      params.categoryId = selectedCategoryId;
    }
    if (isbn) params.isbn = isbn;
    if (thumbnail) params.thumbnail = thumbnail;

    setIsSubmitting(true);
    try {
      await onConfirm(params);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canConfirm =
    title.trim().length > 0 &&
    (selectedCategoryId || (isAddingNewCategory && newCategoryName.trim().length > 0));

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
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalOverlayPressable} onPress={handleClose}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>問題集を追加</Text>
                <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={24} color={theme.colors.secondary[600]} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Category selection section */}
                <Text style={styles.sectionLabel}>資格</Text>
                {!isAddingNewCategory ? (
                  <>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryItem,
                          selectedCategoryId === category.id && styles.categoryItemSelected,
                        ]}
                        onPress={() => setSelectedCategoryId(category.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            selectedCategoryId === category.id && styles.categoryTextSelected,
                          ]}
                        >
                          {category.name}
                        </Text>
                        {selectedCategoryId === category.id && (
                          <Check size={18} color={theme.colors.primary[600]} />
                        )}
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      onPress={() => {
                        setIsAddingNewCategory(true);
                        setSelectedCategoryId('');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.addNewCategoryLink}>+ 新しい資格を追加</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.newCategoryContainer}>
                    <TextInput
                      style={styles.newCategoryInput}
                      value={newCategoryName}
                      onChangeText={setNewCategoryName}
                      placeholder="新しい資格名を入力"
                      placeholderTextColor={theme.colors.secondary[400]}
                      returnKeyType="default"
                      blurOnSubmit={true}
                      autoFocus={categories.length > 0}
                    />
                    {categories.length > 0 && (
                      <TouchableOpacity
                        onPress={() => {
                          setIsAddingNewCategory(false);
                          setNewCategoryName('');
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.backToCategoryList}>既存の資格から選択</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Title input section */}
                <View style={styles.titleSection}>
                  <Text style={styles.sectionLabel}>問題集名</Text>
                  <View style={styles.titleInputRow}>
                    <TextInput
                      style={styles.titleInput}
                      value={title}
                      onChangeText={setTitle}
                      placeholder="例: 過去問題集2024"
                      placeholderTextColor={theme.colors.secondary[400]}
                      returnKeyType="default"
                      blurOnSubmit={true}
                    />
                    <TouchableOpacity
                      style={styles.scanButton}
                      onPress={onScanBarcode}
                      activeOpacity={0.7}
                    >
                      <ScanBarcode size={22} color={theme.colors.primary[600]} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Action buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={handleClose}
                    disabled={isSubmitting}
                  >
                    <Text style={[styles.cancelButtonText, isSubmitting && styles.disabledText]}>キャンセル</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.confirmButton, (!canConfirm || isSubmitting) && styles.confirmButtonDisabled]}
                    onPress={handleConfirm}
                    disabled={!canConfirm || isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={theme.colors.neutral.white} />
                    ) : (
                      <Text style={[styles.confirmButtonText, !canConfirm && styles.disabledText]}>追加</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// --- Styles ---

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
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
      maxHeight: '80%',
      backgroundColor: theme.colors.neutral.white,
      borderRadius: theme.borderRadius.xl,
      ...theme.shadows.xl,
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.primary[50],
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.secondary[200],
    },
    modalTitle: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.bold as any,
      fontFamily: 'ZenKaku-Bold',
      color: theme.colors.secondary[900],
    },
    modalBody: {
      padding: theme.spacing.lg,
    },
    sectionLabel: {
      fontSize: theme.typography.fontSizes.sm,
      fontFamily: 'ZenKaku-Medium',
      color: theme.colors.secondary[700],
      marginBottom: theme.spacing.sm,
    },
    categoryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.neutral[50],
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.secondary[200],
    },
    categoryItemSelected: {
      borderColor: theme.colors.primary[400],
      backgroundColor: theme.colors.primary[50],
    },
    categoryText: {
      fontSize: theme.typography.fontSizes.base,
      fontFamily: 'ZenKaku-Medium',
      color: theme.colors.secondary[900],
    },
    categoryTextSelected: {
      color: theme.colors.primary[700],
      fontFamily: 'ZenKaku-Bold',
    },
    addNewCategoryLink: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.primary[600],
      fontFamily: 'ZenKaku-Bold',
      textDecorationLine: 'underline',
      textAlign: 'center',
      paddingVertical: theme.spacing.md,
    },
    newCategoryContainer: {
      gap: theme.spacing.sm,
    },
    newCategoryInput: {
      fontSize: theme.typography.fontSizes.base,
      fontFamily: 'ZenKaku-Regular',
      color: theme.colors.secondary[900],
      borderWidth: 1,
      borderColor: theme.colors.secondary[300],
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.neutral.white,
    },
    backToCategoryList: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.primary[600],
      fontFamily: 'ZenKaku-Medium',
      textDecorationLine: 'underline',
      textAlign: 'center',
      paddingVertical: theme.spacing.xs,
    },
    titleSection: {
      marginTop: theme.spacing.lg,
    },
    titleInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    titleInput: {
      flex: 1,
      fontSize: theme.typography.fontSizes.base,
      fontFamily: 'ZenKaku-Regular',
      color: theme.colors.secondary[900],
      borderWidth: 1,
      borderColor: theme.colors.secondary[300],
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.neutral.white,
    },
    scanButton: {
      width: 48,
      height: 48,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.primary[50],
      borderWidth: 1,
      borderColor: theme.colors.primary[300],
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalActions: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
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
    confirmButtonDisabled: {
      opacity: 0.5,
    },
    confirmButtonText: {
      fontSize: theme.typography.fontSizes.base,
      fontFamily: 'ZenKaku-Bold',
      color: theme.colors.neutral.white,
    },
    disabledText: {
      opacity: 0.5,
    },
  });

export default AddQuizBookModal;
