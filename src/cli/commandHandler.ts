import { config } from '../config/config';

export class CommandHandler {
  /**
   * Muestra la ayuda del programa
   */
  showHelp(): void {
    console.log(`
🚀 Excel Processor - Procesador de Archivos Excel

Uso: excel-processor [OPCIONES] [run]

Opciones generales:
  -h, --help                    Mostrar esta ayuda
  -v, --version                 Mostrar versión
  -c, --config                  Mostrar configuración actual
  -d, --dry-run                 Ejecutar sin procesar archivos (solo validar)
  run                           Ejecutar procesamiento tras aplicar configuración

Opciones de configuración de API REST:
  --api-url <url>               Configurar URL base de la API
  --api-key <key>               Configurar API key para autenticación
  --api-timeout <timeout>       Configurar timeout de la API (ms)

Opciones de configuración de directorios:
  --excel-dir <path>            Configurar directorio de archivos Excel
  --processed-dir <path>        Configurar directorio de archivos procesados
  --error-dir <path>            Configurar directorio de archivos con errores

Opciones de configuración de procesamiento:
  --batch-size <number>         Configurar tamaño de lote para procesamiento
  --log-level <level>           Configurar nivel de logs (debug, info, warn, error)

Opciones de configuración de logs:
  --log-file <path>             Configurar archivo de logs

Ejemplos:
  excel-processor run                                # Procesamiento normal
  excel-processor --help                             # Mostrar ayuda
  excel-processor --config                           # Ver configuración
  excel-processor run --dry-run                      # Solo validar archivos
  excel-processor --api-url https://api.example.com  # Configurar URL de API
  excel-processor --api-key my-api-key               # Configurar API key
  excel-processor --excel-dir ./my-excel-files       # Configurar directorio Excel
  excel-processor --batch-size 200                   # Cambiar tamaño de lote
  excel-processor --log-level debug                  # Cambiar nivel de logs

Nota: Las opciones de configuración modifican el archivo .env permanentemente.
      Si se proporcionan opciones de configuración sin 'run' ni 'run --dry-run',
      se aplican los cambios y el programa no se ejecuta automáticamente.
`);
  }

  /**
   * Muestra la versión del programa
   */
  showVersion(): void {
    const packageJson = require('../../package.json');
    console.log(`Excel Processor v${packageJson.version}`);
  }

  /**
   * Muestra la configuración actual
   */
  showConfig(): void {
    console.log('📋 Configuración actual:');
    console.log(`  🌐 API REST: ${config.api.baseURL}`);
    console.log(`  📁 Directorio Excel: ${config.directories.excel}`);
    console.log(`  📁 Directorio procesados: ${config.directories.processed}`);
    console.log(`  📁 Directorio errores: ${config.directories.error}`);
    console.log(`  📦 Tamaño de lote: ${config.processing.batchSize}`);
    console.log(`  📊 Nivel de logs: ${config.logging.level}`);
    console.log(`  📄 Archivo de logs: ${config.logging.file}`);
  }
}
