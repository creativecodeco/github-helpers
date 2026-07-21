export interface UserToken {
  username: string;
  encrypted_token: string;
  iv: string;
  consent_accepted: number;
  consent_date: string;
  consent_fingerprint: string;
  updated_at?: string;
}
