import { ITokenRepository } from '@/domain/repositories/ITokenRepository';
import { UserToken } from '@/domain/entities/UserToken';
import { AppDataSource } from '@/infrastructure/database/database';
import { UserTokenEntity } from '@/infrastructure/database/entities/UserTokenEntity';

export class TypeORMTokenRepository implements ITokenRepository {
  async saveToken(
    username: string,
    encryptedToken: string,
    iv: string,
    consentAccepted: boolean,
    consentDate: string,
    consentFingerprint: string
  ): Promise<void> {
    try {
      const tokenRepo = AppDataSource.getRepository(UserTokenEntity);
      
      await tokenRepo
        .createQueryBuilder()
        .insert()
        .values({
          username: username.toLowerCase(),
          encrypted_token: encryptedToken,
          iv,
          consent_accepted: consentAccepted,
          consent_date: new Date(consentDate),
          consent_fingerprint: consentFingerprint
        })
        .orUpdate(
          ['encrypted_token', 'iv', 'consent_accepted', 'consent_date', 'consent_fingerprint', 'updated_at'],
          ['username']
        )
        .execute();
    } catch (err) {
      console.error(`Error saving token for user ${username}:`, err);
      throw err;
    }
  }

  async getToken(username: string): Promise<UserToken | null> {
    try {
      const tokenRepo = AppDataSource.getRepository(UserTokenEntity);
      const entity = await tokenRepo.findOneBy({ username: username.toLowerCase() });
      if (!entity) return null;

      return {
        username: entity.username,
        encrypted_token: entity.encrypted_token,
        iv: entity.iv,
        consent_accepted: entity.consent_accepted ? 1 : 0, // Map boolean to number (1/0) for domain compatibility
        consent_date: entity.consent_date.toISOString(),
        consent_fingerprint: entity.consent_fingerprint,
        updated_at: entity.updated_at.toISOString()
      };
    } catch (err) {
      console.error(`Error getting token for user ${username}:`, err);
      return null;
    }
  }

  async deleteToken(username: string): Promise<void> {
    try {
      const tokenRepo = AppDataSource.getRepository(UserTokenEntity);
      await tokenRepo.delete({ username: username.toLowerCase() });
    } catch (err) {
      console.error(`Error deleting token for user ${username}:`, err);
      throw err;
    }
  }
}
