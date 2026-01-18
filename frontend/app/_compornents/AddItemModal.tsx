import { useAppTheme } from '@/hooks/useAppTheme';
import { BookOpen, FolderPlus, ScanBarcode, X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface AddItemModalProps {
  visible: boolean;
  onAddCategory: () => void;
  onAddQuizBook: () => void;
  onScanBarcode: () => void;
  onClose: () => void;
}

const AddItemModal = ({
  visible,
  onAddCategory,
  onAddQuizBook,
  onScanBarcode,
  onClose,
}: AddItemModalProps) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>追加</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={24} color={theme.colors.secondary[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={onAddCategory}
                activeOpacity={0.7}
              >
                <View style={styles.optionIcon}>
                  <FolderPlus size={32} color={theme.colors.primary[600]} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>資格を追加</Text>
                  <Text style={styles.optionDescription}>新しい資格カテゴリを作成します</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.optionButton}
                onPress={onAddQuizBook}
                activeOpacity={0.7}
              >
                <View style={styles.optionIcon}>
                  <BookOpen size={32} color={theme.colors.primary[600]} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>問題集を追加</Text>
                  <Text style={styles.optionDescription}>既存の資格に問題集を追加します</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.optionButton}
                onPress={onScanBarcode}
                activeOpacity={0.7}
              >
                <View style={styles.optionIcon}>
                  <ScanBarcode size={32} color={theme.colors.primary[600]} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>バーコードで追加</Text>
                  <Text style={styles.optionDescription}>本のバーコードをスキャンして追加します</Text>
                </View>
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
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.md,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
    marginBottom: theme.spacing.xs,
  },
  optionDescription: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[600],
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.secondary[200],
    marginVertical: theme.spacing.md,
  },
});

export default AddItemModal;
