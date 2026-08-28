// AfriLaunch AI — Structured logging (replaces console.log)
// In production: sends to Sentry (if configured) + console
// In dev: console only

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  userId?: string;
  requestId?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function log(level: LogLevel, message: string, data?: any) {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    data,
  };

  // Console output (structured JSON in production)
  if (process.env.NODE_ENV === 'production') {
    console[level === 'debug' ? 'log' : level](JSON.stringify(entry));
  } else {
    const emoji = { debug: '🔍', info: 'ℹ️', warn: '⚠️', error: '❌' }[level];
    console[level === 'debug' ? 'log' : level](`${emoji} [${level.toUpperCase()}] ${message}`, data ?? '');
  }

  // Sentry integration (if configured)
  if (level === 'error' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    // Sentry.captureException(new Error(message), { extra: data });
    // Uncomment when @sentry/nextjs is installed
  }
}

export const logger = {
  debug: (msg: string, data?: any) => log('debug', msg, data),
  info: (msg: string, data?: any) => log('info', msg, data),
  warn: (msg: string, data?: any) => log('warn', msg, data),
  error: (msg: string, data?: any) => log('error', msg, data),
};
