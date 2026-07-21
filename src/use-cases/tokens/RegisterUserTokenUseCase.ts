import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { ITokenRepository } from '@/domain/repositories/ITokenRepository';
import {
  encryptToken,
  validateTokenScopes,
  generateConsentFingerprint
} from '@/infrastructure/security/security';

export class RegisterUserTokenUseCase {
  constructor(
    private readonly tokenRepo: ITokenRepository,
    private readonly githubRepo: IGitHubRepository
  ) {}

  async execute(
    username: string,
    token: string,
    consentAccepted: boolean,
    ip: string,
    userAgent: string
  ): Promise<{ message: string }> {
    const isComingSoon = process.env.PRIVATE_STATS_COMING_SOON !== 'false';
    if (isComingSoon) {
      throw new Error('Esta característica no está disponible temporalmente (Coming Soon).');
    }

    if (consentAccepted !== true) {
      throw new Error('Debes aceptar los términos y condiciones de almacenamiento de datos.');
    }

    const validation = await validateTokenScopes(token);
    if (!validation.valid) {
      throw new Error(validation.reason || 'Token de GitHub inválido o con demasiados permisos.');
    }

    const { encryptedToken, iv } = encryptToken(token);
    const fingerprint = generateConsentFingerprint(ip, userAgent);
    const consentDate = new Date().toISOString();

    await this.tokenRepo.saveToken(
      username,
      encryptedToken,
      iv,
      consentAccepted,
      consentDate,
      fingerprint
    );

    // Clear caches to force reloading with the new private token
    this.githubRepo.clearCache(username);

    return {
      message:
        'Token registrado exitosamente. Tus estadísticas privadas ahora se incluirán en tus tarjetas.'
    };
  }
}
