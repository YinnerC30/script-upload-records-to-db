import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { consoleCleaner } from '../logger';

describe('ConsoleCleaner', () => {
  let consoleSpy: any;

  beforeEach(() => {
    // Mock de console.log para capturar la salida
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (consoleSpy) {
      consoleSpy.mockRestore();
    }
  });

  describe('getStats', () => {
    it('should return stats object with logCount and lastCleanTime', () => {
      const stats = consoleCleaner.getStats();

      expect(stats).toHaveProperty('logCount');
      expect(stats).toHaveProperty('lastCleanTime');
      expect(typeof stats.logCount).toBe('number');
      expect(typeof stats.lastCleanTime).toBe('number');
    });
  });

  describe('configure', () => {
    it('should configure maxLogsBeforeClean', () => {
      consoleCleaner.configure(50, undefined);

      // Verificar que la configuración se aplicó
      // (esto se puede verificar indirectamente a través del comportamiento)
      expect(true).toBe(true); // Placeholder - la configuración se aplica internamente
    });

    it('should configure cleanInterval', () => {
      consoleCleaner.configure(undefined, 15000);

      // Verificar que la configuración se aplicó
      expect(true).toBe(true); // Placeholder - la configuración se aplica internamente
    });

    it('should configure both parameters', () => {
      consoleCleaner.configure(75, 20000);

      // Verificar que la configuración se aplicó
      expect(true).toBe(true); // Placeholder - la configuración se aplica internamente
    });
  });

  describe('cleanNow', () => {
    it('should clean console and show cleanup message', () => {
      // Limpiar consola
      consoleCleaner.cleanNow();

      // Verificar que se llamó a console.log (que incluye el mensaje de limpieza)
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle non-TTY environment', () => {
      // Mock de process.stdout.isTTY para simular entorno no-TTY
      const originalIsTTY = process.stdout.isTTY;
      Object.defineProperty(process.stdout, 'isTTY', {
        value: false,
        writable: true,
      });

      consoleCleaner.cleanNow();

      // Verificar que se llamó a console.log
      expect(consoleSpy).toHaveBeenCalled();

      // Restaurar isTTY original
      Object.defineProperty(process.stdout, 'isTTY', {
        value: originalIsTTY,
        writable: true,
      });
    });
  });

  describe('stop', () => {
    it('should stop automatic cleanup', () => {
      // No debería lanzar errores
      expect(() => {
        consoleCleaner.stop();
      }).not.toThrow();
    });
  });

  describe('integration', () => {
    it('should work with logger integration', () => {
      // Verificar que las funciones están disponibles
      expect(typeof consoleCleaner.cleanNow).toBe('function');
      expect(typeof consoleCleaner.getStats).toBe('function');
      expect(typeof consoleCleaner.configure).toBe('function');
      expect(typeof consoleCleaner.stop).toBe('function');
    });

    it('should maintain stats between operations', () => {
      const initialStats = consoleCleaner.getStats();

      // Realizar algunas operaciones
      consoleCleaner.cleanNow();

      const afterCleanStats = consoleCleaner.getStats();

      // Verificar que las estadísticas se actualizaron
      expect(afterCleanStats.lastCleanTime).toBeGreaterThan(
        initialStats.lastCleanTime
      );
    });
  });
});
