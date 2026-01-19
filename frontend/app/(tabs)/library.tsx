import { useAppTheme } from '@/hooks/useAppTheme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { AlertCircle, Edit, MoreVertical, Plus, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import AddItemModal from '../_compornents/AddItemModal';
import CategorySelectModal from '../_compornents/CategorySelectModal';
import ConfirmDialog from '../_compornents/ConfirmDialog';
import QuizBookCard from '../_compornents/QuizBookCard';
import QuizBookTitleModal from '../_compornents/QuizBookTitleModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showSuccessToast, showErrorToast, showWarningToast } from '@/utils/toast';

export default function LibraryScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { scannedBookTitle, scannedBookIsbn, scannedBookThumbnail, openCategoryModal } = useLocalSearchParams<{
    scannedBookTitle?: string;
    scannedBookIsbn?: string;
    scannedBookThumbnail?: string;
    openCategoryModal?: string;
  }>();

  const quizBooks = useQuizBookStore(state => state.quizBooks);
  const categories = useQuizBookStore(state => state.categories);
  const fetchCategories = useQuizBookStore(state => state.fetchCategories);
  const createCategory = useQuizBookStore(state => state.createCategory);
  const updateCategory = useQuizBookStore(state => state.updateCategory);
  const deleteCategory = useQuizBookStore(state => state.deleteCategory);
  const addQuizBook = useQuizBookStore(state => state.addQuizBook);
  const deleteQuizBook = useQuizBookStore(state => state.deleteQuizBook);
  const completeQuizBook = useQuizBookStore(state => state.completeQuizBook);
  const reactivateQuizBook = useQuizBookStore(state => state.reactivateQuizBook);

  const { isPremium, canCreateQuizBook, fetchActiveQuizBookCount } = useSubscriptionStore();

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [titleModalVisible, setTitleModalVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [scannedTitle, setScannedTitle] = useState<string>('');
  const [scannedIsbn, setScannedIsbn] = useState<string>('');
  const [scannedThumbnail, setScannedThumbnail] = useState<string>('');

  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedCategoryName, setEditedCategoryName] = useState('');
  const [targetCategoryId, setTargetCategoryId] = useState<string>('');
  const [deleteCategoryDialogVisible, setDeleteCategoryDialogVisible] = useState(false);
  const [categoryBooksCount, setCategoryBooksCount] = useState(0);
  const [isCategoryCreating, setIsCategoryCreating] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    fetchCategories();
  }, []);

  // バーコードスキャンから戻ってきた場合の処理
  useEffect(() => {
    if (scannedBookTitle && openCategoryModal === 'true') {
      setScannedTitle(scannedBookTitle);
      setScannedIsbn(scannedBookIsbn || '');
      setScannedThumbnail(scannedBookThumbnail || '');
      setIsAddingCategory(false);
      setCategoryModalVisible(true);
      // パラメータをクリア
      router.setParams({ scannedBookTitle: undefined, scannedBookIsbn: undefined, scannedBookThumbnail: undefined, openCategoryModal: undefined });
    }
  }, [scannedBookTitle, scannedBookIsbn, scannedBookThumbnail, openCategoryModal]);

  useFocusEffect(
    useCallback(() => {
      // アクティブな問題集数を更新（削除後などに即座に反映させるため）
      fetchActiveQuizBookCount();

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

    }, [])
  );

  const groupedQuizBooks = useMemo(() => {
    const groups: { [key: string]: { categoryId: string; books: any[] } } = {};

    // 全カテゴリをグループに追加（問題集がなくても表示）
    categories.forEach(category => {
      groups[category.name] = { categoryId: category.id, books: [] };
    });

    // 問題集をカテゴリごとにグループ化
    quizBooks.forEach((book) => {
      const categoryName = book.category?.name || '未分類';
      if (!groups[categoryName]) {
        groups[categoryName] = { categoryId: book.category?.id || '', books: [] };
      }
      groups[categoryName].books.push(book);
    });

    return groups;
  }, [quizBooks, categories]);

  const handleAddQuiz = () => {
    setAddItemModalVisible(true);
  };

  const handleAddCategory = () => {
    setAddItemModalVisible(false);
    setIsAddingCategory(true);
    setCategoryModalVisible(true);
  };

  const handleAddQuizBook = () => {
    // 無料ユーザーで既にアクティブな問題集がある場合はペイウォールを表示
    if (!canCreateQuizBook()) {
      setAddItemModalVisible(false);
      router.push('/paywall?source=add_quiz_book');
      return;
    }

    if (categories.length === 0) {
      setAddItemModalVisible(false);
      setIsAddingCategory(true);
      setCategoryModalVisible(true);
      return;
    }
    setAddItemModalVisible(false);
    setIsAddingCategory(false);
    setCategoryModalVisible(true);
  };

  const handleScanBarcode = () => {
    // 無料ユーザーで既にアクティブな問題集がある場合はペイウォールを表示
    if (!canCreateQuizBook()) {
      setAddItemModalVisible(false);
      router.push('/paywall?source=add_quiz_book');
      return;
    }

    setAddItemModalVisible(false);
    router.push('/barcode-scanner');
  };

  const handleCategorySelect = async (categoryNameOrId: string) => {
    if (isAddingCategory) {
      // カテゴリ追加モード：カテゴリのみ作成
      const existingCategory = categories.find(c => c.name === categoryNameOrId);

      if (existingCategory) {
        // 既存のカテゴリの場合は何もしない
        setCategoryModalVisible(false);
        setIsAddingCategory(false);
        return;
      }

      // 新しいカテゴリを作成
      try {
        setIsCategoryCreating(true);
        await createCategory(categoryNameOrId);
        setCategoryModalVisible(false);
        setIsAddingCategory(false);
      } catch (error) {
        console.error('Failed to create category:', error);
      } finally {
        setIsCategoryCreating(false);
      }
    } else {
      // 問題集追加モード：カテゴリを選択してタイトル入力へ
      const category = categories.find(c => c.name === categoryNameOrId);
      if (category) {
        setSelectedCategoryId(category.id);
        setCategoryModalVisible(false);
        setTitleModalVisible(true);
      } else {
        // 新しいカテゴリの場合は作成してからIDを取得
        try {
          setIsCategoryCreating(true);
          const categoryId = await createCategory(categoryNameOrId);
          setSelectedCategoryId(categoryId);
          setCategoryModalVisible(false);
          setTitleModalVisible(true);
        } catch (error) {
          console.error('Failed to create category:', error);
        } finally {
          setIsCategoryCreating(false);
        }
      }
    }
  };

  const handleTitleConfirm = async (title: string) => {
    try {
      await addQuizBook(title, selectedCategoryId, true, scannedIsbn || undefined, scannedThumbnail || undefined);
      await fetchActiveQuizBookCount();
      setTitleModalVisible(false);
      setSelectedCategoryId('');
      setScannedTitle('');
      setScannedIsbn('');
      setScannedThumbnail('');
    } catch (error) {
      console.error('Failed to confirm Title:', error);
    }
  };

  const handleTitleCancel = () => {
    setTitleModalVisible(false);
    setSelectedCategoryId('');
    setScannedTitle('');
    setScannedIsbn('');
    setScannedThumbnail('');
  };

  const handleCardPress = (quizBookId: string) => {
    router.push(`/study/${quizBookId}` as any);
  };

  const handleDelete = async (quizBookId: string) => {
    setDeleteTargetId(quizBookId);
    setDeleteDialogVisible(true);
  };

  const handleComplete = async (quizBookId: string) => {
    try {
      await completeQuizBook(quizBookId);
      await fetchActiveQuizBookCount();
      showSuccessToast('問題集を完了しました！');
      // ペイウォールを表示
      router.push('/paywall?source=complete');
    } catch (error) {
      // エラーはストアで処理される
    }
  };

  const handleReactivate = async (quizBookId: string) => {
    // 無料ユーザーで他にアクティブな問題集がある場合は再開できない
    if (!isPremium && !canCreateQuizBook()) {
      showWarningToast('プレミアムプランにアップグレードすると、複数の問題集を同時に使用できます');
      router.push('/paywall?source=reactivate');
      return;
    }

    try {
      await reactivateQuizBook(quizBookId);
      await fetchActiveQuizBookCount();
      showSuccessToast('問題集を再開しました');
    } catch (error) {
      // エラーはストアで処理される
    }
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      await deleteQuizBook(deleteTargetId);
      await fetchActiveQuizBookCount();
      setDeleteDialogVisible(false);
      setDeleteTargetId(null);
    }
  };

  const handleCategoryMenuPress = (categoryId: string) => {
    setTargetCategoryId(categoryId);
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setEditedCategoryName(category.name);
    }
    setShowCategoryMenu(true);
  };

  const handleEditCategory = () => {
    setShowCategoryMenu(false);
    setShowEditModal(true);
  };

  const handleDeleteCategory = () => {
    setShowCategoryMenu(false);

    // ✅ カテゴリに紐づく問題集の数をカウント
    const categoryBooks = quizBooks.filter(book => book.categoryId === targetCategoryId);
    setCategoryBooksCount(categoryBooks.length);

    setDeleteCategoryDialogVisible(true);
  };

  const confirmEditCategory = async () => {
    if (editedCategoryName.trim() === '') {
      setShowEditModal(false);
      return;
    }

    try {
      await updateCategory(targetCategoryId, editedCategoryName.trim());
      setShowEditModal(false);
      setTargetCategoryId('');
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('カテゴリ名の変更に失敗しました');
    }
  };

  const confirmDeleteCategory = async () => {
    try {
      await deleteCategory(targetCategoryId);
      setDeleteCategoryDialogVisible(false);
      setTargetCategoryId('');
      setCategoryBooksCount(0);
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('カテゴリの削除に失敗しました');
    }
  };

  // ✅ カテゴリ名取得用のヘルパー
  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || '';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {categories.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyContent}>
                {/* @ts-ignore */}
                <AlertCircle size={20} color={theme.colors.warning[600]} />
                <Text style={styles.emptyText}>まだカテゴリが登録されていません</Text>
              </View>
            </View>
          ) : (
            Object.entries(groupedQuizBooks).map(([categoryName, group]) => {
              const categoryId = group.categoryId;
              const books = group.books;
              return (
                <View key={categoryName} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryTitle}>{categoryName}</Text>
                    {categoryId && (
                      <TouchableOpacity
                        onPress={() => handleCategoryMenuPress(categoryId)}
                        activeOpacity={0.7}
                        style={styles.categoryMenuButton}
                      >
                        {/* @ts-ignore */}
                        <MoreVertical size={20} color={theme.colors.secondary[600]} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {books.length === 0 ? (
                    <View style={styles.emptyCategory}>
                      <Text style={styles.emptyCategoryText}>問題集がありません</Text>
                    </View>
                  ) : (
                    <View style={styles.cardsGrid}>
                      {books.map((book) => (
                        <View key={book.id} style={styles.cardWrapper}>
                          <QuizBookCard
                            quizBook={book}
                            onPress={() => handleCardPress(book.id)}
                            onDelete={() => handleDelete(book.id)}
                            onComplete={() => handleComplete(book.id)}
                            onReactivate={() => handleReactivate(book.id)}
                            existingCategories={categories.map(c => c.name)}
                          />
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

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
        onScanBarcode={handleScanBarcode}
        onClose={() => setAddItemModalVisible(false)}
      />

      <CategorySelectModal
        visible={categoryModalVisible}
        categories={categories.map(c => c.name)}
        onSelect={(categoryName) => {
          handleCategorySelect(categoryName);
        }}
        mode={isAddingCategory ? 'create' : 'select'}
        registeredCategories={categories.map(c => c.name)}
        isLoading={isCategoryCreating}
        loadingMessage="資格グループを作成中..."
        onClose={() => {
          setCategoryModalVisible(false);
          setIsAddingCategory(false);
        }}
      />

      <QuizBookTitleModal
        visible={titleModalVisible}
        categoryName={categories.find(c => c.id === selectedCategoryId)?.name || ''}
        initialTitle={scannedTitle}
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
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
        </KeyboardAvoidingView>
      </Modal>

      {/* ✅ メッセージを動的に変更 */}
      <ConfirmDialog
        visible={deleteCategoryDialogVisible}
        title="資格グループを削除"
        message={
          categoryBooksCount === 0
            ? `「${getCategoryName(targetCategoryId)}」の資格グループを削除してもよろしいですか？この操作は取り消せません。`
            : `「${getCategoryName(targetCategoryId)}」の資格グループとその中の全ての問題集（${categoryBooksCount}冊）を削除してもよろしいですか？この操作は取り消せません。`
        }
        onConfirm={confirmDeleteCategory}
        onCancel={() => {
          setDeleteCategoryDialogVisible(false);
          setCategoryBooksCount(0); // ✅ リセット
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
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
  emptyCategory: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  emptyCategoryText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[500],
    fontStyle: 'italic',
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