type LogLevel = 'info' | 'warn' | 'error';

const LOG_LEVELS: LogLevel[] = ['error', 'warn', 'info'];

const CURRENT_LEVEL: LogLevel = 'info';

function shouldLog(level: LogLevel) {
  return LOG_LEVELS.indexOf(level) <= LOG_LEVELS.indexOf(CURRENT_LEVEL);
}

export function logInfo(...args: unknown[]) {
  if (shouldLog('info')) {
    console.info('[INFO]', ...args);
  }
}

export function logWarn(...args: unknown[]) {
  if (shouldLog('warn')) {
    console.warn('[WARN]', ...args);
  }
}

export function logError(...args: unknown[]) {
  if (shouldLog('error')) {
    console.error('[ERROR]', ...args);
  }
}