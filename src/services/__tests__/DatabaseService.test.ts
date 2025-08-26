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

// Función para validar formato UUID v4
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
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

    expect(await service.hasLicitacionId(id)).toBe(false);
    await service.addLicitacionId(id);
    expect(await service.hasLicitacionId(id)).toBe(true);

    // Reinsertar no debe fallar por UNIQUE (usa INSERT OR IGNORE)
    await service.addLicitacionId(id);
    expect(await service.hasLicitacionId(id)).toBe(true);

    await service.close();
  });

  it('debe insertar múltiples licitacion_id en transacción', async () => {
    const { DatabaseService } = await import('../DatabaseService');
    const service = DatabaseService.getInstance();

    const ids = ['A-1', 'A-2', 'A-1', 'A-3', '', 'A-4'];
    await service.addManyLicitacionIds(ids);

    expect(await service.hasLicitacionId('A-1')).toBe(true);
    expect(await service.hasLicitacionId('A-2')).toBe(true);
    expect(await service.hasLicitacionId('A-3')).toBe(true);
    expect(await service.hasLicitacionId('A-4')).toBe(true);
    expect(await service.hasLicitacionId('NO-EXISTE')).toBe(false);

    await service.close();
  });

  it('debe generar UUIDs válidos para los registros insertados', async () => {
    const { DatabaseService } = await import('../DatabaseService');
    const service = DatabaseService.getInstance();

    // Acceder directamente a la base de datos para verificar los UUIDs
    const db = (service as any).db;

    const licitacionId = 'TEST-UUID-123';
    await service.addLicitacionId(licitacionId);

    // Consultar el registro insertado para verificar el UUID
    const row = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, licitacion_id FROM processed_records WHERE licitacion_id = ?',
        [licitacionId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    expect(row).toBeDefined();
    expect((row as any).licitacion_id).toBe(licitacionId);
    expect(isValidUUID((row as any).id)).toBe(true);

    await service.close();
  });

  it('debe cerrar la conexión sin lanzar error', async () => {
    const { DatabaseService } = await import('../DatabaseService');
    const service = DatabaseService.getInstance();
    await expect(service.close()).resolves.not.toThrow();
  });
});
