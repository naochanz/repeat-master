// frontend/src/utils/questionHelpers.ts

import { Attempt } from "@/types/QuizBook";

export type QuestionColor = 'gold' | 'silver' | 'green' | 'red' | 'gray';

/**
 * 問題の色を判定する（単一カード用）
 * @param attempts 回答履歴
 * @returns 色（gold, silver, green, red, gray）
 */
export const getQuestionColor = (attempts?: Attempt[]): QuestionColor => {
  if (!attempts || attempts.length === 0) {
    return 'gray';
  }

  const recent3 = attempts.slice(-3);
  const recent2 = attempts.slice(-2);
  const latest = attempts[attempts.length - 1];

  // 3連続○ → 金
  if (recent3.length >= 3 && recent3.every(a => a.result === '○')) {
    return 'gold';
  }

  // 2連続○ → 銀
  if (recent2.length >= 2 && recent2.every(a => a.result === '○')) {
    return 'silver';
  }

  // 最新が○ → 緑
  if (latest.result === '○') {
    return 'green';
  }

  // 最新が× → 赤
  return 'red';
};

/**
 * 各カードの色を計算する（連続グループ内でも個別に判定）
 * 連続○グループの中で:
 * - 1回目 → 緑
 * - 2回目 → 銀
 * - 3回目以降 → 金
 * × → 赤（連続リセット）
 * 
 * @param attempts 確定済み回答履歴
 * @returns 各カードの色の配列
 */
export const getCardColors = (attempts: Attempt[]): QuestionColor[] => {
  if (attempts.length === 0) {
    return [];
  }

  const colors: QuestionColor[] = new Array(attempts.length).fill('gray');
  let consecutiveCorrectCount = 0;  // 現在の連続○カウント

  for (let i = 0; i < attempts.length; i++) {
    const current = attempts[i];

    if (current.result === '×') {
      // × は赤、連続カウントをリセット
      colors[i] = 'red';
      consecutiveCorrectCount = 0;
    } else {
      // ○ の場合、連続カウントを増やす
      consecutiveCorrectCount++;

      // 連続回数に応じて色を決定
      if (consecutiveCorrectCount === 1) {
        colors[i] = 'green';   // 1回目 → 緑
      } else if (consecutiveCorrectCount === 2) {
        colors[i] = 'silver';  // 2回目 → 銀
      } else {
        colors[i] = 'gold';    // 3回目以降 → 金
      }
    }
  }

  return colors;
};

/**
 * 色のスタイル定義
 */
export const questionColors = {
  gold: {
    bg: '#FEF3C7',
    border: '#FFD700',
    text: '#92400E',
    icon: '👑',
  },
  silver: {
    bg: '#F3F4F6',
    border: '#C0C0C0',
    text: '#4B5563',
    icon: '⭐',
  },
  green: {
    bg: '#DCFCE7',
    border: '#22C55E',
    text: '#14532D',
    icon: '✓',
  },
  red: {
    bg: '#FEE2E2',
    border: '#EF4444',
    text: '#7F1D1D',
    icon: '✗',
  },
  gray: {
    bg: '#F9FAFB',
    border: '#D1D5DB',
    text: '#6B7280',
    icon: '—',
  },
};