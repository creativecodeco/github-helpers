import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('request_log')
export class RequestLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  username!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  card_type!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  source!: string;

  @Column({ type: 'text', nullable: true })
  user_agent!: string;

  @Column({ type: 'text', nullable: true })
  referer!: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address!: string;

  @CreateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
