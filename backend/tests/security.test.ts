import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  encryptToken,
  decryptToken,
  generateConsentFingerprint,
  validateTokenScopes
} from '@/infrastructure/security/security';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('security.ts tests', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 64 hex characters (32 bytes)
  });

  it('should encrypt and decrypt a token correctly', () => {
    const originalToken = 'ghp_testToken12345';
    const { encryptedToken, iv } = encryptToken(originalToken);

    expect(encryptedToken).toBeDefined();
    expect(iv).toBeDefined();
    expect(encryptedToken).toContain(':');

    const decrypted = decryptToken(encryptedToken, iv);
    expect(decrypted).toBe(originalToken);
  });

  it('should generate consent fingerprint consistently', () => {
    const ip = '127.0.0.1';
    const ua = 'Mozilla/5.0';
    const fingerprint1 = generateConsentFingerprint(ip, ua);
    const fingerprint2 = generateConsentFingerprint(ip, ua);

    expect(fingerprint1).toBe(fingerprint2);
    expect(fingerprint1).toHaveLength(64); // SHA-256 hex length
  });

  it('should reject token with dangerous scopes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name === 'x-oauth-scopes') return 'repo, write:org';
          return null;
        }
      },
      json: async () => ({ login: 'testuser' })
    });

    const result = await validateTokenScopes('ghp_dangerous');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('permisos de escritura o administración');
  });

  it('should accept read-only metadata token', async () => {
    // 1. mock profile response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name === 'x-oauth-scopes') return '';
          return null;
        }
      },
      json: async () => ({ login: 'testuser' })
    });

    // 2. mock probe repos POST request response (returns 403 Forbidden since it has no write scopes)
    mockFetch.mockResolvedValueOnce({
      status: 403,
      ok: false,
      json: async () => ({ message: 'Forbidden' })
    });

    const result = await validateTokenScopes('ghp_readonly');
    expect(result.valid).toBe(true);
  });

  it('should reject token that has repo creation permission (returns 422)', async () => {
    // 1. mock profile response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name === 'x-oauth-scopes') return '';
          return null;
        }
      },
      json: async () => ({ login: 'testuser' })
    });

    // 2. mock probe repos POST request response (returns 422 Unprocessable Entity since it got past authorization and failed on body validation)
    mockFetch.mockResolvedValueOnce({
      status: 422,
      ok: false,
      json: async () => ({ message: 'Validation failed' })
    });

    const result = await validateTokenScopes('ghp_haswrite');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('permisos de creación/escritura');
  });
});
