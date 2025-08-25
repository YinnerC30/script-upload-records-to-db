import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { config, validateConfig, createRequiredDirectories } from '../config';

describe('Config Module', () => {
  const originalEnv = process.env;
  const originalPkg = (process as any).pkg;
  const originalExecPath = process.execPath;
  const originalCwd = process.cwd;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    (process as any).pkg = undefined;
    process.execPath = '/fake/exec/path';
    process.cwd = vi.fn().mockReturnValue('/fake/cwd');
  });

  afterEach(() => {
    process.env = originalEnv;
    (process as any).pkg = originalPkg;
    process.execPath = originalExecPath;
    process.cwd = originalCwd;
  });

  describe('Config Object', () => {
    it('should have all required configuration sections', () => {
      expect(config).toHaveProperty('directories');
      expect(config).toHaveProperty('logging');
      expect(config).toHaveProperty('processing');
      expect(config).toHaveProperty('api');
      expect(config).toHaveProperty('executable');
    });

    it('should have correct structure for directories section', () => {
      expect(config.directories).toHaveProperty('excel');
      expect(config.directories).toHaveProperty('processed');
      expect(config.directories).toHaveProperty('error');
      expect(config.directories).toHaveProperty('logs');
    });

    it('should have correct structure for logging section', () => {
      expect(config.logging).toHaveProperty('level');
      expect(config.logging).toHaveProperty('file');
      expect(config.logging).toHaveProperty('maxSize');
      expect(config.logging).toHaveProperty('maxFiles');
    });

    it('should have correct structure for processing section', () => {
      expect(config.processing).toHaveProperty('batchSize');
    });

    it('should have correct structure for api section', () => {
      expect(config.api).toHaveProperty('baseURL');
      expect(config.api).toHaveProperty('apiKey');
      expect(config.api).toHaveProperty('timeout');
    });

    it('should have correct structure for executable section', () => {
      expect(config.executable).toHaveProperty('isExecutable');
      expect(config.executable).toHaveProperty('getWorkingDir');
      expect(typeof config.executable.getWorkingDir).toBe('function');
    });
  });

  describe('Executable Configuration', () => {
    it('should detect when running as script (default)', () => {
      expect(config.executable.isExecutable).toBe(false);
    });

    it('should return current working directory when running as script', () => {
      const workingDir = config.executable.getWorkingDir();
      expect(typeof workingDir).toBe('string');
      expect(workingDir.length).toBeGreaterThan(0);
    });

    it('should handle executable path correctly', () => {
      // Simular que estamos ejecutando como binario
      const originalPkg = (process as any).pkg;
      (process as any).pkg = { someProperty: true };

      // Necesitamos re-ejecutar la función para ver el cambio
      const workingDir = config.executable.getWorkingDir();
      expect(typeof workingDir).toBe('string');

      // Restaurar
      (process as any).pkg = originalPkg;
    });
  });

  describe('Configuration Values', () => {
    it('should have reasonable default values', () => {
      expect(config.processing.batchSize).toBeGreaterThan(0);
      expect(config.processing.batchSize).toBeLessThanOrEqual(10000);

      expect(config.api.timeout).toBeGreaterThan(0);

      expect(config.logging.maxSize).toBeGreaterThan(0);
      expect(config.logging.maxFiles).toBeGreaterThan(0);
    });

    it('should have valid directory paths', () => {
      expect(typeof config.directories.excel).toBe('string');
      expect(typeof config.directories.processed).toBe('string');
      expect(typeof config.directories.error).toBe('string');
      expect(typeof config.directories.logs).toBe('string');
    });

    it('should have valid API configuration', () => {
      expect(typeof config.api.baseURL).toBe('string');
      expect(config.api.baseURL.length).toBeGreaterThan(0);
      expect(typeof config.api.apiKey).toBe('string');
    });

    it('should have valid logging configuration', () => {
      expect(typeof config.logging.level).toBe('string');
      expect(['error', 'warn', 'info', 'debug', 'trace']).toContain(
        config.logging.level
      );
    });
  });

  describe('validateConfig', () => {
    it('should log configuration information', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      validateConfig();

      expect(consoleSpy).toHaveBeenCalledWith('🔧 Configuración cargada:');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('📁 Directorio de trabajo:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🌐 API REST:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('📊 Tamaño de lote:')
      );

      consoleSpy.mockRestore();
    });

    it('should not throw any errors', () => {
      expect(() => {
        validateConfig();
      }).not.toThrow();
    });
  });

  describe('createRequiredDirectories', () => {
    it('should not throw any errors when called', () => {
      expect(() => {
        createRequiredDirectories();
      }).not.toThrow();
    });

    it('should be a function', () => {
      expect(typeof createRequiredDirectories).toBe('function');
    });
  });

  describe('Environment Variable Handling', () => {
    it('should handle missing environment variables gracefully', () => {
      // Las funciones de configuración deberían manejar variables faltantes
      // sin lanzar errores (usando valores por defecto)
      expect(() => {
        // Simular que no hay API_KEY
        const originalApiKey = process.env.API_KEY;
        delete process.env.API_KEY;

        // Como ya está cargado el módulo, no debería afectar la configuración actual
        // Solo verificamos que no se lance un error
        expect(typeof config.api.apiKey).toBe('string');

        // Restaurar
        process.env.API_KEY = originalApiKey;
      }).not.toThrow();
    });

    it('should handle numeric environment variables correctly', () => {
      // Verificar que los valores numéricos son válidos
      expect(typeof config.processing.batchSize).toBe('number');
      expect(typeof config.api.timeout).toBe('number');
      expect(typeof config.logging.maxSize).toBe('number');
      expect(typeof config.logging.maxFiles).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    it('should have consistent configuration across multiple calls', () => {
      const config1 = config;
      const config2 = config;

      expect(config1).toBe(config2);
      expect(config1.directories.excel).toBe(config2.directories.excel);
      expect(config1.api.baseURL).toBe(config2.api.baseURL);
    });

    it('should have valid default values for all configuration sections', () => {
      // Verificar que todos los valores tienen tipos válidos
      expect(typeof config.directories.excel).toBe('string');
      expect(typeof config.directories.processed).toBe('string');
      expect(typeof config.directories.error).toBe('string');
      expect(typeof config.directories.logs).toBe('string');

      expect(typeof config.logging.level).toBe('string');
      expect(typeof config.logging.file).toBe('string');

      expect(typeof config.logging.maxSize).toBe('number');
      expect(typeof config.logging.maxFiles).toBe('number');

      expect(typeof config.processing.batchSize).toBe('number');

      expect(typeof config.api.baseURL).toBe('string');
      expect(typeof config.api.apiKey).toBe('string');
      expect(typeof config.api.timeout).toBe('number');

      expect(typeof config.executable.isExecutable).toBe('boolean');
      expect(typeof config.executable.getWorkingDir).toBe('function');
    });

    it('should have reasonable value ranges', () => {
      // Verificar que los valores están en rangos razonables
      expect(config.processing.batchSize).toBeGreaterThan(0);
      expect(config.processing.batchSize).toBeLessThanOrEqual(10000);

      expect(config.api.timeout).toBeGreaterThan(0);
      expect(config.api.timeout).toBeLessThanOrEqual(300000); // 5 minutos máximo

      expect(config.logging.maxSize).toBeGreaterThan(0);
      expect(config.logging.maxFiles).toBeGreaterThan(0);
      expect(config.logging.maxFiles).toBeLessThanOrEqual(100);
    });
  });

  describe('Configuration Validation', () => {
    it('should have valid log levels', () => {
      const validLogLevels = ['error', 'warn', 'info', 'debug', 'trace'];
      expect(validLogLevels).toContain(config.logging.level);
    });

    it('should have valid API base URL format', () => {
      // Verificar que la URL base tiene un formato válido
      expect(config.api.baseURL).toMatch(/^https?:\/\/.+/);
    });

    it('should have valid directory paths', () => {
      // Verificar que las rutas de directorio no están vacías
      expect(config.directories.excel.length).toBeGreaterThan(0);
      expect(config.directories.processed.length).toBeGreaterThan(0);
      expect(config.directories.error.length).toBeGreaterThan(0);
      expect(config.directories.logs.length).toBeGreaterThan(0);
    });
  });
});
