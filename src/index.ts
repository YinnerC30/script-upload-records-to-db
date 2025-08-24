import {
  config,
  createRequiredDirectories,
  validateConfig,
} from './config/config';
import { ExcelProcessor } from './services/ExcelProcessor';
import { ArgumentParser, ParsedArgs } from './cli/argumentParser';
import { CommandHandler } from './cli/commandHandler';
import { EnvironmentManager } from './cli/environmentManager';
import logger from './utils/logger';

// Variable global para modo dry-run
let isDryRun = false;

// Función para procesar argumentos
async function parseArguments(): Promise<{
  isDryRun: boolean;
  envUpdates: Record<string, string>;
}> {
  const parser = new ArgumentParser();
  const args = parser.parseArguments();

  const commandHandler = new CommandHandler();
  const envManager = new EnvironmentManager();

  // Manejar comandos que no requieren procesamiento
  if (args.help) {
    commandHandler.showHelp();
    process.exit(0);
  }

  if (args.version) {
    commandHandler.showVersion();
    process.exit(0);
  }

  if (args.config) {
    commandHandler.showConfig();
    process.exit(0);
  }

  // Configurar modo dry-run
  if (args.dryRun) {
    console.log('🔍 Modo dry-run activado (solo validación)');
    isDryRun = true;
  }

  // Actualizar archivo .env si hay cambios
  if (Object.keys(args.envUpdates).length > 0) {
    try {
      await envManager.updateEnvFile(args.envUpdates);
      console.log('✅ Configuración actualizada exitosamente');
      console.log('🔄 Reinicia la aplicación para aplicar los cambios\n');
    } catch (error) {
      console.error('❌ Error actualizando configuración:', error);
      process.exit(1);
    }
  }

  return { isDryRun, envUpdates: args.envUpdates };
}

// Función principal
async function main() {
  try {
    console.log('🚀 Iniciando Excel Processor...\n');

    // Procesar argumentos de línea de comandos
    const { isDryRun: dryRunMode } = await parseArguments();

    // Validar configuración
    validateConfig();

    // Crear directorios necesarios
    createRequiredDirectories();

    // Crear archivo .env de ejemplo si no existe
    const envManager = new EnvironmentManager();
    await envManager.createExampleEnvFile();

    // Inicializar logger
    logger.info('🚀 Excel Processor iniciado', {
      dryRun: dryRunMode,
      config: {
        apiUrl: config.api.baseURL,
        excelDir: config.directories.excel,
        batchSize: config.processing.batchSize,
      },
    });

    // Crear procesador de Excel
    const processor = new ExcelProcessor(dryRunMode);

    // Ejecutar procesamiento
    await processor.run();

    console.log('\n✅ Procesamiento completado exitosamente');
    logger.info('✅ Procesamiento completado exitosamente');
  } catch (error) {
    console.error('\n❌ Error durante el procesamiento:', error);
    logger.error('❌ Error durante el procesamiento', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    process.exit(1);
  }
}

// Ejecutar función principal
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}
