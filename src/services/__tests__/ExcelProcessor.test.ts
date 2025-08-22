import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExcelProcessor, ExcelRow } from '../ExcelProcessor';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock de las dependencias
vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(),
    mkdir: vi.fn(),
    readdir: vi.fn(() => []),
    stat: vi.fn(() => ({ mtime: new Date() })),
    rename: vi.fn(),
  },
  access: vi.fn(),
  mkdir: vi.fn(),
  readdir: vi.fn(() => []),
  stat: vi.fn(() => ({ mtime: new Date() })),
  rename: vi.fn(),
}));

vi.mock('path');
vi.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: vi.fn(() => ({
      save: vi.fn().mockResolvedValue([]),
    })),
  },
}));

vi.mock('xlsx', () => ({
  readFile: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(),
  },
}));

describe('ExcelProcessor', () => {
  let processor: ExcelProcessor;
  const mockFs = vi.mocked(fs);
  const mockPath = vi.mocked(path);

  beforeEach(() => {
    vi.clearAllMocks();
    processor = new ExcelProcessor();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('findLatestExcelFile', () => {
    it('should return null when no Excel files exist', async () => {
      mockFs.readdir.mockResolvedValue(['file.txt', 'document.pdf'] as any);
      mockPath.extname.mockReturnValue('.txt');

      const result = await processor.findLatestExcelFile();

      expect(result).toBeNull();
    });

    it('should return the most recent Excel file', async () => {
      const mockStatsOld = {
        mtime: new Date('2023-01-01'),
      };
      const mockStatsNew = {
        mtime: new Date('2023-01-02'),
      };

      mockFs.readdir.mockResolvedValue(['old.xlsx', 'new.xlsx'] as any);
      mockFs.stat
        .mockResolvedValueOnce(mockStatsOld as any)
        .mockResolvedValueOnce(mockStatsNew as any);
      mockPath.join.mockImplementation((...args) => args.join('/'));
      mockPath.extname
        .mockReturnValueOnce('.xlsx')
        .mockReturnValueOnce('.xlsx');

      const result = await processor.findLatestExcelFile();

      expect(result).toBe('./excel-files/new.xlsx');
    });
  });

  describe('validateData', () => {
    it('should return false for empty array', async () => {
      const result = await processor['validateData']([]);
      expect(result).toBe(false);
    });

    it('should return false for invalid data structure', async () => {
      const result = await processor['validateData'](null as any);
      expect(result).toBe(false);
    });

    it('should return false when records lack required fields', async () => {
      const data: ExcelRow[] = [
        { nombre: 'Test', organismo: 'Test Org' }, // Sin idLicitacion
        { idLicitacion: '123', nombre: 'Test 2' },
      ];

      const result = await processor['validateData'](data);
      expect(result).toBe(false);
    });

    it('should return true for valid data', async () => {
      const data: ExcelRow[] = [
        { idLicitacion: '123', nombre: 'Test' },
        { idLicitacion: '456', nombre: 'Test 2' },
      ];

      const result = await processor['validateData'](data);
      expect(result).toBe(true);
    });

    // Nuevos tests para validaciones mejoradas
    it('should validate required fields properly', async () => {
      const data: ExcelRow[] = [
        {
          idLicitacion: '123',
          nombre: 'Licitación Test',
          organismo: 'Organismo Test',
          unidad: 'Unidad Test'
        }
      ];

      const result = await processor['validateData'](data);
      expect(result).toBe(true);
    });

    it('should reject records with missing required fields', async () => {
      const data: ExcelRow[] = [
        {
          idLicitacion: '', // Vacío
          nombre: 'Licitación Test',
          organismo: 'Organismo Test',
          unidad: 'Unidad Test'
        }
      ];

      const result = await processor['validateData'](data);
      expect(result).toBe(false);
    });

    it('should validate date formats', async () => {
      const data: ExcelRow[] = [
        {
          idLicitacion: '123',
          nombre: 'Licitación Test',
          organismo: 'Organismo Test',
          unidad: 'Unidad Test',
          fechaPublicacion: '2023-01-01',
          fechaCierre: '2023-01-31'
        }
      ];

      const result = await processor['validateData'](data);
      expect(result).toBe(true);
    });

    it('should reject invalid date formats', async () => {
      const data: ExcelRow[] = [
        {
          idLicitacion: '123',
          nombre: 'Licitación Test',
          organismo: 'Organismo Test',
          unidad: 'Unidad Test',
          fechaPublicacion: 'fecha-invalida',
          fechaCierre: '2023-01-31'
        }
      ];

      const result = await processor['validateData'](data);
      expect(result).toBe(false);
    });

    it('should validate date ranges', async () => {
      const data: ExcelRow[] = [
        {
          idLicitacion: '123',
          nombre: 'Licitación Test',
          organismo: 'Organismo Test',
          unidad: 'Unidad Test',
          fechaPublicacion: '2023-01-01',
          fechaCierre: '2023-01-31' // Después de publicación
        }
      ];

      const result = await processor['validateData'](data);
      expect(result).toBe(true);
    });

    it('should reject invalid date ranges', async () => {
      const data: ExcelRow[] = [
        {
          idLicitacion: '123',
          nombre: 'Licitación Test',
          organismo: 'Organismo Test',
          unidad: 'Unidad Test',
          fechaPublicacion: '2023-01-31',
          fechaCierre: '2023-01-01' // Antes de publicación
        }
      ];

      const result = await processor['validateData'](data);
      expect(result).toBe(false);
    });

    it('should validate numeric fields', async () => {
      const data: ExcelRow[] = [
        {
          idLicitacion: '123',
          nombre: 'Licitación Test',
          organismo: 'Organismo Test',
          unidad: 'Unidad Test',
          montoDisponible: 1000.50
        }
      ];

      const result = await processor['validateData'](data);
      expect(result).toBe(true);
    });

    it('should validate string numeric fields', async () => {
      const data: ExcelRow[] = [
        {
          idLicitacion: '123',
          nombre: 'Licitación Test',
          organismo: 'Organismo Test',
          unidad: 'Unidad Test',
          montoDisponible: '1000.50'
        }
      ];

      const result = await processor['validateData'](data);
      expect(result).toBe(true);
    });

    it('should reject invalid numeric fields', async () => {
      const data: ExcelRow[] = [
        {
          idLicitacion: '123',
          nombre: 'Licitación Test',
          organismo: 'Organismo Test',
          unidad: 'Unidad Test',
          montoDisponible: 'no-es-numero'
        }
      ];

      const result = await processor['validateData'](data);
      expect(result).toBe(false);
    });

    it('should validate field length limits', async () => {
      const data: ExcelRow[] = [
        {
          idLicitacion: '123',
          nombre: 'A'.repeat(500), // Máximo permitido
          organismo: 'B'.repeat(300), // Máximo permitido
          unidad: 'C'.repeat(200), // Máximo permitido
          moneda: 'USD',
          estado: 'Activo'
        }
      ];

      const result = await processor['validateData'](data);
      expect(result).toBe(true);
    });

    it('should reject fields exceeding length limits', async () => {
      const data: ExcelRow[] = [
        {
          idLicitacion: '123',
          nombre: 'A'.repeat(501), // Excede límite
          organismo: 'Organismo Test',
          unidad: 'Unidad Test'
        }
      ];

      const result = await processor['validateData'](data);
      expect(result).toBe(false);
    });

    it('should handle undefined rows gracefully', async () => {
      const data: ExcelRow[] = [
        {
          idLicitacion: '123',
          nombre: 'Licitación Test',
          organismo: 'Organismo Test',
          unidad: 'Unidad Test'
        },
        undefined as any, // Fila undefined
        {
          idLicitacion: '456',
          nombre: 'Licitación Test 2',
          organismo: 'Organismo Test 2',
          unidad: 'Unidad Test 2'
        }
      ];

      const result = await processor['validateData'](data);
      expect(result).toBe(false);
    });
  });

  describe('parseDate', () => {
    it('should parse string date correctly', () => {
      const result = processor['parseDate']('2023-01-01');

      expect(result).toBeInstanceOf(Date);
      // Verificar que la fecha sea correcta sin depender de zona horaria
      const expectedDate = new Date('2023-01-01');
      expect(result.getTime()).toBe(expectedDate.getTime());
    });

    it('should return current date for invalid date', () => {
      const result = processor['parseDate']('invalid-date');
      expect(result).toBeInstanceOf(Date);
    });

    it('should return current date for undefined', () => {
      const result = processor['parseDate'](undefined);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('parseNumber', () => {
    it('should parse number correctly', () => {
      const result = processor['parseNumber'](123.45);
      expect(result).toBe(123.45);
    });

    it('should parse string number correctly', () => {
      const result = processor['parseNumber']('123.45');
      expect(result).toBe(123.45);
    });

    it('should handle currency strings', () => {
      const result = processor['parseNumber']('$1,234.56');
      expect(result).toBe(1234.56);
    });

    it('should return 0 for invalid number', () => {
      const result = processor['parseNumber']('invalid');
      expect(result).toBe(0);
    });
  });
});

describe('ExcelProcessor - Mapeo de Encabezados', () => {
  let processor: ExcelProcessor;

  beforeEach(() => {
    processor = new ExcelProcessor();
  });

  describe('normalizeHeader', () => {
    it('should normalize headers correctly', () => {
      const testCases = [
        { input: 'ID', expected: 'id' },
        { input: 'Nombre', expected: 'nombre' },
        { input: 'Fecha de Publicación', expected: 'fecha de publicacion' },
        { input: 'Fecha de cierre', expected: 'fecha de cierre' },
        { input: 'Organismo', expected: 'organismo' },
        { input: 'Unidad', expected: 'unidad' },
        { input: 'Monto Disponible', expected: 'monto disponible' },
        { input: 'Moneda', expected: 'moneda' },
        { input: 'Estado', expected: 'estado' },
        { input: '  ID  ', expected: 'id' },
        { input: 'Fecha   de   Publicación', expected: 'fecha de publicacion' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = (processor as any).normalizeHeader(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle accented characters', () => {
      const testCases = [
        { input: 'Publicación', expected: 'publicacion' },
        { input: 'Organismo', expected: 'organismo' },
        { input: 'Unidad', expected: 'unidad' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = (processor as any).normalizeHeader(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('mapHeadersAndTransformData', () => {
    it('should map headers correctly', () => {
      const rawData = [
        {
          ID: 'LIC001',
          Nombre: 'Licitación Test',
          'Fecha de Publicación': '2024-01-01',
          'Fecha de cierre': '2024-02-01',
          Organismo: 'Ministerio Test',
          Unidad: 'Unidad Test',
          'Monto Disponible': '1000000',
          Moneda: 'CLP',
          Estado: 'Activa',
        },
      ];

      const result = (processor as any).mapHeadersAndTransformData(rawData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        idLicitacion: 'LIC001',
        nombre: 'Licitación Test',
        fechaPublicacion: '2024-01-01',
        fechaCierre: '2024-02-01',
        organismo: 'Ministerio Test',
        unidad: 'Unidad Test',
        montoDisponible: '1000000',
        moneda: 'CLP',
        estado: 'Activa',
      });
    });

    it('should handle empty data', () => {
      const result = (processor as any).mapHeadersAndTransformData([]);
      expect(result).toEqual([]);
    });

    it('should handle unmapped headers', () => {
      const rawData = [
        {
          ID: 'LIC001',
          Nombre: 'Licitación Test',
          'Campo Desconocido': 'valor',
          Estado: 'Activa',
        },
      ];

      const result = (processor as any).mapHeadersAndTransformData(rawData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        idLicitacion: 'LIC001',
        nombre: 'Licitación Test',
        estado: 'Activa',
      });
      // El campo 'Campo Desconocido' no debería estar en el resultado
      expect(result[0]['Campo Desconocido']).toBeUndefined();
    });
  });
});
