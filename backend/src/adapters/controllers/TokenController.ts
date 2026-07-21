import { Request, Response } from 'express';
import { RegisterUserTokenUseCase } from '@/use-cases/tokens/RegisterUserTokenUseCase';
import { RevokeUserTokenUseCase } from '@/use-cases/tokens/RevokeUserTokenUseCase';
import { PurgeUserDataUseCase } from '@/use-cases/users/PurgeUserDataUseCase';

const GITHUB_USERNAME_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export class TokenController {
  constructor(
    private readonly registerUseCase: RegisterUserTokenUseCase,
    private readonly revokeUseCase: RevokeUserTokenUseCase,
    private readonly purgeUseCase: PurgeUserDataUseCase
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const { username, token, consentAccepted } = req.body;

    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
      res.status(400).json({ error: 'Usuario de GitHub inválido.' });
      return;
    }

    if (!token || typeof token !== 'string' || token.trim() === '') {
      res.status(400).json({ error: 'Token de GitHub no proporcionado.' });
      return;
    }

    if (consentAccepted !== true) {
      res
        .status(400)
        .json({ error: 'Debes aceptar los términos y condiciones de almacenamiento de datos.' });
      return;
    }

    try {
      const ip = req.ip || '';
      const userAgent = req.headers['user-agent'] || '';

      const result = await this.registerUseCase.execute(
        username,
        token,
        consentAccepted,
        ip,
        userAgent
      );
      res.status(200).json(result);
    } catch (error: any) {
      console.error(`Error registering token for user ${username}:`, error);
      res
        .status(500)
        .json({ error: error.message || 'Error interno del servidor al registrar el token.' });
    }
  };

  revoke = async (req: Request, res: Response): Promise<void> => {
    const { username } = req.body;

    let providedToken = req.headers['authorization'] || req.body.token;
    if (providedToken && typeof providedToken === 'string') {
      if (providedToken.startsWith('Bearer ')) {
        providedToken = providedToken.slice(7);
      } else if (providedToken.startsWith('token ')) {
        providedToken = providedToken.slice(6);
      }
    }

    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
      res.status(400).json({ error: 'Usuario de GitHub inválido.' });
      return;
    }

    if (!providedToken || typeof providedToken !== 'string' || providedToken.trim() === '') {
      res.status(400).json({
        error: 'Se requiere proveer un token de GitHub válido para confirmar tu identidad.'
      });
      return;
    }

    try {
      const result = await this.revokeUseCase.execute(username, providedToken);
      res.status(200).json(result);
    } catch (error: any) {
      console.error(`Error revoking token for user ${username}:`, error);
      res
        .status(500)
        .json({ error: error.message || 'Error interno del servidor al revocar el token.' });
    }
  };

  purge = async (req: Request, res: Response): Promise<void> => {
    const { username } = req.body;
    let providedToken = req.headers['authorization'] || req.body.token;
    if (providedToken && typeof providedToken === 'string') {
      if (providedToken.startsWith('Bearer ')) {
        providedToken = providedToken.slice(7);
      } else if (providedToken.startsWith('token ')) {
        providedToken = providedToken.slice(6);
      }
    }

    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
      res.status(400).json({ error: 'Usuario de GitHub inválido.' });
      return;
    }

    if (!providedToken || typeof providedToken !== 'string' || providedToken.trim() === '') {
      res.status(400).json({
        error:
          'Se requiere proveer tu token de GitHub válido para confirmar y autorizar la purga de datos.'
      });
      return;
    }

    try {
      // 1. Verify who owns the provided token
      const profileRes = await fetch('https://api.github.com/user', {
        headers: {
          'User-Agent': 'github-helpers-security',
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${providedToken}`
        }
      });

      if (!profileRes.ok) {
        res.status(401).json({ error: 'El token de GitHub provisto no es válido o ha expirado.' });
        return;
      }

      const githubUser = await profileRes.json();
      const tokenOwner = githubUser.login;

      // 2. Enforce ownership: only the owner of the GitHub username can purge its data
      if (tokenOwner.toLowerCase() !== username.toLowerCase()) {
        res.status(403).json({
          error: `Acceso denegado. El token proporcionado pertenece al usuario '${tokenOwner}', pero estás intentando purgar los datos de '${username}'.`
        });
        return;
      }

      // 3. Execute purge
      await this.purgeUseCase.execute(username);

      res.status(200).json({
        message:
          'Todos tus datos (token, historial, métricas de uso y logs) han sido eliminados de forma definitiva.'
      });
    } catch (error: any) {
      console.error(`Error purging data for user ${username}:`, error);
      res.status(500).json({
        error: error.message || 'Error interno del servidor al procesar la purga de datos.'
      });
    }
  };
}
