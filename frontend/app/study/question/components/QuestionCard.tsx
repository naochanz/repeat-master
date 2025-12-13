import { theme } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Attempt {
  result: '○' | '×';
  answeredAt: string;
  resultConfirmFlg: boolean;
}

interface QuestionCardProps {
  questionNumber: number;
  mode: 'view' | 'answer';
  isExpanded: boolean;
  showFab: boolean;
  history: Attempt[];
  onPress: (questionNumber: number) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  questionNumber,
  mode,
  isExpanded,
  showFab,
  history,
  onPress
}) => {
  const confirmedHistory = history.filter(a => a.resultConfirmFlg === true);
  const lastConfirmedAttempt = confirmedHistory[confirmedHistory.length - 1];

  let displayRound;
  if (showFab) {
    displayRound = confirmedHistory.length + 1;
  } else {
    displayRound = Math.max(confirmedHistory.length, 1);
  }

  if (mode === 'view' && isExpanded) {
    // 閲覧モード: 展開状態（履歴一覧）
    return (
      <View style={styles.expandedHistory}>
        {confirmedHistory.length > 0 ? (
          confirmedHistory.map((attempt, index) => (
            <TouchableOpacity
              key={`${questionNumber}-${index}`}
              style={[
                styles.historyCard,
                attempt.result === '○' ? styles.correctCard : styles.incorrectCard
              ]}
              onPress={() => onPress(questionNumber)}
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
            </TouchableOpacity>
          ))
        ) : (
          <TouchableOpacity
            style={styles.historyCard}
            onPress={() => onPress(questionNumber)}
          >
            <Text style={{ color: theme.colors.secondary[500] }}>
              まだ履歴がありません
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // スタック表示
  const stackHeight = 75 + (showFab ? confirmedHistory.length * 9 : Math.max((confirmedHistory.length - 1) * 9, 0));

  return (
    <TouchableOpacity
      style={[styles.stackContainer, { height: stackHeight }]}
      onPress={() => onPress(questionNumber)}
      activeOpacity={0.7}
    >
      {showFab ? (
        // FAB表示中: 確定済み履歴を全て背景に + 最前面に未回答カード
        <>
          {confirmedHistory.slice().reverse().map((attempt, reverseIndex) => {
            const index = confirmedHistory.length - 1 - reverseIndex;
            const stackIndex = confirmedHistory.length - 1 - index;
            const offset = (stackIndex + 1) * 9;

            return (
              <View
                key={`stack-${questionNumber}-${index}`}
                style={[
                  styles.questionCard,
                  {
                    position: 'absolute',
                    top: offset,
                    left: 0,
                    right: 0,
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
            <Text style={styles.questionNumber}>{questionNumber}</Text>
          </View>
        </>
      ) : (
        // FAB非表示: 確定済み履歴のスタック表示のみ
        <>
          {confirmedHistory.length > 0 ? (
            confirmedHistory.slice().reverse().map((attempt, reverseIndex) => {
              const index = confirmedHistory.length - 1 - reverseIndex;
              const stackIndex = confirmedHistory.length - 1 - index;
              const offset = stackIndex * 9;
              const isTopCard = stackIndex === 0;

              return (
                <View
                  key={`stack-${questionNumber}-${index}`}
                  style={[
                    styles.questionCard,
                    {
                      position: 'absolute',
                      top: offset,
                      left: 0,
                      right: 0,
                      zIndex: confirmedHistory.length - stackIndex,
                      opacity: Math.max(1 - (stackIndex * 0.1), 0.3),
                    },
                    attempt.result === '○' ? styles.correctCard : styles.incorrectCard,
                  ]}
                >
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
              <Text style={styles.questionNumber}>{questionNumber}</Text>
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
  );
};

const styles = StyleSheet.create({
  stackContainer: {
    position: 'relative',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  topCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: theme.colors.neutral.white,
  },
  historyCount: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.secondary[500],
    fontWeight: theme.typography.fontWeights.medium,
    zIndex: 1001,
  },
  questionCard: {
    backgroundColor: theme.colors.neutral.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
    height: 75,
    borderWidth: 2,
    borderColor: theme.colors.neutral[200],
  },
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
    height: 75,
  },
  historyDate: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.secondary[500],
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
  unattemptedCard: {
    backgroundColor: theme.colors.warning[50],
    borderWidth: 2,
    borderColor: theme.colors.warning[300],
    borderStyle: 'dashed',
  },
  questionNumber: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
  },
  answerMark: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
  },
  attemptNumber: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Medium',
  },
  cardDate: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    left: theme.spacing.sm,
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.secondary[500],
    fontFamily: 'ZenKaku-Regular',
  },
});

export default QuestionCard;
