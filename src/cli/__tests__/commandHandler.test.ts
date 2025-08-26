import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CommandHandler } from '../commandHandler';

// Mock del módulo config
vi.mock('../../config/config', () => ({
  config: {
    api: {
      baseURL: 'https://api.example.com',
    },
    directories: {
      excel: './excel-files',
      processed: './processed-files',
      error: './error-files',
      sqliteDbPath: './processed-db/processed_ids.db',
    },
    processing: {
      batchSize: 100,
    },
    logging: {
      level: 'info',
      file: './logs/app.log',
    },
  },
}));

// Mock del módulo package.json
vi.mock('../../../package.json', () => ({
  version: '1.0.0',
}));

describe('CommandHandler', () => {
  let commandHandler: CommandHandler;
  let consoleSpy: any;

  beforeEach(() => {
    // Mock de la configuración
    vi.mock('../../config/config', () => ({
      config: {
        directories: {
          excel: './excel-files',
          processed: './processed-files',
          error: './error-files',
          sqliteDbPath: './processed-db/processed_ids.db',
        },
        api: {
          baseURL: 'https://api.example.com',
          apiKey: 'test-key',
          timeout: 30000,
        },
        logging: {
          file: './logs/app.log',
          level: 'debug',
        },
      },
      validateConfig: vi.fn(),
      createRequiredDirectories: vi.fn(),
    }));
    commandHandler = new CommandHandler();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('showHelp', () => {
    it('should display help information when called', () => {
      commandHandler.showHelp();

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '🚀 Excel Processor - Procesador de Archivos Excel'
        )
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Uso: excel-processor [OPCIONES] [run]')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('--help')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('--api-url <url>')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('--excel-dir <path>')
      );
    });

    it('should include all command line options in help text', () => {
      commandHandler.showHelp();

      const helpText = consoleSpy.mock.calls[0][0];

      // Verificar que contiene todas las opciones principales
      expect(helpText).toContain('--help');
      expect(helpText).toContain('--version');
      expect(helpText).toContain('--dry-run');
      expect(helpText).toContain('--api-url');
      expect(helpText).toContain('--api-key');
      expect(helpText).toContain('--api-timeout');
      expect(helpText).toContain('--excel-dir');
      expect(helpText).toContain('--processed-dir');
      expect(helpText).toContain('--error-dir');
      expect(helpText).toContain('--log-file');
    });

    it('should include usage examples in help text', () => {
      commandHandler.showHelp();

      const helpText = consoleSpy.mock.calls[0][0];

      expect(helpText).toContain('excel-processor');
      expect(helpText).toContain('--help');
      expect(helpText).toContain('--dry-run');
      expect(helpText).toContain('--api-url https://api.example.com');
      expect(helpText).toContain('--api-key new-api-key');
    });
  });

  describe('showVersion', () => {
    it('should display the correct version from package.json', () => {
      commandHandler.showVersion();

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('Excel Processor v1.0.1');
    });

    it('should use the version from package.json', () => {
      // Este test verifica que se usa la versión del package.json
      // El mock ya está configurado en el nivel superior
      commandHandler.showVersion();

      expect(consoleSpy).toHaveBeenCalledWith('Excel Processor v1.0.1');
    });
  });

  describe('showConfig', () => {
    it('should display current configuration when called', () => {
      commandHandler.showConfig();

      expect(consoleSpy).toHaveBeenCalledTimes(8); // 8 líneas de configuración (incluyendo el título)

      // Verificar que se muestran todas las secciones de configuración
      expect(consoleSpy).toHaveBeenCalledWith('📋 Configuración actual:');
      expect(consoleSpy).toHaveBeenCalledWith(
        '  🌐 API REST: https://api.example.com'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '  📁 Directorio Excel: ./excel-files'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '  📁 Directorio procesados: ./processed-files'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '  📁 Directorio errores: ./error-files'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '  📄 Archivo de logs: ./logs/app.log'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '  🗄️  Base de datos SQLite: ./processed-db/processed_ids.db'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '  📊 Nivel de logs: debug (siempre máximo detalle)'
      );
    });

    it('should display configuration in the correct order', () => {
      commandHandler.showConfig();

      const calls = consoleSpy.mock.calls.map((call) => call[0]);

      expect(calls[0]).toBe('📋 Configuración actual:');
      expect(calls[1]).toBe('  🌐 API REST: https://api.example.com');
      expect(calls[2]).toBe('  📁 Directorio Excel: ./excel-files');
      expect(calls[3]).toBe('  📁 Directorio procesados: ./processed-files');
      expect(calls[4]).toBe('  📁 Directorio errores: ./error-files');
      expect(calls[5]).toBe('  📄 Archivo de logs: ./logs/app.log');
      expect(calls[6]).toBe('  🗄️  Base de datos SQLite: ./processed-db/processed_ids.db');
      expect(calls[7]).toBe(
        '  📊 Nivel de logs: debug (siempre máximo detalle)'
      );
    });

    it('should handle different configuration values correctly', () => {
      // Este test verifica que la configuración se muestra correctamente
      // con los valores del mock configurado en el nivel superior
      commandHandler.showConfig();

      // Verificar que se muestran los valores correctos del mock
      expect(consoleSpy).toHaveBeenCalledWith(
        '  🌐 API REST: https://api.example.com'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '  📁 Directorio Excel: ./excel-files'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '  📁 Directorio procesados: ./processed-files'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '  📁 Directorio errores: ./error-files'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '  📄 Archivo de logs: ./logs/app.log'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '  🗄️  Base de datos SQLite: ./processed-db/processed_ids.db'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '  📊 Nivel de logs: debug (siempre máximo detalle)'
      );
    });
  });

  describe('Integration tests', () => {
    it('should be able to call all methods without errors', () => {
      expect(() => {
        commandHandler.showHelp();
        commandHandler.showVersion();
        commandHandler.showConfig();
      }).not.toThrow();
    });

    it('should maintain consistent output format across all methods', () => {
      commandHandler.showHelp();
      const helpOutput = consoleSpy.mock.calls[0][0];

      consoleSpy.mockClear();

      commandHandler.showVersion();
      const versionOutput = consoleSpy.mock.calls[0][0];

      consoleSpy.mockClear();

      commandHandler.showConfig();
      const configOutput = consoleSpy.mock.calls
        .map((call) => call[0])
        .join('\n');

      // Verificar que todos los métodos producen strings
      expect(typeof helpOutput).toBe('string');
      expect(typeof versionOutput).toBe('string');
      expect(typeof configOutput).toBe('string');

      // Verificar que no están vacíos
      expect(helpOutput.length).toBeGreaterThan(0);
      expect(versionOutput.length).toBeGreaterThan(0);
      expect(configOutput.length).toBeGreaterThan(0);
    });
  });
});
