import { DataSource } from 'typeorm';
import { Licitacion } from '../entities/Licitacion';
import { config } from './config';
import logger from '../utils/logger';

// Configuración de retry
const RETRY_CONFIG = {
  maxAttempts: parseInt(process.env.DB_RETRY_MAX_ATTEMPTS || '5'),
  initialDelay: parseInt(process.env.DB_RETRY_INITIAL_DELAY || '1000'),
  maxDelay: parseInt(process.env.DB_RETRY_MAX_DELAY || '30000'),
  backoffMultiplier: parseFloat(process.env.DB_RETRY_BACKOFF_MULTIPLIER || '2'),
};

// Función para calcular delay con backoff exponencial
function calculateDelay(attempt: number): number {
  const delay =
    RETRY_CONFIG.initialDelay *
    Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
}

// Función para esperar un tiempo específico
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  entities: [Licitacion],
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  ssl: false,

  // Configuración de pool de conexiones (MySQL2 compatible)
  extra: {
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '30000'),
    // Opciones de reconexión modernas para MySQL2
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  },

  // Configuración de timeouts
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '30000'),

  // Configuración de logging detallado
  logger:
    process.env.NODE_ENV === 'development'
      ? 'advanced-console'
      : 'simple-console',
});

/**
 * Inicializa la base de datos con lógica de retry robusta
 */
export const initializeDatabase = async (): Promise<void> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      logger.info(
        `🔄 Intento ${attempt}/${RETRY_CONFIG.maxAttempts} de conexión a la base de datos`,
        {
          host: config.database.host,
          port: config.database.port,
          database: config.database.database,
          attempt,
          maxAttempts: RETRY_CONFIG.maxAttempts,
        }
      );

      // Intentar inicializar la conexión
      await AppDataSource.initialize();

      // Verificar que la conexión está activa
      await AppDataSource.query('SELECT 1 as health_check');

      logger.info('✅ Base de datos conectada exitosamente', {
        host: config.database.host,
        port: config.database.port,
        database: config.database.database,
        attempt,
        connectionId: AppDataSource.options.name || 'default',
      });

      console.log('✅ Base de datos conectada exitosamente');
      return;
    } catch (error) {
      lastError = error as Error;

      logger.error(
        `❌ Error en intento ${attempt}/${RETRY_CONFIG.maxAttempts} de conexión a la base de datos`,
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          host: config.database.host,
          port: config.database.port,
          database: config.database.database,
          attempt,
          maxAttempts: RETRY_CONFIG.maxAttempts,
        }
      );

      // Si es el último intento, no esperar
      if (attempt === RETRY_CONFIG.maxAttempts) {
        break;
      }

      // Calcular delay para el siguiente intento
      const delay = calculateDelay(attempt);

      logger.info(`⏳ Esperando ${delay}ms antes del siguiente intento`, {
        attempt,
        nextAttempt: attempt + 1,
        delay,
        maxDelay: RETRY_CONFIG.maxDelay,
      });

      console.log(
        `⏳ Reintentando en ${delay}ms... (${attempt}/${RETRY_CONFIG.maxAttempts})`
      );

      // Esperar antes del siguiente intento
      await sleep(delay);
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  const errorMessage = `❌ Falló la conexión a la base de datos después de ${RETRY_CONFIG.maxAttempts} intentos`;

  logger.error(errorMessage, {
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    maxAttempts: RETRY_CONFIG.maxAttempts,
    lastError: lastError?.message,
    stack: lastError?.stack,
  });

  console.error(errorMessage);
  console.error('❌ Último error:', lastError?.message);

  throw new Error(`${errorMessage}: ${lastError?.message}`);
};

/**
 * Verifica el estado de la conexión a la base de datos
 */
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    if (!AppDataSource.isInitialized) {
      logger.warn('Base de datos no inicializada');
      return false;
    }

    await AppDataSource.query('SELECT 1 as health_check');
    logger.debug('Verificación de conexión a BD exitosa');
    return true;
  } catch (error) {
    logger.error('Error verificando conexión a BD', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};

/**
 * Cierra la conexión a la base de datos de forma segura
 */
export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('✅ Conexión a la base de datos cerrada exitosamente');
      console.log('✅ Conexión a la base de datos cerrada exitosamente');
    }
  } catch (error) {
    logger.error('Error cerrando conexión a BD', {
      error: error instanceof Error ? error.message : String(error),
    });
    console.error('❌ Error cerrando conexión a BD:', error);
  }
};

/**
 * Ejecuta una operación con retry automático
 */
export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  operationName: string = 'database_operation'
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Verificar conexión antes de ejecutar
      if (!(await checkDatabaseConnection())) {
        throw new Error('Conexión a BD no disponible');
      }

      logger.debug(
        `Ejecutando ${operationName} (intento ${attempt}/${maxRetries})`
      );
      return await operation();
    } catch (error) {
      lastError = error as Error;

      logger.warn(
        `Error en ${operationName} (intento ${attempt}/${maxRetries})`,
        {
          error: error instanceof Error ? error.message : String(error),
          operationName,
          attempt,
          maxRetries,
        }
      );

      // Si es el último intento, no esperar
      if (attempt === maxRetries) {
        break;
      }

      // Esperar antes del siguiente intento
      const delay = calculateDelay(attempt);
      await sleep(delay);
    }
  }

  logger.error(`Falló ${operationName} después de ${maxRetries} intentos`, {
    operationName,
    maxRetries,
    lastError: lastError?.message,
  });

  throw new Error(
    `${operationName} falló después de ${maxRetries} intentos: ${lastError?.message}`
  );
};
