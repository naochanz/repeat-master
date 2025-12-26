import { theme } from '@/constants/theme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { ChevronDown, MoreVertical, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Category } from '@/types/QuizBook';

interface QuizBook {
  id: string;
  title: string;
  category: Category;
  chapterCount: number;
  currentRate: number;
  useSections?: boolean;
  correctRate?: number;
  currentRound?: number;
}

interface QuizBookCardProps {
  quizBook: QuizBook;
  onPress: () => void;
  onDelete: () => void;
  existingCategories: string[];
}

const QuizBookCard = ({ quizBook, onPress, onDelete, existingCategories }: QuizBookCardProps) => {
  const updateQuizBook = useQuizBookStore(state => state.updateQuizBook);
  const [showMenu, setShowMenu] = useState(false);
  const [editedTitle, setEditedTitle] = useState(quizBook.title);
  const [editedCategory, setEditedCategory] = useState(quizBook.category?.name || '');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [useSections, setUseSections] = useState(quizBook.useSections ?? undefined);
  const correctRate = quizBook.correctRate || 0;

  const handleMenuPress = (e: any) => {
    e.stopPropagation();
    setEditedTitle(quizBook.title);
    setEditedCategory(quizBook.category?.name || '');
    setShowMenu(true);
  };

  const handleSaveAndClose = async () => {
    if (editedTitle.trim() === '') {
      return;
    }
    // カテゴリの更新は現在サポートしていない（categoryIdが必要）
    await updateQuizBook(quizBook.id, { title: editedTitle });
    setShowMenu(false);
  };

  const handleCloseMenu = () => {
    setEditedTitle(quizBook.title);
    setEditedCategory(quizBook.category?.name || '');
    setShowMenu(false);
  };

  const handleDelete = (e: any) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete();
  };

  const handleToggleSections = async (value: boolean) => {
    setUseSections(value);
    await updateQuizBook(quizBook.id, { useSections: value });
  };

  return (
    <>
      <View style={styles.bookContainer}>
        <TouchableOpacity
          style={styles.book}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <View style={styles.bookSpine}>
            <View style={styles.bookTop} />
            <View style={styles.bookMain}>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={handleMenuPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MoreVertical size={16} color={theme.colors.secondary[600]} />
              </TouchableOpacity>

              <View style={styles.bookContent}>
                <Text style={styles.bookTitle} numberOfLines={6}>
                  {quizBook.title || '未設定'}
                </Text>

                <View style={styles.bookStats}>
                  <View style={styles.bookStatItem}>
                    <Text style={styles.bookStatLabel}>現在 {(quizBook.currentRound || 0) + 1}周目</Text>
                    <Text style={[styles.bookStatValue, { color: theme.colors.primary[600] }]}>
                      {quizBook.currentRound || 0}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.bookBottom} />
          </View>
        </TouchableOpacity>
        <View style={styles.bookShadow} />
      </View>

      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={handleCloseMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseMenu}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>問題集の設定</Text>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>資格</Text>
                <View style={[styles.categorySelector, { backgroundColor: theme.colors.secondary[100] }]}>
                  <Text style={styles.categorySelectorText}>{editedCategory}</Text>
                </View>
                <Text style={styles.helpText}>※資格は変更できません</Text>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>タイトル</Text>
                <TextInput
                  style={styles.titleInput}
                  value={editedTitle}
                  onChangeText={setEditedTitle}
                  placeholder="問題集名を入力"
                  placeholderTextColor={theme.colors.secondary[400]}
                  multiline
                />
              </View>

              <View style={styles.menuDivider} />

              <View style={styles.menuItem}>
                <Text style={styles.menuText}>節を使用</Text>
                <Switch
                  value={useSections ?? false}
                  onValueChange={handleToggleSections}
                  trackColor={{
                    false: theme.colors.secondary[300],
                    true: theme.colors.primary[400]
                  }}
                  thumbColor={useSections ? theme.colors.primary[600] : theme.colors.neutral.white}
                />
              </View>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Trash2 size={20} color={theme.colors.error[600]} />
                <Text style={styles.deleteButtonText}>問題集を削除</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.footerButton, styles.cancelButton]}
                onPress={handleCloseMenu}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerButton, styles.saveButton]}
                onPress={handleSaveAndClose}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  bookContainer: {
    position: 'relative',
    aspectRatio: 0.7,
  },
  book: {
    flex: 1,
    position: 'relative',
    zIndex: 2,
  },
  bookSpine: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.primary[600],
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  bookTop: {
    height: 6,
    backgroundColor: theme.colors.primary[600],
  },
  bookMain: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: 'space-between',
    position: 'relative',
  },
  bookBottom: {
    height: 6,
    backgroundColor: theme.colors.primary[600],
  },
  bookShadow: {
    position: 'absolute',
    top: 3,
    right: -3,
    bottom: 3,
    width: 6,
    backgroundColor: theme.colors.primary[200],
    borderRadius: theme.borderRadius.sm,
    zIndex: 1,
  },
  menuButton: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    zIndex: 10,
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: theme.borderRadius.sm,
  },
  bookContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    textAlign: 'center',
    lineHeight: 20,
  },
  bookStats: {
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  bookStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookStatLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.secondary[700],
    fontFamily: 'ZenKaku-Regular',
  },
  bookStatValue: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
  },
  bookStatDivider: {
    height: 1,
    backgroundColor: theme.colors.secondary[200],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.xl,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary[50],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary[200],
  },
  modalHeaderText: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
    textAlign: 'center',
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  inputSection: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[700],
    marginBottom: theme.spacing.xs,
  },
  titleInput: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[900],
    borderWidth: 1,
    borderColor: theme.colors.secondary[300],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral.white,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.secondary[300],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral.white,
  },
  categorySelectorText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[900],
  },
  categoryDropdown: {
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.secondary[300],
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.neutral.white,
    maxHeight: 200,
    ...theme.shadows.md,
  },
  categoryOption: {
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary[200],
  },
  categoryOptionText: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[900],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.secondary[200],
    marginVertical: theme.spacing.md,
  },
  menuText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[900],
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  deleteButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.error[600],
  },
  modalFooter: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.secondary[200],
  },
  footerButton: {
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
  saveButton: {
    backgroundColor: theme.colors.primary[600],
  },
  saveButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.neutral.white,
  },
  helpText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.secondary[500],
    marginTop: theme.spacing.xs,
  },
});

export default QuizBookCard
