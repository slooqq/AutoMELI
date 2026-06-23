import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('test_variants')
export class TestVariant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  itemId: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  imageUrl: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'boolean', default: false })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
