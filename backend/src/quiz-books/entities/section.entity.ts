import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Chapter } from './chapter.entity';
import { QuestionAnswer } from './question-answer.entity';

@Entity('sections')
export class Section {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  title: string;

  @Column()
  sectionNumber: number;

  @Column()
  questionCount: number;

  @ManyToOne(() => Chapter, chapter => chapter.sections, { onDelete: 'CASCADE' })
  chapter: Chapter;

  @Column()
  chapterId: string;

  @OneToMany(() => QuestionAnswer, questionAnswer => questionAnswer.section, { cascade: true })
  questionAnswers: QuestionAnswer[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}