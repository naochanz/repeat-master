import EditDeleteModal from '@/app/_compornents/EditDeleteModal';
import LoadingOverlay from '@/app/_compornents/LoadingOverlay';
import CustomTabBar from '@/components/CustomTabBar';
import Card from '@/components/ui/Card';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AlertCircle, MoreVertical, Plus, ArrowLeft } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';



const StudyHome = () => {
    const theme = useAppTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { id } = useLocalSearchParams();

    const quizBooks = useQuizBookStore(state => state.quizBooks);
    const isLoading = useQuizBookStore(state => state.isLoading);
    const fetchQuizBooks = useQuizBookStore(state => state.fetchQuizBooks);
    const addChapterToQuizBook = useQuizBookStore(state => state.addChapter);
    const deleteChapterFromQuizBook = useQuizBookStore(state => state.deleteChapter);
    const updateChapterInQuizBook = useQuizBookStore(state => state.updateChapter);
    const updateQuizBook = useQuizBookStore(state => state.updateQuizBook);

    const [showAddModal, setShowAddModal] = useState(false);
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const [editingChapter, setEditingChapter] = useState<any>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [showConfirmRoundModal, setShowConfirmRoundModal] = useState(false);
    const [unansweredQuestionsWarning, setUnansweredQuestionsWarning] = useState<string>('');

    // ✅ 追加: 画面フォーカス時にデータを再取得
    useFocusEffect(
        useCallback(() => {
            fetchQuizBooks();
        }, [fetchQuizBooks])
    );

    // ✅ 修正: quizBooks から直接検索
    const quizBook = quizBooks.find(book => book.id === id);
    const isCompleted = !!quizBook?.completedAt;

    if (!quizBook) {
        return (
            <ScrollView style={styles.container}>
                <Text>問題集が存在しません</Text>
            </ScrollView>
        )
    }

    const displayRound = (quizBook.currentRound || 0) + 1;

    const getChapterTotalQuestions = (chapter: typeof quizBook.chapters[0]) => {
        if (chapter.sections && chapter.sections.length > 0) {
            return chapter.sections.reduce((sum, section) => {
                return sum + section.questionCount;
            }, 0);
        } else {
            return chapter.questionCount || 0;
        };
    }

    // フロントエンドで章の正答率を計算（現在の周回用）
    const getChapterRate = (chapter: typeof quizBook.chapters[0]) => {
        let totalQuestions = 0;
        let correctAnswers = 0;

        const processAnswers = (answers: any[]) => {
            answers.forEach((qa) => {
                const roundAttempt = qa.attempts?.find(
                    (a: any) => a.round === displayRound && a.resultConfirmFlg
                );
                if (roundAttempt) {
                    totalQuestions++;
                    if (roundAttempt.result === '○') {
                        correctAnswers++;
                    }
                }
            });
        };

        if (chapter.sections && chapter.sections.length > 0) {
            chapter.sections.forEach((section) => {
                if (section.questionAnswers) {
                    processAnswers(section.questionAnswers);
                }
            });
        } else if (chapter.questionAnswers) {
            processAnswers(chapter.questionAnswers);
        }

        if (totalQuestions === 0) return 0;
        return Math.round((correctAnswers / totalQuestions) * 100);
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
        const nextChapterNumber = quizBook.chapters.length + 1;
        await addChapterToQuizBook(
            quizBook.id,
            nextChapterNumber,
            newChapterTitle.trim() || undefined
        );
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
        // 章リストは常にライブラリに戻る（タブナビゲーションの外に出ているため）
        router.replace('/(tabs)/library' as any);
    };

    const checkUnansweredQuestions = () => {
        if (!quizBook) return '';

        const currentRound = quizBook.currentRound || 0;
        const nextRound = currentRound + 1;
        let unansweredCount = 0;

        quizBook.chapters.forEach((chapter) => {
            if (chapter.sections && chapter.sections.length > 0) {
                // 節がある場合
                chapter.sections.forEach((section) => {
                    if (section.questionAnswers && section.questionAnswers.length > 0) {
                        section.questionAnswers.forEach((qa) => {
                            const hasAnswerInCurrentRound = qa.attempts?.some(
                                (attempt) => attempt.round === nextRound
                            );
                            if (!hasAnswerInCurrentRound) {
                                unansweredCount++;
                            }
                        });
                    }
                });
            } else {
                // 節がない場合
                if (chapter.questionAnswers && chapter.questionAnswers.length > 0) {
                    chapter.questionAnswers.forEach((qa) => {
                        const hasAnswerInCurrentRound = qa.attempts?.some(
                            (attempt) => attempt.round === nextRound
                        );
                        if (!hasAnswerInCurrentRound) {
                            unansweredCount++;
                        }
                    });
                }
            }
        });

        if (unansweredCount > 0) {
            return `第${nextRound}周で未回答の問題が${unansweredCount}問あります。`;
        }
        return '';
    };

    const handleConfirmRound = () => {
        const warning = checkUnansweredQuestions();
        setUnansweredQuestionsWarning(warning);
        setShowConfirmRoundModal(true);
    };

    const handleExecuteConfirmRound = async () => {
        if (!quizBook) return;

        const newRound = (quizBook.currentRound || 0) + 1;
        await updateQuizBook(quizBook.id, { currentRound: newRound });
        setShowConfirmRoundModal(false);
        setUnansweredQuestionsWarning('');
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
                                style={{ fontSize: 16, fontWeight: "bold", textAlign: 'center', color: theme.colors.secondary[900] }}
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

            <SafeAreaView style={styles.wrapper} edges={['left', 'right']}>
                {!isCompleted && (
                    <TouchableOpacity
                        style={styles.confirmRoundButton}
                        onPress={handleConfirmRound}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.confirmRoundButtonText}>周回を確定する</Text>
                    </TouchableOpacity>
                )}

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
                                        {!isCompleted && (
                                            <TouchableOpacity
                                                style={styles.menuButton}
                                                onPress={(e) => handleMenuPress(chapter, e)}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                {/* @ts-ignore */}
                                                <MoreVertical size={20} color={theme.colors.secondary[600]} />
                                            </TouchableOpacity>
                                        )}

                                        <View style={styles.chapterHeader}>
                                            <Text style={styles.chapterNumber}>
                                                第{chapter.chapterNumber}章
                                            </Text>
                                            {chapter.title?.trim() && (
                                                <Text style={styles.chapterTitle} numberOfLines={1} ellipsizeMode="tail">
                                                    {chapter.title}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={styles.chapterStats}>
                                            <View style={styles.statItem}>
                                                <Text style={styles.statLabel}>{displayRound}周目 正答率</Text>
                                                <Text style={[styles.statValue, {
                                                    color: getChapterRate(chapter) >= 80
                                                        ? theme.colors.success[600]
                                                        : getChapterRate(chapter) >= 60
                                                            ? theme.colors.warning[600]
                                                            : theme.colors.error[600]
                                                }]}>
                                                    {getChapterRate(chapter)}%
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

                    {!isCompleted && (
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => setShowAddModal(true)}
                            activeOpacity={0.7}
                        >
                            {/* @ts-ignore */}
                            <Plus size={24} color={theme.colors.primary[600]} strokeWidth={2.5} />
                            <Text style={styles.addButtonText}>章を追加</Text>
                        </TouchableOpacity>
                    )}
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
                                    disabled={isLoading}
                                >
                                    <Text style={[styles.cancelButtonText, isLoading && { opacity: 0.5 }]}>キャンセル</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.confirmButton]}
                                    onPress={handleAddChapter}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color={theme.colors.neutral.white} />
                                    ) : (
                                        <Text style={styles.confirmButtonText}>追加</Text>
                                    )}
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
                    isLoading={isLoading}
                />

                <Modal
                    visible={showConfirmRoundModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowConfirmRoundModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>周回確定</Text>
                            <Text style={styles.modalMessage}>
                                {quizBook.title}の第{displayRound}周を確定しますか？
                            </Text>
                            {unansweredQuestionsWarning && (
                                <View style={styles.warningContainer}>
                                    <AlertCircle size={20} color={theme.colors.warning[600]} />
                                    <Text style={styles.warningText}>{unansweredQuestionsWarning}</Text>
                                </View>
                            )}
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => {
                                        setShowConfirmRoundModal(false);
                                        setUnansweredQuestionsWarning('');
                                    }}
                                    disabled={isLoading}
                                >
                                    <Text style={[styles.cancelButtonText, isLoading && { opacity: 0.5 }]}>キャンセル</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.confirmButton]}
                                    onPress={handleExecuteConfirmRound}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color={theme.colors.neutral.white} />
                                    ) : (
                                        <Text style={styles.confirmButtonText}>確定</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <CustomTabBar />
                <LoadingOverlay visible={isLoading} />
            </SafeAreaView>
        </>
    )
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: theme.colors.neutral[50],
    },
    confirmRoundButton: {
        backgroundColor: theme.colors.primary[600],
        marginHorizontal: theme.spacing.lg,
        marginVertical: 10,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        ...theme.shadows.sm,
    },
    confirmRoundButtonText: {
        fontSize: theme.typography.fontSizes.base,
        fontWeight: theme.typography.fontWeights.bold as any,
        color: theme.colors.neutral.white,
        fontFamily: 'ZenKaku-Bold',
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
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
        paddingRight: 32,
    },
    chapterNumber: {
        fontSize: theme.typography.fontSizes.sm,
        fontWeight: theme.typography.fontWeights.bold as any,
        color: theme.colors.primary[600],
        fontFamily: 'ZenKaku-Bold',
        flexShrink: 0,
    },
    chapterTitle: {
        fontSize: theme.typography.fontSizes.sm,
        fontWeight: theme.typography.fontWeights.bold as any,
        color: theme.colors.secondary[900],
        fontFamily: 'ZenKaku-Bold',
        marginLeft: theme.spacing.sm,
        flex: 1,
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
        justifyContent: 'center',
        gap: theme.spacing.md,
        marginTop: 10,
    },
    modalButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        width: 120,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: theme.colors.secondary[100],
    },
    cancelButtonText: {
        color: theme.colors.secondary[700],
        fontSize: theme.typography.fontSizes.sm,
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
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.warning[50],
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.warning[200],
        marginTop: theme.spacing.md,
    },
    warningText: {
        flex: 1,
        fontSize: theme.typography.fontSizes.sm,
        color: theme.colors.warning[800],
        fontFamily: 'ZenKaku-Regular',
    },
    modalMessage: {
        fontSize: theme.typography.fontSizes.base,
        color: theme.colors.secondary[700],
        fontFamily: 'ZenKaku-Regular',
        textAlign: 'center',
        lineHeight: 24,
    },
});

export default StudyHome
