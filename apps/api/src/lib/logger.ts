import winston from 'winston';

const { combine, timestamp, json, errors } = winston.format;

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'ezzi-api' },
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'development'
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        : undefined,
    }),
  ],
});

// Convenience methods
export const logError = (message: string, error: unknown, meta?: Record<string, unknown>) => {
  logger.error({
    message,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...meta,
  });
};

export const logInfo = (message: string, meta?: Record<string, unknown>) => {
  logger.info({ message, ...meta });
};

export const logWarn = (message: string, meta?: Record<string, unknown>) => {
  logger.warn({ message, ...meta });
};

export const logDebug = (message: string, meta?: Record<string, unknown>) => {
  logger.debug({ message, ...meta });
};
