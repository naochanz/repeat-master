export class CreateAnswerDto {
    questionNumber: number;
    result: '○' | '×';
    chapterId?: string;
    sectionId?: string;
    isBookmarked?: boolean;
}