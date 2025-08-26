import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExcelProcessor } from '../ExcelProcessor';
import { FileProcessor } from '../FileProcessor';
import { ExcelValidator } from '../ExcelValidator';
import { DataTransformer } from '../DataTransformer';
import { ApiService } from '../ApiService';
import { DatabaseService } from '../DatabaseService';
import { ExcelRow, FailedRecord, LicitacionApiData } from '../../types/excel';
import * as XLSX from 'xlsx';
import * as path from 'path';

// Mock de todas las dependencias
vi.mock('../FileProcessor');
vi.mock('../ExcelValidator');
vi.mock('../DataTransformer');
vi.mock('../ApiService');
vi.mock('../DatabaseService');
vi.mock('../../utils/logger');
vi.mock('xlsx');
vi.mock('path');

// Mock de console.log para evitar output en pruebas
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

describe('ExcelProcessor', () => {
  let excelProcessor: ExcelProcessor;
  let mockFileProcessor: any;
  let mockValidator: any;
  let mockTransformer: any;
  let mockApiService: any;
  let mockDbService: any;

  beforeEach(() => {
    // Limpiar todos los mocks
    vi.clearAllMocks();

    // Mock de Date.now para evitar problemas con timestamps
    vi.spyOn(Date, 'now').mockReturnValue(1640995200000); // 2022-01-01 00:00:00

    // Configurar variables de entorno para las pruebas
    process.env.API_BASE_URL = 'http://localhost:3000/api/up_compra.php';
    process.env.API_KEY = 'test-api-key';
    process.env.EXCEL_DIRECTORY = './test-excel-files';
    process.env.PROCESSED_DIRECTORY = './test-processed-files';
    process.env.ERROR_DIRECTORY = './test-error-files';
    process.env.LOG_FILE = './test-logs/app.log';

    // Mock de FileProcessor
    mockFileProcessor = {
      ensureDirectories: vi.fn(),
      findLatestExcelFile: vi.fn(),
      readExcelFile: vi.fn(),
      moveToProcessed: vi.fn(),
      moveToError: vi.fn(),
    };
    (FileProcessor as any).mockImplementation(() => mockFileProcessor);

    // Mock de ExcelValidator
    mockValidator = {
      validateHeaders: vi.fn(),
      validateData: vi.fn(),
    };
    (ExcelValidator as any).mockImplementation(() => mockValidator);

    // Mock de DataTransformer
    mockTransformer = {
      mapHeaders: vi.fn(),
      transformRawData: vi.fn(),
      mapToLicitacionApiData: vi.fn(),
    };
    (DataTransformer as any).mockImplementation(() => mockTransformer);

    // Mock de ApiService
    mockApiService = {
      sendLicitacionWithResponse: vi.fn(),
    };
    (ApiService as any).mockImplementation(() => mockApiService);

    // Mock de DatabaseService (SQLite)
    mockDbService = {
      hasLicitacionId: vi.fn().mockResolvedValue(false),
      addLicitacionId: vi.fn().mockResolvedValue(undefined),
      addManyLicitacionIds: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };
    (DatabaseService as any).getInstance = vi
      .fn()
      .mockReturnValue(mockDbService);

    // Mock de XLSX
    vi.mocked(XLSX.read).mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: {
        Sheet1: {},
      },
    } as any);
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([]);
    vi.mocked(XLSX.utils.book_new).mockReturnValue({} as any);
    vi.mocked(XLSX.utils.json_to_sheet).mockReturnValue({} as any);
    vi.mocked(XLSX.utils.book_append_sheet).mockImplementation(() => {});
    vi.mocked(XLSX.writeFile).mockImplementation(() => {});

    // Mock de path
    vi.mocked(path.basename).mockReturnValue('test-file.xlsx');
    vi.mocked(path.parse).mockReturnValue({
      name: 'test-file',
      ext: '.xlsx',
    } as any);
    vi.mocked(path.join).mockReturnValue(
      './test-error-files/test-file_failed_2023-01-01T00-00-00.xlsx'
    );

    excelProcessor = new ExcelProcessor(false);
  });

  afterEach(() => {
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(FileProcessor).toHaveBeenCalledWith(
        './excel-files',
        './processed-files',
        './error-files'
      );
      expect(ExcelValidator).toHaveBeenCalled();
      expect(DataTransformer).toHaveBeenCalled();
      expect(ApiService).toHaveBeenCalled();
      expect((DatabaseService as any).getInstance).toHaveBeenCalled();
      expect(mockFileProcessor.ensureDirectories).toHaveBeenCalled();
    });

    it('should initialize with dry run mode', () => {
      const dryRunProcessor = new ExcelProcessor(true);
      expect(dryRunProcessor).toBeInstanceOf(ExcelProcessor);
    });
  });

  describe('run', () => {
    it('should process files successfully', async () => {
      const mockFilePath = './test-excel-files/test.xlsx';
      const mockFileBuffer = Buffer.from('test');
      const mockRawData = [
        {
          idLicitacion: '123',
          nombre: 'Test Licitación',
          fechaPublicacion: '2023-01-01',
          fechaCierre: '2023-01-31',
          organismo: 'Test Organismo',
          unidad: 'Test Unidad',
          montoDisponible: 1000000,
          moneda: 'CLP',
          estado: 'Activa',
        },
      ];

      // Configurar mocks
      mockFileProcessor.findLatestExcelFile.mockResolvedValue(mockFilePath);
      mockFileProcessor.readExcelFile.mockResolvedValue(mockFileBuffer);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockRawData);

      const mockHeaders = [
        'idLicitacion',
        'nombre',
        'fechaPublicacion',
        'fechaCierre',
        'organismo',
        'unidad',
        'montoDisponible',
        'moneda',
        'estado',
      ];
      mockValidator.validateHeaders.mockReturnValue({
        isValid: true,
        missingHeaders: [],
      });

      const mockHeaderMapping = { idLicitacion: 'licitacion_id' };
      mockTransformer.mapHeaders.mockReturnValue(mockHeaderMapping);

      const mockTransformedData: ExcelRow[] = [
        {
          idLicitacion: '123',
          nombre: 'Test Licitación',
        },
      ];
      mockTransformer.transformRawData.mockReturnValue(mockTransformedData);

      mockValidator.validateData.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      const mockLicitacionData: LicitacionApiData = {
        licitacion_id: '123',
        nombre: 'Test Licitación',
        fecha_publicacion: '2023-01-01',
        fecha_cierre: '2023-01-31',
        organismo: 'Test Organismo',
        unidad: 'Test Unidad',
        monto_disponible: 1000000,
        moneda: 'CLP',
        estado: 'Activa',
      };
      mockTransformer.mapToLicitacionApiData.mockReturnValue(
        mockLicitacionData
      );

      mockApiService.sendLicitacionWithResponse.mockResolvedValue({
        status: 200,
      });

      // Ejecutar
      await excelProcessor.run();

      // Verificar
      expect(mockFileProcessor.findLatestExcelFile).toHaveBeenCalled();
      expect(mockFileProcessor.readExcelFile).toHaveBeenCalledWith(
        mockFilePath
      );
      expect(mockValidator.validateHeaders).toHaveBeenCalledWith(mockHeaders);
      expect(mockTransformer.mapHeaders).toHaveBeenCalledWith(mockHeaders);
      expect(mockTransformer.transformRawData).toHaveBeenCalledWith(
        mockRawData,
        mockHeaderMapping
      );
      expect(mockValidator.validateData).toHaveBeenCalledWith(
        mockTransformedData
      );
      expect(mockApiService.sendLicitacionWithResponse).toHaveBeenCalledWith(
        mockLicitacionData
      );
      expect(mockDbService.addLicitacionId).toHaveBeenCalledWith('123');
      expect(mockFileProcessor.moveToProcessed).toHaveBeenCalledWith(
        mockFilePath,
        'test-file.xlsx'
      );
    });

    it('should handle no files found', async () => {
      mockFileProcessor.findLatestExcelFile.mockResolvedValue(null);

      await excelProcessor.run();

      expect(mockFileProcessor.findLatestExcelFile).toHaveBeenCalled();
      // Verificar que el método se ejecutó correctamente sin errores
      expect(true).toBe(true);
    });

    it('should handle empty file data', async () => {
      const mockFilePath = './test-excel-files/test.xlsx';
      const mockFileBuffer = Buffer.from('test');

      mockFileProcessor.findLatestExcelFile.mockResolvedValue(mockFilePath);
      mockFileProcessor.readExcelFile.mockResolvedValue(mockFileBuffer);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([]);

      await excelProcessor.run();

      expect(mockFileProcessor.moveToError).toHaveBeenCalledWith(
        mockFilePath,
        'test-file.xlsx'
      );
    });

    it('should handle invalid headers', async () => {
      const mockFilePath = './test-excel-files/test.xlsx';
      const mockFileBuffer = Buffer.from('test');
      const mockRawData = [{ test: 'data' }];

      mockFileProcessor.findLatestExcelFile.mockResolvedValue(mockFilePath);
      mockFileProcessor.readExcelFile.mockResolvedValue(mockFileBuffer);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockRawData);

      mockValidator.validateHeaders.mockReturnValue({
        isValid: false,
        missingHeaders: ['idLicitacion', 'nombre'],
      });

      await excelProcessor.run();

      expect(mockFileProcessor.moveToError).toHaveBeenCalledWith(
        mockFilePath,
        'test-file.xlsx'
      );
    });

    it('should handle dry run mode', async () => {
      const dryRunProcessor = new ExcelProcessor(true);
      const mockFilePath = './test-excel-files/test.xlsx';
      const mockFileBuffer = Buffer.from('test');
      const mockRawData = [{ idLicitacion: '123' }];

      mockFileProcessor.findLatestExcelFile.mockResolvedValue(mockFilePath);
      mockFileProcessor.readExcelFile.mockResolvedValue(mockFileBuffer);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockRawData);

      mockValidator.validateHeaders.mockReturnValue({
        isValid: true,
        missingHeaders: [],
      });

      const mockHeaderMapping = { idLicitacion: 'licitacion_id' };
      mockTransformer.mapHeaders.mockReturnValue(mockHeaderMapping);

      const mockTransformedData: ExcelRow[] = [{ idLicitacion: '123' }];
      mockTransformer.transformRawData.mockReturnValue(mockTransformedData);

      mockValidator.validateData.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      await dryRunProcessor.run();

      expect(mockFileProcessor.moveToProcessed).not.toHaveBeenCalledWith(
        mockFilePath,
        'test-file.xlsx'
      );
      expect(mockApiService.sendLicitacionWithResponse).not.toHaveBeenCalled();
      expect(mockDbService.addLicitacionId).not.toHaveBeenCalled();
    });

    it('should handle processing errors', async () => {
      const mockFilePath = './test-excel-files/test.xlsx';
      const error = new Error('Test error');

      mockFileProcessor.findLatestExcelFile.mockResolvedValue(mockFilePath);
      mockFileProcessor.readExcelFile.mockRejectedValue(error);

      await expect(excelProcessor.run()).rejects.toThrow('Test error');
      expect(mockFileProcessor.moveToError).toHaveBeenCalledWith(
        mockFilePath,
        'test-file.xlsx'
      );
    });
  });

  describe('processRecordsIndividually', () => {
    it('should process records successfully', async () => {
      const mockData: ExcelRow[] = [
        { idLicitacion: '123', nombre: 'Test 1' },
        { idLicitacion: '456', nombre: 'Test 2' },
      ];

      // Devolver un objeto con el mismo id que el row para validar el registro en SQLite
      mockTransformer.mapToLicitacionApiData.mockImplementation((row: any) => ({
        licitacion_id: row.idLicitacion,
        nombre: row.nombre,
        fecha_publicacion: '2023-01-01',
        fecha_cierre: '2023-01-31',
        organismo: 'Test',
        unidad: 'Test',
        monto_disponible: 1000000,
        moneda: 'CLP',
        estado: 'Activa',
      }));
      mockApiService.sendLicitacionWithResponse.mockResolvedValue({
        status: 200,
      });

      // Usar reflection para acceder al método privado
      const result = await (excelProcessor as any).processRecordsIndividually(
        mockData,
        'test.xlsx'
      );

      expect(result.successCount).toBe(2);
      expect(result.failedRecords).toHaveLength(0);
      expect(mockApiService.sendLicitacionWithResponse).toHaveBeenCalledTimes(
        2
      );
      expect(mockDbService.addLicitacionId).toHaveBeenCalledWith('123');
      expect(mockDbService.addLicitacionId).toHaveBeenCalledWith('456');
    });

    it('should handle failed records', async () => {
      const mockData: ExcelRow[] = [
        { idLicitacion: '123', nombre: 'Test 1' },
        { idLicitacion: '456', nombre: 'Test 2' },
      ];

      const mockLicitacionData: LicitacionApiData = {
        licitacion_id: '123',
        nombre: 'Test',
        fecha_publicacion: '2023-01-01',
        fecha_cierre: '2023-01-31',
        organismo: 'Test',
        unidad: 'Test',
        monto_disponible: 1000000,
        moneda: 'CLP',
        estado: 'Activa',
      };

      mockTransformer.mapToLicitacionApiData.mockReturnValue(
        mockLicitacionData
      );
      mockApiService.sendLicitacionWithResponse
        .mockResolvedValueOnce({ status: 200 })
        .mockResolvedValueOnce({ status: 400 });

      const result = await (excelProcessor as any).processRecordsIndividually(
        mockData,
        'test.xlsx'
      );

      expect(result.successCount).toBe(1);
      expect(result.failedRecords).toHaveLength(1);
      expect(result.failedRecords[0].error).toBe(
        'API respondió con código 400'
      );
    });

    it('should handle network errors', async () => {
      const mockData: ExcelRow[] = [{ idLicitacion: '123', nombre: 'Test 1' }];

      const mockLicitacionData: LicitacionApiData = {
        licitacion_id: '123',
        nombre: 'Test',
        fecha_publicacion: '2023-01-01',
        fecha_cierre: '2023-01-31',
        organismo: 'Test',
        unidad: 'Test',
        monto_disponible: 1000000,
        moneda: 'CLP',
        estado: 'Activa',
      };

      mockTransformer.mapToLicitacionApiData.mockReturnValue(
        mockLicitacionData
      );
      mockApiService.sendLicitacionWithResponse.mockRejectedValue(
        new Error('Network error')
      );

      const result = await (excelProcessor as any).processRecordsIndividually(
        mockData,
        'test.xlsx'
      );

      expect(result.successCount).toBe(0);
      expect(result.failedRecords).toHaveLength(1);
      expect(result.failedRecords[0].error).toBe('Network error');
    });
  });

  describe('createFailedRecordsFile', () => {
    it('should create failed records file', async () => {
      const mockFailedRecords: FailedRecord[] = [
        {
          originalRow: { idLicitacion: '123', nombre: 'Test' },
          licitacionData: {
            licitacion_id: '123',
            nombre: 'Test',
            fecha_publicacion: '2023-01-01',
            fecha_cierre: '2023-01-31',
            organismo: 'Test',
            unidad: 'Test',
            monto_disponible: 1000000,
            moneda: 'CLP',
            estado: 'Activa',
          },
          error: 'Test error',
          statusCode: 400,
          rowIndex: 0,
        },
      ];

      // Mock de Date para timestamp consistente
      const mockDate = new Date('2023-01-01T00:00:00.000Z');
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const result = await (excelProcessor as any).createFailedRecordsFile(
        mockFailedRecords,
        'test.xlsx'
      );

      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
      expect(XLSX.writeFile).toHaveBeenCalled();
      expect(result).toBe(
        './test-error-files/test-file_failed_2023-01-01T00-00-00.xlsx'
      );
    });

    it('should return empty string for no failed records', async () => {
      const result = await (excelProcessor as any).createFailedRecordsFile(
        [],
        'test.xlsx'
      );

      expect(result).toBe('');
      expect(XLSX.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle XLSX read errors', async () => {
      const mockFilePath = './test-excel-files/test.xlsx';
      const mockFileBuffer = Buffer.from('test');

      mockFileProcessor.findLatestExcelFile.mockResolvedValue(mockFilePath);
      mockFileProcessor.readExcelFile.mockResolvedValue(mockFileBuffer);
      vi.mocked(XLSX.read).mockImplementation(() => {
        throw new Error('Invalid Excel file');
      });

      await expect(excelProcessor.run()).rejects.toThrow('Invalid Excel file');
      expect(mockFileProcessor.moveToError).toHaveBeenCalledWith(
        mockFilePath,
        'test-file.xlsx'
      );
    });

    it('should handle missing worksheet', async () => {
      const mockFilePath = './test-excel-files/test.xlsx';
      const mockFileBuffer = Buffer.from('test');

      mockFileProcessor.findLatestExcelFile.mockResolvedValue(mockFilePath);
      mockFileProcessor.readExcelFile.mockResolvedValue(mockFileBuffer);
      vi.mocked(XLSX.read).mockReturnValue({
        SheetNames: [],
        Sheets: {},
      } as any);

      await expect(excelProcessor.run()).rejects.toThrow(
        'No se encontró ninguna hoja en el archivo Excel'
      );
    });

    it('should handle validation errors', async () => {
      const mockFilePath = './test-excel-files/test.xlsx';
      const mockFileBuffer = Buffer.from('test');
      const mockRawData = [{ idLicitacion: '123' }];

      mockFileProcessor.findLatestExcelFile.mockResolvedValue(mockFilePath);
      mockFileProcessor.readExcelFile.mockResolvedValue(mockFileBuffer);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockRawData);

      mockValidator.validateHeaders.mockReturnValue({
        isValid: true,
        missingHeaders: [],
      });

      const mockHeaderMapping = { idLicitacion: 'licitacion_id' };
      mockTransformer.mapHeaders.mockReturnValue(mockHeaderMapping);

      const mockTransformedData: ExcelRow[] = [{ idLicitacion: '123' }];
      mockTransformer.transformRawData.mockReturnValue(mockTransformedData);

      mockValidator.validateData.mockReturnValue({
        isValid: false,
        errors: ['Error 1', 'Error 2'],
        warnings: ['Warning 1'],
      });

      const mockLicitacionData: LicitacionApiData = {
        licitacion_id: '123',
        nombre: 'Test',
        fecha_publicacion: '2023-01-01',
        fecha_cierre: '2023-01-31',
        organismo: 'Test',
        unidad: 'Test',
        monto_disponible: 1000000,
        moneda: 'CLP',
        estado: 'Activa',
      };
      mockTransformer.mapToLicitacionApiData.mockReturnValue(
        mockLicitacionData
      );

      mockApiService.sendLicitacionWithResponse.mockResolvedValue({
        status: 200,
      });

      await excelProcessor.run();

      // Debería continuar procesando a pesar de los errores de validación
      expect(mockApiService.sendLicitacionWithResponse).toHaveBeenCalled();
    });
  });

  // Nuevos casos de prueba relacionados con SQLite
  describe('SQLite integration behaviors', () => {
    it('should filter out records already present in SQLite', async () => {
      const mockFilePath = './test-excel-files/test.xlsx';
      const mockFileBuffer = Buffer.from('test');
      const mockRawData = [
        { idLicitacion: '111', nombre: 'Nueva' },
        { idLicitacion: '222', nombre: 'Duplicada' },
      ];

      mockFileProcessor.findLatestExcelFile.mockResolvedValue(mockFilePath);
      mockFileProcessor.readExcelFile.mockResolvedValue(mockFileBuffer);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockRawData);

      const mockHeaders = ['idLicitacion', 'nombre'];
      mockValidator.validateHeaders.mockReturnValue({
        isValid: true,
        missingHeaders: [],
      });
      mockTransformer.mapHeaders.mockReturnValue({
        idLicitacion: 'licitacion_id',
        nombre: 'nombre',
      });
      const transformed: ExcelRow[] = [
        { idLicitacion: '111', nombre: 'Nueva' },
        { idLicitacion: '222', nombre: 'Duplicada' },
      ];
      mockTransformer.transformRawData.mockReturnValue(transformed);
      mockValidator.validateData.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      // Simular que '222' ya existe en SQLite
      mockDbService.hasLicitacionId
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const licData111: LicitacionApiData = {
        licitacion_id: '111',
        nombre: 'Nueva',
        fecha_publicacion: '2023-01-01',
        fecha_cierre: '2023-01-31',
        organismo: 'Org',
        unidad: 'Uni',
        monto_disponible: 1,
        moneda: 'CLP',
        estado: 'Activa',
      };
      mockTransformer.mapToLicitacionApiData.mockReturnValue(licData111);
      mockApiService.sendLicitacionWithResponse.mockResolvedValue({
        status: 200,
      });

      await excelProcessor.run();

      expect(mockDbService.hasLicitacionId).toHaveBeenCalledTimes(2);
      expect(mockApiService.sendLicitacionWithResponse).toHaveBeenCalledTimes(
        1
      );
      expect(mockDbService.addLicitacionId).toHaveBeenCalledWith('111');
    });

    it('should register ID when API returns 400 duplicate with message', async () => {
      const data: ExcelRow[] = [{ idLicitacion: '999', nombre: 'Dup' }];
      const licData: LicitacionApiData = {
        licitacion_id: '999',
        nombre: 'Dup',
        fecha_publicacion: '2023-01-01',
        fecha_cierre: '2023-01-31',
        organismo: 'O',
        unidad: 'U',
        monto_disponible: 1,
        moneda: 'CLP',
        estado: 'Activa',
      };
      mockTransformer.mapToLicitacionApiData.mockReturnValue(licData);

      // Simular error 400 con mensaje de duplicado
      const error: any = new Error('duplicado');
      error.response = { status: 400, data: { message: 'Ya existe registro' } };
      mockApiService.sendLicitacionWithResponse.mockRejectedValue(error);

      const result = await (excelProcessor as any).processRecordsIndividually(
        data,
        'test.xlsx'
      );

      expect(result.successCount).toBe(0);
      expect(mockDbService.addLicitacionId).toHaveBeenCalledWith('999');
    });

    it('should move file to processed when all records are filtered out as duplicates', async () => {
      const mockFilePath = './test-excel-files/test.xlsx';
      const mockFileBuffer = Buffer.from('test');
      const mockRawData = [{ idLicitacion: 'A' }];

      mockFileProcessor.findLatestExcelFile.mockResolvedValue(mockFilePath);
      mockFileProcessor.readExcelFile.mockResolvedValue(mockFileBuffer);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockRawData);

      mockValidator.validateHeaders.mockReturnValue({
        isValid: true,
        missingHeaders: [],
      });
      mockTransformer.mapHeaders.mockReturnValue({
        idLicitacion: 'licitacion_id',
      });
      mockTransformer.transformRawData.mockReturnValue([{ idLicitacion: 'A' }]);
      mockValidator.validateData.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      // Filtrar todos como duplicados
      mockDbService.hasLicitacionId.mockResolvedValue(true);

      await excelProcessor.run();

      expect(mockFileProcessor.moveToProcessed).toHaveBeenCalledWith(
        mockFilePath,
        'test-file.xlsx'
      );
      expect(mockApiService.sendLicitacionWithResponse).not.toHaveBeenCalled();
    });
  });
});
