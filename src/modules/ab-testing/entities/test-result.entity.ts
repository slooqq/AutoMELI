import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TestVariant } from './test-variant.entity';

@Entity('test_results')
export class TestResult {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TestVariant, (variant) => variant.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'testVariantId' })
  testVariant: TestVariant;

  @Column()
  testVariantId: number;

  @Column({ type: 'int', default: 0 })
  visits: number;

  @Column({ type: 'int', default: 0 })
  sales: number;

  @Column({ type: 'date' })
  recordedDate: string;

  @CreateDateColumn()
  createdAt: Date;
}
