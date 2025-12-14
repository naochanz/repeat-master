import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Chapter } from './chapter.entity';
import { Section } from './section.entity';

@Entity('question_answers')
export class QuestionAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  questionNumber: number;

  @Column({ type: 'text', nullable: true })
  memo?: string;

  @Column({ type: 'jsonb' })
  attempts: {
    round: number;
    result: '○' | '×';
    resultConfirmFlg: boolean;
    answeredAt: Date;
  }[];

  @ManyToOne(() => Chapter, chapter => chapter.questionAnswers, { onDelete: 'CASCADE', nullable: true })
  chapter?: Chapter;

  @Column({ nullable: true })
  chapterId?: string;

  @ManyToOne(() => Section, section => section.questionAnswers, { onDelete: 'CASCADE', nullable: true })
  section?: Section;

  @Column({ nullable: true })
  sectionId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}