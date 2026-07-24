import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, requestLoggerMiddleware } from '../src/infrastructure/logging/logger';
import type { Request, Response } from 'express';

describe('Logger Module', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should format info logs correctly', () => {
    logger.info('Server started', { port: 3000 });
    expect(consoleLogSpy).toHaveBeenCalledOnce();
    const logOutput = consoleLogSpy.mock.calls[0][0];
    expect(logOutput).toContain('Server started');
    expect(logOutput).toContain('3000');
  });

  it('should redact sensitive keys like token and password', () => {
    logger.warn('Token operation', { token: 'secret-token-123', username: 'john' });
    expect(consoleWarnSpy).toHaveBeenCalledOnce();
    const logOutput = consoleWarnSpy.mock.calls[0][0];
    expect(logOutput).toContain('[REDACTED]');
    expect(logOutput).not.toContain('secret-token-123');
    expect(logOutput).toContain('john');
  });

  it('should log error payloads correctly', () => {
    logger.error('Database query failed', { error: 'Connection lost' });
    expect(consoleErrorSpy).toHaveBeenCalledOnce();
    const logOutput = consoleErrorSpy.mock.calls[0][0];
    expect(logOutput).toContain('Database query failed');
  });

  it('should log HTTP requests with requestLoggerMiddleware', () => {
    const listeners: Record<string, () => void> = {};
    const req = {
      originalUrl: '/api/stats',
      method: 'GET',
      get: () => 'TestAgent'
    } as unknown as Request;

    const res = {
      statusCode: 200,
      on: (event: string, cb: () => void) => {
        listeners[event] = cb;
      }
    } as unknown as Response;

    const next = vi.fn();

    requestLoggerMiddleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();

    // Trigger response finish event
    listeners['finish']();
    expect(consoleLogSpy).toHaveBeenCalledOnce();
    expect(consoleLogSpy.mock.calls[0][0]).toContain('HTTP GET /api/stats 200');
  });
});
