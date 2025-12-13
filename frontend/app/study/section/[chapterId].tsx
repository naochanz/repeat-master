import EditDeleteModal from '@/app/compornents/EditDeleteModal';
import CustomTabBar from '@/components/CustomTabBar';
import Card from '@/components/ui/Card';
import { theme } from '@/constants/theme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AlertCircle, ArrowLeft, MoreVertical, Plus } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SectionList = () => {
  const { chapterId } = useLocalSearchParams();
  const quizBooks = useQuizBookStore(state => state.quizBooks);
  const fetchQuizBooks = useQuizBookStore(state => state.fetchQuizBooks);
  const updateQuizBook = useQuizBookStore(state => state.updateQuizBook);
  const addSectionToChapter = useQuizBookStore(state => state.addSectionToChapter);
  const deleteSectionFromChapter = useQuizBookStore(state => state.deleteSectionFromChapter);
  const updateSectionInChapter = useQuizBookStore(state => state.updateSectionInChapter);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [editingSection, setEditingSection] = useState<any>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchQuizBooks();
    }, [fetchQuizBooks])
  );

  let chapterData = null;
  for (const book of quizBooks) {
    const chapter = book.chapters.find(ch => ch.id === chapterId);
    if (chapter) {
      chapterData = { book, chapter };
      break;
    }
  }

  if (!chapterData) {
    return (
      <View style={styles.container}>
        <Text>章が見つかりません</Text>
      </View>
    );
  }

  const { book, chapter } = chapterData;
  const sections = chapter.sections || [];

  const handleSelectUseSections = async (useSections: boolean) => {
    await updateQuizBook(book.id, { useSections });
    if (useSections) {
      // 節を使用する場合は節一覧を表示
    } else {
      // 節を使用しない場合は問題画面へ遷移
      router.replace({
        pathname: '/study/question/[id]',
        params: { id: chapter.id }
      });
    }
  };

  const handleSectionPress = (sectionId: string) => {
    if (activeMenu) return;
    router.push({
      pathname: '/study/question/[id]',
      params: { id: sectionId }
    });
  };

  const handleChapterPress = () => {
    router.push({
      pathname: '/study/question/[id]',
      params: { id: chapter.id }
    });
  };

  const handleAddSection = async () => {
    await addSectionToChapter(book.id, chapter.id, newSectionTitle.trim());
    setNewSectionTitle('');
    setShowAddModal(false);
  };

  const handleMenuPress = (section: any, e: any) => {
    e.stopPropagation();
    setEditingSection(section);
    setActiveMenu(section.id);
  };

  const handleSaveSection = async (newTitle: string) => {
    if (editingSection && newTitle.trim() !== '') {
      await updateSectionInChapter(book.id, chapter.id, editingSection.id, {
        title: newTitle.trim()
      });
    }
    setActiveMenu(null);
    setEditingSection(null);
  };

  const handleDeleteSection = async () => {
    if (editingSection) {
      await deleteSectionFromChapter(book.id, chapter.id, editingSection.id);
    }
    setActiveMenu(null);
    setEditingSection(null);
  };

  // 初回選択画面
  if (book.useSections === undefined) {
    return (
      <>
        <SafeAreaView style={styles.wrapper} edges={['top', 'left', 'right']}>
          <Stack.Screen
            options={{
              headerTitle: () => (
                <View style={{ maxWidth: 280 }}>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{ fontSize: 16, fontWeight: "bold", textAlign: 'center' }}
                  >
                    {book.title}
                  </Text>

                  <Text style={{ fontSize: 14, textAlign: 'center' }}>
                    {`第${chapter.chapterNumber}章 ${chapter.title}`}
                  </Text>
                </View>
              ),
              headerLeft: () => (
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={{ marginLeft: 8 }}
                >
                  <ArrowLeft size={24} color={theme.colors.secondary[900]} />
                </TouchableOpacity>
              ),
              gestureEnabled: false,
            }}
          />
          <View style={styles.selectionContainer}>
            <Text style={styles.selectionTitle}>節を使用しますか？</Text>
            <Text style={styles.selectionDescription}>
              この問題集で節を使用するかどうかを選択してください。{'\n'}
              後から設定で変更することもできます。
            </Text>
            <View style={styles.selectionButtons}>
              <TouchableOpacity
                style={[styles.selectionButton, styles.yesButton]}
                onPress={() => handleSelectUseSections(true)}
              >
                <Text style={styles.yesButtonText}>はい</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.selectionButton, styles.noButton]}
                onPress={() => handleSelectUseSections(false)}
              >
                <Text style={styles.noButtonText}>いいえ</Text>
              </TouchableOpacity>
            </View>
          </View>
          <CustomTabBar />
        </SafeAreaView>
      </>
    );
  }

  // 節を使用する場合
  return (
    <>
      <SafeAreaView style={styles.wrapper} edges={['top', 'left', 'right']}>
        <Stack.Screen
          options={{
            headerTitle: () => (
              <View style={{ maxWidth: 280 }}>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ fontSize: 16, fontWeight: "bold", textAlign: 'center' }}
                >
                  {book.title}
                </Text>

                <Text style={{ fontSize: 14, textAlign: 'center' }}>
                  {`第${chapter.chapterNumber}章 ${chapter.title}`}
                </Text>
              </View>
            ),
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ marginLeft: 8 }}
              >
                <ArrowLeft size={24} color={theme.colors.secondary[900]} />
              </TouchableOpacity>
            ),
            gestureEnabled: false,
          }}
        />
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {sections.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyContent}>
                <AlertCircle size={20} color={theme.colors.warning[600]} />
                <Text style={styles.emptyText}>節を追加してください</Text>
              </View>
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleChapterPress}
              >
                <Text style={styles.startButtonText}>
                  節なしで問題を開始
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            sections.map((section) => (
              <View key={section.id} style={styles.cardWrapper}>
                <TouchableOpacity
                  onPress={() => handleSectionPress(section.id)}
                  activeOpacity={0.7}
                >
                  <Card style={styles.sectionCard}>
                    <TouchableOpacity
                      style={styles.menuButton}
                      onPress={(e) => handleMenuPress(section, e)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <MoreVertical size={20} color={theme.colors.secondary[600]} />
                    </TouchableOpacity>

                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionNumber}>
                        第{section.sectionNumber}節
                      </Text>
                      {section.title && (
                        <Text style={styles.sectionTitle}>
                          {section.title}
                        </Text>
                      )}
                    </View>
                    <View style={styles.sectionStats}>
                      <Text style={styles.questionCount}>
                        {section.questionCount}問
                      </Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.7}
          >
            <Plus size={24} color={theme.colors.primary[600]} strokeWidth={2.5} />
            <Text style={styles.addButtonText}>節を追加</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* モーダル等は同じ */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>節を追加</Text>
              <TextInput
                style={styles.input}
                value={newSectionTitle}
                onChangeText={setNewSectionTitle}
                placeholder="節名を入力（任意）"
                placeholderTextColor={theme.colors.secondary[400]}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowAddModal(false);
                    setNewSectionTitle('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleAddSection}
                >
                  <Text style={styles.confirmButtonText}>追加</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <EditDeleteModal
          visible={!!activeMenu && !!editingSection}
          onClose={() => {
            setActiveMenu(null);
            setEditingSection(null);
          }}
          onSave={handleSaveSection}
          onDelete={handleDeleteSection}
          title="節の編集・削除"
          editLabel="節名"
          editValue={editingSection?.title || ''}
          editPlaceholder="節名を入力（任意）"
        />

        <CustomTabBar />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  container: {
    flex: 1,
  },
  // ★ titleContainer を削除
  // titleContainer: { ... },
  // title: { ... },
  // subtitle: { ... },

  // ★ 節数表示用のスタイル追加（オプション）
  sectionCountContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.neutral[100],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary[200],
  },
  sectionCountText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  selectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  selectionTitle: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    marginBottom: theme.spacing.lg,
    fontFamily: 'ZenKaku-Bold',
  },
  selectionDescription: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[600],
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
    fontFamily: 'ZenKaku-Regular',
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  selectionButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    minWidth: 120,
    alignItems: 'center',
  },
  yesButton: {
    backgroundColor: theme.colors.primary[600],
  },
  yesButtonText: {
    color: theme.colors.neutral.white,
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
  },
  noButton: {
    backgroundColor: theme.colors.secondary[200],
  },
  noButtonText: {
    color: theme.colors.secondary[700],
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
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
    marginBottom: theme.spacing.lg,
  },
  emptyText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
  },
  startButton: {
    backgroundColor: theme.colors.primary[600],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  startButtonText: {
    color: theme.colors.neutral.white,
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
  },
  cardWrapper: {
    marginBottom: theme.spacing.sm,
    position: 'relative',
  },
  sectionCard: {
    padding: theme.spacing.md,
    position: 'relative',
  },
  menuButton: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    zIndex: 10,
    padding: 4,
  },
  sectionHeader: {
    marginBottom: theme.spacing.sm,
  },
  sectionNumber: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.primary[600],
    marginBottom: 4,
    fontFamily: 'ZenKaku-Bold',
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    marginBottom: theme.spacing.xs,
    fontFamily: 'ZenKaku-Bold',
  },
  sectionStats: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.secondary[200],
    paddingTop: theme.spacing.sm,
  },
  questionCount: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
  },
  menu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.secondary[200],
    ...theme.shadows.lg,
    overflow: 'hidden',
    zIndex: 100,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.secondary[200],
  },
  menuText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[900],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
    borderStyle: 'dashed',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  addButtonText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    marginBottom: theme.spacing.lg,
    fontFamily: 'ZenKaku-Bold',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.secondary[300],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Regular',
    marginBottom: theme.spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
  },
  modalButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.secondary[100],
  },
  cancelButtonText: {
    color: theme.colors.secondary[700],
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    fontFamily: 'ZenKaku-Medium',
  },
  confirmButton: {
    backgroundColor: theme.colors.primary[600],
  },
  confirmButtonText: {
    color: theme.colors.neutral.white,
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    fontFamily: 'ZenKaku-Medium',
  },
});

export default SectionList;