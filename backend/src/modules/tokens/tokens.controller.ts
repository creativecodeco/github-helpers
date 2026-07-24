import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Headers,
  InternalServerErrorException,
  Ip,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserTokenUseCase } from '@/use-cases/tokens/RegisterUserTokenUseCase';
import { RevokeUserTokenUseCase } from '@/use-cases/tokens/RevokeUserTokenUseCase';
import { PurgeUserDataUseCase } from '@/use-cases/users/PurgeUserDataUseCase';
import { logger } from '@/infrastructure/logging/logger';
import { escapeXml } from '@/utils/escape';
import { getMessages, resolveLocale } from '@/infrastructure/i18n/backendI18n';
import { RegisterTokenDto, RevokeTokenDto, PurgeUserDto } from './dto/tokens.dto';

function extractBearerToken(authHeader?: string, bodyToken?: string): string | undefined {
  const raw = authHeader ?? bodyToken;
  if (typeof raw !== 'string') return undefined;
  if (raw.startsWith('Bearer ')) return raw.slice(7);
  if (raw.startsWith('token ')) return raw.slice(6);
  return raw;
}

@Controller('api')
export class TokensController {
  constructor(
    private readonly registerUseCase: RegisterUserTokenUseCase,
    private readonly revokeUseCase: RevokeUserTokenUseCase,
    private readonly purgeUseCase: PurgeUserDataUseCase
  ) {}

  @Post('tokens/register')
  async register(
    @Body() dto: RegisterTokenDto,
    @Headers('authorization') authHeader?: string,
    @Headers('user-agent') userAgent?: string,
    @Ip() clientIp?: string
  ): Promise<Record<string, unknown>> {
    const m = getMessages(resolveLocale(dto.locale));

    if (!dto.consentAccepted) {
      throw new BadRequestException(m.consentRequired);
    }

    try {
      // Fastify's @Ip() decorator resolves the IP from the underlying socket,
      // which is the authoritative source and cannot be spoofed by client headers.
      const ip = clientIp ?? '';
      const agent = userAgent ?? '';
      const result = await this.registerUseCase.execute(dto.username, dto.token, dto.consentAccepted, ip, agent);
      logger.info(`Token registered successfully for user ${dto.username}`, { username: dto.username });
      return result as Record<string, unknown>;
    } catch (error: unknown) {
      logger.error(`Error registering token for user ${dto.username}`, { username: dto.username, error });
      throw new InternalServerErrorException(m.tokenRegisterError);
    }
  }

  @Delete('tokens/revoke')
  async revoke(
    @Body() dto: RevokeTokenDto,
    @Headers('authorization') authHeader?: string
  ): Promise<Record<string, unknown>> {
    const m = getMessages(resolveLocale(dto.locale));
    const providedToken = extractBearerToken(authHeader, dto.token);

    if (!providedToken || providedToken.trim() === '') {
      throw new BadRequestException(m.tokenIdentityRequired);
    }

    try {
      const result = await this.revokeUseCase.execute(dto.username, providedToken);
      logger.info(`Token revoked successfully for user ${dto.username}`, { username: dto.username });
      return result as Record<string, unknown>;
    } catch (error: unknown) {
      logger.error(`Error revoking token for user ${dto.username}`, { username: dto.username, error });
      throw new InternalServerErrorException(m.tokenRevokeError);
    }
  }

  @Delete('users/purge')
  async purge(
    @Body() dto: PurgeUserDto,
    @Headers('authorization') authHeader?: string
  ): Promise<{ message: string }> {
    const m = getMessages(resolveLocale(dto.locale));
    const providedToken = extractBearerToken(authHeader, dto.token);

    if (!providedToken || providedToken.trim() === '') {
      throw new BadRequestException(m.purgeTokenRequired);
    }

    const profileRes = await fetch('https://api.github.com/user', {
      headers: {
        'User-Agent': 'github-helpers-security',
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${providedToken}`,
      },
    });

    if (!profileRes.ok) {
      throw new UnauthorizedException(m.tokenExpiredOrInvalid);
    }

    const githubUser = (await profileRes.json()) as { login: string };
    const tokenOwner = githubUser.login;

    if (tokenOwner.toLowerCase() !== dto.username.toLowerCase()) {
      throw new ForbiddenException(m.accessDenied(escapeXml(tokenOwner), escapeXml(dto.username)));
    }

    try {
      await this.purgeUseCase.execute(dto.username);
      logger.info(`GDPR data purge completed for user ${dto.username}`, { username: dto.username });
      return { message: m.purgeSuccess };
    } catch (error: unknown) {
      logger.error(`Error purging data for user ${dto.username}`, { username: dto.username, error });
      throw new InternalServerErrorException(m.purgeDataError);
    }
  }
}
