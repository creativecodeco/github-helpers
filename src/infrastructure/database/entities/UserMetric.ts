import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('user_metrics')
export class UserMetric {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  username!: string;

  @Column({ type: 'integer', default: 0 })
  stats_web!: number;

  @Column({ type: 'integer', default: 0 })
  stats_github!: number;

  @Column({ type: 'integer', default: 0 })
  languages_web!: number;

  @Column({ type: 'integer', default: 0 })
  languages_github!: number;

  @Column({ type: 'integer', default: 0 })
  repo_web!: number;

  @Column({ type: 'integer', default: 0 })
  repo_github!: number;

  @Column({ type: 'integer', default: 0 })
  rank_web!: number;

  @Column({ type: 'integer', default: 0 })
  rank_github!: number;

  @Column({ type: 'integer', default: 0 })
  streak_web!: number;

  @Column({ type: 'integer', default: 0 })
  streak_github!: number;

  @Column({ type: 'integer', default: 0 })
  trophies_web!: number;

  @Column({ type: 'integer', default: 0 })
  trophies_github!: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  last_updated!: Date;
}
