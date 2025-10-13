/**
 * Logger utility for development and production environments
 * Only logs detailed information in development mode
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Debug logs - only shown in development
   */
  debug: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, data !== undefined ? data : '');
    }
  },

  /**
   * Info logs - only shown in development
   */
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, data !== undefined ? data : '');
    }
  },

  /**
   * Warning logs - always shown but sanitized in production
   */
  warn: (message: string, data?: any) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, data);
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },

  /**
   * Error logs - always shown but sanitized in production
   */
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error);
    } else {
      // In production, only log the message and error type, not full details
      const errorMessage = error?.message || 'Unknown error';
      console.error(`[ERROR] ${message}: ${errorMessage}`);
    }
  },

  /**
   * Success logs - only shown in development
   */
  success: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[SUCCESS] ✅ ${message}`, data !== undefined ? data : '');
    }
  },
};
