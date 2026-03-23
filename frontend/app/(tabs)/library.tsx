import { useAppTheme } from '@/hooks/useAppTheme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { Edit, MoreVertical, Plus, Search, BookOpen, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import AdBanner from '@/components/AdBanner';
import AddItemModal from '../_compornents/AddItemModal';
import AddQuizBookModal from '../_compornents/AddQuizBookModal';
import CategorySelectModal from '../_compornents/CategorySelectModal';
import ConfirmDialog from '../_compornents/ConfirmDialog';
import LoadingOverlay from '../_compornents/LoadingOverlay';
import EditDeleteModal from '../_compornents/EditDeleteModal';
import { Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGuideStore } from '@/stores/guideStore';
import GuideOverlay from '@/components/GuideOverlay';
import { usePulse } from '@/hooks/usePulse';
import { showSuccessToast, showErrorToast, showWarningToast } from '@/utils/toast';
import { quizBookDomain } from '@/domain/quizBookDomain';

export default function LibraryScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { scannedBookTitle, scannedBookIsbn, scannedBookThumbnail, openQuizBookModal } = useLocalSearchParams<{
    scannedBookTitle?: string; scannedBookIsbn?: string; scannedBookThumbnail?: string; openQuizBookModal?: string;
  }>();

  const quizBooks = useQuizBookStore(state => state.quizBooks);
  const categories = useQuizBookStore(state => state.categories);
  const isLoading = useQuizBookStore(state => state.isLoading);
  const fetchCategories = useQuizBookStore(state => state.fetchCategories);
  const createCategory = useQuizBookStore(state => state.createCategory);
  const updateCategory = useQuizBookStore(state => state.updateCategory);
  const deleteCategory = useQuizBookStore(state => state.deleteCategory);
  const addQuizBook = useQuizBookStore(state => state.addQuizBook);
  const deleteQuizBook = useQuizBookStore(state => state.deleteQuizBook);
  const completeQuizBook = useQuizBookStore(state => state.completeQuizBook);
  const reactivateQuizBook = useQuizBookStore(state => state.reactivateQuizBook);
  const { isAdFree } = useSubscriptionStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [bookEditModalVisible, setBookEditModalVisible] = useState(false);
  const [bookMenuTargetId, setBookMenuTargetId] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [addQuizBookModalVisible, setAddQuizBookModalVisible] = useState(false);
  const [pendingScannedTitle, setPendingScannedTitle] = useState('');
  const [pendingScannedIsbn, setPendingScannedIsbn] = useState('');
  const [pendingScannedThumbnail, setPendingScannedThumbnail] = useState('');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isCategoryCreating, setIsCategoryCreating] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedCategoryName, setEditedCategoryName] = useState('');
  const [targetCategoryId, setTargetCategoryId] = useState('');
  const [deleteCategoryDialogVisible, setDeleteCategoryDialogVisible] = useState(false);
  const [categoryBooksCount, setCategoryBooksCount] = useState(0);
  const navigation = useNavigation();
  const guideStep = useGuideStore(state => state.currentStep);
  const advanceGuide = useGuideStore(state => state.advance);
  const fabPulse = usePulse(guideStep === 'library_tap_add');
  const bookPulse = usePulse(guideStep === 'library_tap_book');

  useEffect(() => { fetchCategories(); }, []);

  useEffect(() => {
    if (scannedBookTitle && openQuizBookModal === 'true') {
      setPendingScannedTitle(scannedBookTitle);
      setPendingScannedIsbn(scannedBookIsbn || '');
      setPendingScannedThumbnail(scannedBookThumbnail || '');
      setAddQuizBookModalVisible(true);
      router.setParams({ scannedBookTitle: undefined, scannedBookIsbn: undefined, scannedBookThumbnail: undefined, openQuizBookModal: undefined });
    }
  }, [scannedBookTitle, scannedBookIsbn, scannedBookThumbnail, openQuizBookModal]);

  useFocusEffect(useCallback(() => {
    const rootState = navigation.getState();
    if (rootState?.routes) {
      const studyRoute = rootState.routes.find((r: any) => r.name === 'study');
      if (studyRoute?.state) {
        navigation.dispatch(CommonActions.reset({
          ...rootState,
          routes: rootState.routes.map((r: any) => r.name === 'study' ? { ...r, state: undefined } : r),
        }));
      }
    }
  }, []));

  const filteredBooks = useMemo(() => {
    let books = quizBooks;
    if (selectedCategory) books = books.filter(b => b.categoryId === selectedCategory);
    if (searchQuery.trim()) books = books.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return books;
  }, [quizBooks, selectedCategory, searchQuery]);

  // --- Handlers (unchanged logic) ---
  const handleAddQuiz = () => setAddItemModalVisible(true);
  const handleAddCategory = () => { setAddItemModalVisible(false); setCategoryModalVisible(true); };
  const handleAddQuizBook = () => {
    setAddItemModalVisible(false); setPendingScannedTitle(''); setPendingScannedIsbn(''); setPendingScannedThumbnail(''); setAddQuizBookModalVisible(true);
  };
  const handleQuizBookConfirm = async (params: { categoryId?: string; newCategoryName?: string; title: string; isbn?: string; thumbnail?: string }) => {
    let categoryId = params.categoryId;
    if (params.newCategoryName) categoryId = await createCategory(params.newCategoryName);
    if (!categoryId) return;
    await addQuizBook(params.title, categoryId, false, params.isbn, params.thumbnail);
    if (guideStep === 'library_tap_add') advanceGuide(); // → library_tap_book
    setAddQuizBookModalVisible(false); setPendingScannedTitle(''); setPendingScannedIsbn(''); setPendingScannedThumbnail('');
  };
  const handleQuizBookScanBarcode = () => { setAddQuizBookModalVisible(false); setTimeout(() => router.push('/barcode-scanner'), 300); };
  const handleCategorySelect = async (categoryName: string) => {
    if (categories.find(c => c.name === categoryName)) { setCategoryModalVisible(false); return; }
    try { setIsCategoryCreating(true); await createCategory(categoryName); setCategoryModalVisible(false); } catch {} finally { setIsCategoryCreating(false); }
  };
  const handleDelete = (id: string) => { setDeleteTargetId(id); setDeleteDialogVisible(true); };
  const handleComplete = async (id: string) => { try { await completeQuizBook(id); showSuccessToast('問題集を完了しました！'); } catch {} };
  const handleReactivate = async (id: string) => {
    try { await reactivateQuizBook(id); showSuccessToast('問題集を再開しました'); } catch {}
  };
  const confirmDelete = async () => { if (deleteTargetId) { await deleteQuizBook(deleteTargetId); setDeleteDialogVisible(false); setDeleteTargetId(null); } };
  const handleCategoryMenuPress = (categoryId: string) => { setTargetCategoryId(categoryId); const c = categories.find(c => c.id === categoryId); if (c) setEditedCategoryName(c.name); setShowCategoryMenu(true); };
  const handleEditCategory = () => { setShowCategoryMenu(false); setShowEditModal(true); };
  const handleDeleteCategory = () => { setShowCategoryMenu(false); setCategoryBooksCount(quizBooks.filter(b => b.categoryId === targetCategoryId).length); setDeleteCategoryDialogVisible(true); };
  const confirmEditCategory = async () => { if (!editedCategoryName.trim()) { setShowEditModal(false); return; } try { await updateCategory(targetCategoryId, editedCategoryName.trim()); setShowEditModal(false); setTargetCategoryId(''); } catch {} };
  const confirmDeleteCategory = async () => { try { await deleteCategory(targetCategoryId); setDeleteCategoryDialogVisible(false); setTargetCategoryId(''); setCategoryBooksCount(0); } catch {} };
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || '';

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Text style={styles.title}>ライブラリ</Text>

          {/* Search */}
          <View style={styles.searchBar}>
            <Search size={18} color={theme.colors.secondary[400]} />
            <TextInput style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} placeholder="問題集を検索..." placeholderTextColor={theme.colors.secondary[400]} />
          </View>

          {/* Category Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            <TouchableOpacity style={[styles.pill, !selectedCategory && styles.pillActive]} onPress={() => setSelectedCategory(null)}>
              <Text style={[styles.pillText, !selectedCategory && styles.pillTextActive]}>すべて</Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity key={cat.id} style={[styles.pill, selectedCategory === cat.id && styles.pillActive]} onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}>
                <Text style={[styles.pillText, selectedCategory === cat.id && styles.pillTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Book List */}
          {filteredBooks.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{searchQuery ? '検索結果がありません' : '問題集がありません'}</Text>
            </View>
          ) : (
            <View style={styles.bookList}>
              {filteredBooks.map(book => (
                <Animated.View key={book.id} style={[guideStep === 'library_tap_book' && { opacity: bookPulse }]}>
                <TouchableOpacity style={[styles.bookCard, guideStep === 'library_tap_book' && styles.bookCardHighlight]} onPress={() => { if (guideStep === 'library_tap_book') advanceGuide(); router.push(`/study/${book.id}` as any); }} activeOpacity={0.7}>
                  {book.thumbnailUrl ? (
                    <Image source={{ uri: book.thumbnailUrl }} style={styles.bookThumbImg} />
                  ) : (
                    <View style={[styles.bookThumb, { backgroundColor: book.completedAt ? theme.colors.secondary[300] : theme.colors.primary[600] }]}>
                      <BookOpen size={24} color="#FFFFFF" />
                    </View>
                  )}
                  <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle} numberOfLines={1}>{book.title}</Text>
                    <Text style={styles.bookCategory}>{book.category?.name || '未分類'}</Text>
                    {book.completedAt && <Text style={styles.bookCompleted}>完了済み</Text>}
                  </View>
                  <TouchableOpacity style={styles.bookMenu} onPress={() => { setBookMenuTargetId(book.id); setBookEditModalVisible(true); }} hitSlop={8}>
                    <MoreVertical size={18} color={theme.colors.secondary[400]} />
                  </TouchableOpacity>
                </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
          {guideStep === 'library_tap_book' && filteredBooks.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <GuideOverlay step={2} total={4} title="問題集をタップしよう" description="作成した問題集をタップして章の管理に進みましょう。" />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <AdBanner />

      <Animated.View style={[styles.fab, guideStep === 'library_tap_add' && styles.fabHighlight, { opacity: guideStep === 'library_tap_add' ? fabPulse : 1 }]}>
        <TouchableOpacity onPress={handleAddQuiz} activeOpacity={0.8} style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
          <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </Animated.View>

      {guideStep === 'library_tap_add' && (
        <View style={{ position: 'absolute', right: 24, bottom: 140 }}>
          <GuideOverlay step={1} total={4} title="問題集を追加しよう" description="＋ボタンをタップして最初の問題集を登録しましょう。" />
        </View>
      )}

      {/* Modals (existing - will be redesigned in Phase 8) */}
      <AddItemModal visible={addItemModalVisible} onAddCategory={handleAddCategory} onAddQuizBook={handleAddQuizBook} onClose={() => setAddItemModalVisible(false)} />
      <AddQuizBookModal visible={addQuizBookModalVisible} categories={categories} initialTitle={pendingScannedTitle} initialIsbn={pendingScannedIsbn} initialThumbnail={pendingScannedThumbnail} onConfirm={handleQuizBookConfirm} onScanBarcode={handleQuizBookScanBarcode} onClose={() => { setAddQuizBookModalVisible(false); setPendingScannedTitle(''); setPendingScannedIsbn(''); setPendingScannedThumbnail(''); }} />
      <CategorySelectModal visible={categoryModalVisible} categories={categories.map(c => c.name)} onSelect={handleCategorySelect} mode="create" registeredCategories={categories.map(c => c.name)} isLoading={isCategoryCreating} loadingMessage="資格グループを作成中..." onClose={() => setCategoryModalVisible(false)} />
      <ConfirmDialog visible={deleteDialogVisible} title="問題集を削除" message="この問題集を削除してもよろしいですか？この操作は取り消せません。" onConfirm={confirmDelete} onCancel={() => setDeleteDialogVisible(false)} isLoading={isLoading} />

      <Modal visible={showCategoryMenu} transparent animationType="slide" onRequestClose={() => setShowCategoryMenu(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryMenu(false)}>
          <View style={styles.menuContent}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEditCategory}>
              <Edit size={20} color={theme.colors.primary[600]} />
              <Text style={styles.menuText}>編集</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteCategory}>
              <Trash2 size={20} color={theme.colors.error[600]} />
              <Text style={[styles.menuText, { color: theme.colors.error[600] }]}>削除</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.editModalContent}>
              <Text style={styles.editModalTitle}>資格名を編集</Text>
              <TextInput style={styles.editInput} value={editedCategoryName} onChangeText={setEditedCategoryName} placeholder="資格名を入力" placeholderTextColor={theme.colors.secondary[400]} />
              <View style={styles.editModalActions}>
                <TouchableOpacity style={[styles.editBtn, styles.cancelBtn]} onPress={() => setShowEditModal(false)}><Text style={styles.cancelBtnText}>キャンセル</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.editBtn, styles.confirmBtn]} onPress={confirmEditCategory}>{isLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.confirmBtnText}>保存</Text>}</TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Book Edit/Delete/Complete Modal */}
      <EditDeleteModal
        visible={bookEditModalVisible}
        onClose={() => { setBookEditModalVisible(false); setBookMenuTargetId(null); }}
        title="問題集を編集"
        editLabel="問題集名"
        editValue={quizBooks.find(b => b.id === bookMenuTargetId)?.title || ''}
        editPlaceholder="問題集のタイトル"
        onSave={async (newTitle) => {
          if (bookMenuTargetId) {
            const book = quizBooks.find(b => b.id === bookMenuTargetId);
            const updates: any = {};
            if (newTitle.trim() && newTitle.trim() !== book?.title) updates.title = newTitle.trim();
            if (Object.keys(updates).length > 0) {
              const { updateQuizBook } = useQuizBookStore.getState();
              await updateQuizBook(bookMenuTargetId, updates);
            }
          }
        }}
        onDelete={() => { if (bookMenuTargetId) handleDelete(bookMenuTargetId); }}
        isCompleted={!!quizBooks.find(b => b.id === bookMenuTargetId)?.completedAt}
        onComplete={() => { if (bookMenuTargetId) handleComplete(bookMenuTargetId); }}
        onReactivate={() => { if (bookMenuTargetId) handleReactivate(bookMenuTargetId); }}
        isLoading={isLoading}
      >
        <View style={styles.sectionToggle}>
          <Text style={styles.sectionToggleLabel}>節を使う</Text>
          <Switch
            value={!!quizBooks.find(b => b.id === bookMenuTargetId)?.useSections}
            onValueChange={(val) => {
              if (bookMenuTargetId) {
                const prev = useQuizBookStore.getState().quizBooks;
                useQuizBookStore.setState({ quizBooks: prev.map(b => b.id === bookMenuTargetId ? { ...b, useSections: val } : b) });
                quizBookDomain.update(bookMenuTargetId, { useSections: val }).catch(() => {
                  useQuizBookStore.setState({ quizBooks: prev });
                });
              }
            }}
            trackColor={{ false: theme.colors.secondary[200], true: theme.colors.primary[400] }}
            thumbColor={quizBooks.find(b => b.id === bookMenuTargetId)?.useSections ? theme.colors.primary[600] : theme.colors.neutral.white}
          />
        </View>
      </EditDeleteModal>

      <ConfirmDialog visible={deleteCategoryDialogVisible} title="資格グループを削除" message={categoryBooksCount === 0 ? `「${getCategoryName(targetCategoryId)}」を削除してもよろしいですか？` : `「${getCategoryName(targetCategoryId)}」と問題集（${categoryBooksCount}冊）を削除してもよろしいですか？`} onConfirm={confirmDeleteCategory} onCancel={() => { setDeleteCategoryDialogVisible(false); setCategoryBooksCount(0); }} isLoading={isLoading} />
      <LoadingOverlay visible={isLoading} />
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 80, gap: 20 },

  title: { fontSize: 24, fontWeight: '700', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold' },
  fab: { position: 'absolute', right: 24, bottom: 70, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary[600], justifyContent: 'center', alignItems: 'center', ...theme.shadows.lg } as any,
  fabHighlight: { borderWidth: 4, borderColor: theme.colors.primary[600], shadowOpacity: 0.4, shadowRadius: 20 },
  bookCardHighlight: { borderColor: theme.colors.primary[600], borderWidth: 2 },
  sectionToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  sectionToggleLabel: { fontSize: 15, color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Medium' },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, borderRadius: 12, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.secondary[200], paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'ZenKaku-Regular', color: theme.colors.secondary[900] },

  pillRow: { gap: 8 },
  pill: { height: 32, borderRadius: 16, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.secondary[200] },
  pillActive: { backgroundColor: theme.colors.primary[600], borderColor: theme.colors.primary[600] },
  pillText: { fontSize: 12, color: theme.colors.secondary[500], fontFamily: 'ZenKaku-Regular' },
  pillTextActive: { color: '#FFFFFF', fontFamily: 'ZenKaku-Bold' },

  bookList: { gap: 12 },
  bookCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.secondary[200] },
  bookThumb: { width: 52, height: 68, borderRadius: 10, justifyContent: 'center', alignItems: 'center' } as any,
  bookThumbImg: { width: 52, height: 68, borderRadius: 10 },
  bookMenu: { padding: 4 },
  bookInfo: { flex: 1, gap: 4 },
  bookTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.secondary[900], fontFamily: 'ZenKaku-Bold' },
  bookCategory: { fontSize: 11, color: theme.colors.primary[600], fontFamily: 'ZenKaku-Regular' },
  bookCompleted: { fontSize: 11, color: theme.colors.secondary[400], fontFamily: 'ZenKaku-Regular' },

  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: theme.colors.secondary[400], fontFamily: 'ZenKaku-Regular' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  menuContent: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, minWidth: 200, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20 },
  menuDivider: { height: 1, backgroundColor: theme.colors.secondary[200], marginHorizontal: 16 },
  menuText: { fontSize: 16, fontFamily: 'ZenKaku-Medium', color: theme.colors.secondary[900] },

  editModalContent: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: 24, width: '100%', maxWidth: 400 },
  editModalTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'ZenKaku-Bold', color: theme.colors.secondary[900], marginBottom: 16, textAlign: 'center' },
  editInput: { fontSize: 16, fontFamily: 'ZenKaku-Regular', color: theme.colors.secondary[900], borderWidth: 1, borderColor: theme.colors.secondary[200], borderRadius: 14, padding: 16, backgroundColor: theme.colors.background, marginBottom: 16 },
  editModalActions: { flexDirection: 'row', gap: 12 },
  editBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: theme.colors.secondary[100] },
  cancelBtnText: { fontSize: 16, fontWeight: '700', fontFamily: 'ZenKaku-Bold', color: theme.colors.secondary[600] },
  confirmBtn: { backgroundColor: theme.colors.primary[600] },
  confirmBtnText: { fontSize: 16, fontWeight: '700', fontFamily: 'ZenKaku-Bold', color: '#FFFFFF' },
});
