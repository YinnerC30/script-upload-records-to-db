import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExcelProcessor, ExcelRow } from '../ExcelProcessor';
import * as fs from 'fs';
import * as path from 'path';

// Mock de las dependencias
vi.mock('fs');
vi.mock('path');
vi.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: vi.fn(() => ({
      save: vi.fn().mockResolvedValue([]),
    })),
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
    it('should return null when no Excel files exist', () => {
      mockFs.readdirSync.mockReturnValue(['file.txt', 'document.pdf'] as any);

      const result = processor.findLatestExcelFile();

      expect(result).toBeNull();
    });

    it('should return the most recent Excel file', () => {
      const mockStats = {
        mtime: new Date('2023-01-02'),
      };

      mockFs.readdirSync.mockReturnValue(['old.xlsx', 'new.xlsx'] as any);
      mockFs.statSync.mockReturnValue(mockStats as any);
      mockPath.join.mockImplementation((...args) => args.join('/'));
      mockPath.extname.mockReturnValue('.xlsx');

      const result = processor.findLatestExcelFile();

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
  });

  describe('parseDate', () => {
    it('should parse string date correctly', () => {
      const result = processor['parseDate']('2023-01-01');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2023);
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
