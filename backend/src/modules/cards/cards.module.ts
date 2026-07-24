import { Module } from '@nestjs/common';
import { CardsController } from './cards.controller';
import { ApiGitHubRepository } from '@/adapters/repositories/ApiGitHubRepository';
import { CachedGitHubRepository } from '@/adapters/repositories/CachedGitHubRepository';
import { TypeORMTokenRepository } from '@/adapters/repositories/TypeORMTokenRepository';
import { TypeORMMetricsRepository } from '@/adapters/repositories/TypeORMMetricsRepository';
import { GetUserStatsCardUseCase } from '@/use-cases/cards/GetUserStatsCardUseCase';
import { GetUserLanguagesCardUseCase } from '@/use-cases/cards/GetUserLanguagesCardUseCase';
import { GetFeaturedRepoCardUseCase } from '@/use-cases/cards/GetFeaturedRepoCardUseCase';
import { GetUserRankCardUseCase } from '@/use-cases/cards/GetUserRankCardUseCase';
import { GetUserStreakCardUseCase } from '@/use-cases/cards/GetUserStreakCardUseCase';
import { GetUserTrophiesCardUseCase } from '@/use-cases/cards/GetUserTrophiesCardUseCase';
import { GetUserTopReposCardUseCase } from '@/use-cases/cards/GetUserTopReposCardUseCase';
import { RecordProfileViewUseCase } from '@/use-cases/metrics/RecordProfileViewUseCase';

@Module({
  controllers: [CardsController],
  providers: [
    {
      provide: 'IGitHubRepository',
      useFactory: () => new CachedGitHubRepository(new ApiGitHubRepository())
    },
    {
      provide: 'ITokenRepository',
      useClass: TypeORMTokenRepository
    },
    {
      provide: 'IMetricsRepository',
      useClass: TypeORMMetricsRepository
    },
    {
      provide: GetUserStatsCardUseCase,
      useFactory: (gh, token, metrics) => new GetUserStatsCardUseCase(gh, token, metrics),
      inject: ['IGitHubRepository', 'ITokenRepository', 'IMetricsRepository']
    },
    {
      provide: GetUserLanguagesCardUseCase,
      useFactory: (gh, token, metrics) => new GetUserLanguagesCardUseCase(gh, token, metrics),
      inject: ['IGitHubRepository', 'ITokenRepository', 'IMetricsRepository']
    },
    {
      provide: GetFeaturedRepoCardUseCase,
      useFactory: (gh, token, metrics) => new GetFeaturedRepoCardUseCase(gh, token, metrics),
      inject: ['IGitHubRepository', 'ITokenRepository', 'IMetricsRepository']
    },
    {
      provide: GetUserRankCardUseCase,
      useFactory: (gh, token, metrics) => new GetUserRankCardUseCase(gh, token, metrics),
      inject: ['IGitHubRepository', 'ITokenRepository', 'IMetricsRepository']
    },
    {
      provide: GetUserStreakCardUseCase,
      useFactory: (gh, metrics, token) => new GetUserStreakCardUseCase(gh, metrics, token),
      inject: ['IGitHubRepository', 'IMetricsRepository', 'ITokenRepository']
    },
    {
      provide: GetUserTrophiesCardUseCase,
      useFactory: (gh, token, metrics) => new GetUserTrophiesCardUseCase(gh, token, metrics),
      inject: ['IGitHubRepository', 'ITokenRepository', 'IMetricsRepository']
    },
    {
      provide: GetUserTopReposCardUseCase,
      useFactory: (gh, token) => new GetUserTopReposCardUseCase(gh, token),
      inject: ['IGitHubRepository', 'ITokenRepository']
    },
    {
      provide: RecordProfileViewUseCase,
      useFactory: (metrics) => new RecordProfileViewUseCase(metrics),
      inject: ['IMetricsRepository']
    }
  ]
})
export class CardsModule {}
