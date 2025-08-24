import dotenv from 'dotenv';
import path from 'path';

// Determinar el directorio del ejecutable
function getExecutableDir(): string {
  if ((process as any).pkg) {
    // Si es ejecutable, usar el directorio donde está el ejecutable
    return path.dirname(process.execPath);
  }
  // Si no es ejecutable, usar el directorio actual
  return process.cwd();
}

// Cargar variables de entorno desde archivo .env en el directorio del ejecutable
dotenv.config({ path: path.join(getExecutableDir(), '.env') });

// Función para obtener valor de variable de entorno con valor por defecto
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value !== undefined) {
    return value;
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`Variable de entorno requerida: ${key}`);
}

// Función para obtener valor numérico de variable de entorno
function getEnvVarNumber(key: string, defaultValue?: number): number {
  const value = getEnvVar(key, defaultValue?.toString());
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Variable de entorno ${key} debe ser un número válido`);
  }
  return num;
}

// Función para obtener valor booleano de variable de entorno
function getEnvVarBoolean(key: string, defaultValue?: boolean): boolean {
  const value = getEnvVar(key, defaultValue?.toString());
  return value.toLowerCase() === 'true';
}

// Configuración de la aplicación
export const config = {
  // Configuración de Directorios
  directories: {
    excel: getEnvVar('EXCEL_DIRECTORY', './excel-files'),
    processed: getEnvVar('PROCESSED_DIRECTORY', './processed-files'),
    error: getEnvVar('ERROR_DIRECTORY', './error-files'),
    logs: getEnvVar('LOG_FILE', './logs/app.log'),
  },

  // Configuración de Logs
  logging: {
    level: getEnvVar('LOG_LEVEL', 'info'),
    file: getEnvVar('LOG_FILE', './logs/app.log'),
    enableConsole: getEnvVarBoolean('LOG_ENABLE_CONSOLE', true),
    enablePerformance: getEnvVarBoolean('LOG_ENABLE_PERFORMANCE', true),
    maxSize: getEnvVarNumber('LOG_MAX_SIZE', 5242880), // 5MB
    maxFiles: getEnvVarNumber('LOG_MAX_FILES', 5),
    retentionDays: getEnvVarNumber('LOG_RETENTION_DAYS', 30),
  },

  // Configuración del Procesamiento
  processing: {
    batchSize: getEnvVarNumber('BATCH_SIZE', 100),
  },

  // Configuración de la API REST
  api: {
    baseURL: getEnvVar('API_BASE_URL', 'http://localhost:3000/api'),
    apiKey: getEnvVar('API_KEY', ''),
    timeout: getEnvVarNumber('API_TIMEOUT', 30000),
    retryAttempts: getEnvVarNumber('API_RETRY_ATTEMPTS', 3),
  },

  // Configuración del ejecutable
  executable: {
    // Determinar si estamos ejecutando como binario
    isExecutable: (process as any).pkg !== undefined,
    // Obtener directorio de trabajo del ejecutable
    getWorkingDir: (): string => {
      if ((process as any).pkg) {
        // Si es ejecutable, usar el directorio donde está el ejecutable
        return path.dirname(process.execPath);
      }
      // Si no es ejecutable, usar el directorio actual
      return process.cwd();
    },
  },
};

// Función para validar la configuración
export function validateConfig(): void {
  const requiredDirs = [
    config.directories.excel,
    config.directories.processed,
    config.directories.error,
    path.dirname(config.directories.logs),
  ];

  console.log('🔧 Configuración cargada:');
  console.log(`📁 Directorio de trabajo: ${config.executable.getWorkingDir()}`);

  console.log(`🌐 API REST: ${config.api.baseURL}`);
  console.log(`📊 Tamaño de lote: ${config.processing.batchSize}`);
}

// Función para crear directorios necesarios
export function createRequiredDirectories(): void {
  const fs = require('fs');
  const path = require('path');

  const dirs = [
    config.directories.excel,
    config.directories.processed,
    config.directories.error,
    path.dirname(config.directories.logs),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Directorio creado: ${dir}`);
    }
  });
}
