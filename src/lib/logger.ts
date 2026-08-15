type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const LOG_LEVELS: LogLevel[] = ['error', 'warn', 'info', 'debug'];

// Peut être ajusté selon l'environnement (ex: 'info' en prod, 'debug' en dev)
const CURRENT_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

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

export function logDebug(...args: unknown[]) {
  if (shouldLog('debug')) {
    console.debug('[DEBUG]', ...args);
  }
} 