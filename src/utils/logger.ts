import winston from 'winston';
import path from 'path';
import fs from 'fs/promises';

// Crear directorio de logs si no existe
const logDir = path.dirname(process.env.LOG_FILE || './logs/app.log');

// Función async para crear directorio si no existe
const ensureLogDirectory = async () => {
  try {
    await fs.access(logDir);
  } catch {
    await fs.mkdir(logDir, { recursive: true });
  }
};

// Crear directorio de logs
ensureLogDirectory().catch(console.error);

// Configuración de niveles personalizados
const customLevels = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
};

// Colores para consola
const customColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  verbose: 'cyan',
  debug: 'blue',
};

winston.addColors(customColors);

// Formato personalizado para archivos
const fileFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(
    ({
      timestamp,
      level,
      message,
      service,
      category,
      sessionId,
      operation,
      duration,
      ...meta
    }) => {
      return JSON.stringify({
        timestamp,
        level,
        service,
        category,
        sessionId,
        operation,
        duration,
        message,
        ...meta,
      });
    }
  )
);

// Formato personalizado para consola
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    ({
      timestamp,
      level,
      message,
      service,
      category,
      sessionId,
      operation,
      duration,
      ...meta
    }) => {
      const categoryStr = category ? `[${category}]` : '';
      const sessionStr = sessionId ? `[${sessionId}]` : '';
      const operationStr = operation ? `[${operation}]` : '';
      const durationStr = duration ? `(${duration}ms)` : '';
      const metaStr =
        Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
      return `${timestamp} ${level} ${categoryStr}${sessionStr}${operationStr} ${message}${durationStr}${metaStr}`;
    }
  )
);

const logger = winston.createLogger({
  levels: customLevels,
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: 'excel-processor',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: [
    // Archivo de logs general
    new winston.transports.File({
      filename: process.env.LOG_FILE || './logs/app.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: fileFormat,
    }),
    // Archivo de errores
    new winston.transports.File({
      filename:
        process.env.LOG_FILE?.replace('.log', '.error.log') ||
        './logs/app.error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: fileFormat,
    }),
    // Archivo de logs de rendimiento
    new winston.transports.File({
      filename:
        process.env.LOG_FILE?.replace('.log', '.performance.log') ||
        './logs/app.performance.log',
      level: 'verbose',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
      format: fileFormat,
    }),
  ],
});

// Agregar console transport en desarrollo
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Clase para logging estructurado
export class StructuredLogger {
  private sessionId: string;
  private category: string;

  constructor(category: string, sessionId?: string) {
    this.category = category;
    this.sessionId = sessionId || this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  info(message: string, meta?: any) {
    logger.info(message, {
      category: this.category,
      sessionId: this.sessionId,
      ...meta,
    });
  }

  error(message: string, error?: any, meta?: any) {
    logger.error(message, {
      category: this.category,
      sessionId: this.sessionId,
      error: error?.message || error,
      stack: error?.stack,
      ...meta,
    });
  }

  warn(message: string, meta?: any) {
    logger.warn(message, {
      category: this.category,
      sessionId: this.sessionId,
      ...meta,
    });
  }

  verbose(message: string, meta?: any) {
    logger.verbose(message, {
      category: this.category,
      sessionId: this.sessionId,
      ...meta,
    });
  }

  debug(message: string, meta?: any) {
    logger.debug(message, {
      category: this.category,
      sessionId: this.sessionId,
      ...meta,
    });
  }

  // Método para logging de rendimiento
  performance(operation: string, duration: number, meta?: any) {
    logger.verbose(`Performance: ${operation}`, {
      category: this.category,
      sessionId: this.sessionId,
      operation,
      duration,
      ...meta,
    });
  }

  // Método para logging de métricas
  metrics(metricName: string, value: number, unit?: string, meta?: any) {
    logger.info(`Metric: ${metricName}`, {
      category: this.category,
      sessionId: this.sessionId,
      metricName,
      value,
      unit,
      ...meta,
    });
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

export default logger;
