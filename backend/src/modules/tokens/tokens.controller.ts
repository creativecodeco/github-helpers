import { Controller, Post, Delete, Body, Req, Res } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { RegisterUserTokenUseCase } from '@/use-cases/tokens/RegisterUserTokenUseCase';
import { RevokeUserTokenUseCase } from '@/use-cases/tokens/RevokeUserTokenUseCase';
import { PurgeUserDataUseCase } from '@/use-cases/users/PurgeUserDataUseCase';
import { GITHUB_USERNAME_REGEX } from '@/domain/entities/Validation';
import { logger } from '@/infrastructure/logging/logger';

function extractBearerToken(req: FastifyRequest, bodyToken?: string): string | undefined {
  const authHeader = req.headers['authorization'];
  let token = authHeader || bodyToken;
  if (typeof token !== 'string') return undefined;
  if (token.startsWith('Bearer ')) {
    return token.slice(7);
  }
  if (token.startsWith('token ')) {
    return token.slice(6);
  }
  return token;
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
    @Body() body: Record<string, any>,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply
  ): Promise<void> {
    const { username, token, consentAccepted } = body || {};

    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
      res.status(400).send({ error: 'Usuario de GitHub inválido.' });
      return;
    }

    if (!token || typeof token !== 'string' || token.trim() === '') {
      res.status(400).send({ error: 'Token de GitHub no proporcionado.' });
      return;
    }

    if (consentAccepted !== true) {
      res.status(400).send({ error: 'Debes aceptar los términos y condiciones de almacenamiento de datos.' });
      return;
    }

    try {
      const ip = req.ip || '';
      const userAgent = (req.headers['user-agent'] as string) || '';

      const result = await this.registerUseCase.execute(username, token, consentAccepted, ip, userAgent);
      logger.info(`Token registered successfully for user ${username}`, { username });
      res.status(200).send(result);
    } catch (error: any) {
      logger.error(`Error registering token for user ${username}`, { username, error });
      res.status(500).send({ error: error.message || 'Error interno del servidor al registrar el token.' });
    }
  }

  @Delete('tokens/revoke')
  async revoke(
    @Body() body: Record<string, any>,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply
  ): Promise<void> {
    const { username, token: bodyToken } = body || {};
    const providedToken = extractBearerToken(req, bodyToken);

    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
      res.status(400).send({ error: 'Usuario de GitHub inválido.' });
      return;
    }

    if (!providedToken || providedToken.trim() === '') {
      res.status(400).send({ error: 'Se requiere proveer un token de GitHub válido para confirmar tu identidad.' });
      return;
    }

    try {
      const result = await this.revokeUseCase.execute(username, providedToken);
      logger.info(`Token revoked successfully for user ${username}`, { username });
      res.status(200).send(result);
    } catch (error: any) {
      logger.error(`Error revoking token for user ${username}`, { username, error });
      res.status(500).send({ error: error.message || 'Error interno del servidor al revocar el token.' });
    }
  }

  @Delete('users/purge')
  async purge(
    @Body() body: Record<string, any>,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply
  ): Promise<void> {
    const { username, token: bodyToken } = body || {};
    const providedToken = extractBearerToken(req, bodyToken);

    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
      res.status(400).send({ error: 'Usuario de GitHub inválido.' });
      return;
    }

    if (!providedToken || providedToken.trim() === '') {
      res.status(400).send({
        error: 'Se requiere proveer tu token de GitHub válido para confirmar y autorizar la purga de datos.'
      });
      return;
    }

    try {
      const profileRes = await fetch('https://api.github.com/user', {
        headers: {
          'User-Agent': 'github-helpers-security',
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${providedToken}`
        }
      });

      if (!profileRes.ok) {
        res.status(401).send({ error: 'El token de GitHub provisto no es válido o ha expirado.' });
        return;
      }

      const githubUser = (await profileRes.json()) as { login: string };
      const tokenOwner = githubUser.login;

      if (tokenOwner.toLowerCase() !== username.toLowerCase()) {
        res.status(403).send({
          error: `Acceso denegado. El token proporcionado pertenece al usuario '${tokenOwner}', pero estás intentando purgar los datos de '${username}'.`
        });
        return;
      }

      await this.purgeUseCase.execute(username);
      logger.info(`GDPR data purge completed for user ${username}`, { username });

      res.status(200).send({
        message: 'Todos tus datos (token, historial, métricas de uso y logs) han sido eliminados de forma definitiva.'
      });
    } catch (error: any) {
      logger.error(`Error purging data for user ${username}`, { username, error });
      res.status(500).send({
        error: error.message || 'Error interno del servidor al procesar la purga de datos.'
      });
    }
  }
}
