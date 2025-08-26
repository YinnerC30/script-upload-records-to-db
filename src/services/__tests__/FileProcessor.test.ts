import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileProcessor } from '../FileProcessor';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock del módulo fs/promises
vi.mock('fs/promises', () => ({
  access: vi.fn(),
  mkdir: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
  rename: vi.fn(),
  readFile: vi.fn(),
}));

// Mock del logger
vi.mock('../../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('FileProcessor', () => {
  let fileProcessor: FileProcessor;
  const mockExcelDir = '/test/excel';
  const mockProcessedDir = '/test/processed';
  const mockErrorDir = '/test/error';

  beforeEach(() => {
    fileProcessor = new FileProcessor(
      mockExcelDir,
      mockProcessedDir,
      mockErrorDir
    );
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct directories', () => {
      const processor = new FileProcessor('/excel', '/processed', '/error');

      // Verificar que las propiedades privadas se establecen correctamente
      expect(processor).toBeInstanceOf(FileProcessor);
    });
  });

  describe('ensureDirectories', () => {
    it('should create directories when they do not exist', async () => {
      const mockAccess = vi.mocked(fs.access);
      const mockMkdir = vi.mocked(fs.mkdir);

      // Simular que los directorios no existen
      mockAccess.mockRejectedValue(new Error('Directory not found'));

      await fileProcessor.ensureDirectories();

      expect(mockAccess).toHaveBeenCalledTimes(3);
      expect(mockAccess).toHaveBeenCalledWith(mockExcelDir);
      expect(mockAccess).toHaveBeenCalledWith(mockProcessedDir);
      expect(mockAccess).toHaveBeenCalledWith(mockErrorDir);

      expect(mockMkdir).toHaveBeenCalledTimes(3);
      expect(mockMkdir).toHaveBeenCalledWith(mockExcelDir, { recursive: true });
      expect(mockMkdir).toHaveBeenCalledWith(mockProcessedDir, {
        recursive: true,
      });
      expect(mockMkdir).toHaveBeenCalledWith(mockErrorDir, { recursive: true });
    });

    it('should not create directories when they already exist', async () => {
      const mockAccess = vi.mocked(fs.access);
      const mockMkdir = vi.mocked(fs.mkdir);

      // Simular que los directorios ya existen
      mockAccess.mockResolvedValue(undefined);

      await fileProcessor.ensureDirectories();

      expect(mockAccess).toHaveBeenCalledTimes(3);
      expect(mockMkdir).not.toHaveBeenCalled();
    });
  });

  describe('findLatestExcelFile', () => {
    it('should return the most recent Excel file', async () => {
      const mockReaddir = vi.mocked(fs.readdir);
      const mockStat = vi.mocked(fs.stat);

      // Simular archivos en el directorio
      mockReaddir.mockResolvedValue([
        'old-file.xlsx',
        'new-file.xlsx',
        'text-file.txt',
        'another-file.xls',
      ] as any);

      // Simular estadísticas de archivos con diferentes fechas
      // El método itera sobre los archivos Excel en el orden que aparecen en el array
      mockStat
        .mockResolvedValueOnce({
          mtime: new Date('2023-01-01'),
        } as any) // old-file.xlsx
        .mockResolvedValueOnce({
          mtime: new Date('2023-01-02'),
        } as any) // new-file.xlsx
        .mockResolvedValueOnce({
          mtime: new Date('2023-01-03'),
        } as any); // another-file.xls

      const result = await fileProcessor.findLatestExcelFile();

      expect(result).toBe(path.join(mockExcelDir, 'another-file.xls'));
      expect(mockReaddir).toHaveBeenCalledWith(mockExcelDir);
      expect(mockStat).toHaveBeenCalledTimes(3); // Solo para archivos Excel
    });

    it('should return null when no Excel files exist', async () => {
      const mockReaddir = vi.mocked(fs.readdir);

      mockReaddir.mockResolvedValue(['text-file.txt', 'image.jpg'] as any);

      const result = await fileProcessor.findLatestExcelFile();

      expect(result).toBeNull();
      expect(mockReaddir).toHaveBeenCalledWith(mockExcelDir);
    });

    it('should handle readdir errors', async () => {
      const mockReaddir = vi.mocked(fs.readdir);
      const mockLogger = vi.mocked(await import('../../utils/logger')).default;

      mockReaddir.mockRejectedValue(new Error('Permission denied'));

      await expect(fileProcessor.findLatestExcelFile()).rejects.toThrow(
        'Permission denied'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error buscando archivo Excel más reciente',
        expect.objectContaining({
          directory: mockExcelDir,
          error: 'Permission denied',
        })
      );
    });
  });

  describe('moveToProcessed', () => {
    it('should move file to processed directory', async () => {
      const mockRename = vi.mocked(fs.rename);
      const mockLogger = vi.mocked(await import('../../utils/logger')).default;

      const filePath = '/test/excel/file.xlsx';
      const fileName = 'file.xlsx';
      const expectedDestination = path.join(mockProcessedDir, fileName);

      await fileProcessor.moveToProcessed(filePath, fileName);

      expect(mockRename).toHaveBeenCalledWith(filePath, expectedDestination);
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Archivo movido a procesados: ${fileName}`
      );
    });
  });

  describe('moveToError', () => {
    it('should move file to error directory', async () => {
      const mockRename = vi.mocked(fs.rename);
      const mockLogger = vi.mocked(await import('../../utils/logger')).default;

      const filePath = '/test/excel/file.xlsx';
      const fileName = 'file.xlsx';
      const expectedDestination = path.join(mockErrorDir, fileName);

      await fileProcessor.moveToError(filePath, fileName);

      expect(mockRename).toHaveBeenCalledWith(filePath, expectedDestination);
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Archivo movido a errores: ${fileName}`
      );
    });
  });

  describe('readExcelFile', () => {
    it('should read file content successfully', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockBuffer = Buffer.from('test content');

      mockReadFile.mockResolvedValue(mockBuffer);

      const filePath = '/test/excel/file.xlsx';
      const result = await fileProcessor.readExcelFile(filePath);

      expect(mockReadFile).toHaveBeenCalledWith(filePath);
      expect(result).toBe(mockBuffer);
    });

    it('should handle read file errors', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockLogger = vi.mocked(await import('../../utils/logger')).default;

      mockReadFile.mockRejectedValue(new Error('File not found'));

      const filePath = '/test/excel/file.xlsx';

      await expect(fileProcessor.readExcelFile(filePath)).rejects.toThrow(
        'File not found'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error leyendo archivo Excel',
        expect.objectContaining({
          filePath,
          error: 'File not found',
        })
      );
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      const mockAccess = vi.mocked(fs.access);

      mockAccess.mockResolvedValue(undefined);

      const filePath = '/test/excel/file.xlsx';
      const result = await fileProcessor.fileExists(filePath);

      expect(mockAccess).toHaveBeenCalledWith(filePath);
      expect(result).toBe(true);
    });

    it('should return false when file does not exist', async () => {
      const mockAccess = vi.mocked(fs.access);

      mockAccess.mockRejectedValue(new Error('File not found'));

      const filePath = '/test/excel/file.xlsx';
      const result = await fileProcessor.fileExists(filePath);

      expect(mockAccess).toHaveBeenCalledWith(filePath);
      expect(result).toBe(false);
    });
  });

  describe('getDirectoryStats', () => {
    it('should return correct directory statistics', async () => {
      const mockReaddir = vi.mocked(fs.readdir);

      mockReaddir.mockResolvedValue([
        'file1.xlsx',
        'file2.xls',
        'file3.txt',
        'file4.jpg',
        'file5.xlsx',
      ] as any);

      const directory = '/test/directory';
      const result = await fileProcessor.getDirectoryStats(directory);

      expect(mockReaddir).toHaveBeenCalledWith(directory);
      expect(result).toEqual({
        totalFiles: 5,
        excelFiles: 3, // .xlsx y .xls files
        processedFiles: 0,
        errorFiles: 0,
      });
    });

    it('should handle empty directory', async () => {
      const mockReaddir = vi.mocked(fs.readdir);

      mockReaddir.mockResolvedValue([] as any);

      const directory = '/test/empty-directory';
      const result = await fileProcessor.getDirectoryStats(directory);

      expect(result).toEqual({
        totalFiles: 0,
        excelFiles: 0,
        processedFiles: 0,
        errorFiles: 0,
      });
    });

    it('should handle directory read errors', async () => {
      const mockReaddir = vi.mocked(fs.readdir);
      const mockLogger = vi.mocked(await import('../../utils/logger')).default;

      mockReaddir.mockRejectedValue(new Error('Permission denied'));

      const directory = '/test/inaccessible-directory';
      const result = await fileProcessor.getDirectoryStats(directory);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error obteniendo estadísticas del directorio',
        expect.objectContaining({
          directory,
          error: 'Permission denied',
        })
      );
      expect(result).toEqual({
        totalFiles: 0,
        excelFiles: 0,
        processedFiles: 0,
        errorFiles: 0,
      });
    });

    it('should filter Excel files correctly', async () => {
      const mockReaddir = vi.mocked(fs.readdir);

      mockReaddir.mockResolvedValue([
        'file1.XLSX', // Mayúsculas
        'file2.xls', // Minúsculas
        'file3.XLS', // Mayúsculas
        'file4.xlsx', // Minúsculas
        'file5.txt',
        'file6.pdf',
        'file7.doc',
      ] as any);

      const directory = '/test/directory';
      const result = await fileProcessor.getDirectoryStats(directory);

      expect(result.excelFiles).toBe(4); // Solo archivos .xlsx y .xls (case insensitive)
    });
  });
});
