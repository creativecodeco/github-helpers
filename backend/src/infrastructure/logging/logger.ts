export type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

/**
 * Sanitizes potentially sensitive keys (tokens, secrets, authorizations) from metadata objects.
 */
function sanitizeMetadata(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('token') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('authorization') ||
      lowerKey.includes('password')
    ) {
      sanitized[key] = '[REDACTED]';
    } else if (value instanceof Error) {
      sanitized[key] = {
        name: value.name,
        message: value.message,
        stack: value.stack
      };
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function formatAndOutput(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const isProd = process.env.NODE_ENV === 'production';
  const cleanMeta = sanitizeMetadata(meta);
  const timestamp = new Date().toISOString();

  if (isProd) {
    const payload: LogPayload = {
      timestamp,
      level,
      message,
      ...cleanMeta
    };
    const jsonStr = JSON.stringify(payload);
    if (level === 'error') {
      console.error(jsonStr);
    } else if (level === 'warn') {
      console.warn(jsonStr);
    } else {
      console.log(jsonStr);
    }
  } else {
    const metaStr = cleanMeta && Object.keys(cleanMeta).length > 0 ? ` ${JSON.stringify(cleanMeta)}` : '';
    const formatted = `[${timestamp}] [${level.toUpperCase()}]: ${message}${metaStr}`;
    if (level === 'error') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    formatAndOutput('info', message, meta);
  },
  warn(message: string, meta?: Record<string, unknown>) {
    formatAndOutput('warn', message, meta);
  },
  error(message: string, meta?: Record<string, unknown>) {
    formatAndOutput('error', message, meta);
  }
};

/**
 * Middleware helper to record structured HTTP access logs.
 */
export function requestLoggerMiddleware(req: any, res: any, next: () => void) {
  const url = req.originalUrl || req.url || '';
  if (!url.startsWith('/api') && url !== '/health') {
    return next();
  }

  const startMs = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startMs;
    const statusCode = res.statusCode;

    const logMeta = {
      method: req.method,
      url,
      status: statusCode,
      duration_ms: durationMs,
      user_agent: (typeof req.get === 'function' ? req.get('user-agent') : req.headers?.['user-agent']) || 'unknown'
    };

    if (statusCode >= 500) {
      logger.error(`HTTP ${req.method} ${url} ${statusCode}`, logMeta);
    } else if (statusCode >= 400) {
      logger.warn(`HTTP ${req.method} ${url} ${statusCode}`, logMeta);
    } else {
      logger.info(`HTTP ${req.method} ${url} ${statusCode}`, logMeta);
    }
  });

  next();
}
