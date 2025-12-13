import { theme } from '@/constants/theme';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

  // 収納アニメーション中かどうか
  const [isCollapsing, setIsCollapsing] = useState(false);
  const prevIsExpandedRef = useRef(isExpanded);
  const prevModeRef = useRef(mode);

  // アニメーション用
  const animatedValues = useRef<Animated.Value[]>([]);

  // Initialize/update animated values when confirmedHistory changes
  useEffect(() => {
    const neededLength = confirmedHistory.length;
    const currentLength = animatedValues.current.length;

    if (neededLength > currentLength) {
      // Add new values
      for (let i = currentLength; i < neededLength; i++) {
        animatedValues.current.push(new Animated.Value(0));
      }
    } else if (neededLength < currentLength) {
      // Remove excess values
      animatedValues.current = animatedValues.current.slice(0, neededLength);
    }
  }, [confirmedHistory.length]);

  useEffect(() => {
    const prevIsExpanded = prevIsExpandedRef.current;
    const prevMode = prevModeRef.current;
    prevIsExpandedRef.current = isExpanded;
    prevModeRef.current = mode;

    // answer → view へのモード切り替えで、既に展開状態の場合
    if (prevMode === 'answer' && mode === 'view' && isExpanded) {
      // アニメーションなしで即座に全て表示
      setIsCollapsing(false);
      animatedValues.current.forEach(anim => anim.setValue(1));
      return;
    }

    if (mode === 'view' && isExpanded && !prevIsExpanded) {
      // 展開開始
      setIsCollapsing(false);
      // Reset all values to 0 first (except the first one which stays visible)
      animatedValues.current.slice(1).forEach(anim => anim.setValue(0));

      // 展開時: 各カードを順番にスライドイン（一番上は除く）
      const animations = animatedValues.current.slice(1).map((anim, index) => {
        return Animated.timing(anim, {
          toValue: 1,
          duration: 30,
          delay: index * 30,
          useNativeDriver: true,
        });
      });
      // 一番上のカードは即座に表示
      if (animatedValues.current[0]) {
        animatedValues.current[0].setValue(1);
      }
      Animated.parallel(animations).start();
    } else if (mode === 'view' && !isExpanded && prevIsExpanded) {
      // 収納開始
      setIsCollapsing(true);
      // 収納時: アニメーション（一番上は除く）
      const animations = animatedValues.current.slice(1).map((anim, index) => {
        return Animated.timing(anim, {
          toValue: 0,
          duration: 30,
          delay: (animatedValues.current.length - 2 - index) * 30, // 逆順
          useNativeDriver: true,
        });
      });
      Animated.parallel(animations).start(() => {
        // アニメーション完了後に収納状態を解除
        setIsCollapsing(false);
      });
    } else if (mode === 'answer') {
      // Reset all values when in answer mode
      setIsCollapsing(false);
      animatedValues.current.forEach(anim => anim.setValue(0));
    }
  }, [isExpanded, mode]);

  let displayRound;
  if (showFab) {
    displayRound = confirmedHistory.length + 1;
  } else {
    displayRound = Math.max(confirmedHistory.length, 1);
  }

  if (mode === 'view' && (isExpanded || isCollapsing)) {
    // 閲覧モード: 展開状態（履歴一覧）最新から降順で表示
    return (
      <View style={styles.expandedHistory}>
        {confirmedHistory.length > 0 ? (
          confirmedHistory.slice().reverse().map((attempt, reverseIndex) => {
            const originalIndex = confirmedHistory.length - 1 - reverseIndex;
            const animValue = animatedValues.current[reverseIndex] || new Animated.Value(1);
            const isFirstCard = reverseIndex === 0;

            // 一番上のカードはアニメーションなし
            if (isFirstCard) {
              return (
                <View key={`${questionNumber}-${originalIndex}`}>
                  <TouchableOpacity
                    style={[
                      styles.historyCard,
                      attempt.result === '○' ? styles.correctCard : styles.incorrectCard
                    ]}
                    onPress={() => onPress(questionNumber)}
                  >
                    <Text style={styles.attemptNumber}>{originalIndex + 1}周目</Text>
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
                </View>
              );
            }

            // 2番目以降のカードはアニメーション
            return (
              <Animated.View
                key={`${questionNumber}-${originalIndex}`}
                style={{
                  transform: [
                    {
                      translateY: animValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-30, 0],
                      }),
                    },
                  ],
                  opacity: animValue,
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.historyCard,
                    attempt.result === '○' ? styles.correctCard : styles.incorrectCard
                  ]}
                  onPress={() => onPress(questionNumber)}
                >
                  <Text style={styles.attemptNumber}>{originalIndex + 1}周目</Text>
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
              </Animated.View>
            );
          })
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
