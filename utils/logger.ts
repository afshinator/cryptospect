// utils/logger.ts

/**
 * Debug levels for logging
 * - 'none': No logs (only errors)
 * - 'warn': Warnings and errors only (default)
 * - 'info': Info, warnings, and errors
 * - 'debug': All logs including debug messages
 */
export type DebugLevel = 'none' | 'warn' | 'info' | 'debug';

/**
 * Log method types
 */
export type LogMethod = 'log' | 'warn' | 'error';

/**
 * Logger configuration
 */
interface LoggerConfig {
  /** Current debug level */
  level: DebugLevel;
}

/**
 * Global logger configuration
 * Default level is 'warn' (only warnings and errors are shown)
 */
let loggerConfig: LoggerConfig = {
  level: 'info',
};

/**
 * Set the global debug level
 */
export function setDebugLevel(level: DebugLevel): void {
  loggerConfig.level = level;
}

/**
 * Get the current debug level
 */
export function getDebugLevel(): DebugLevel {
  return loggerConfig.level;
}

/**
 * Check if a log should be displayed based on the current debug level and method
 */
function shouldLog(method: LogMethod, level: DebugLevel): boolean {
  // Errors are always shown
  if (method === 'error') {
    return true;
  }

  // Warnings are shown if level is 'warn', 'info', or 'debug'
  if (method === 'warn') {
    return level === 'warn' || level === 'info' || level === 'debug';
  }

  // Logs (info) are shown if level is 'info' or 'debug'
  if (method === 'log') {
    return level === 'info' || level === 'debug';
  }

  return false;
}

/**
 * Logger function that respects debug levels
 * 
 * @param message - The message to log
 * @param method - The console method to use ('log', 'warn', or 'error'). Default: 'log'
 * @param debugLevel - Optional override for this specific log. If not provided, uses global level.
 * @param ...args - Additional arguments to pass to the console method (like console.log supports)
 * 
 * @example
 * ```ts
 * logger('This is a log message'); // Uses console.log, respects global debug level
 * logger('This is a warning', 'warn'); // Uses console.warn
 * logger('This is an error', 'error'); // Uses console.error (always shown)
 * logger('Debug message', 'log', 'debug'); // Only shown if global level is 'debug'
 * logger('Data:', 'log', undefined, { key: 'value' }); // Pass additional arguments
 * ```
 */
export function logger(
  message: string,
  method: LogMethod = 'log',
  debugLevel?: DebugLevel,
  ...args: any[]
): void {
  const effectiveLevel = debugLevel ?? loggerConfig.level;

  // Check if this log should be displayed
  if (!shouldLog(method, effectiveLevel)) {
    return;
  }

  // Output to the appropriate console method with additional arguments
  switch (method) {
    case 'warn':
      console.warn(message, ...args);
      break;
    case 'error':
      console.error(message, ...args);
      break;
    case 'log':
    default:
      console.log(message, ...args);
      break;
  }
}

