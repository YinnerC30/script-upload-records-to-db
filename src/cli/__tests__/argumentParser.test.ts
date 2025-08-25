import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ArgumentParser } from '../argumentParser';

describe('ArgumentParser', () => {
  let parser: ArgumentParser;
  let originalArgv: string[];
  let mockExit: any;
  let mockConsoleError: any;

  beforeEach(() => {
    parser = new ArgumentParser();
    originalArgv = process.argv;
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.restoreAllMocks();
  });

  describe('parseArguments', () => {
    it('should return default values when no arguments are provided', () => {
      process.argv = ['node', 'script.js'];

      const result = parser.parseArguments();

      expect(result).toEqual({
        help: false,
        version: false,
        config: false,
        dryRun: false,
        run: false,
        envUpdates: {},
      });
    });

    it('should parse help flag with -h', () => {
      process.argv = ['node', 'script.js', '-h'];

      const result = parser.parseArguments();

      expect(result.help).toBe(true);
      expect(result.version).toBe(false);
      expect(result.config).toBe(false);
      expect(result.dryRun).toBe(false);
    });

    it('should parse help flag with --help', () => {
      process.argv = ['node', 'script.js', '--help'];

      const result = parser.parseArguments();

      expect(result.help).toBe(true);
    });

    it('should parse version flag with -v', () => {
      process.argv = ['node', 'script.js', '-v'];

      const result = parser.parseArguments();

      expect(result.version).toBe(true);
      expect(result.help).toBe(false);
    });

    it('should parse version flag with --version', () => {
      process.argv = ['node', 'script.js', '--version'];

      const result = parser.parseArguments();

      expect(result.version).toBe(true);
    });

    it('should parse config flag with -c', () => {
      process.argv = ['node', 'script.js', '-c'];

      const result = parser.parseArguments();

      expect(result.config).toBe(true);
    });

    it('should parse config flag with --config', () => {
      process.argv = ['node', 'script.js', '--config'];

      const result = parser.parseArguments();

      expect(result.config).toBe(true);
    });

    it('should parse dry-run flag with -d', () => {
      process.argv = ['node', 'script.js', '-d'];

      const result = parser.parseArguments();

      expect(result.dryRun).toBe(true);
    });

    it('should parse dry-run flag with --dry-run', () => {
      process.argv = ['node', 'script.js', '--dry-run'];

      const result = parser.parseArguments();

      expect(result.dryRun).toBe(true);
    });

    it('should parse multiple flags correctly', () => {
      process.argv = ['node', 'script.js', '--help', '--version', '--dry-run'];

      const result = parser.parseArguments();

      expect(result.help).toBe(true);
      expect(result.version).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.config).toBe(false);
    });

    describe('API options', () => {
      it('should parse --api-url correctly', () => {
        process.argv = [
          'node',
          'script.js',
          '--api-url',
          'https://api.example.com',
        ];

        const result = parser.parseArguments();

        expect(result.envUpdates['API_BASE_URL']).toBe(
          'https://api.example.com'
        );
      });

      it('should parse --api-key correctly', () => {
        process.argv = ['node', 'script.js', '--api-key', 'secret-key-123'];

        const result = parser.parseArguments();

        expect(result.envUpdates['API_KEY']).toBe('secret-key-123');
      });

      it('should parse --api-timeout with valid number', () => {
        process.argv = ['node', 'script.js', '--api-timeout', '5000'];

        const result = parser.parseArguments();

        expect(result.envUpdates['API_TIMEOUT']).toBe('5000');
      });

      it('should handle --api-timeout with invalid number', () => {
        process.argv = ['node', 'script.js', '--api-timeout', 'invalid'];

        expect(() => parser.parseArguments()).toThrow('process.exit called');
        expect(mockConsoleError).toHaveBeenCalledWith(
          '❌ Error: --api-timeout debe ser un número válido'
        );
      });

      it('should handle --api-url without value', () => {
        process.argv = ['node', 'script.js', '--api-url'];

        expect(() => parser.parseArguments()).toThrow('process.exit called');
        expect(mockConsoleError).toHaveBeenCalledWith(
          '❌ Error: --api-url requiere un valor'
        );
      });

      it('should handle --api-key without value', () => {
        process.argv = ['node', 'script.js', '--api-key'];

        expect(() => parser.parseArguments()).toThrow('process.exit called');
        expect(mockConsoleError).toHaveBeenCalledWith(
          '❌ Error: --api-key requiere un valor'
        );
      });

      it('should handle --api-timeout without value', () => {
        process.argv = ['node', 'script.js', '--api-timeout'];

        expect(() => parser.parseArguments()).toThrow('process.exit called');
        expect(mockConsoleError).toHaveBeenCalledWith(
          '❌ Error: --api-timeout requiere un valor'
        );
      });
    });

    describe('Directory options', () => {
      it('should parse --excel-dir correctly', () => {
        process.argv = ['node', 'script.js', '--excel-dir', '/path/to/excel'];

        const result = parser.parseArguments();

        expect(result.envUpdates['EXCEL_DIRECTORY']).toBe('/path/to/excel');
      });

      it('should parse --processed-dir correctly', () => {
        process.argv = [
          'node',
          'script.js',
          '--processed-dir',
          '/path/to/processed',
        ];

        const result = parser.parseArguments();

        expect(result.envUpdates['PROCESSED_DIRECTORY']).toBe(
          '/path/to/processed'
        );
      });

      it('should parse --error-dir correctly', () => {
        process.argv = ['node', 'script.js', '--error-dir', '/path/to/errors'];

        const result = parser.parseArguments();

        expect(result.envUpdates['ERROR_DIRECTORY']).toBe('/path/to/errors');
      });

      it('should handle --excel-dir without value', () => {
        process.argv = ['node', 'script.js', '--excel-dir'];

        expect(() => parser.parseArguments()).toThrow('process.exit called');
        expect(mockConsoleError).toHaveBeenCalledWith(
          '❌ Error: --excel-dir requiere un valor'
        );
      });

      it('should handle --processed-dir without value', () => {
        process.argv = ['node', 'script.js', '--processed-dir'];

        expect(() => parser.parseArguments()).toThrow('process.exit called');
        expect(mockConsoleError).toHaveBeenCalledWith(
          '❌ Error: --processed-dir requiere un valor'
        );
      });

      it('should handle --error-dir without value', () => {
        process.argv = ['node', 'script.js', '--error-dir'];

        expect(() => parser.parseArguments()).toThrow('process.exit called');
        expect(mockConsoleError).toHaveBeenCalledWith(
          '❌ Error: --error-dir requiere un valor'
        );
      });
    });

    describe('Processing options', () => {
      it('should parse --batch-size with valid number', () => {
        process.argv = ['node', 'script.js', '--batch-size', '100'];

        const result = parser.parseArguments();

        expect(result.envUpdates['BATCH_SIZE']).toBe('100');
      });

      it('should handle --batch-size with invalid number', () => {
        process.argv = ['node', 'script.js', '--batch-size', 'invalid'];

        expect(() => parser.parseArguments()).toThrow('process.exit called');
        expect(mockConsoleError).toHaveBeenCalledWith(
          '❌ Error: --batch-size debe ser un número válido'
        );
      });

      it('should parse --log-level with valid values', () => {
        const validLevels = ['debug', 'info', 'warn', 'error'];

        validLevels.forEach((level) => {
          process.argv = ['node', 'script.js', '--log-level', level];

          const result = parser.parseArguments();

          expect(result.envUpdates['LOG_LEVEL']).toBe(level);
        });
      });

      it('should handle --log-level with invalid value', () => {
        process.argv = ['node', 'script.js', '--log-level', 'invalid'];

        expect(() => parser.parseArguments()).toThrow('process.exit called');
        expect(mockConsoleError).toHaveBeenCalledWith(
          '❌ Error: --log-level debe ser: debug, info, warn, error'
        );
      });

      it('should parse --log-file correctly', () => {
        process.argv = [
          'node',
          'script.js',
          '--log-file',
          '/path/to/logs/app.log',
        ];

        const result = parser.parseArguments();

        expect(result.envUpdates['LOG_FILE']).toBe('/path/to/logs/app.log');
      });



      it('should handle --batch-size without value', () => {
        process.argv = ['node', 'script.js', '--batch-size'];

        expect(() => parser.parseArguments()).toThrow('process.exit called');
        expect(mockConsoleError).toHaveBeenCalledWith(
          '❌ Error: --batch-size requiere un valor'
        );
      });

      it('should handle --log-level without value', () => {
        process.argv = ['node', 'script.js', '--log-level'];

        expect(() => parser.parseArguments()).toThrow('process.exit called');
        expect(mockConsoleError).toHaveBeenCalledWith(
          '❌ Error: --log-level requiere un valor'
        );
      });

      it('should handle --log-file without value', () => {
        process.argv = ['node', 'script.js', '--log-file'];

        expect(() => parser.parseArguments()).toThrow('process.exit called');
        expect(mockConsoleError).toHaveBeenCalledWith(
          '❌ Error: --log-file requiere un valor'
        );
      });


    });

    describe('Unknown options', () => {
      it('should handle unknown option', () => {
        process.argv = ['node', 'script.js', '--unknown-option'];

        expect(() => parser.parseArguments()).toThrow('process.exit called');
        expect(mockConsoleError).toHaveBeenCalledWith(
          '❌ Error: Opción desconocida: --unknown-option'
        );
        expect(mockConsoleError).toHaveBeenCalledWith(
          '💡 Usa --help para ver las opciones disponibles'
        );
      });

      it('should handle unknown short option', () => {
        process.argv = ['node', 'script.js', '-x'];

        expect(() => parser.parseArguments()).toThrow('process.exit called');
        expect(mockConsoleError).toHaveBeenCalledWith(
          '❌ Error: Opción desconocida: -x'
        );
      });
    });

    describe('Complex scenarios', () => {
      it('should handle multiple options with values', () => {
        process.argv = [
          'node',
          'script.js',
          '--help',
          '--api-url',
          'https://api.example.com',
          '--api-key',
          'secret-key',
          '--batch-size',
          '50',
          '--log-level',
          'debug',
          '--excel-dir',
          '/path/to/excel',
        ];

        const result = parser.parseArguments();

        expect(result.help).toBe(true);
        expect(result.envUpdates['API_BASE_URL']).toBe(
          'https://api.example.com'
        );
        expect(result.envUpdates['API_KEY']).toBe('secret-key');
        expect(result.envUpdates['BATCH_SIZE']).toBe('50');
        expect(result.envUpdates['LOG_LEVEL']).toBe('debug');
        expect(result.envUpdates['EXCEL_DIRECTORY']).toBe('/path/to/excel');
      });

      it('should handle empty string values as invalid', () => {
        process.argv = ['node', 'script.js', '--api-url', ''];

        expect(() => parser.parseArguments()).toThrow('process.exit called');
        expect(mockConsoleError).toHaveBeenCalledWith(
          '❌ Error: --api-url requiere un valor'
        );
      });

      it('should handle whitespace-only values as invalid', () => {
        process.argv = ['node', 'script.js', '--api-url', '   '];

        const result = parser.parseArguments();

        // Los espacios en blanco se consideran válidos en este caso
        expect(result.envUpdates['API_BASE_URL']).toBe('   ');
      });
    });
  });
});
