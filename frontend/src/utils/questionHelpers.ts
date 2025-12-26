import { Attempt } from "@/types/QuizBook";

export type QuestionColor = 'gold' | 'silver' | 'green' | 'red' | 'gray';

/**
 * 問題の色を判定する
 * @param attempts 回答履歴
 * @returns 色（gold, silver, green, red, gray）
 */

export const getQuestionColor = (attempts?: Attempt[]): QuestionColor => {
    if(!attempts || attempts.length === 0){
        return 'gray';
    }

    const recent3 = attempts.slice(-3);
    const recent2 = attempts.slice(-2);
    const latest = attempts[attempts.length - 1];

    //3連続〇　→　金
    if(recent3.length >= 3 && recent3.every(a => a.result === '○')){
        return 'gold';
    }

    //2連続〇　→　銀
    if(recent2.length >= 2 && recent2.every(a => a.result === '○')){
        return 'silver';
    }

    //最新が〇　→　緑
    if(latest.result ===  '○') {
        return 'green';
    }

    //最新が×　→　赤
        return 'red';
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