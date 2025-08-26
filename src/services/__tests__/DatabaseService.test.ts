import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Mock del logger para evitar salidas reales y poder espiar llamadas
vi.mock('../../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    verbose: vi.fn(),
    debug: vi.fn(),
  },
  StructuredLogger: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    error: vi.fn(),
  })),
}));

// Utilidad para crear una ruta temporal única de base de datos por test
const createTempDbPath = () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbservice-'));
  return path.join(tmpDir, 'processed_ids.test.db');
};

describe('DatabaseService', () => {
  let tempDbPath: string;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    tempDbPath = createTempDbPath();

    // Mock de config para apuntar a la ruta temporal
    vi.doMock('../../config/config', () => ({
      config: {
        directories: {
          sqliteDbPath: tempDbPath,
        },
        executable: {
          isExecutable: false,
          getWorkingDir: () => '/',
        },
      },
    }));
  });

  afterEach(async () => {
    // Resetear singleton entre tests
    const { DatabaseService } = await import('../DatabaseService');
    (DatabaseService as any).instance = null;
  });

  it('debe crear una instancia singleton', async () => {
    const { DatabaseService } = await import('../DatabaseService');
    const a = DatabaseService.getInstance();
    const b = DatabaseService.getInstance();

    expect(a).toBe(b);
    a.close();
  });

  it('debe inicializar la BD y permitir consultar e insertar un licitacion_id', async () => {
    const { DatabaseService } = await import('../DatabaseService');
    const service = DatabaseService.getInstance();

    const id = 'LIC-123';

    expect(service.hasLicitacionId(id)).toBe(false);
    service.addLicitacionId(id);
    expect(service.hasLicitacionId(id)).toBe(true);

    // Reinsertar no debe fallar por UNIQUE (usa INSERT OR IGNORE)
    service.addLicitacionId(id);
    expect(service.hasLicitacionId(id)).toBe(true);

    service.close();
  });

  it('debe insertar múltiples licitacion_id en transacción', async () => {
    const { DatabaseService } = await import('../DatabaseService');
    const service = DatabaseService.getInstance();

    const ids = ['A-1', 'A-2', 'A-1', 'A-3', '', 'A-4'];
    service.addManyLicitacionIds(ids);

    expect(service.hasLicitacionId('A-1')).toBe(true);
    expect(service.hasLicitacionId('A-2')).toBe(true);
    expect(service.hasLicitacionId('A-3')).toBe(true);
    expect(service.hasLicitacionId('A-4')).toBe(true);
    expect(service.hasLicitacionId('NO-EXISTE')).toBe(false);

    service.close();
  });

  it('debe cerrar la conexión sin lanzar error', async () => {
    const { DatabaseService } = await import('../DatabaseService');
    const service = DatabaseService.getInstance();
    expect(() => service.close()).not.toThrow();
  });
});
