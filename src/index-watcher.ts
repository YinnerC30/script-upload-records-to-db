import 'reflect-metadata';
import { initializeDatabase } from './config/database';
import { WatcherService } from './services/WatcherService';
import logger from './utils/logger';

async function main() {
  try {
    logger.info('🚀 Iniciando servicio de monitoreo de archivos Excel...');

    // Inicializar base de datos
    await initializeDatabase();

    // Crear servicio de monitoreo
    const watcher = new WatcherService();

    // Iniciar monitoreo
    watcher.startWatching();

    logger.info('✅ Servicio de monitoreo iniciado exitosamente');
    logger.info('📋 Presiona Ctrl+C para detener el servicio');

    // Mantener la aplicación corriendo
    process.stdin.resume();
  } catch (error) {
    logger.error('❌ Error iniciando el servicio:', error);
    process.exit(1);
  }
}

// Manejar señales de terminación
process.on('SIGINT', () => {
  logger.info('🛑 Recibida señal SIGINT, cerrando servicio...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 Recibida señal SIGTERM, cerrando servicio...');
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
