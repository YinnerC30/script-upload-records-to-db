export interface ParsedArgs {
  help: boolean;
  version: boolean;
  config: boolean;
  dryRun: boolean;
  run: boolean;
  envUpdates: Record<string, string>;
}

export class ArgumentParser {
  /**
   * Parsea los argumentos de línea de comandos
   */
  parseArguments(): ParsedArgs {
    const args = process.argv.slice(2);
    const result: ParsedArgs = {
      help: false,
      version: false,
      config: false,
      dryRun: false,
      run: false,
      envUpdates: {},
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case 'run':
          result.run = true;
          break;

        case '-h':
        case '--help':
          result.help = true;
          break;

        case '-v':
        case '--version':
          result.version = true;
          break;

        case '-c':
        case '--config':
          result.config = true;
          break;

        case '-d':
        case '--dry-run':
          result.dryRun = true;
          break;

        // Opciones de API REST
        case '--api-url':
          if (i + 1 < args.length) {
            const value = args[++i];
            if (value) {
              result.envUpdates['API_BASE_URL'] = value;
            } else {
              this.handleError('--api-url requiere un valor');
            }
          } else {
            this.handleError('--api-url requiere un valor');
          }
          break;

        case '--api-key':
          if (i + 1 < args.length) {
            const value = args[++i];
            if (value) {
              result.envUpdates['API_KEY'] = value;
            } else {
              this.handleError('--api-key requiere un valor');
            }
          } else {
            this.handleError('--api-key requiere un valor');
          }
          break;

        case '--api-timeout':
          if (i + 1 < args.length) {
            const timeout = args[++i];
            if (timeout && /^\d+$/.test(timeout)) {
              result.envUpdates['API_TIMEOUT'] = timeout;
            } else {
              this.handleError('--api-timeout debe ser un número válido');
            }
          } else {
            this.handleError('--api-timeout requiere un valor');
          }
          break;

        // Opciones de directorios
        case '--excel-dir':
          if (i + 1 < args.length) {
            const value = args[++i];
            if (value) {
              result.envUpdates['EXCEL_DIRECTORY'] = value;
            } else {
              this.handleError('--excel-dir requiere un valor');
            }
          } else {
            this.handleError('--excel-dir requiere un valor');
          }
          break;

        case '--processed-dir':
          if (i + 1 < args.length) {
            const value = args[++i];
            if (value) {
              result.envUpdates['PROCESSED_DIRECTORY'] = value;
            } else {
              this.handleError('--processed-dir requiere un valor');
            }
          } else {
            this.handleError('--processed-dir requiere un valor');
          }
          break;

        case '--error-dir':
          if (i + 1 < args.length) {
            const value = args[++i];
            if (value) {
              result.envUpdates['ERROR_DIRECTORY'] = value;
            } else {
              this.handleError('--error-dir requiere un valor');
            }
          } else {
            this.handleError('--error-dir requiere un valor');
          }
          break;

        // Opciones de procesamiento
        case '--batch-size':
          if (i + 1 < args.length) {
            const size = args[++i];
            if (size && /^\d+$/.test(size)) {
              result.envUpdates['BATCH_SIZE'] = size;
            } else {
              this.handleError('--batch-size debe ser un número válido');
            }
          } else {
            this.handleError('--batch-size requiere un valor');
          }
          break;

        case '--log-level':
          if (i + 1 < args.length) {
            const level = args[++i];
            if (level && ['debug', 'info', 'warn', 'error'].includes(level)) {
              result.envUpdates['LOG_LEVEL'] = level;
            } else {
              this.handleError(
                '--log-level debe ser: debug, info, warn, error'
              );
            }
          } else {
            this.handleError('--log-level requiere un valor');
          }
          break;

        case '--log-file':
          if (i + 1 < args.length) {
            const value = args[++i];
            if (value) {
              result.envUpdates['LOG_FILE'] = value;
            } else {
              this.handleError('--log-file requiere un valor');
            }
          } else {
            this.handleError('--log-file requiere un valor');
          }
          break;

        case '--log-console':
          if (i + 1 < args.length) {
            const value = args[++i];
            if (value && ['true', 'false'].includes(value)) {
              result.envUpdates['LOG_ENABLE_CONSOLE'] = value;
            } else {
              this.handleError('--log-console debe ser: true o false');
            }
          } else {
            this.handleError('--log-console requiere un valor');
          }
          break;

        case '--log-performance':
          if (i + 1 < args.length) {
            const value = args[++i];
            if (value && ['true', 'false'].includes(value)) {
              result.envUpdates['LOG_ENABLE_PERFORMANCE'] = value;
            } else {
              this.handleError('--log-performance debe ser: true o false');
            }
          } else {
            this.handleError('--log-performance requiere un valor');
          }
          break;

        default:
          console.error(`❌ Error: Opción desconocida: ${arg}`);
          console.error('💡 Usa --help para ver las opciones disponibles');
          process.exit(1);
      }
    }

    return result;
  }

  private handleError(message: string): never {
    console.error(`❌ Error: ${message}`);
    process.exit(1);
  }
}
