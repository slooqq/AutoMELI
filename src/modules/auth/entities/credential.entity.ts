import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('credentials')
export class Credential {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  appId: string;

  @Column({ type: 'text' })
  secretKey: string;

  @Column({ type: 'text' })
  redirectUri: string;

  @Column({ type: 'text', nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
