import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ArgumentParser, ParsedArgs } from '../cli/argumentParser';
import { CommandHandler } from '../cli/commandHandler';
import { EnvironmentManager } from '../cli/environmentManager';
import { ExcelProcessor } from '../services/ExcelProcessor';
import logger, { StructuredLogger } from '../utils/logger';

// Mock de todas las dependencias
vi.mock('../cli/argumentParser');
vi.mock('../cli/commandHandler');
vi.mock('../cli/environmentManager');
vi.mock('../services/ExcelProcessor');
vi.mock('../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    verbose: vi.fn(),
    debug: vi.fn(),
    close: vi.fn(),
  },
  StructuredLogger: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    verbose: vi.fn(),
    debug: vi.fn(),
    performance: vi.fn(),
    metrics: vi.fn(),
    getSessionId: vi.fn().mockReturnValue('test-session-id'),
  })),
}));
vi.mock('../config/config', () => ({
  config: {
    api: { baseURL: 'http://localhost:3000/api' },
    directories: {
      excel: './excel-files',
      processed: './processed-files',
      error: './error-files',
    },

    logging: {
      level: 'info',
      file: './logs/app.log',
    },
  },
  createRequiredDirectories: vi.fn(),
  validateConfig: vi.fn(),
}));

// Mock de process.argv y process.exit
const mockExit = vi.fn();
const mockConsoleLog = vi.fn();
const mockConsoleError = vi.fn();

