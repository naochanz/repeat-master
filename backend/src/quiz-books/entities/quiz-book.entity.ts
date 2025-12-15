import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Chapter } from './chapter.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('quiz_books')
export class QuizBook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @ManyToOne(() => Category, category => category.quizBooks)
  category: Category;

  @Column()
  categoryId: string;

  @Column({ default: 0 })
  chapterCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  currentRate: number;

  @Column({ default: false })
  useSections: boolean;

  @Column({ default: 1 })
  currentRound: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => Chapter, chapter => chapter.quizBook, { cascade: true })
  chapters: Chapter[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}