import crypto from 'node:crypto';
import { ITokenRepository } from '@/domain/repositories/ITokenRepository';
import { logger } from '@/infrastructure/logging/logger';

const ALGORITHM = 'aes-256-gcm';

/**
 * Compare two strings in constant time to prevent timing attacks
 */
export function safeTimingEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

// Derive a secure 32-byte key from the environment variable
function getEncryptionKey(): Buffer {
  const rawKey = process.env.ENCRYPTION_KEY;
  if (!rawKey || rawKey === 'default-fallback-key-change-me-in-production-creativecode') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL SECURITY ERROR: ENCRYPTION_KEY environment variable is not defined or is using default fallback in production mode.'
      );
    }
  }
  const keyToUse = rawKey || 'default-fallback-key-change-me-in-production-creativecode';
  return crypto.createHash('sha256').update(keyToUse).digest();
}

/**
 * Encrypt a GitHub Personal Access Token using AES-256-GCM
 */
export function encryptToken(token: string): { encryptedToken: string; iv: string } {
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encryptedToken: `${encrypted}:${authTag}`,
    iv: iv.toString('hex')
  };
}

/**
 * Decrypt a GitHub Personal Access Token using AES-256-GCM
 */
export function decryptToken(encryptedText: string, ivHex: string): string {
  const [encrypted, authTagHex] = encryptedText.split(':');
  if (!encrypted || !authTagHex) {
    throw new Error('Formato de token cifrado inválido.');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const key = getEncryptionKey();
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate a secure fingerprint for consent audit based on client IP and User-Agent
 */
export function generateConsentFingerprint(
  ip: string = 'unknown-ip',
  userAgent: string = 'unknown-ua'
): string {
  return crypto.createHash('sha256').update(`${ip || 'unknown-ip'}-${userAgent || 'unknown-ua'}`).digest('hex');
}

/**
 * Validate that the provided token is valid and does not have dangerous write/admin permissions
 */
export async function validateTokenScopes(
  token: string
): Promise<{ valid: boolean; reason?: string }> {
  try {
    // 1. Verify token validity by requesting user profile info
    const profileRes = await fetch('https://api.github.com/user', {
      headers: {
        'User-Agent': 'github-helpers-security',
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${token}`
      }
    });

    if (!profileRes.ok) {
      if (profileRes.status === 401) {
        return { valid: false, reason: 'El token proporcionado no es válido o ha expirado.' };
      }
      return {
        valid: false,
        reason: `GitHub API error (${profileRes.status}): ${profileRes.statusText}`
      };
    }

    // 2. Read scopes header (available for Classic PATs)
    const scopesHeader = profileRes.headers.get('x-oauth-scopes');
    if (scopesHeader) {
      const scopes = scopesHeader.split(',').map((s) => s.trim().toLowerCase());

      const dangerousScopes = new Set([
        'repo',
        'write:repo_hook',
        'write:org',
        'write:public_key',
        'write:repo_gpg_key',
        'admin:org',
        'admin:repo_hook',
        'admin:org_hook',
        'delete_repo'
      ]);

      const hasDangerous = scopes.some(
        (scope) =>
          dangerousScopes.has(scope) ||
          scope.startsWith('write:') ||
          scope.includes('delete') ||
          scope.includes('admin')
      );

      if (hasDangerous) {
        return {
          valid: false,
          reason:
            'El token provisto tiene permisos de escritura o administración peligrosos. Por favor, crea un token con los permisos mínimos requeridos (solo lectura de perfil).'
        };
      }
    }

    // 3. Probing verification (Dry-run) for Fine-Grained PATs (since they don't return scopes header)
    // We attempt a repository creation request (POST /user/repos) with an empty body.
    // - If the token is read-only (Metadata), GitHub will block it at the authorization layer and return 403 Forbidden/404.
    // - If the token has write/create repository permissions, the request gets through authorization and returns 422 Unprocessable Entity (missing 'name').
    const probeRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'User-Agent': 'github-helpers-security',
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${token}`
      },
      body: JSON.stringify({})
    });

    // If it responds with 422, it means the token had authorization to write, which we want to reject
    if (probeRes.status === 422) {
      return {
        valid: false,
        reason:
          'Se detectaron permisos de creación/escritura de repositorios en el token. Por favor, asegúrate de que el token sea de solo lectura.'
      };
    }

    return { valid: true };
  } catch (error) {
    logger.error('Error validating token scopes', { error });
    return {
      valid: false,
      reason: 'Error al comunicarse con la API de GitHub durante la validación.'
    };
  }
}

export async function getDecryptedToken(
  username: string,
  tokenRepo: ITokenRepository
): Promise<string | undefined> {
  try {
    const tokenInfo = await tokenRepo.getToken(username);
    if (tokenInfo) {
      return decryptToken(tokenInfo.encrypted_token, tokenInfo.iv);
    }
  } catch (e) {
    logger.warn(`Could not decrypt token for user ${username}`, { username, error: e });
  }
  return undefined;
}
