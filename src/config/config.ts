import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

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
  // Configuración de Base de Datos
  database: {
    host: getEnvVar('DB_HOST', 'localhost'),
    port: getEnvVarNumber('DB_PORT', 3306),
    username: getEnvVar('DB_USERNAME', 'root'),
    password: getEnvVar('DB_PASSWORD', 'password'),
    database: getEnvVar('DB_DATABASE', 'excel_data'),
  },

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
  console.log(
    `🗄️  Base de datos: ${config.database.host}:${config.database.port}/${config.database.database}`
  );
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

// Función para actualizar el archivo .env
export async function updateEnvFile(
  updates: Record<string, string>
): Promise<void> {
  const envPath = path.join(getExecutableDir(), '.env');

  // Leer el archivo .env actual
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else {
    // Si no existe, crear desde el template
    const examplePath = path.join(getExecutableDir(), 'env.example');
    if (fs.existsSync(examplePath)) {
      envContent = fs.readFileSync(examplePath, 'utf8');
    } else {
      // Crear contenido básico si no hay template
      envContent = `# Configuración de Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=excel_data

# Configuración de Retry y Pool de Conexiones
DB_RETRY_MAX_ATTEMPTS=5
DB_RETRY_INITIAL_DELAY=1000
DB_RETRY_MAX_DELAY=30000
DB_RETRY_BACKOFF_MULTIPLIER=2
DB_CONNECTION_LIMIT=10
DB_CONNECT_TIMEOUT_MS=30000

# Configuración del Directorio de Archivos
EXCEL_DIRECTORY=./excel-files
PROCESSED_DIRECTORY=./processed-files
ERROR_DIRECTORY=./error-files

# Configuración de Logs Mejorada
LOG_LEVEL=info
LOG_FILE=./logs/app.log
LOG_ENABLE_CONSOLE=true
LOG_ENABLE_PERFORMANCE=true
LOG_MAX_SIZE=5242880
LOG_MAX_FILES=5
LOG_RETENTION_DAYS=30

# Configuración del Procesamiento
BATCH_SIZE=100
`;
    }
  }

  // Dividir el contenido en líneas
  const lines = envContent.split('\n');
  const updatedLines: string[] = [];
  const updatedKeys = new Set<string>();

  // Procesar cada línea
  for (const line of lines) {
    const trimmedLine = line.trim();

    // Si es un comentario o línea vacía, mantenerla
    if (trimmedLine.startsWith('#') || trimmedLine === '') {
      updatedLines.push(line);
      continue;
    }

    // Buscar variable de entorno
    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex === -1) {
      // Si no tiene =, mantener la línea como está
      updatedLines.push(line);
      continue;
    }

    const key = trimmedLine.substring(0, equalIndex).trim();

    // Si esta variable está en las actualizaciones, reemplazarla
    if (updates[key] !== undefined) {
      updatedLines.push(`${key}=${updates[key]}`);
      updatedKeys.add(key);
    } else {
      // Mantener la línea original
      updatedLines.push(line);
    }
  }

  // Agregar variables nuevas que no existían
  for (const [key, value] of Object.entries(updates)) {
    if (!updatedKeys.has(key)) {
      updatedLines.push(`${key}=${value}`);
    }
  }

  // Escribir el archivo actualizado
  const updatedContent = updatedLines.join('\n');

  try {
    fs.writeFileSync(envPath, updatedContent, 'utf8');
    console.log(`📝 Archivo .env actualizado: ${envPath}`);

    // Mostrar las variables actualizadas
    for (const [key, value] of Object.entries(updates)) {
      console.log(`  ✅ ${key}=${key.includes('PASSWORD') ? '***' : value}`);
    }
  } catch (error) {
    throw new Error(`Error al escribir archivo .env: ${error}`);
  }
}
