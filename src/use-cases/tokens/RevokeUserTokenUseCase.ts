import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { ITokenRepository } from '@/domain/repositories/ITokenRepository';

export class RevokeUserTokenUseCase {
  constructor(
    private readonly tokenRepo: ITokenRepository,
    private readonly githubRepo: IGitHubRepository
  ) {}

  async execute(username: string, providedToken: string): Promise<{ message: string }> {
    throw new Error('Esta característica no está disponible temporalmente (Coming Soon).');
    /*
    // 1. Verify who owns the provided token
    const profileRes = await fetch('https://api.github.com/user', {
      headers: {
        'User-Agent': 'github-helpers-security',
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${providedToken}`
      }
    });

    if (!profileRes.ok) {
      throw new Error('El token provisto no es válido. No se puede verificar tu identidad.');
    }

    const githubUser = await profileRes.json();
    const tokenOwner = githubUser.login;

    // 2. Enforce ownership: only the owner of the GitHub username can delete its token
    if (tokenOwner.toLowerCase() !== username.toLowerCase()) {
      throw new Error(
        `Acceso denegado. El token proporcionado pertenece al usuario de GitHub '${tokenOwner}', pero estás intentando revocar el token de '${username}'.`
      );
    }

    // 3. Check if token exists
    const existingToken = await this.tokenRepo.getToken(username);
    if (!existingToken) {
      throw new Error('No se encontró ningún token registrado para este usuario.');
    }

    // 4. Delete from database
    await this.tokenRepo.deleteToken(username);

    // 5. Clear caches
    this.githubRepo.clearCache(username);

    return {
      message: 'Token revocado y eliminado exitosamente de nuestros servidores.'
    };
    */
  }
}
