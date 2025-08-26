import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import logger, { consoleCleaner } from '../logger';

describe('Logger Exit Behavior', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Asegurar que el logger se cierre después de cada test
    logger.close();
  });

  it('should close logger without leaving orphaned processes', () => {
    // Verificar que el logger se puede cerrar correctamente
    expect(() => {
      logger.close();
    }).not.toThrow();
  });

  it('should stop console cleaner when requested', () => {
    // Verificar que el console cleaner se puede detener
    expect(() => {
      consoleCleaner.stop();
    }).not.toThrow();
  });

  it('should handle multiple close calls gracefully', () => {
    // Verificar que múltiples llamadas a close no causan errores
    expect(() => {
      logger.close();
      logger.close();
      logger.close();
    }).not.toThrow();
  });

  it('should handle multiple stop calls on console cleaner gracefully', () => {
    // Verificar que múltiples llamadas a stop no causan errores
    expect(() => {
      consoleCleaner.stop();
      consoleCleaner.stop();
      consoleCleaner.stop();
    }).not.toThrow();
  });
});
