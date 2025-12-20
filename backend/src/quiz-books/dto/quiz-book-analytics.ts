export class RoundStatsDto {
    round: number;
    correctRate: number;
    totalQuestion: number;
    correctAnswer: number;
}

export class ChapterStatsDto {
    round: number;
    chapterId: string;
    chapterNumber: number;
    crrectRate: number;
    totalQuestions: number;
    correctAnswers: number;
}

export class SectionStatsDto {
    round: number;
    sectionId: string;
    chapterId: string;
    sectionNumber: number;
    crrectRate: number;
    totalQuestions: number;
    correctAnswer: number;
}

export class QuizBookAnalyticsDto {
    quizBookId: string;
    totalRounds: number;
    roundStats: RoundStatsDto[];
    chapterStats: ChapterStatsDto[];
    sectionDtats: SectionStatsDto[];
}