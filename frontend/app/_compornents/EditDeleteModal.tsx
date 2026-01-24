import { useAppTheme } from '@/hooks/useAppTheme';
import { Trash2 } from 'lucide-react-native';
import React, { useState, useEffect, useMemo } from 'react';
import { ActivityIndicator, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface EditDeleteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (value: string) => void;
  onDelete: () => void;
  title?: string;
  editLabel?: string;
  editValue?: string;
  editPlaceholder?: string;
  showEditField?: boolean;
  isLoading?: boolean;
}

const EditDeleteModal = ({
  visible,
  onClose,
  onSave,
  onDelete,
  title,
  editLabel = '名前',
  editValue = '',
  editPlaceholder = '入力してください',
  showEditField = true,
  isLoading = false
}: EditDeleteModalProps) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [inputValue, setInputValue] = useState(editValue);

  useEffect(() => {
    setInputValue(editValue);
  }, [editValue, visible]);

  const handleSave = () => {
    if (onSave) {
      onSave(inputValue);
    }
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <Pressable style={styles.modalOverlayPressable} onPress={onClose}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {title && <Text style={styles.modalTitle}>{title}</Text>}

            {showEditField && (
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>{editLabel}</Text>
                <TextInput
                  style={styles.editInput}
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholder={editPlaceholder}
                  placeholderTextColor={theme.colors.secondary[400]}
                />
              </View>
            )}

            <View style={styles.buttonSection}>
              {showEditField && onSave && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.neutral.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>保存</Text>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDelete}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.neutral.white} />
                ) : (
                  <>
                    <Trash2 size={20} color={theme.colors.neutral.white} />
                    <Text style={styles.deleteButtonText}>削除</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={onClose}
                disabled={isLoading}
              >
                <Text style={[styles.cancelButtonText, isLoading && { opacity: 0.5 }]}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </SafeAreaView>
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
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.xl,
    minWidth: 300,
    maxWidth: 400,
    ...theme.shadows.xl,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary[50],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary[200],
    textAlign: 'center',
  },
  editSection: {
    padding: theme.spacing.lg,
  },
  editLabel: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[700],
    marginBottom: theme.spacing.xs,
  },
  editInput: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[900],
    borderWidth: 1,
    borderColor: theme.colors.secondary[300],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral.white,
  },
  buttonSection: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  saveButton: {
    backgroundColor: theme.colors.primary[600],
  },
  saveButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.neutral.white,
  },
  deleteButton: {
    backgroundColor: theme.colors.error[600],
  },
  deleteButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.neutral.white,
  },
  cancelButton: {
    backgroundColor: theme.colors.secondary[100],
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[700],
  },
});

export default EditDeleteModal;
