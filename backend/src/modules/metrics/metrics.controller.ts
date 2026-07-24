import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Inject,
  InternalServerErrorException,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { safeTimingEqual } from '@/infrastructure/security/security';
import { logger } from '@/infrastructure/logging/logger';
import { getMessages, resolveLocale, SupportedLocale } from '@/infrastructure/i18n/backendI18n';
import { MetricsHistoryQueryDto, MetricsKeyQueryDto } from './dto/metrics.dto';

@Controller('api')
export class MetricsController {
  constructor(
    @Inject('IMetricsRepository') private readonly metricsRepo: IMetricsRepository
  ) {}

  private validateMetricsKey(queryKey?: string, headerKey?: string, locale?: SupportedLocale): void {
    const m = getMessages(resolveLocale(locale));
    const expectedKey = process.env.METRICS_KEY;

    if (!expectedKey) {
      throw new ForbiddenException(m.metricsDisabled);
    }

    const providedKey = headerKey ?? queryKey;

    if (typeof providedKey !== 'string' || !safeTimingEqual(providedKey, expectedKey)) {
      throw new UnauthorizedException(m.metricsUnauthorized);
    }
  }

  @Get('metrics')
  getMetrics(
    @Query() query: MetricsKeyQueryDto,
    @Headers('x-api-key') headerKey?: string
  ): unknown {
    this.validateMetricsKey(query.key, headerKey, query.locale);
    return this.metricsRepo.getMetrics();
  }

  @Get('metrics/history')
  async getRendersHistory(
    @Query() query: MetricsHistoryQueryDto,
    @Headers('x-api-key') headerKey?: string
  ): Promise<unknown> {
    this.validateMetricsKey(query.key, headerKey, query.locale);

    try {
      const days = query.days ?? 7;
      return await this.metricsRepo.getRendersHistory(days);
    } catch (error: unknown) {
      logger.error('Error in getRendersHistory endpoint', { error });
      throw new InternalServerErrorException(getMessages('es').metricsHistoryError);
    }
  }

  @Get('metrics/users')
  async getUserMetrics(
    @Query() query: MetricsKeyQueryDto,
    @Headers('x-api-key') headerKey?: string
  ): Promise<unknown> {
    this.validateMetricsKey(query.key, headerKey, query.locale);

    try {
      return await this.metricsRepo.getAllUserMetrics();
    } catch (error: unknown) {
      logger.error('Error in getUserMetrics endpoint', { error });
      throw new InternalServerErrorException(getMessages('es').userMetricsError);
    }
  }

  @Get('metrics/users/count')
  async getUniqueUsersCount(): Promise<unknown> {
    try {
      return await this.metricsRepo.getUniqueUsersCount();
    } catch (error: unknown) {
      logger.error('Error in getUniqueUsersCount endpoint', { error });
      throw new InternalServerErrorException(getMessages('es').userCountError);
    }
  }

  @Get('config')
  getConfig(): { privateStatsComingSoon: boolean } {
    return {
      privateStatsComingSoon: process.env.PRIVATE_STATS_COMING_SOON !== 'false',
    };
  }
}
