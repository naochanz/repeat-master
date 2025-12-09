import ConfirmDialog from '@/app/compornents/ConfirmDialog';
import CustomTabBar from '@/components/CustomTabBar';
import { theme } from '@/constants/theme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MemoModal from './compornent/MemoModal';

const QuestionList = () => {
    const { id } = useLocalSearchParams();

    // ✅ quizBooks を直接購読
    const quizBooks = useQuizBookStore(state => state.quizBooks);
    const fetchQuizBooks = useQuizBookStore(state => state.fetchQuizBooks);
    const saveAnswer = useQuizBookStore(state => state.saveAnswer);
    const saveMemo = useQuizBookStore(state => state.saveMemo);
    const getQuestionAnswers = useQuizBookStore(state => state.getQuestionAnswers);
    const updateLastAnswer = useQuizBookStore(state => state.updateLastAnswer);
    const deleteLastAnswer = useQuizBookStore(state => state.deleteLastAnswer);
    const addQuestionToTarget = useQuizBookStore(state => state.addQuestionToTarget);
    const deleteQuestionFromTarget = useQuizBookStore(state => state.deleteQuestionFromTarget);

    const lastTap = useRef<number>(0);

    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [deleteTargetNumber, setDeleteTargetNumber] = useState<number | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
    const [memoText, setMemoText] = useState('');
    const [mode, setMode] = useState<'view' | 'answer'>('answer');
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set()); //展開済みの問題番号をSet<number>に入れる
    const [activeFabQuestion, setActiveFabQuestion] = useState<number | null>(null);


    // ✅ 画面フォーカス時にデータを再取得
    useFocusEffect(
        useCallback(() => {
            fetchQuizBooks();
        }, [fetchQuizBooks])
    );

    // ✅ quizBooks から直接検索
    let chapterData = null;
    let sectionData = null;

    for (const book of quizBooks) {
        const chapter = book.chapters.find(ch => ch.id === id);
        if (chapter) {
            chapterData = { book, chapter };
            break;
        }

        for (const chapter of book.chapters) {
            const section = chapter.sections?.find(sec => sec.id === id);
            if (section) {
                sectionData = { book, chapter, section };
                break;
            }
        }
        if (sectionData) break;
    }

    const chapterId = chapterData?.chapter.id || sectionData?.chapter.id || '';
    const sectionId = sectionData?.section.id || null;

    const displayInfo = chapterData
        ? {
            type: 'chapter' as const,
            chapterNumber: chapterData.chapter.chapterNumber,
            title: chapterData.chapter.title,
            questionCount: chapterData.chapter.questionCount || 0
        }
        : sectionData
            ? {
                type: 'section' as const,
                chapterNumber: sectionData.chapter.chapterNumber,
                chapterTitle: sectionData.chapter.title,
                sectionNumber: sectionData.section.sectionNumber,
                title: sectionData.section.title,
                questionCount: sectionData.section.questionCount
            }
            : null;

    if (!displayInfo) {
        return (
            <View style={styles.container}>
                <Text>データが見つかりません</Text>
            </View>
        );
    }

    const handleCardPress = async (questionNumber: number) => {
        if (mode === 'view') {
            // 閲覧モード: 履歴の展開/折りたたみ
            setExpandedQuestions(prev => {
                const newSet = new Set(prev);
                if (newSet.has(questionNumber)) {
                    newSet.delete(questionNumber)
                } else {
                    newSet.add(questionNumber);
                }
                return newSet;
            })
        } else {
            // 回答モード: FABの表示/非表示をトグル
            if (activeFabQuestion === questionNumber) {
                // 既に表示中 → 非表示にする
                setActiveFabQuestion(null);
            } else {
                // 非表示中 → 表示する
                // ✅ ここでは何もしない（Stateの変更だけで新カードとして扱う）
                setActiveFabQuestion(questionNumber);
            }
        }
    }

    const handleAnswerFromFab = async (questionNumber: number, answer: '○' | '×') => {
        await saveAnswer(chapterId, sectionId, questionNumber, answer);
        //FABを非表示
        setActiveFabQuestion(null);
    };

    const handleAddQuestion = async () => {
        await addQuestionToTarget(chapterId, sectionId);
    };

    const handleDeleteQuestion = (questionNumber: number) => {
        setDeleteTargetNumber(questionNumber);
        setDeleteDialogVisible(true);
    };

    const confirmDelete = async () => {
        if (deleteTargetNumber !== null) {
            await deleteQuestionFromTarget(chapterId, sectionId, deleteTargetNumber);
            setDeleteDialogVisible(false);
            setDeleteTargetNumber(null);
        }
    };

    const handleSaveMemo = async (text: string) => {
        if (selectedQuestion !== null) {
            await saveMemo(chapterId, sectionId, selectedQuestion, text);
        }
    };

    const handleOpenMemo = (questionNumber: number) => {
        setSelectedQuestion(questionNumber);
        const questionData = getQuestionAnswers(chapterId, sectionId, questionNumber);
        const currentMemo = questionData?.memo || '';
        setMemoText(currentMemo);
        setModalVisible(true);
    };

    return (
        <>
            <View style={styles.safeArea}>
                <Stack.Screen
                    options={{
                        headerTitle: () => (
                            <View style={styles.headerTitleContainer}>
                                <Text style={styles.questionCount}>
                                    全{displayInfo.questionCount}問
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
                        headerRight: () => (
                            <View style={styles.modeToggleContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.modeToggleButton,
                                        mode === 'view' && styles.modeToggleButtonActive
                                    ]}
                                    onPress={() => setMode('view')}
                                >
                                    <Text style={[
                                        styles.modeToggleText,
                                        mode === 'view' && styles.modeToggleTextActive
                                    ]}>
                                        閲覧
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.modeToggleButton,
                                        mode === 'answer' && styles.modeToggleButtonActive
                                    ]}
                                    onPress={() => setMode('answer')}
                                >
                                    <Text
                                        style={[
                                            styles.modeToggleText,
                                            mode === 'answer' && styles.modeToggleTextActive
                                        ]}>
                                        回答
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ),
                        gestureEnabled: false,
                    }}
                />
                <ScrollView style={styles.container}>
                    {Array.from({ length: displayInfo.questionCount }, (_, i) => i + 1).map((num) => {
                        const questionData = getQuestionAnswers(chapterId, sectionId, num);
                        const history = questionData?.attempts || [];
                        const isExpanded = expandedQuestions.has(num);
                        const showFab = activeFabQuestion === num;

                        // ✅ 確定済み履歴をフィルタ
                        const confirmedHistory = history.filter(a => a.resultConfirmFlg === true);
                        const lastConfirmedAttempt = confirmedHistory[confirmedHistory.length - 1];

                        // ✅ 表示する周回数の計算
                        let displayRound;
                        if (showFab) {
                            displayRound = confirmedHistory.length + 1;
                        } else {
                            displayRound = Math.max(confirmedHistory.length, 1);
                        }

                        return (
                            <View key={num} style={styles.questionGroup}>
                                {/* ラベル部分（MEMO、削除ボタン） */}
                                <View style={styles.labelContainer}>
                                    <Text style={styles.questionNumberLabel}>問題 {num}</Text>
                                    <View style={styles.buttonGroup}>
                                        <TouchableOpacity
                                            style={styles.memoButton}
                                            onPress={() => handleOpenMemo(num)}
                                        >
                                            <Text style={styles.memoText}>MEMO</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteQuestion(num)}
                                        >
                                            <Trash2 size={16} color={theme.colors.error[600]} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* カード表示部分 */}
                                {mode === 'view' && isExpanded ? (
                                    // 閲覧モード: 展開状態（履歴一覧）
                                    <View style={styles.expandedHistory}>
                                        {confirmedHistory.length > 0 ? (
                                            confirmedHistory.map((attempt, index) => (
                                                <View
                                                    key={`${num}-${index}`}
                                                    style={[
                                                        styles.historyCard,
                                                        attempt.result === '○' ? styles.correctCard : styles.incorrectCard
                                                    ]}
                                                >
                                                    <Text style={styles.attemptNumber}>{index + 1}周目</Text>
                                                    <Text style={styles.answerMark}>
                                                        {attempt.result === '○' ? '✅' : '❌'}
                                                    </Text>
                                                    <Text style={styles.historyDate}>
                                                        {new Date(attempt.answeredAt).toLocaleDateString('ja-JP', {
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </Text>
                                                </View>
                                            ))
                                        ) : (
                                            <View style={styles.historyCard}>
                                                <Text style={{ color: theme.colors.secondary[500] }}>
                                                    まだ履歴がありません
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    // 折りたたみ状態（スタック表示）
                                    <TouchableOpacity
                                        style={[
                                            styles.stackContainer,
                                            {
                                                height: 100 + (showFab ? confirmedHistory.length * 4 : Math.max((confirmedHistory.length - 1) * 4, 0))
                                            }
                                        ]}
                                        onPress={() => handleCardPress(num)}
                                        activeOpacity={0.7}
                                    >
                                        {showFab ? (
                                            // ✅ FAB表示中: 確定済み履歴を全て背景に + 最前面に未回答カード
                                            <>
                                                {/* 背景: 確定済み履歴全て */}
                                                {confirmedHistory.slice().reverse().map((attempt, reverseIndex) => {
                                                    const index = confirmedHistory.length - 1 - reverseIndex;
                                                    const stackIndex = confirmedHistory.length - 1 - index;
                                                    const offset = (stackIndex + 1) * 4;

                                                    return (
                                                        <View
                                                            key={`stack-${num}-${index}`}
                                                            style={[
                                                                styles.questionCard,
                                                                {
                                                                    position: 'absolute',
                                                                    top: offset,
                                                                    left: offset,
                                                                    right: -offset,
                                                                    zIndex: confirmedHistory.length - stackIndex,
                                                                    opacity: Math.max(1 - (stackIndex * 0.1), 0.3),
                                                                },
                                                                attempt.result === '○' ? styles.correctCard : styles.incorrectCard,
                                                            ]}
                                                        />
                                                    );
                                                })}

                                                {/* 最前面: 未回答カード */}
                                                <View
                                                    style={[
                                                        styles.questionCard,
                                                        styles.topCard,
                                                        styles.unattemptedCard,
                                                    ]}
                                                >
                                                    <Text style={styles.attemptNumber}>
                                                        {displayRound}周目
                                                    </Text>
                                                    <Text style={styles.questionNumber}>{num}</Text>
                                                </View>
                                            </>
                                        ) : (
                                            // ✅ FAB非表示: 確定済み履歴のスタック表示のみ
                                            <>
                                                {confirmedHistory.length > 0 ? (
                                                    // 確定済み履歴がある場合: スタック表示
                                                    confirmedHistory.slice().reverse().map((attempt, reverseIndex) => {
                                                        const index = confirmedHistory.length - 1 - reverseIndex;
                                                        const stackIndex = confirmedHistory.length - 1 - index;
                                                        const offset = stackIndex * 4;
                                                        const isTopCard = stackIndex === 0;

                                                        return (
                                                            <View
                                                                key={`stack-${num}-${index}`}
                                                                style={[
                                                                    styles.questionCard,
                                                                    {
                                                                        position: 'absolute',
                                                                        top: offset,
                                                                        left: offset,
                                                                        right: -offset,
                                                                        zIndex: confirmedHistory.length - stackIndex,
                                                                        opacity: Math.max(1 - (stackIndex * 0.1), 0.3),
                                                                    },
                                                                    attempt.result === '○' ? styles.correctCard : styles.incorrectCard,
                                                                ]}
                                                            >
                                                                {/* ✅ 最前面のカードのみ情報を表示 */}
                                                                {isTopCard && (
                                                                    <>
                                                                        <Text style={styles.attemptNumber}>
                                                                            {confirmedHistory.length}周目
                                                                        </Text>
                                                                        <Text style={styles.answerMark}>
                                                                            {attempt.result === '○' ? '✅' : '❌'}
                                                                        </Text>
                                                                        <Text style={styles.cardDate}>
                                                                            {new Date(attempt.answeredAt).toLocaleDateString('ja-JP', {
                                                                                month: '2-digit',
                                                                                day: '2-digit',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </Text>
                                                                    </>
                                                                )}
                                                            </View>
                                                        );
                                                    })
                                                ) : (
                                                    // 確定済み履歴がない場合: 初回カード（未回答）
                                                    <View
                                                        style={[
                                                            styles.questionCard,
                                                            styles.topCard,
                                                            styles.unattemptedCard,
                                                        ]}
                                                    >
                                                        <Text style={styles.questionNumber}>{num}</Text>
                                                    </View>
                                                )}
                                            </>
                                        )}

                                        {/* 履歴カウント表示 */}
                                        {!showFab && confirmedHistory.length > 0 && (
                                            <Text style={styles.historyCount}>
                                                {confirmedHistory.length}枚の履歴 ↗️
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                )}

                                {/* FAB表示（回答モード + アクティブな問題のみ） */}
                                {showFab && (
                                    <View style={styles.fabContainer}>
                                        <TouchableOpacity
                                            style={[styles.fab, styles.fabIncorrect]}
                                            onPress={() => handleAnswerFromFab(num, '×')}
                                        >
                                            <Text style={styles.fabText}>×</Text>
                                            <Text style={styles.fabLabel}>不正解</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.fab, styles.fabCorrect]}
                                            onPress={() => handleAnswerFromFab(num, '○')}
                                        >
                                            <Text style={styles.fabText}>○</Text>
                                            <Text style={styles.fabLabel}>正解</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })}

                    <TouchableOpacity
                        style={styles.addQuestionButton}
                        onPress={handleAddQuestion}
                        activeOpacity={0.7}
                    >
                        <Plus size={24} color={theme.colors.primary[600]} strokeWidth={2.5} />
                        <Text style={styles.addQuestionButtonText}>問題を追加</Text>
                    </TouchableOpacity>

                    <MemoModal
                        visible={modalVisible}
                        questionNumber={selectedQuestion}
                        memoText={memoText}
                        onClose={() => setModalVisible(false)}
                        onSave={handleSaveMemo}
                        onChangeText={setMemoText}
                    />

                    <ConfirmDialog
                        visible={deleteDialogVisible}
                        title="問題を削除"
                        message="この問題を削除してもよろしいですか？この操作は取り消せません。"
                        onConfirm={confirmDelete}
                        onCancel={() => setDeleteDialogVisible(false)}
                    />
                </ScrollView>

                <CustomTabBar />
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.neutral[50],
    },
    container: {
        flex: 1,
    },
    titleContainer: {
        backgroundColor: theme.colors.neutral.white,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.secondary[200],
    },
    breadcrumb: {
        fontSize: theme.typography.fontSizes.sm,
        color: theme.colors.secondary[600],
        marginBottom: theme.spacing.xs,
        fontFamily: theme.typography.fontFamilies.regular,
    },
    title: {
        fontSize: theme.typography.fontSizes.xl,
        fontWeight: theme.typography.fontWeights.bold,
        color: theme.colors.secondary[900],
        fontFamily: theme.typography.fontFamilies.bold,
    },
    questionCount: {
        fontSize: theme.typography.fontSizes.lg,
        color: theme.colors.secondary[600],
        fontWeight: 'bold',
        fontFamily: theme.typography.fontFamilies.regular,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modeToggleContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.neutral[100],
        borderRadius: theme.borderRadius.md,
        padding: 2,
        marginRight: 8,
    },
    modeToggleButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.sm,
        textAlign: 'center'
    },
    modeToggleButtonActive: {
        backgroundColor: theme.colors.primary[600],
    },
    modeToggleText: {
        fontSize: theme.typography.fontSizes.sm,
        fontWeight: theme.typography.fontWeights.semibold,
        color: theme.colors.secondary[600],
    },
    modeToggleTextActive: {
        color: theme.colors.neutral.white,
    },

    // ✅ スタック表示関連
    stackContainer: {
        position: 'relative',
        minHeight: 130,
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.md,
        marginTop: theme.spacing.sm,
    },
    topCard: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000, // 確実に最前面
        backgroundColor: theme.colors.neutral.white,
    },
    historyCount: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        fontSize: theme.typography.fontSizes.xs,
        color: theme.colors.secondary[500],
        fontWeight: theme.typography.fontWeights.medium,
        zIndex: 1001, // 最前面
    },

    questionCard: {
        backgroundColor: theme.colors.neutral.white,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.md,
        minHeight: 100,
        borderWidth: 2,
        borderColor: theme.colors.neutral[200],
    },

    // ✅ 追加: 展開履歴表示
    expandedHistory: {
        paddingHorizontal: theme.spacing.md,
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },
    historyCard: {
        backgroundColor: theme.colors.neutral.white,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        borderWidth: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...theme.shadows.sm,
    },
    historyDate: {
        fontSize: theme.typography.fontSizes.xs,
        color: theme.colors.secondary[500],
    },

    // ✅ 追加: FAB関連
    fabContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme.spacing.md,
        marginTop: theme.spacing.md,
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    fab: {
        width: 100,
        height: 100,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.lg,
    },
    fabCorrect: {
        backgroundColor: theme.colors.success[500],
    },
    fabIncorrect: {
        backgroundColor: theme.colors.error[500],
    },
    fabText: {
        fontSize: 32,
        fontWeight: theme.typography.fontWeights.bold,
        color: theme.colors.neutral.white,
    },
    fabLabel: {
        fontSize: theme.typography.fontSizes.xs,
        fontWeight: theme.typography.fontWeights.semibold,
        color: theme.colors.neutral.white,
        marginTop: 4,
    },

    correctCard: {
        backgroundColor: theme.colors.success[50],
        borderColor: theme.colors.success[500],
        borderWidth: 2,
    },
    incorrectCard: {
        backgroundColor: theme.colors.error[50],
        borderColor: theme.colors.error[500],
        borderWidth: 2,
    },
    masteredCard: {
        transform: [{ scale: 0.95 }],
        opacity: 0.8,
    },
    unattemptedCard: {
        backgroundColor: theme.colors.warning[50],
        borderWidth: 2,
        borderColor: theme.colors.warning[300],
        borderStyle: 'dashed',
    },
    lockedCard: {
        borderWidth: 4,
        opacity: 0.75,
        transform: [{ scale: 0.97 }],
    },
    questionNumber: {
        fontSize: theme.typography.fontSizes.xl,
        fontWeight: theme.typography.fontWeights.bold,
        color: theme.colors.secondary[900],
        fontFamily: theme.typography.fontFamilies.bold,
    },
    answerMark: {
        position: 'absolute',
        top: theme.spacing.sm,
        right: theme.spacing.sm,
        fontSize: theme.typography.fontSizes.lg,
        fontWeight: theme.typography.fontWeights.bold,
    },
    correctMark: {
        color: theme.colors.success[600],
    },
    incorrectMark: {
        color: theme.colors.error[600],
    },
    lockIcon: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        fontSize: 16,
    },
    questionGroup: {
        marginTop: theme.spacing.lg,
    },
    questionNumberLabel: {
        fontSize: theme.typography.fontSizes.base,
        fontWeight: theme.typography.fontWeights.bold,
        color: theme.colors.secondary[900],
        fontFamily: theme.typography.fontFamilies.bold,
    },
    cardRow: {
        paddingHorizontal: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    attemptNumber: {
        position: 'absolute',
        top: theme.spacing.sm,
        left: theme.spacing.sm,
        fontSize: theme.typography.fontSizes.xs,
        fontWeight: theme.typography.fontWeights.semibold,
        color: theme.colors.secondary[600],
        fontFamily: theme.typography.fontFamilies.medium,
    },
    cardRowNonScroll: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        alignItems: 'center',
    },
    memoButton: {
        backgroundColor: theme.colors.neutral.white,
        borderColor: theme.colors.primary[600],
        borderWidth: 1.5,
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        ...theme.shadows.sm,
    },
    memoText: {
        fontSize: theme.typography.fontSizes.xs,
        fontWeight: theme.typography.fontWeights.semibold,
        color: theme.colors.primary[600],
        fontFamily: theme.typography.fontFamilies.bold,
    },
    deleteButton: {
        backgroundColor: theme.colors.neutral.white,
        borderColor: theme.colors.error[600],
        borderWidth: 1.5,
        borderRadius: theme.borderRadius.sm,
        padding: theme.spacing.xs,
        ...theme.shadows.sm,
    },
    addQuestionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.lg,
        marginHorizontal: theme.spacing.md,
        marginVertical: theme.spacing.lg,
        backgroundColor: theme.colors.neutral.white,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 2,
        borderColor: theme.colors.primary[300],
        borderStyle: 'dashed',
        gap: theme.spacing.sm,
    },
    addQuestionButtonText: {
        fontSize: theme.typography.fontSizes.base,
        color: theme.colors.primary[600],
        fontWeight: theme.typography.fontWeights.bold as any,
        fontFamily: theme.typography.fontFamilies.bold,
    },
    // モーダル関連のスタイル
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        height: '70%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    closeIcon: {
        padding: 4,
    },
    closeIconText: {
        fontSize: 16,
        color: '#666',
        fontWeight: 'bold',
    },
    memoInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        flex: 1,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        marginBottom: 20,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#4caf50',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cardDate: {
        position: 'absolute',
        bottom: theme.spacing.sm,
        left: theme.spacing.sm,
        fontSize: theme.typography.fontSizes.xs,
        color: theme.colors.secondary[500],
        fontFamily: theme.typography.fontFamilies.regular,
    },
});

export default QuestionList;