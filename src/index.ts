import 'reflect-metadata';
import {
  config,
  createRequiredDirectories,
  updateEnvFile,
  validateConfig,
} from './config/config';
import { closeDatabaseConnection, initializeDatabase } from './config/database';
import { ExcelProcessor } from './services/ExcelProcessor';
import logger from './utils/logger';

// Función para mostrar ayuda
function showHelp() {
  console.log(`
🚀 Excel Processor - Procesador de Archivos Excel

Uso: excel-processor [OPCIONES]

Opciones generales:
  -h, --help                    Mostrar esta ayuda
  -v, --version                 Mostrar versión
  -c, --config                  Mostrar configuración actual
  -d, --dry-run                 Ejecutar sin procesar archivos (solo validar)

Opciones de configuración de base de datos:
  --db-host <host>              Configurar host de base de datos
  --db-port <port>              Configurar puerto de base de datos
  --db-username <username>      Configurar usuario de base de datos
  --db-password <password>      Configurar contraseña de base de datos
  --db-database <database>      Configurar nombre de base de datos

Opciones de configuración de directorios:
  --excel-dir <path>            Configurar directorio de archivos Excel
  --processed-dir <path>        Configurar directorio de archivos procesados
  --error-dir <path>            Configurar directorio de archivos con errores

Opciones de configuración de procesamiento:
  --batch-size <number>         Configurar tamaño de lote para procesamiento
  --log-level <level>           Configurar nivel de logs (debug, info, warn, error)

Opciones de configuración de logs:
  --log-file <path>             Configurar archivo de logs
  --log-console <true|false>    Habilitar/deshabilitar logs en consola
  --log-performance <true|false> Habilitar/deshabilitar logs de rendimiento

Ejemplos:
  excel-processor                                    # Procesamiento normal
  excel-processor --help                             # Mostrar ayuda
  excel-processor --config                           # Ver configuración
  excel-processor --dry-run                          # Solo validar archivos
  excel-processor --db-host 192.168.1.100            # Cambiar host de BD
  excel-processor --db-port 3307                     # Cambiar puerto de BD
  excel-processor --excel-dir ./my-excel-files       # Cambiar directorio Excel
  excel-processor --batch-size 200                   # Cambiar tamaño de lote
  excel-processor --log-level debug                  # Cambiar nivel de logs

Nota: Las opciones de configuración modifican el archivo .env permanentemente
`);
}

// Función para mostrar versión
function showVersion() {
  const packageJson = require('../package.json');
  console.log(`Excel Processor v${packageJson.version}`);
}

// Función para mostrar configuración
function showConfig() {
  console.log('📋 Configuración actual:');
  console.log(
    `  🗄️  Base de datos: ${config.database.host}:${config.database.port}/${config.database.database}`
  );
  console.log(`  📁 Directorio Excel: ${config.directories.excel}`);
  console.log(`  📁 Directorio procesados: ${config.directories.processed}`);
  console.log(`  📁 Directorio errores: ${config.directories.error}`);
  console.log(`  📦 Tamaño de lote: ${config.processing.batchSize}`);
}

// Variable global para modo dry-run
let isDryRun = false;

