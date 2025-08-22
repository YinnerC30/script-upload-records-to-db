import 'reflect-metadata';
import { initializeDatabase } from './config/database';
import { ExcelProcessor } from './services/ExcelProcessor';
import {
  config,
  validateConfig,
  createRequiredDirectories,
} from './config/config';
import logger from './utils/logger';

async function main() {
  try {
    console.log('🚀 Iniciando aplicación de procesamiento de Excel...');

    // Validar y mostrar configuración
    validateConfig();

    // Crear directorios necesarios
    createRequiredDirectories();

    logger.info('🚀 Iniciando aplicación de procesamiento de Excel...');

    // Inicializar base de datos
    await initializeDatabase();

    // Crear procesador de Excel
    const processor = new ExcelProcessor();

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
process.on('SIGINT', () => {
  logger.info('🛑 Recibida señal SIGINT, cerrando aplicación...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 Recibida señal SIGTERM, cerrando aplicación...');
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
