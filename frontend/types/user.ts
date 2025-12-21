// ✅ 追加：ユーザー情報
export interface User {
    id: string;
    email: string;
    name?: string;
    goal?: string;
    createdAt: Date;
    updatedAt: Date;
}

// ✅ 追加：学習履歴
export interface StudyRecord {
    id: string;
    quizBook: {
        id: string;
        title: string;
        category: {
            id: string;
            name: string;
        };
    };
    chapterId: string;
    sectionId?: string;
    questionNumber: number;
    result: '○' | '×';
    round: number;
    answeredAt: string;
}