describe('index.ts', () => {
  let mockArgumentParser: any;
  let mockCommandHandler: any;
  let mockEnvironmentManager: any;
  let mockExcelProcessor: any;
  let mockLogger: any;

  beforeEach(async () => {
    // Limpiar todos los mocks
    vi.clearAllMocks();

    // Mock de process.exit
    vi.spyOn(process, 'exit').mockImplementation(mockExit as any);

    // Mock de console
    vi.spyOn(console, 'log').mockImplementation(mockConsoleLog);
    vi.spyOn(console, 'error').mockImplementation(mockConsoleError);

    // Mock de require.main
    Object.defineProperty(require, 'main', {
      value: module,
      configurable: true,
    });

    // Resetear el módulo para limpiar el estado global
    vi.resetModules();

    // Configurar mocks de las clases
    mockArgumentParser = {
      parseArguments: vi.fn(),
    };
    (ArgumentParser as any).mockImplementation(() => mockArgumentParser);

    mockCommandHandler = {
      showHelp: vi.fn(),
      showVersion: vi.fn(),
      showConfig: vi.fn(),
    };
    (CommandHandler as any).mockImplementation(() => mockCommandHandler);

    mockEnvironmentManager = {
      updateEnvFile: vi.fn(),
      createExampleEnvFile: vi.fn(),
    };
    (EnvironmentManager as any).mockImplementation(
      () => mockEnvironmentManager
    );

    mockExcelProcessor = {
      run: vi.fn(),
    };
    (ExcelProcessor as any).mockImplementation(() => mockExcelProcessor);

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      verbose: vi.fn(),
      debug: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseArguments', () => {
    it('should handle help command and exit', async () => {
      // Arrange
      mockArgumentParser.parseArguments.mockReturnValue({
        help: true,
        version: false,
        config: false,
        dryRun: false,
        envUpdates: {},
      });

      // Act
      const { parseArguments } = await import('../index');
      const result = await parseArguments();

      // Assert
      expect(mockCommandHandler.showHelp).toHaveBeenCalledTimes(1);
      expect(mockExit).toHaveBeenCalledWith(0);
      expect(result.isDryRun).toBe(false);
    });

    it('should handle version command and exit', async () => {
      // Arrange
      mockArgumentParser.parseArguments.mockReturnValue({
        help: false,
        version: true,
        config: false,
        dryRun: false,
        envUpdates: {},
      });

      // Act
      const { parseArguments } = await import('../index');
      const result = await parseArguments();

      // Assert
      expect(mockCommandHandler.showVersion).toHaveBeenCalledTimes(1);
      expect(mockExit).toHaveBeenCalledWith(0);
      expect(result.isDryRun).toBe(false);
    });

    it('should handle config command and exit', async () => {
      // Arrange
      mockArgumentParser.parseArguments.mockReturnValue({
        help: false,
        version: false,
        config: true,
        dryRun: false,
        envUpdates: {},
      });

      // Act
      const { parseArguments } = await import('../index');
      const result = await parseArguments();

      // Assert
      expect(mockCommandHandler.showConfig).toHaveBeenCalledTimes(1);
      expect(mockExit).toHaveBeenCalledWith(0);
      expect(result.isDryRun).toBe(false);
    });

    it('should enable dry-run mode when specified', async () => {
      // Arrange
      mockArgumentParser.parseArguments.mockReturnValue({
        help: false,
        version: false,
        config: false,
        dryRun: true,
        envUpdates: {},
      });

      // Act
      const { parseArguments } = await import('../index');
      const result = await parseArguments();

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '🔍 Modo dry-run activado (solo validación)'
      );
      expect(result.isDryRun).toBe(true);
    });

    it('should update environment file when envUpdates are provided', async () => {
      // Arrange
      const envUpdates = { API_BASE_URL: 'https://new-api.com' };
      mockArgumentParser.parseArguments.mockReturnValue({
        help: false,
        version: false,
        config: false,
        dryRun: false,
        envUpdates,
      });

      // Act
      const { parseArguments } = await import('../index');
      const result = await parseArguments();

      // Assert
      expect(mockEnvironmentManager.updateEnvFile).toHaveBeenCalledWith(
        envUpdates
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '✅ Configuración actualizada exitosamente'
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '🔄 Reinicia la aplicación para aplicar los cambios\n'
      );
      expect(result.envUpdates).toEqual(envUpdates);
    });

    it('should handle environment update errors', async () => {
      // Arrange
      const envUpdates = { API_BASE_URL: 'https://new-api.com' };
      const error = new Error('Update failed');
      mockArgumentParser.parseArguments.mockReturnValue({
        help: false,
        version: false,
        config: false,
        dryRun: false,
        envUpdates,
      });
      mockEnvironmentManager.updateEnvFile.mockRejectedValue(error);

      // Act
      const { parseArguments } = await import('../index');

      // La función debería llamar process.exit(1) en lugar de lanzar el error
      await parseArguments();

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Error actualizando configuración:',
        error
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should return correct values for normal execution', async () => {
      // Arrange
      mockArgumentParser.parseArguments.mockReturnValue({
        help: false,
        version: false,
        config: false,
        dryRun: false,
        envUpdates: {},
      });

      // Act
      const { parseArguments } = await import('../index');
      const result = await parseArguments();

      // Assert
      expect(result.isDryRun).toBe(false);
      expect(result.envUpdates).toEqual({});
    });

    it('should handle empty envUpdates object', async () => {
      // Arrange
      mockArgumentParser.parseArguments.mockReturnValue({
        help: false,
        version: false,
        config: false,
        dryRun: false,
        envUpdates: {},
      });

      // Act
      const { parseArguments } = await import('../index');
      const result = await parseArguments();

      // Assert
      expect(mockEnvironmentManager.updateEnvFile).not.toHaveBeenCalled();
      expect(result.envUpdates).toEqual({});
    });
  });

  describe('main function', () => {
    beforeEach(() => {
      // Configurar variables de entorno para las pruebas
      process.env.API_BASE_URL = 'http://localhost:3000/api/up_compra.php';
      process.env.API_KEY = 'test-api-key';
      process.env.EXCEL_DIRECTORY = './test-excel-files';
      process.env.PROCESSED_DIRECTORY = './test-processed-files';
      process.env.ERROR_DIRECTORY = './test-error-files';
      process.env.LOG_FILE = './test-logs/app.log';

      // Mock por defecto para argumentos normales
      mockArgumentParser.parseArguments.mockReturnValue({
        help: false,
        version: false,
        config: false,
        dryRun: false,
        run: true,
        envUpdates: {},
      });
    });

    it('should execute successfully with normal flow', async () => {
      // Arrange
      const { main } = await import('../index');

      // Act
      await main();

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '🚀 Iniciando Excel Processor...\n'
      );
      expect(mockEnvironmentManager.createExampleEnvFile).toHaveBeenCalledTimes(
        1
      );
      expect(mockExcelProcessor.run).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).not.toHaveBeenCalledWith(
        '\n✅ Procesamiento completado exitosamente'
      );
      expect(logger.info).not.toHaveBeenCalledWith(
        '✅ Procesamiento completado exitosamente'
      );
    });

    it('should execute successfully in dry-run mode', async () => {
      // Arrange
      mockArgumentParser.parseArguments.mockReturnValue({
        help: false,
        version: false,
        config: false,
        dryRun: true,
        run: false,
        envUpdates: {},
      });
      const { main } = await import('../index');

      // Act
      await main();

      // Assert
      expect(ExcelProcessor).toHaveBeenCalledWith(true); // dryRun = true
      expect(logger.info).toHaveBeenCalledWith('🚀 Excel Processor iniciado', {
        dryRun: true,
        config: {
          apiUrl: 'http://localhost:3000/api',
          excelDir: './excel-files',
        },
      });
    });

    it('should handle ExcelProcessor errors', async () => {
      // Arrange
      const error = new Error('Processing failed');
      mockExcelProcessor.run.mockRejectedValue(error);
      const { main } = await import('../index');

      // Act
      await main();

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith(
        '\n❌ Error durante el procesamiento:',
        error
      );
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Error durante el procesamiento',
        {
          error: 'Processing failed',
          stack: error.stack,
        }
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle non-Error objects', async () => {
      // Arrange
      const error = 'String error';
      mockExcelProcessor.run.mockRejectedValue(error);
      const { main } = await import('../index');

      // Act
      await main();

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith(
        '\n❌ Error durante el procesamiento:',
        error
      );
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Error durante el procesamiento',
        {
          error: 'String error',
          stack: undefined,
        }
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should log startup information correctly', async () => {
      // Arrange
      mockArgumentParser.parseArguments.mockReturnValue({
        help: false,
        version: false,
        config: false,
        dryRun: false,
        run: true,
        envUpdates: {},
      });
      const { main } = await import('../index');

      // Act
      await main();

      // Assert
      expect(logger.info).toHaveBeenCalledWith('🚀 Excel Processor iniciado', {
        dryRun: false,
        config: {
          apiUrl: 'http://localhost:3000/api',
          excelDir: './excel-files',
        },
      });
    });

    it('should handle null error objects', async () => {
      // Arrange
      const error = null;
      mockExcelProcessor.run.mockRejectedValue(error);
      const { main } = await import('../index');

      // Act
      await main();

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith(
        '\n❌ Error durante el procesamiento:',
        error
      );
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Error durante el procesamiento',
        {
          error: 'null',
          stack: undefined,
        }
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('module execution', () => {
    it('should handle main function errors when called directly', async () => {
      // Arrange
      const error = new Error('Main function error');
      mockArgumentParser.parseArguments.mockReturnValue({
        help: false,
        version: false,
        config: false,
        dryRun: false,
        run: true,
        envUpdates: {},
      });
      mockExcelProcessor.run.mockRejectedValue(error);
      const { main } = await import('../index');

      // Act
      await main();

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith(
        '\n❌ Error durante el procesamiento:',
        error
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('integration scenarios', () => {
    it('should handle dry-run with environment updates', async () => {
      // Arrange
      const envUpdates = { API_BASE_URL: 'https://test-api.com' };
      mockArgumentParser.parseArguments.mockReturnValue({
        help: false,
        version: false,
        config: false,
        dryRun: true,
        envUpdates,
      });
      const { main } = await import('../index');

      // Act
      await main();

      // Assert
      expect(mockEnvironmentManager.updateEnvFile).toHaveBeenCalledWith(
        envUpdates
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '🔍 Modo dry-run activado (solo validación)'
      );
      expect(ExcelProcessor).toHaveBeenCalledWith(true);
    });

    it('should handle multiple environment updates', async () => {
      // Arrange
      const envUpdates = {
        API_BASE_URL: 'https://new-api.com',
        API_KEY: 'new-key',
      };
      mockArgumentParser.parseArguments.mockReturnValue({
        help: false,
        version: false,
        config: false,
        dryRun: false,
        envUpdates,
      });
      const { parseArguments } = await import('../index');

      // Act
      const result = await parseArguments();

      // Assert
      expect(mockEnvironmentManager.updateEnvFile).toHaveBeenCalledWith(
        envUpdates
      );
      expect(result.envUpdates).toEqual(envUpdates);
    });

    it('should apply configuration but skip execution when not using run or dry-run', async () => {
      // Arrange
      const envUpdates = {
        API_BASE_URL: 'https://production-api.com',
        API_KEY: 'prod-key-123',
        API_TIMEOUT: '60000',
        EXCEL_DIRECTORY: '/custom/excel/path',
      };
      mockArgumentParser.parseArguments.mockReturnValue({
        help: false,
        version: false,
        config: false,
        dryRun: false,
        envUpdates,
      });
      const { main } = await import('../index');

      // Act
      await main();

      // Assert
      expect(mockEnvironmentManager.updateEnvFile).toHaveBeenCalledWith(
        envUpdates
      );
      expect(mockExcelProcessor.run).not.toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '⚙️  Configuración aplicada. Usa "run" para ejecutar o "run --dry-run" para validar.'
      );
    });

    it('should execute when using run with configuration changes', async () => {
      // Arrange
      const envUpdates = { EXCEL_DIRECTORY: '/new/path' };
      mockArgumentParser.parseArguments.mockReturnValue({
        help: false,
        version: false,
        config: false,
        dryRun: false,
        run: true,
        envUpdates,
      });
      const { main } = await import('../index');

      // Act
      await main();

      // Assert
      expect(mockEnvironmentManager.updateEnvFile).toHaveBeenCalledWith(
        envUpdates
      );
      expect(mockExcelProcessor.run).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling edge cases', () => {
    it('should handle undefined error objects', async () => {
      // Arrange
      const error = undefined;
      mockArgumentParser.parseArguments.mockReturnValue({
        help: false,
        version: false,
        config: false,
        dryRun: false,
        run: true,
        envUpdates: {},
      });
      mockExcelProcessor.run.mockRejectedValue(error);
      const { main } = await import('../index');

      // Act
      await main();

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith(
        '\n❌ Error durante el procesamiento:',
        error
      );
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Error durante el procesamiento',
        {
          error: 'undefined',
          stack: undefined,
        }
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle error objects without message property', async () => {
      // Arrange
      const error = { customProperty: 'custom value' };
      mockArgumentParser.parseArguments.mockReturnValue({
        help: false,
        version: false,
        config: false,
        dryRun: false,
        run: true,
        envUpdates: {},
      });
      mockExcelProcessor.run.mockRejectedValue(error);
      const { main } = await import('../index');

      // Act
      await main();

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith(
        '\n❌ Error durante el procesamiento:',
        error
      );
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Error durante el procesamiento',
        {
          error: '[object Object]',
          stack: undefined,
        }
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
});
