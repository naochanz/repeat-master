export class RoundStatsDto {
    round: number;
    correctRate: number;
    totalQuestions: number;
    correctAnswers: number;
}

export class ChapterStatsDto {
    round: number;
    chapterId: string;
    chapterNumber: number;
    correctRate: number;
    totalQuestions: number;
    correctAnswers: number;
}

export class SectionStatsDto {
    round: number;
    sectionId: string;
    chapterId: string;
    sectionNumber: number;
    correctRate: number;
    totalQuestions: number;
    correctAnswers: number;
}

export class QuizBookAnalyticsDto {
    quizBookId: string;
    totalRounds: number;
    roundStats: RoundStatsDto[];
    chapterStats: ChapterStatsDto[];
    sectionStats: SectionStatsDto[];
}