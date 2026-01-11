// frontend/src/components/study/question/QuestionCard.tsx

import { useAppTheme } from '@/hooks/useAppTheme';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCardColors, questionColors, QuestionColor } from '@/src/utils/questionHelpers';
import { Attempt } from '@/types/QuizBook';

// 光沢グラデーションの色定義
const metallicGradients = {
  gold: {
    colors: ['#FFD700', '#FFF8DC', '#FFD700', '#B8860B', '#FFD700'] as const,
    locations: [0, 0.3, 0.5, 0.7, 1] as const,
  },
  silver: {
    colors: ['#C0C0C0', '#F5F5F5', '#C0C0C0', '#A9A9A9', '#C0C0C0'] as const,
    locations: [0, 0.3, 0.5, 0.7, 1] as const,
  },
};

// 光沢カードかどうかを判定
const isMetallicColor = (color: QuestionColor): color is 'gold' | 'silver' => {
  return color === 'gold' || color === 'silver';
};

// 光沢カードのラッパーコンポーネント
interface MetallicCardWrapperProps {
  color: 'gold' | 'silver';
  style?: any;
  children: React.ReactNode;
}

const MetallicCardWrapper: React.FC<MetallicCardWrapperProps> = ({ color, style, children }) => {
  const gradient = metallicGradients[color];
  return (
    <LinearGradient
      colors={[...gradient.colors]}
      locations={[...gradient.locations]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[style, { overflow: 'hidden' }]}
    >
      {children}
    </LinearGradient>
  );
};

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
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const confirmedHistory = history.filter(a => a.resultConfirmFlg === true);

  // ✅ 各カードの色を取得（ヘルパー関数を呼ぶだけ）
  const cardColors = getCardColors(confirmedHistory);

  // ✅ 特定のインデックスの色名を取得
  const getColorNameForIndex = (index: number): QuestionColor => {
    if (index < 0 || index >= cardColors.length) {
      return 'gray';
    }
    return cardColors[index];
  };

  // ✅ 特定のインデックスの色スタイルを取得
  const getColorForIndex = (index: number) => {
    return questionColors[getColorNameForIndex(index)];
  };

  // ✅ 特定のインデックスの連続数を取得
  const getConsecutiveCountForIndex = (index: number): number => {
    if (index < 0 || index >= confirmedHistory.length) {
      return 0;
    }

    // そのカードまでの履歴を逆順に見て、連続○をカウント
    let count = 0;
    for (let i = index; i >= 0; i--) {
      if (confirmedHistory[i].result === '○') {
        count++;
      } else {
        break;
      }
    }
    return count;
  };

  // 収納アニメーション中かどうか
  const [isCollapsing, setIsCollapsing] = useState(false);
  const prevIsExpandedRef = useRef(isExpanded);
  const prevModeRef = useRef(mode);

  // アニメーション用
  const animatedValues = useRef<Animated.Value[]>([]);

  useEffect(() => {
    const neededLength = confirmedHistory.length;
    const currentLength = animatedValues.current.length;

    if (neededLength > currentLength) {
      for (let i = currentLength; i < neededLength; i++) {
        animatedValues.current.push(new Animated.Value(0));
      }
    } else if (neededLength < currentLength) {
      animatedValues.current = animatedValues.current.slice(0, neededLength);
    }
  }, [confirmedHistory.length]);

  useEffect(() => {
    const prevIsExpanded = prevIsExpandedRef.current;
    const prevMode = prevModeRef.current;
    prevIsExpandedRef.current = isExpanded;
    prevModeRef.current = mode;

    if (prevMode === 'answer' && mode === 'view' && isExpanded) {
      setIsCollapsing(false);
      animatedValues.current.forEach(anim => anim.setValue(1));
      return;
    }

    if (mode === 'view' && isExpanded && !prevIsExpanded) {
      setIsCollapsing(false);
      animatedValues.current.slice(1).forEach(anim => anim.setValue(0));

      const animations = animatedValues.current.slice(1).map((anim, index) => {
        return Animated.timing(anim, {
          toValue: 1,
          duration: 30,
          delay: index * 30,
          useNativeDriver: true,
        });
      });
      if (animatedValues.current[0]) {
        animatedValues.current[0].setValue(1);
      }
      Animated.parallel(animations).start();
    } else if (mode === 'view' && !isExpanded && prevIsExpanded) {
      setIsCollapsing(true);
      const animations = animatedValues.current.slice(1).map((anim, index) => {
        return Animated.timing(anim, {
          toValue: 0,
          duration: 30,
          delay: (animatedValues.current.length - 2 - index) * 30,
          useNativeDriver: true,
        });
      });
      Animated.parallel(animations).start(() => {
        setIsCollapsing(false);
      });
    } else if (mode === 'answer') {
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
    return (
      <View style={styles.expandedHistory}>
        {confirmedHistory.length > 0 ? (
          confirmedHistory.slice().reverse().map((attempt, reverseIndex) => {
            const originalIndex = confirmedHistory.length - 1 - reverseIndex;
            const colorName = getColorNameForIndex(originalIndex);
            const colorStyle = getColorForIndex(originalIndex);
            const animValue = animatedValues.current[reverseIndex] || new Animated.Value(1);
            const isFirstCard = reverseIndex === 0;
            const isMetallic = isMetallicColor(colorName);
            
            // ✅ 連続数を取得
            const consecutiveCount = getConsecutiveCountForIndex(originalIndex);
            const showConsecutiveCount = colorName === 'gold' && consecutiveCount >= 4;

            // カードの中身
            const cardContent = (
              <>
                <View style={styles.historyCardContent}>
                  <Text style={styles.historyIcon}>{colorStyle.icon}</Text>
                  <Text style={styles.attemptNumber}>{originalIndex + 1}周目</Text>
                </View>
                
                {/* ✅ 4連続以上の場合、中央に表示 */}
                {showConsecutiveCount && (
                  <View style={styles.consecutiveBadge}>
                    <Text style={styles.consecutiveText}>{consecutiveCount}連続!</Text>
                  </View>
                )}
                
                <Text style={styles.historyDate}>
                  {new Date(attempt.answeredAt).toLocaleDateString('ja-JP', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </>
            );

            // カードのスタイル（非光沢用）
            const nonMetallicStyle = [
              styles.historyCard,
              {
                backgroundColor: colorStyle.bg,
                borderColor: colorStyle.border,
                borderWidth: 2,
              }
            ];

            // 光沢カードのスタイル
            const metallicCardStyle = [
              styles.historyCard,
              {
                borderColor: colorStyle.border,
                borderWidth: 2,
              }
            ];

            if (isFirstCard) {
              return (
                <View key={`${questionNumber}-${originalIndex}`}>
                  {isMetallic ? (
                    <TouchableOpacity onPress={() => onPress(questionNumber)} activeOpacity={0.7}>
                      <MetallicCardWrapper color={colorName} style={metallicCardStyle}>
                        {cardContent}
                      </MetallicCardWrapper>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={nonMetallicStyle}
                      onPress={() => onPress(questionNumber)}
                    >
                      {cardContent}
                    </TouchableOpacity>
                  )}
                </View>
              );
            }

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
                {isMetallic ? (
                  <TouchableOpacity onPress={() => onPress(questionNumber)} activeOpacity={0.7}>
                    <MetallicCardWrapper color={colorName} style={metallicCardStyle}>
                      {cardContent}
                    </MetallicCardWrapper>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={nonMetallicStyle}
                    onPress={() => onPress(questionNumber)}
                  >
                    {cardContent}
                  </TouchableOpacity>
                )}
              </Animated.View>
            );
          })
        ) : (
          <TouchableOpacity
            style={[
              styles.historyCard,
              {
                backgroundColor: questionColors.gray.bg,
                borderColor: questionColors.gray.border,
                borderWidth: 2,
              }
            ]}
            onPress={() => onPress(questionNumber)}
          >
            <Text style={styles.historyIcon}>{questionColors.gray.icon}</Text>
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
        <>
          {confirmedHistory.slice().reverse().map((attempt, reverseIndex) => {
            const index = confirmedHistory.length - 1 - reverseIndex;
            const colorName = getColorNameForIndex(index);
            const colorStyle = getColorForIndex(index);
            const stackIndex = confirmedHistory.length - 1 - index;
            const offset = (stackIndex + 1) * 9;
            const isMetallic = isMetallicColor(colorName);

            const stackCardStyle = {
              position: 'absolute' as const,
              top: offset,
              left: 0,
              right: 0,
              zIndex: confirmedHistory.length - stackIndex,
              opacity: Math.max(1 - (stackIndex * 0.1), 0.3),
              borderColor: colorStyle.border,
              borderWidth: 2,
            };

            if (isMetallic) {
              return (
                <MetallicCardWrapper
                  key={`stack-${questionNumber}-${index}`}
                  color={colorName}
                  style={[styles.questionCard, stackCardStyle]}
                >
                  <View />
                </MetallicCardWrapper>
              );
            }

            return (
              <View
                key={`stack-${questionNumber}-${index}`}
                style={[
                  styles.questionCard,
                  stackCardStyle,
                  { backgroundColor: colorStyle.bg },
                ]}
              />
            );
          })}

          {/* FAB表示中の最前面: 未回答カード（gray - 問題番号非表示） */}
          <View
            style={[
              styles.questionCard,
              styles.topCard,
              {
                backgroundColor: questionColors.gray.bg,
                borderColor: questionColors.gray.border,
                borderWidth: 2,
                borderStyle: 'dashed',
              }
            ]}
          >
            <Text style={styles.historyIcon}>{questionColors.gray.icon}</Text>
            <Text style={styles.attemptNumber}>{displayRound}周目</Text>
          </View>
        </>
      ) : (
        <>
          {confirmedHistory.length > 0 ? (
            confirmedHistory.slice().reverse().map((attempt, reverseIndex) => {
              const index = confirmedHistory.length - 1 - reverseIndex;
              const colorName = getColorNameForIndex(index);
              const colorStyle = getColorForIndex(index);
              const stackIndex = confirmedHistory.length - 1 - index;
              const offset = stackIndex * 9;
              const isTopCard = stackIndex === 0;
              const isMetallic = isMetallicColor(colorName);
              
              // ✅ 連続数を取得
              const consecutiveCount = getConsecutiveCountForIndex(index);
              const showConsecutiveCount = colorName === 'gold' && consecutiveCount >= 4;

              const stackCardStyle = {
                position: 'absolute' as const,
                top: offset,
                left: 0,
                right: 0,
                zIndex: confirmedHistory.length - stackIndex,
                opacity: Math.max(1 - (stackIndex * 0.1), 0.3),
                borderColor: colorStyle.border,
                borderWidth: 2,
              };

              const cardContent = isTopCard ? (
                <>
                  <Text style={styles.historyIcon}>{colorStyle.icon}</Text>
                  <Text style={styles.attemptNumber}>
                    {confirmedHistory.length}周目
                  </Text>
                  
                  {/* ✅ 4連続以上の場合、中央に表示 */}
                  {showConsecutiveCount && (
                    <View style={styles.consecutiveBadgeStack}>
                      <Text style={styles.consecutiveTextStack}>{consecutiveCount}連続!</Text>
                    </View>
                  )}
                  
                  <Text style={styles.cardDate}>
                    {new Date(attempt.answeredAt).toLocaleDateString('ja-JP', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </>
              ) : null;

              if (isMetallic) {
                return (
                  <MetallicCardWrapper
                    key={`stack-${questionNumber}-${index}`}
                    color={colorName}
                    style={[styles.questionCard, stackCardStyle]}
                  >
                    {cardContent}
                  </MetallicCardWrapper>
                );
              }

              return (
                <View
                  key={`stack-${questionNumber}-${index}`}
                  style={[
                    styles.questionCard,
                    stackCardStyle,
                    { backgroundColor: colorStyle.bg },
                  ]}
                >
                  {cardContent}
                </View>
              );
            })
          ) : (
            // 履歴がない場合（gray - 問題番号非表示）
            <View
              style={[
                styles.questionCard,
                styles.topCard,
                {
                  backgroundColor: questionColors.gray.bg,
                  borderColor: questionColors.gray.border,
                  borderWidth: 2,
                },
              ]}
            >
              <Text style={styles.historyIcon}>{questionColors.gray.icon}</Text>
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
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
  },
  questionCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
    height: 75,
  },
  expandedHistory: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  historyCard: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.sm,
    height: 75,
  },
  historyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  historyIcon: {
    fontSize: 24,
  },
  historyDate: {
    fontSize: theme.typography.fontSizes.xs,
    color: '#4B5563',
  },
  questionNumber: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: '#1F2937',
    fontFamily: 'ZenKaku-Bold',
  },
  answerMark: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
  },
  attemptNumber: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold,
    color: '#374151',
    fontFamily: 'ZenKaku-Medium',
  },
  cardDate: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    left: theme.spacing.sm,
    fontSize: theme.typography.fontSizes.xs,
    color: '#4B5563',
    fontFamily: 'ZenKaku-Regular',
  },
 // ✅ 連続バッジスタイル（展開時）
 consecutiveBadge: {
  position: 'absolute',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  paddingHorizontal: theme.spacing.xs,
  paddingVertical: 2,
  borderRadius: theme.borderRadius.xs,
  marginLeft: theme.spacing.xs,
  borderWidth: 1.5,
  borderColor: theme.colors.secondary[400],  // ← グレー系の枠
  ...theme.shadows.sm,
},
consecutiveText: {
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.bold as any,
  color: '#1F2937',
  fontFamily: 'ZenKaku-Bold',
},

// ✅ 連続バッジスタイル（スタック時）
consecutiveBadgeStack: {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  paddingHorizontal: theme.spacing.xs,
  paddingVertical: 1,
  borderRadius: theme.borderRadius.xs,
  borderWidth: 1.5,
  borderColor: '#9CA3AF',
},
consecutiveTextStack: {
  fontSize: 10,
  fontWeight: theme.typography.fontWeights.bold as any,
  color: '#1F2937',
  fontFamily: 'ZenKaku-Bold',
},
});

export default QuestionCard;