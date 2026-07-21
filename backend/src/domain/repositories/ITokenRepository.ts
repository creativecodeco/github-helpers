import { UserToken } from '../entities/UserToken';

export interface ITokenRepository {
  saveToken(
    username: string,
    encryptedToken: string,
    iv: string,
    consentAccepted: boolean,
    consentDate: string,
    consentFingerprint: string
  ): Promise<void>;
  getToken(username: string): Promise<UserToken | null>;
  deleteToken(username: string): Promise<void>;
}