// Función para procesar argumentos
async function parseArguments() {
  const args = process.argv.slice(2);
  const envUpdates: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '-h':
      case '--help':
        showHelp();
        process.exit(0);
        break;

      case '-v':
      case '--version':
        showVersion();
        process.exit(0);
        break;

      case '-c':
      case '--config':
        showConfig();
        process.exit(0);
        break;

      case '-d':
      case '--dry-run':
        console.log('🔍 Modo dry-run activado (solo validación)');
        isDryRun = true;
        break;

      // Opciones de base de datos
      case '--db-host':
        if (i + 1 < args.length) {
          const value = args[++i];
          if (value) {
            envUpdates['DB_HOST'] = value;
          } else {
            console.error('❌ Error: --db-host requiere un valor');
            process.exit(1);
          }
        } else {
          console.error('❌ Error: --db-host requiere un valor');
          process.exit(1);
        }
        break;

      case '--db-port':
        if (i + 1 < args.length) {
          const port = args[++i];
          if (port && /^\d+$/.test(port)) {
            envUpdates['DB_PORT'] = port;
          } else {
            console.error('❌ Error: --db-port debe ser un número válido');
            process.exit(1);
          }
        } else {
          console.error('❌ Error: --db-port requiere un valor');
          process.exit(1);
        }
        break;

      case '--db-username':
        if (i + 1 < args.length) {
          const value = args[++i];
          if (value) {
            envUpdates['DB_USERNAME'] = value;
          } else {
            console.error('❌ Error: --db-username requiere un valor');
            process.exit(1);
          }
        } else {
          console.error('❌ Error: --db-username requiere un valor');
          process.exit(1);
        }
        break;

      case '--db-password':
        if (i + 1 < args.length) {
          const value = args[++i];
          if (value) {
            envUpdates['DB_PASSWORD'] = value;
          } else {
            console.error('❌ Error: --db-password requiere un valor');
            process.exit(1);
          }
        } else {
          console.error('❌ Error: --db-password requiere un valor');
          process.exit(1);
        }
        break;

      case '--db-database':
        if (i + 1 < args.length) {
          const value = args[++i];
          if (value) {
            envUpdates['DB_DATABASE'] = value;
          } else {
            console.error('❌ Error: --db-database requiere un valor');
            process.exit(1);
          }
        } else {
          console.error('❌ Error: --db-database requiere un valor');
          process.exit(1);
        }
        break;

      // Opciones de directorios
      case '--excel-dir':
        if (i + 1 < args.length) {
          const value = args[++i];
          if (value) {
            envUpdates['EXCEL_DIRECTORY'] = value;
          } else {
            console.error('❌ Error: --excel-dir requiere un valor');
            process.exit(1);
          }
        } else {
          console.error('❌ Error: --excel-dir requiere un valor');
          process.exit(1);
        }
        break;

      case '--processed-dir':
        if (i + 1 < args.length) {
          const value = args[++i];
          if (value) {
            envUpdates['PROCESSED_DIRECTORY'] = value;
          } else {
            console.error('❌ Error: --processed-dir requiere un valor');
            process.exit(1);
          }
        } else {
          console.error('❌ Error: --processed-dir requiere un valor');
          process.exit(1);
        }
        break;

      case '--error-dir':
        if (i + 1 < args.length) {
          const value = args[++i];
          if (value) {
            envUpdates['ERROR_DIRECTORY'] = value;
          } else {
            console.error('❌ Error: --error-dir requiere un valor');
            process.exit(1);
          }
        } else {
          console.error('❌ Error: --error-dir requiere un valor');
          process.exit(1);
        }
        break;

      // Opciones de procesamiento
      case '--batch-size':
        if (i + 1 < args.length) {
          const batchSize = args[++i];
          if (batchSize && /^\d+$/.test(batchSize)) {
            envUpdates['BATCH_SIZE'] = batchSize;
          } else {
            console.error('❌ Error: --batch-size debe ser un número válido');
            process.exit(1);
          }
        } else {
          console.error('❌ Error: --batch-size requiere un valor');
          process.exit(1);
        }
        break;

      // Opciones de logs
      case '--log-level':
        if (i + 1 < args.length) {
          const level = args[++i];
          if (level && ['debug', 'info', 'warn', 'error'].includes(level)) {
            envUpdates['LOG_LEVEL'] = level;
          } else {
            console.error(
              '❌ Error: --log-level debe ser debug, info, warn o error'
            );
            process.exit(1);
          }
        } else {
          console.error('❌ Error: --log-level requiere un valor');
          process.exit(1);
        }
        break;

      case '--log-file':
        if (i + 1 < args.length) {
          const value = args[++i];
          if (value) {
            envUpdates['LOG_FILE'] = value;
          } else {
            console.error('❌ Error: --log-file requiere un valor');
            process.exit(1);
          }
        } else {
          console.error('❌ Error: --log-file requiere un valor');
          process.exit(1);
        }
        break;

      case '--log-console':
        if (i + 1 < args.length) {
          const value = args[++i];
          if (value && ['true', 'false'].includes(value)) {
            envUpdates['LOG_ENABLE_CONSOLE'] = value;
          } else {
            console.error('❌ Error: --log-console debe ser true o false');
            process.exit(1);
          }
        } else {
          console.error('❌ Error: --log-console requiere un valor');
          process.exit(1);
        }
        break;

      case '--log-performance':
        if (i + 1 < args.length) {
          const value = args[++i];
          if (value && ['true', 'false'].includes(value)) {
            envUpdates['LOG_ENABLE_PERFORMANCE'] = value;
          } else {
            console.error('❌ Error: --log-performance debe ser true o false');
            process.exit(1);
          }
        } else {
          console.error('❌ Error: --log-performance requiere un valor');
          process.exit(1);
        }
        break;

      default:
        console.error(`❌ Opción desconocida: ${arg}`);
        console.log('Usa --help para ver las opciones disponibles');
        process.exit(1);
    }
  }

  // Si hay actualizaciones de configuración, aplicarlas
  if (Object.keys(envUpdates).length > 0) {
    try {
      await updateEnvFile(envUpdates);
      console.log('✅ Configuración actualizada exitosamente');

      // Si solo se actualizó la configuración, salir
      if (!isDryRun) {
        console.log(
          '💡 Ejecuta el comando nuevamente sin opciones para procesar archivos'
        );
        process.exit(0);
      }
    } catch (error) {
      console.error('❌ Error al actualizar configuración:', error);
      process.exit(1);
    }
  }
}

async function main() {
  try {
    // Procesar argumentos primero
    await parseArguments();

    console.log('🚀 Iniciando aplicación de procesamiento de Excel...');

    // Validar y mostrar configuración
    validateConfig();

    // Crear directorios necesarios
    createRequiredDirectories();

    logger.info('🚀 Iniciando aplicación de procesamiento de Excel...');

    // Inicializar base de datos
    await initializeDatabase();

    // Crear procesador de Excel
    const processor = new ExcelProcessor(isDryRun);

    // Ejecutar procesamiento
    await processor.run();

    logger.info('✅ Aplicación finalizada exitosamente');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error en la aplicación:', error);
    process.exit(1);
  }
}

// Manejar señales de terminación
process.on('SIGINT', async () => {
  logger.info('🛑 Recibida señal SIGINT, cerrando aplicación...');
  await closeDatabaseConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('🛑 Recibida señal SIGTERM, cerrando aplicación...');
  await closeDatabaseConnection();
  process.exit(0);
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('❌ Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Promesa rechazada no manejada:', reason);
  process.exit(1);
});

// Ejecutar aplicación
main();
