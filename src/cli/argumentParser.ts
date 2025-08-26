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

        // Opciones de base de datos SQLite
        case '--sqlite-db-path':
          if (i + 1 < args.length) {
            const value = args[++i];
            if (value) {
              result.envUpdates['SQLITE_DB_PATH'] = value;
            } else {
              this.handleError('--sqlite-db-path requiere un valor');
            }
          } else {
            this.handleError('--sqlite-db-path requiere un valor');
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
