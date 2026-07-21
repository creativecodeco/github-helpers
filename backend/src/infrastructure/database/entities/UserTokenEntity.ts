import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('user_tokens')
export class UserTokenEntity {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  username!: string;

  @Column({ type: 'text' })
  encrypted_token!: string;

  @Column({ type: 'varchar', length: 100 })
  iv!: string;

  @Column({ type: 'boolean', default: false })
  consent_accepted!: boolean;

  @Column({ type: 'timestamp with time zone' })
  consent_date!: Date;

  @Column({ type: 'varchar', length: 255 })
  consent_fingerprint!: string;

  @UpdateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
