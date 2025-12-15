import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { QuizBook } from './quiz-book.entity';
import { Section } from './section.entity';
import { QuestionAnswer } from './question-answer.entity';

@Entity('chapters')
export class Chapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  title: string;

  @Column()
  chapterNumber: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  chapterRate: number;

  @Column({ nullable: true })
  questionCount: number;

  @ManyToOne(() => QuizBook, quizBook => quizBook.chapters, { onDelete: 'CASCADE' })
  quizBook: QuizBook;

  @Column()
  quizBookId: string;

  @OneToMany(() => Section, section => section.chapter, { cascade: true, nullable: true })
  sections?: Section[];

  @OneToMany(() => QuestionAnswer, questionAnswer => questionAnswer.chapter, { cascade: true, nullable: true })
  questionAnswers?: QuestionAnswer[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}