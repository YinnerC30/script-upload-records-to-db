import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Crear directorio de logs si no existe
const logDir = path.dirname(process.env.LOG_FILE || './logs/app.log');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'excel-processor' },
  transports: [
    // Archivo de logs
    new winston.transports.File({
      filename: process.env.LOG_FILE || './logs/app.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Archivo de errores
    new winston.transports.File({
      filename:
        process.env.LOG_FILE?.replace('.log', '.error.log') ||
        './logs/app.error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Agregar console transport en desarrollo
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;
