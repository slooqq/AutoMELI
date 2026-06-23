import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('competitor_items')
export class CompetitorItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  itemId: string;

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
