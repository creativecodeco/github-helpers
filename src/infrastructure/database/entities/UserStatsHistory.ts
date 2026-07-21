import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('user_stats_history')
export class UserStatsHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  username!: string;

  @Column({ type: 'integer', default: 0 })
  stars!: number;

  @Column({ type: 'integer', default: 0 })
  commits!: number;

  @Column({ type: 'integer', default: 0 })
  prs!: number;

  @Column({ type: 'integer', default: 0 })
  issues!: number;

  @Column({ type: 'integer', default: 0 })
  followers!: number;

  @Column({ type: 'jsonb', nullable: true })
  languages!: Record<string, number>;

  @CreateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  recorded_at!: Date;
}
