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
  --dry-run                    Ejecutar en modo validación (no envía datos)
  --help                       Mostrar esta ayuda
  --version                    Mostrar versión

Opciones de configuración de API REST:
  --api-url <url>               Configurar URL base de la API
  --api-key <key>               Configurar API key para autenticación
  --api-timeout <timeout>       Configurar timeout de la API (ms)

Opciones de configuración de directorios:
  --excel-dir <path>            Configurar directorio de archivos Excel
  --processed-dir <path>        Configurar directorio de archivos procesados
  --error-dir <path>            Configurar directorio de archivos con errores

Opciones de configuración de logs:
  --log-file <path>             Configurar archivo de logs

Ejemplos:
  excel-processor run                                    # Ejecutar procesamiento
  excel-processor run --dry-run                          # Validar sin enviar
  excel-processor --api-url https://api.example.com     # Cambiar URL de API
  excel-processor --api-key new-api-key                 # Cambiar API key

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
    console.log(`  📄 Archivo de logs: ${config.logging.file}`);
    console.log(`  📊 Nivel de logs: debug (siempre máximo detalle)`);
  }
}
