import winston from 'winston';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config/config';

// Crear directorio de logs si no existe
const logDir = path.dirname(config.logging.file);

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

// Clase para manejar la limpieza automática de consola
class ConsoleCleaner {
  private logCount: number = 0;
  private maxLogsBeforeClean: number;
  private cleanInterval: number; // en milisegundos
  private lastCleanTime: number = Date.now();
  private isCleaning: boolean = false;
  private intervalId?: NodeJS.Timeout;

  constructor(maxLogsBeforeClean: number = 100, cleanInterval: number = 30000) {
    this.maxLogsBeforeClean = maxLogsBeforeClean;
    this.cleanInterval = cleanInterval;
    this.startCleanupInterval();
  }

  // Incrementar contador de logs
  incrementLogCount(): void {
    this.logCount++;

    // Verificar si es momento de limpiar
    if (this.shouldCleanConsole() && !this.isCleaning) {
      this.cleanConsole();
    }
  }

  private shouldCleanConsole(): boolean {
    const now = Date.now();
    const timeSinceLastClean = now - this.lastCleanTime;

    // Limpiar si han pasado muchos logs o mucho tiempo
    return (
      this.logCount >= this.maxLogsBeforeClean ||
      timeSinceLastClean >= this.cleanInterval
    );
  }

  private cleanConsole(): void {
    this.isCleaning = true;

    try {
      // Limpiar la terminal
      if (process.stdout.isTTY) {
        // Usar códigos ANSI para limpiar la terminal
        process.stdout.write('\x1B[2J\x1B[0f');
      } else {
        // Fallback: imprimir líneas en blanco
        console.log('\n'.repeat(50));
      }

      // Imprimir mensaje de limpieza
      const timestamp = new Date().toLocaleTimeString();
      console.log(`\n🧹 Terminal limpiada automáticamente - ${timestamp}`);
      console.log(
        `📊 Logs procesados: ${this.logCount} | Archivos de log preservados\n`
      );

      // Resetear contadores
      this.logCount = 0;
      this.lastCleanTime = Date.now();
    } catch (error) {
      console.error('Error al limpiar terminal:', error);
    } finally {
      this.isCleaning = false;
    }
  }

  private startCleanupInterval(): void {
    // Limpiar por tiempo cada cierto intervalo
    this.intervalId = setInterval(() => {
      if (this.logCount > 0 && !this.isCleaning) {
        this.cleanConsole();
      }
    }, this.cleanInterval);
  }

  // Método público para limpiar manualmente
  public manualClean(): void {
    this.cleanConsole();
  }

  // Método para obtener estadísticas
  public getStats(): { logCount: number; lastCleanTime: number } {
    return {
      logCount: this.logCount,
      lastCleanTime: this.lastCleanTime,
    };
  }

  // Método para detener la limpieza automática
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  // Método para configurar parámetros
  public configure(maxLogs?: number, interval?: number): void {
    if (maxLogs !== undefined) {
      this.maxLogsBeforeClean = maxLogs;
    }
    if (interval !== undefined) {
      this.cleanInterval = interval;
      // Reiniciar el intervalo con la nueva configuración
      this.stop();
      this.startCleanupInterval();
    }
  }
}

const logger = winston.createLogger({
  levels: customLevels,
  level: config.logging.level,
  defaultMeta: {
    service: 'excel-processor',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: [
    // Archivo de logs general
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      format: fileFormat,
    }),
    // Archivo de errores
    new winston.transports.File({
      filename: config.logging.file.replace('.log', '.error.log'),
      level: 'error',
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      format: fileFormat,
    }),
  ],
});

// Agregar console transport normal
logger.add(
  new winston.transports.Console({
    format: consoleFormat,
  })
);

// Crear instancia del limpiador de consola
const consoleCleanerInstance = new ConsoleCleaner(
  config.console.maxLogsBeforeClean,
  config.console.cleanInterval
);

// Configurar el limpiador de consola para que funcione con el transport normal
// El limpiador se ejecutará automáticamente basado en el tiempo y contador

// Agregar archivo de rendimiento siempre
logger.add(
  new winston.transports.File({
    filename: config.logging.file.replace('.log', '.performance.log'),
    level: 'verbose',
    maxsize: config.logging.maxSize,
    maxFiles: Math.min(config.logging.maxFiles, 3),
    format: fileFormat,
  })
);

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

// Exportar funciones para control manual de la limpieza
export const consoleCleaner = {
  // Limpiar terminal manualmente
  cleanNow: () => {
    consoleCleanerInstance.manualClean();
  },

  // Obtener estadísticas de limpieza
  getStats: () => {
    return consoleCleanerInstance.getStats();
  },

  // Configurar parámetros de limpieza
  configure: (maxLogs?: number, interval?: number) => {
    consoleCleanerInstance.configure(maxLogs, interval);
  },

  // Detener la limpieza automática
  stop: () => {
    consoleCleanerInstance.stop();
  },
};

export default logger;
