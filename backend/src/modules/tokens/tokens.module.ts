import { Module } from '@nestjs/common';
import { TokensController } from './tokens.controller';
import { ApiGitHubRepository } from '@/adapters/repositories/ApiGitHubRepository';
import { TypeORMTokenRepository } from '@/adapters/repositories/TypeORMTokenRepository';
import { RegisterUserTokenUseCase } from '@/use-cases/tokens/RegisterUserTokenUseCase';
import { RevokeUserTokenUseCase } from '@/use-cases/tokens/RevokeUserTokenUseCase';
import { PurgeUserDataUseCase } from '@/use-cases/users/PurgeUserDataUseCase';

@Module({
  controllers: [TokensController],
  providers: [
    {
      provide: 'ITokenRepository',
      useClass: TypeORMTokenRepository
    },
    {
      provide: 'IGitHubRepository',
      useClass: ApiGitHubRepository
    },
    {
      provide: RegisterUserTokenUseCase,
      useFactory: (tokenRepo, ghRepo) => new RegisterUserTokenUseCase(tokenRepo, ghRepo),
      inject: ['ITokenRepository', 'IGitHubRepository']
    },
    {
      provide: RevokeUserTokenUseCase,
      useFactory: (tokenRepo, ghRepo) => new RevokeUserTokenUseCase(tokenRepo, ghRepo),
      inject: ['ITokenRepository', 'IGitHubRepository']
    },
    {
      provide: PurgeUserDataUseCase,
      useFactory: () => new PurgeUserDataUseCase()
    }
  ]
})
export class TokensModule {}
