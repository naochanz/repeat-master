import EditDeleteModal from '@/app/compornents/EditDeleteModal';
import CustomTabBar from '@/components/CustomTabBar';
import Card from '@/components/ui/Card';
import { theme } from '@/constants/theme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AlertCircle, MoreVertical, Plus, ArrowLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';



const StudyHome = () => {
    const navigation = useNavigation();
    const { id, fromHome, autoNavigateToSection, autoNavigateToQuestion } = useLocalSearchParams();
    console.log('Can go back:', navigation.canGoBack());

    // ✅ 修正: quizBooks を直接購読
    const quizBooks = useQuizBookStore(state => state.quizBooks);
    const fetchQuizBooks = useQuizBookStore(state => state.fetchQuizBooks);
    const addChapterToQuizBook = useQuizBookStore(state => state.addChapterToQuizBook);
    const deleteChapterFromQuizBook = useQuizBookStore(state => state.deleteChapterFromQuizBook);
    const updateChapterInQuizBook = useQuizBookStore(state => state.updateChapterInQuizBook);

    const [showAddModal, setShowAddModal] = useState(false);
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const [editingChapter, setEditingChapter] = useState<any>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    // ✅ 追加: 画面フォーカス時にデータを再取得
    useFocusEffect(
        useCallback(() => {
            fetchQuizBooks();
        }, [fetchQuizBooks])
    );

    // 自動遷移処理（ホームから来た場合）
    useEffect(() => {
        if (autoNavigateToSection && autoNavigateToQuestion) {
            // 節がある場合: 章リスト → 節リスト → 問題リスト
            const timer = setTimeout(() => {
                router.push({
                    pathname: '/study/section/[chapterId]',
                    params: {
                        chapterId: autoNavigateToSection,
                        autoNavigateToQuestion: autoNavigateToQuestion
                    }
                });
            }, 10);
            return () => clearTimeout(timer);
        } else if (autoNavigateToQuestion) {
            // 節がない場合: 章リスト → 問題リスト
            const timer = setTimeout(() => {
                router.push({
                    pathname: '/study/question/[id]',
                    params: { id: autoNavigateToQuestion }
                });
            }, 10);
            return () => clearTimeout(timer);
        }
    }, [autoNavigateToSection, autoNavigateToQuestion]);

    // ✅ 修正: quizBooks から直接検索
    const quizBook = quizBooks.find(book => book.id === id);

    if (!quizBook) {
        return (
            <ScrollView style={styles.container}>
                <Text>問題集が存在しません</Text>
            </ScrollView>
        )
    }

    const getChapterTotalQuestions = (chapter: typeof quizBook.chapters[0]) => {
        if (chapter.sections && chapter.sections.length > 0) {
            return chapter.sections.reduce((sum, section) => {
                return sum + section.questionCount;
            }, 0);
        } else {
            return chapter.questionCount || 0;
        };
    }

    const handleChapterPress = (chapter: typeof quizBook.chapters[0]) => {
        if (activeMenu) return;

        if (quizBook.useSections === true) {
            router.push({
                pathname: '/study/section/[chapterId]',
                params: { chapterId: chapter.id }
            });
        } else if (quizBook.useSections === false) {
            router.push({
                pathname: '/study/question/[id]',
                params: { id: chapter.id }
            });
        } else {
            router.push({
                pathname: '/study/section/[chapterId]',
                params: { chapterId: chapter.id }
            });
        }
    };

    const handleAddChapter = async () => {
        await addChapterToQuizBook(quizBook.id, newChapterTitle);
        setNewChapterTitle('');
        setShowAddModal(false);
    };

    const handleMenuPress = (chapter: any, e: any) => {
        e.stopPropagation();
        setEditingChapter(chapter);
        setActiveMenu(chapter.id);
    };

    const handleSaveChapter = async (newTitle: string) => {
        if (editingChapter && newTitle.trim() !== '') {
            await updateChapterInQuizBook(quizBook.id, editingChapter.id, {
                title: newTitle.trim()
            });
        }
        setActiveMenu(null);
        setEditingChapter(null);
    };

    const handleDeleteChapter = async () => {
        if (editingChapter) {
            await deleteChapterFromQuizBook(quizBook.id, editingChapter.id);
        }
        setActiveMenu(null);
        setEditingChapter(null);
    };

    const handleBack = () => {
        if (fromHome === 'true') {
            // ホームから来た場合はライブラリに戻る
            router.replace('/(tabs)/library' as any);
        } else {
            // 通常の戻る動作
            router.back();
        }
    };

    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: () => (
                        <View style={{ maxWidth: 280 }}>
                            <Text
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                style={{ fontSize: 16, fontWeight: "bold", textAlign: 'center' }}
                            >
                                {quizBook.title}
                            </Text>
                        </View>
                    ),
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={handleBack}
                            style={{ marginLeft: 8 }}
                        >
                            <ArrowLeft size={24} color={theme.colors.secondary[900]} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <SafeAreaView style={styles.wrapper} edges={['top', 'left', 'right']}>
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {quizBook.chapters.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyContent}>
                                <AlertCircle size={20} color={theme.colors.warning[600]} />
                                <Text style={styles.emptyText}>章を追加してください</Text>
                            </View>
                        </View>
                    ) : (
                        quizBook.chapters.map((chapter) => (
                            <View key={chapter.id} style={styles.cardWrapper}>
                                <TouchableOpacity
                                    onPress={() => handleChapterPress(chapter)}
                                    activeOpacity={0.7}
                                >
                                    <Card style={styles.chapterCard}>
                                        <TouchableOpacity
                                            style={styles.menuButton}
                                            onPress={(e) => handleMenuPress(chapter, e)}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            {/* @ts-ignore */}
                                            <MoreVertical size={20} color={theme.colors.secondary[600]} />
                                        </TouchableOpacity>

                                        <View style={styles.chapterHeader}>
                                            <Text style={styles.chapterTitle}>
                                                第{chapter.chapterNumber}章 {chapter.title}
                                            </Text>
                                        </View>
                                        <View style={styles.chapterStats}>
                                            <View style={styles.statItem}>
                                                <Text style={styles.statLabel}>正答率</Text>
                                                <Text style={[styles.statValue, {
                                                    color: chapter.chapterRate >= 80
                                                        ? theme.colors.success[600]
                                                        : chapter.chapterRate >= 60
                                                            ? theme.colors.warning[600]
                                                            : theme.colors.error[600]
                                                }]}>
                                                    {chapter.chapterRate}%
                                                </Text>
                                            </View>
                                            <View style={styles.divider} />
                                            <View style={styles.statItem}>
                                                <Text style={styles.statLabel}>問題数</Text>
                                                <Text style={styles.statValue}>
                                                    {getChapterTotalQuestions(chapter)}問
                                                </Text>
                                            </View>
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
                        {/* @ts-ignore */}
                        <Plus size={24} color={theme.colors.primary[600]} strokeWidth={2.5} />
                        <Text style={styles.addButtonText}>章を追加</Text>
                    </TouchableOpacity>
                </ScrollView>

                <Modal
                    visible={showAddModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowAddModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>章を追加</Text>
                            <TextInput
                                style={styles.input}
                                value={newChapterTitle}
                                onChangeText={setNewChapterTitle}
                                placeholder="章名を入力（任意）"
                                placeholderTextColor={theme.colors.secondary[400]}
                            />
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => {
                                        setShowAddModal(false);
                                        setNewChapterTitle('');
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>キャンセル</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.confirmButton]}
                                    onPress={handleAddChapter}
                                >
                                    <Text style={styles.confirmButtonText}>追加</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <EditDeleteModal
                    visible={!!activeMenu && !!editingChapter}
                    onClose={() => {
                        setActiveMenu(null);
                        setEditingChapter(null);
                    }}
                    onSave={handleSaveChapter}
                    onDelete={handleDeleteChapter}
                    title="章の編集・削除"
                    editLabel="章名"
                    editValue={editingChapter?.title || ''}
                    editPlaceholder="章名を入力"
                />

                <CustomTabBar />
            </SafeAreaView>
        </>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: theme.colors.neutral[50],
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.neutral.white,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.secondary[200],
    },
    title: {
        fontSize: theme.typography.fontSizes.xl,
        fontWeight: theme.typography.fontWeights.bold as any,
        color: theme.colors.secondary[900],
        fontFamily: 'ZenKaku-Bold',
    },
    subtitle: {
        fontSize: theme.typography.fontSizes.sm,
        color: theme.colors.secondary[600],
        fontFamily: 'ZenKaku-Regular',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.md,
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
        fontFamily: 'ZenKaku-Regular',
    },
    cardWrapper: {
        marginBottom: theme.spacing.sm,
        position: 'relative',
    },
    chapterCard: {
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
    chapterHeader: {
        marginBottom: theme.spacing.sm,
    },
    chapterTitle: {
        fontSize: theme.typography.fontSizes.base,
        fontWeight: theme.typography.fontWeights.bold as any,
        color: theme.colors.secondary[900],
        fontFamily: 'ZenKaku-Bold',
    },
    chapterStats: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.secondary[200],
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: theme.typography.fontSizes.xs,
        color: theme.colors.secondary[600],
        marginBottom: 2,
        fontFamily: 'ZenKaku-Regular',
    },
    statValue: {
        fontSize: theme.typography.fontSizes.lg,
        fontWeight: theme.typography.fontWeights.bold as any,
        color: theme.colors.secondary[900],
        fontFamily: 'ZenKaku-Bold',
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: theme.colors.secondary[200],
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

export default StudyHome
