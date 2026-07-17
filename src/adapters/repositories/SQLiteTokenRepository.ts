import { ITokenRepository } from '@/domain/repositories/ITokenRepository';
import { UserToken } from '@/domain/entities/UserToken';
import { db } from '@/infrastructure/database/database';

export class SQLiteTokenRepository implements ITokenRepository {
  async saveToken(
    username: string,
    encryptedToken: string,
    iv: string,
    consentAccepted: boolean,
    consentDate: string,
    consentFingerprint: string
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      db.serialize(() => {
        db.run(
          `
          INSERT INTO user_tokens (username, encrypted_token, iv, consent_accepted, consent_date, consent_fingerprint, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(username) DO UPDATE SET
            encrypted_token = ?,
            iv = ?,
            consent_accepted = ?,
            consent_date = ?,
            consent_fingerprint = ?,
            updated_at = CURRENT_TIMESTAMP
        `,
          [
            username.toLowerCase(),
            encryptedToken,
            iv,
            consentAccepted ? 1 : 0,
            consentDate,
            consentFingerprint,
            encryptedToken,
            iv,
            consentAccepted ? 1 : 0,
            consentDate,
            consentFingerprint
          ],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    });
  }

  async getToken(username: string): Promise<UserToken | null> {
    return new Promise<UserToken | null>((resolve, reject) => {
      db.get(
        'SELECT * FROM user_tokens WHERE username = ?',
        [username.toLowerCase()],
        (err, row: any) => {
          if (err) reject(err);
          else resolve(row || null);
        }
      );
    });
  }

  async deleteToken(username: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      db.serialize(() => {
        db.run('DELETE FROM user_tokens WHERE username = ?', [username.toLowerCase()], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }
}
