import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logLevel = process.env.LOG_LEVEL || 'info';

// Custom format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ` ${JSON.stringify(meta)}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`;
  })
);

// Create logger
export const logger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    }),
    // File output - all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    // File output - errors only
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760,
      maxFiles: 5
    })
  ]
});

// Export log retrieval function
export const getLogs = (options: {
  level?: string;
  limit?: number;
  fromDate?: Date;
}): string[] => {
  const logFile = path.join(logsDir, 'app.log');

  if (!fs.existsSync(logFile)) {
    return [];
  }

  try {
    const content = fs.readFileSync(logFile, 'utf-8');
    let lines = content.split('\n').filter(line => line.trim());

    // Filter by level
    if (options.level) {
      const level = options.level.toLowerCase();
      lines = lines.filter(line =>
        line.toLowerCase().includes(`[${level}]`)
      );
    }

    // Filter by date (simple implementation)
    if (options.fromDate) {
      const dateStr = options.fromDate.toISOString().split('T')[0];
      lines = lines.filter(line => line.includes(dateStr));
    }

    // Limit results
    if (options.limit) {
      lines = lines.slice(-options.limit);
    }

    return lines;
  } catch (error) {
    logger.error('Error reading logs:', error);
    return [];
  }
};

// Export clear logs function
export const clearLogs = (): void => {
  const logFile = path.join(logsDir, 'app.log');
  const errorFile = path.join(logsDir, 'error.log');

  try {
    if (fs.existsSync(logFile)) {
      fs.writeFileSync(logFile, '');
    }
    if (fs.existsSync(errorFile)) {
      fs.writeFileSync(errorFile, '');
    }
    logger.info('Logs cleared');
  } catch (error) {
    logger.error('Error clearing logs:', error);
    throw error;
  }
};
