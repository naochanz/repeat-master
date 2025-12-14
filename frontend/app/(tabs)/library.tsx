import { theme } from '@/constants/theme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { AlertCircle, Edit, MoreVertical, Plus, Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { CommonActions } from '@react-navigation/native';
import AddItemModal from '../_compornents/AddItemModal';
import CategorySelectModal from '../_compornents/CategorySelectModal';
import ConfirmDialog from '../_compornents/ConfirmDialog';
import QuizBookCard from '../_compornents/QuizBookCard';
import QuizBookTitleModal from '../_compornents/QuizBookTitleModal';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LibraryScreen() {
  const quizBooks = useQuizBookStore(state => state.quizBooks);
  const addQuizBook = useQuizBookStore(state => state.addQuizBook);
  const deleteQuizBook = useQuizBookStore(state => state.deleteQuizBook);
  const updateQuizBook = useQuizBookStore(state => state.updateQuizBook);

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [titleModalVisible, setTitleModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedCategoryName, setEditedCategoryName] = useState('');
  const [targetCategory, setTargetCategory] = useState<string>('');
  const [deleteCategoryDialogVisible, setDeleteCategoryDialogVisible] = useState(false);

  const navigation = useNavigation();
  const opacity = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      // 初期状態は透明
      opacity.value = 0;

      // スタディスタックの履歴をリセット
      const rootState = navigation.getState();
      if (rootState && rootState.routes) {
        const studyRoute = rootState.routes.find((route: any) => route.name === 'study');
        if (studyRoute && studyRoute.state) {
          navigation.dispatch(
            CommonActions.reset({
              ...rootState,
              routes: rootState.routes.map((route: any) => {
                if (route.name === 'study') {
                  return { ...route, state: undefined };
                }
                return route;
              }),
            })
          );
        }
      }

      // レンダリング完了後にフェードイン開始
      const timer = setTimeout(() => {
        opacity.value = withTiming(1, { duration: 50 });
      }, 16); // 1フレーム待つ（約16ms）

      return () => clearTimeout(timer);
    }, [])
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });
  
  const registeredCategories = useMemo(() => {
    return [...new Set(quizBooks.map(book => book.category))];
  }, [quizBooks]);

  const groupedQuizBooks = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    quizBooks.forEach((book) => {
      const category = book.category || '未分類';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(book);
    });
    return groups;
  }, [quizBooks]);

  const existingCategories = useMemo(() => {
    return Array.from(new Set(quizBooks.map(book => book.category).filter(Boolean)));
  }, [quizBooks]);

  const handleAddQuiz = () => {
    setAddItemModalVisible(true);
  };

  const handleAddCategory = () => {
    setAddItemModalVisible(false);
    setIsAddingCategory(true);
    setCategoryModalVisible(true);
  };

  const handleAddQuizBook = () => {
    if (existingCategories.length === 0) {
      setAddItemModalVisible(false);
      setIsAddingCategory(true);
      setCategoryModalVisible(true);
      return;
    }
    setAddItemModalVisible(false);
    setIsAddingCategory(false);
    setCategoryModalVisible(true);
  };

  const handleCategorySelect = async (category: string) => {
    if (isAddingCategory) {
      const newQuizBook = {
        id: `quiz-${Date.now()}`,
        title: '',
        category: category,
        chapterCount: 0,
        chapters: [],
        currentRate: 0,
        useSections: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await addQuizBook(newQuizBook);
      setCategoryModalVisible(false);
      setIsAddingCategory(false);
    } else {
      setSelectedCategory(category);
      setCategoryModalVisible(false);
      setTitleModalVisible(true);
    }
  };

  const handleTitleConfirm = async (title: string) => {
    const newQuizBook = {
      id: `quiz-${Date.now()}`,
      title: title,
      category: selectedCategory,
      chapterCount: 0,
      chapters: [],
      currentRate: 0,
      useSections: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await addQuizBook(newQuizBook);
    setTitleModalVisible(false);
    setSelectedCategory('');
  };

  const handleTitleCancel = () => {
    setTitleModalVisible(false);
    setSelectedCategory('');
  };

  const handleCardPress = (quizBookId: string) => {
    router.push(`/study/${quizBookId}` as any);
  };

  const handleDelete = async (quizBookId: string) => {
    setDeleteTargetId(quizBookId);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      await deleteQuizBook(deleteTargetId);
      setDeleteDialogVisible(false);
      setDeleteTargetId(null);
    }
  };

  const handleCategoryMenuPress = (category: string) => {
    setTargetCategory(category);
    setShowCategoryMenu(true);
  };

  const handleEditCategory = () => {
    setShowCategoryMenu(false);
    setEditedCategoryName(targetCategory);
    setShowEditModal(true);
  };

  const handleDeleteCategory = () => {
    setShowCategoryMenu(false);
    setDeleteCategoryDialogVisible(true);
  };

  const confirmEditCategory = async () => {
    if (editedCategoryName.trim() === '' || editedCategoryName === targetCategory) {
      setShowEditModal(false);
      return;
    }

    const categoryBooks = quizBooks.filter(book => book.category === targetCategory);
    for (const book of categoryBooks) {
      await updateQuizBook(book.id, { category: editedCategoryName.trim() });
    }
    setShowEditModal(false);
    setTargetCategory('');
  };

  const confirmDeleteCategory = async () => {
    const categoryBooks = quizBooks.filter(book => book.category === targetCategory);
    for (const book of categoryBooks) {
      await deleteQuizBook(book.id);
    }
    setDeleteCategoryDialogVisible(false);
    setTargetCategory('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>登録済み問題集</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {quizBooks.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyContent}>
              {/* @ts-ignore */}
              <AlertCircle size={20} color={theme.colors.warning[600]} />
              <Text style={styles.emptyText}>まだ問題集が登録されていません</Text>
            </View>
          </View>
        ) : (
          Object.entries(groupedQuizBooks).map(([category, books]) => (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{category}</Text>
                <TouchableOpacity
                  onPress={() => handleCategoryMenuPress(category)}
                  activeOpacity={0.7}
                  style={styles.categoryMenuButton}
                >
                  {/* @ts-ignore */}
                  <MoreVertical size={20} color={theme.colors.secondary[600]} />
                </TouchableOpacity>
              </View>

              <View style={styles.cardsGrid}>
                {books.map((book) => (
                  <View key={book.id} style={styles.cardWrapper}>
                    <QuizBookCard
                      quizBook={book}
                      onPress={() => handleCardPress(book.id)}
                      onDelete={() => handleDelete(book.id)}
                      existingCategories={existingCategories}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
      </Animated.View>

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddQuiz}
        activeOpacity={0.8}
      >
        {/* @ts-ignore */}
        <Plus size={28} color={theme.colors.neutral.white} strokeWidth={2.5} />
      </TouchableOpacity>

      <AddItemModal
        visible={addItemModalVisible}
        onAddCategory={handleAddCategory}
        onAddQuizBook={handleAddQuizBook}
        onClose={() => setAddItemModalVisible(false)}
      />

      <CategorySelectModal
        visible={categoryModalVisible}
        categories={existingCategories}
        onSelect={handleCategorySelect}
        mode={isAddingCategory ? 'create' : 'select'}
        registeredCategories={registeredCategories}
        onClose={() => {
          setCategoryModalVisible(false);
          setIsAddingCategory(false);
        }}
      />

      <QuizBookTitleModal
        visible={titleModalVisible}
        categoryName={selectedCategory}
        onConfirm={handleTitleConfirm}
        onCancel={handleTitleCancel}
      />

      <ConfirmDialog
        visible={deleteDialogVisible}
        title="問題集を削除"
        message="この問題集を削除してもよろしいですか？この操作は取り消せません。"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogVisible(false)}
      />

      <Modal
        visible={showCategoryMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryMenu(false)}>
          <View style={styles.menuContent}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEditCategory}>
              {/* @ts-ignore */}
              <Edit size={20} color={theme.colors.primary[600]} />
              <Text style={styles.menuText}>編集</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteCategory}>
              {/* @ts-ignore */}
              <Trash2 size={20} color={theme.colors.error[600]} />
              <Text style={[styles.menuText, { color: theme.colors.error[600] }]}>削除</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <Text style={styles.editModalTitle}>資格名を編集</Text>
            <TextInput
              style={styles.editInput}
              value={editedCategoryName}
              onChangeText={setEditedCategoryName}
              placeholder="資格名を入力"
              placeholderTextColor={theme.colors.secondary[400]}
            />
            <View style={styles.editModalActions}>
              <TouchableOpacity
                style={[styles.editModalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editModalButton, styles.confirmButton]}
                onPress={confirmEditCategory}
              >
                <Text style={styles.confirmButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={deleteCategoryDialogVisible}
        title="資格グループを削除"
        message={`「${targetCategory}」の資格グループとその中の全ての問題集を削除してもよろしいですか？この操作は取り消せません。`}
        onConfirm={confirmDeleteCategory}
        onCancel={() => setDeleteCategoryDialogVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
  },
  sectionContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary[200],
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'Zenkaku',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  categorySection: {
    marginBottom: theme.spacing.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary[400],
  },
  categoryTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
  },
  categoryMenuButton: {
    padding: theme.spacing.xs,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
  },
  cardWrapper: {
    width: '33.333%',
    paddingHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[600],
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  menuContent: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    minWidth: 200,
    ...theme.shadows.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.secondary[200],
    marginHorizontal: theme.spacing.md,
  },
  menuText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[900],
  },
  editModalContent: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    minWidth: 300,
    ...theme.shadows.xl,
  },
  editModalTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
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
    marginBottom: theme.spacing.lg,
  },
  editModalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  editModalButton: {
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
});