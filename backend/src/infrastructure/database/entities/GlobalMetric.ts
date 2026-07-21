import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('global_metrics')
export class GlobalMetric {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  metric_key!: string;

  @Column({ type: 'integer', default: 0 })
  metric_value!: number;
}
