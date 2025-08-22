import 'reflect-metadata';
import { initializeDatabase, closeDatabaseConnection } from './config/database';
import { ExcelProcessor } from './services/ExcelProcessor';
import {
  config,
  validateConfig,
  createRequiredDirectories,
} from './config/config';
import logger from './utils/logger';

// Función para mostrar ayuda
function showHelp() {
  console.log(`
🚀 Excel Processor - Procesador de Archivos Excel

Uso: excel-processor [OPCIONES]

Opciones:
  -h, --help          Mostrar esta ayuda
  -v, --version       Mostrar versión
  -c, --config        Mostrar configuración actual
  -d, --dry-run       Ejecutar sin procesar archivos (solo validar)

Ejemplos:
  excel-processor                    # Procesamiento normal
  excel-processor --help             # Mostrar ayuda
  excel-processor --config           # Ver configuración
  excel-processor --dry-run          # Solo validar archivos

Configuración:
  El programa usa variables de entorno o archivo .env
  Ver README.md para más detalles sobre configuración
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

  for (const arg of args) {
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

      default:
        console.error(`❌ Opción desconocida: ${arg}`);
        console.log('Usa --help para ver las opciones disponibles');
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
