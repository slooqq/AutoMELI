import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CompetitorItem } from './competitor-item.entity';

@Entity('competitor_snapshots')
export class CompetitorSnapshot {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CompetitorItem, (item) => item.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'competitorItemId' })
  competitorItem: CompetitorItem;

  @Column()
  competitorItemId: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  availableStock: number;

  @Column({ type: 'int', nullable: true })
  sales: number;

  @CreateDateColumn()
  recordedAt: Date;
}
