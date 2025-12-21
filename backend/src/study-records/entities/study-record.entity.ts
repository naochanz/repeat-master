import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { QuizBook } from '../../quiz-books/entities/quiz-book.entity';

@Entity('study_records')
export class StudyRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  quizBookId: string;

  @ManyToOne(() => QuizBook)
  @JoinColumn({ name: 'quizBookId' })
  quizBook: QuizBook;

  @Column()
  chapterId: string;

  @Column({ nullable: true })
  sectionId?: string;

  @Column({ type: 'int' })
  questionNumber: number;

  @Column({ type: 'varchar', length: 1 })
  result: string; // '○' | '×'

  @Column({ type: 'int' })
  round: number;

  @Index()
  @CreateDateColumn()
  answeredAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}