import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { TypeORMMetricsRepository } from '@/adapters/repositories/TypeORMMetricsRepository';

@Module({
  controllers: [MetricsController],
  providers: [
    {
      provide: 'IMetricsRepository',
      useClass: TypeORMMetricsRepository,
    },
  ],
  exports: ['IMetricsRepository'],
})
export class MetricsModule {}
