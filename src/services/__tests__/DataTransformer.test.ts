import { describe, it, expect, beforeEach } from 'vitest';
import { DataTransformer } from '../DataTransformer';
import { ExcelRow } from '../../types/excel';

describe('DataTransformer', () => {
  let transformer: DataTransformer;

  beforeEach(() => {
    transformer = new DataTransformer();
  });

  describe('mapToLicitacionApiData', () => {
    it('should map ExcelRow to LicitacionApiData correctly', () => {
      const mockRow: ExcelRow = {
        idLicitacion: 'LIC-001',
        nombre: 'Licitación de Prueba',
        fechaPublicacion: '2023-01-15',
        fechaCierre: '2023-02-15',
        organismo: 'Ministerio de Obras Públicas',
        unidad: 'Dirección de Vialidad',
        montoDisponible: 1000000,
        moneda: 'CLP',
        estado: 'Activa',
      };

      const result = transformer.mapToLicitacionApiData(mockRow, 'test.xlsx');

      expect(result).toEqual({
        licitacion_id: 'LIC-001',
        nombre: 'Licitación de Prueba',
        fecha_publicacion: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/
        ),
        fecha_cierre: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/),
        organismo: 'Ministerio de Obras Públicas',
        unidad: 'Dirección de Vialidad',
        monto_disponible: 1000000,
        moneda: 'CLP',
        estado: 'Activa',
      });
    });

    it('should handle empty or undefined values', () => {
      const mockRow: ExcelRow = {};

      const result = transformer.mapToLicitacionApiData(mockRow, 'test.xlsx');

      expect(result).toEqual({
        licitacion_id: '',
        nombre: '',
        fecha_publicacion: '',
        fecha_cierre: '',
        organismo: '',
        unidad: '',
        monto_disponible: 0,
        moneda: 'CLP',
        estado: '',
      });
    });

    it('should use default moneda when not provided', () => {
      const mockRow: ExcelRow = {
        idLicitacion: 'LIC-001',
        nombre: 'Test',
      };

      const result = transformer.mapToLicitacionApiData(mockRow, 'test.xlsx');

      expect(result.moneda).toBe('CLP');
    });
  });

  describe('normalizeHeaders', () => {
    it('should normalize headers correctly', () => {
      const headers = [
        'ID Licitación',
        'Nombre de la Licitación',
        'Fecha de Publicación',
        'Monto Disponible ($)',
      ];

      const result = transformer.normalizeHeaders(headers);

      expect(result).toEqual([
        'id licitacin',
        'nombre de la licitacin',
        'fecha de publicacin',
        'monto disponible ',
      ]);
    });

    it('should handle headers with special characters', () => {
      const headers = [
        'ID-Licitación',
        'Nombre@Licitación',
        'Fecha_de_Publicación',
      ];

      const result = transformer.normalizeHeaders(headers);

      expect(result).toEqual([
        'idlicitacin',
        'nombrelicitacin',
        'fecha_de_publicacin',
      ]);
    });

    it('should handle empty headers', () => {
      const headers = ['', '  ', 'Test'];

      const result = transformer.normalizeHeaders(headers);

      expect(result).toEqual(['', '', 'test']);
    });
  });

  describe('mapHeaders', () => {
    it('should map headers correctly', () => {
      const rawHeaders = [
        'ID Licitación',
        'Nombre',
        'Fecha de Publicación',
        'Fecha de Cierre',
        'Organismo',
        'Unidad',
        'Monto Disponible',
        'Moneda',
        'Estado',
      ];

      const result = transformer.mapHeaders(rawHeaders);

      expect(result).toEqual({
        Nombre: 'nombre',
        'Fecha de Publicación': 'fechaPublicacion',
        'Fecha de Cierre': 'fechaCierre',
        Organismo: 'organismo',
        Unidad: 'unidad',
        'Monto Disponible': 'montoDisponible',
        Moneda: 'moneda',
        Estado: 'estado',
      });
    });

    it('should handle alternative header formats', () => {
      const rawHeaders = [
        'ID_Licitacion',
        'idlicitacion',
        'Fecha_Publicacion',
        'fechapublicacion',
        'Monto_Disponible',
        'montodisponible',
      ];

      const result = transformer.mapHeaders(rawHeaders);

      expect(result).toEqual({
        ID_Licitacion: 'idLicitacion',
        idlicitacion: 'idLicitacion',
        Fecha_Publicacion: 'fechaPublicacion',
        fechapublicacion: 'fechaPublicacion',
        Monto_Disponible: 'montoDisponible',
        montodisponible: 'montoDisponible',
      });
    });

    it('should ignore unmapped headers', () => {
      const rawHeaders = [
        'ID Licitación',
        'Campo Desconocido',
        'Nombre',
        'Otro Campo',
      ];

      const result = transformer.mapHeaders(rawHeaders);

      expect(result).toEqual({
        Nombre: 'nombre',
      });
    });
  });

  describe('transformRawData', () => {
    it('should transform raw data using header mapping', () => {
      const rawData = [
        {
          'ID Licitación': 'LIC-001',
          Nombre: 'Licitación 1',
          'Monto Disponible': '1000000',
        },
        {
          'ID Licitación': 'LIC-002',
          Nombre: 'Licitación 2',
          'Monto Disponible': '2000000',
        },
      ];

      const headerMapping = {
        'ID Licitación': 'idLicitacion',
        Nombre: 'nombre',
        'Monto Disponible': 'montoDisponible',
      };

      const result = transformer.transformRawData(rawData, headerMapping);

      expect(result).toEqual([
        {
          idLicitacion: 'LIC-001',
          nombre: 'Licitación 1',
          montoDisponible: '1000000',
        },
        {
          idLicitacion: 'LIC-002',
          nombre: 'Licitación 2',
          montoDisponible: '2000000',
        },
      ]);
    });

    it('should handle undefined values in raw data', () => {
      const rawData = [
        {
          'ID Licitación': 'LIC-001',
          Nombre: undefined,
          'Monto Disponible': null,
        },
      ];

      const headerMapping = {
        'ID Licitación': 'idLicitacion',
        Nombre: 'nombre',
        'Monto Disponible': 'montoDisponible',
      };

      const result = transformer.transformRawData(rawData, headerMapping);

      expect(result).toEqual([
        {
          idLicitacion: 'LIC-001',
          montoDisponible: null,
        },
      ]);
    });

    it('should handle empty header mapping', () => {
      const rawData = [
        {
          'ID Licitación': 'LIC-001',
          Nombre: 'Test',
        },
      ];

      const headerMapping = {};

      const result = transformer.transformRawData(rawData, headerMapping);

      expect(result).toEqual([{}]);
    });
  });

  describe('formatDateForApi', () => {
    it('should format date correctly for API', () => {
      const date = new Date('2023-01-15T10:30:00');

      const result = transformer.formatDateForApi(date);

      expect(result).toBe('2023-01-15 10:30');
    });

    it('should handle date with single digit month and day', () => {
      const date = new Date('2023-01-05T09:05:00');

      const result = transformer.formatDateForApi(date);

      expect(result).toBe('2023-01-05 09:05');
    });

    it('should handle date with double digit month and day', () => {
      const date = new Date('2023-12-25T23:59:00');

      const result = transformer.formatDateForApi(date);

      expect(result).toBe('2023-12-25 23:59');
    });
  });

  describe('parseDate', () => {
    it('should parse string date correctly', () => {
      const dateString = '2023-01-15';

      const result = transformer.parseDate(dateString);

      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(0); // Enero es 0
      expect(result.getDate()).toBe(15); // Ahora debería ser 15, no 14
    });

    it('should return Date object as is', () => {
      const date = new Date('2023-01-15');

      const result = transformer.parseDate(date);

      expect(result).toBe(date);
    });

    it('should return null for undefined input', () => {
      const result = transformer.parseDate(undefined);
      expect(result).toBeNull();
    });

    it('should return null for invalid date string', () => {
      const result = transformer.parseDate('invalid-date');
      expect(result).toBeNull();
    });

    it('should handle various date formats', () => {
      const formats = [
        '2023-01-15',
        '2023/01/15',
        '15/01/2023',
        '2023-01-15T10:30:00',
      ];

      formats.forEach((format) => {
        const result = transformer.parseDate(format);
        expect(result).toBeInstanceOf(Date);
        expect(result.getTime()).toBeGreaterThan(0);
      });
    });
  });

  describe('parseNumber', () => {
    it('should parse number correctly', () => {
      expect(transformer.parseNumber(1000)).toBe(1000);
      expect(transformer.parseNumber('1000')).toBe(1000);
      expect(transformer.parseNumber('1,000')).toBe(1000);
      expect(transformer.parseNumber('$1,000')).toBe(1000);
      expect(transformer.parseNumber('1,000.50')).toBe(1000.5);
    });

    it('should handle undefined and null values', () => {
      expect(transformer.parseNumber(undefined)).toBe(0);
      expect(transformer.parseNumber(null)).toBe(0);
    });

    it('should handle invalid number strings', () => {
      expect(transformer.parseNumber('invalid')).toBe(0);
      expect(transformer.parseNumber('')).toBe(0);
      expect(transformer.parseNumber('abc123def')).toBe(123);
    });

    it('should handle negative numbers', () => {
      expect(transformer.parseNumber(-1000)).toBe(-1000);
      expect(transformer.parseNumber('-1000')).toBe(-1000);
      expect(transformer.parseNumber('-$1,000')).toBe(-1000);
    });

    it('should handle decimal numbers', () => {
      expect(transformer.parseNumber(1000.5)).toBe(1000.5);
      expect(transformer.parseNumber('1000.50')).toBe(1000.5);
      expect(transformer.parseNumber('1,000.50')).toBe(1000.5);
    });
  });

  describe('cleanString', () => {
    it('should clean string correctly', () => {
      expect(transformer.cleanString('  test  ')).toBe('test');
      expect(transformer.cleanString('test')).toBe('test');
      expect(transformer.cleanString('  ')).toBe('');
    });

    it('should handle undefined and empty values', () => {
      expect(transformer.cleanString(undefined)).toBe('');
      expect(transformer.cleanString('')).toBe('');
      expect(transformer.cleanString(null)).toBe('');
    });

    it('should handle non-string values', () => {
      expect(transformer.cleanString(123)).toBe('123');
      expect(transformer.cleanString(true)).toBe('true');
    });
  });

  describe('preprocessData', () => {
    it('should remove null and undefined values', () => {
      const rawData = [
        {
          id: '1',
          name: 'Test',
          value: null,
          empty: undefined,
          valid: 'data',
        },
      ];

      const result = transformer.preprocessData(rawData);

      expect(result).toEqual([
        {
          id: '1',
          name: 'Test',
          valid: 'data',
        },
      ]);
    });

    it('should handle empty array', () => {
      const result = transformer.preprocessData([]);

      expect(result).toEqual([]);
    });

    it('should preserve all valid values', () => {
      const rawData = [
        {
          id: '1',
          name: 'Test',
          value: 0,
          empty: '',
          valid: 'data',
        },
      ];

      const result = transformer.preprocessData(rawData);

      expect(result).toEqual([
        {
          id: '1',
          name: 'Test',
          value: 0,
          empty: '',
          valid: 'data',
        },
      ]);
    });

    it('should handle nested objects', () => {
      const rawData = [
        {
          id: '1',
          nested: {
            value: null,
            valid: 'data',
          },
        },
      ];

      const result = transformer.preprocessData(rawData);

      expect(result).toEqual([
        {
          id: '1',
          nested: {
            value: null,
            valid: 'data',
          },
        },
      ]);
    });
  });

  describe('Date parsing issues', () => {
    it('should handle date parsing correctly and not return current date for invalid dates', () => {
      // Simular el problema real: fecha de inicio 2024-01-15 que se convierte en fecha actual
      const row: ExcelRow = {
        idLicitacion: 'LIC175614',
        nombre: 'Licitación de Servicios de Mantenimiento',
        fechaPublicacion: '2024-01-15', // Esta es la fecha correcta del registro
        fechaCierre: '2024-02-15',
        organismo: 'Ministerio',
        unidad: 'Dirección',
        montoDisponible: 50000000,
        moneda: 'CLP',
        estado: 'Activa',
      };

      const result = transformer.mapToLicitacionApiData(row, 'test.xlsx');

      // Verificar que la fecha de publicación sea la correcta, no la fecha actual
      expect(result.fecha_publicacion).toBe('2024-01-15 00:00');
      expect(result.fecha_cierre).toBe('2024-02-15 00:00');

      // Verificar que no sea la fecha actual (que sería algo como 2025-08-25)
      const currentDate = new Date();
      const currentDateString = currentDate.toISOString().slice(0, 10);
      expect(result.fecha_publicacion).not.toContain(currentDateString);
    });

    it('should handle various date formats correctly', () => {
      const testCases = [
        { input: '2024-01-15', expected: '2024-01-15 00:00' },
        { input: '2024/01/15', expected: '2024-01-15 00:00' },
        { input: '15/01/2024', expected: '2024-01-15 00:00' },
        { input: '2024-01-15T00:00:00', expected: '2024-01-15 00:00' },
        { input: '2024-01-15 10:30:00', expected: '2024-01-15 10:30' },
      ];

      testCases.forEach(({ input, expected }) => {
        const row: ExcelRow = {
          idLicitacion: 'TEST-001',
          nombre: 'Test Licitación',
          fechaPublicacion: input,
          fechaCierre: '2024-02-15',
        };

        const result = transformer.mapToLicitacionApiData(row, 'test.xlsx');
        expect(result.fecha_publicacion).toBe(expected);
      });
    });

    it('should handle invalid dates gracefully', () => {
      const row: ExcelRow = {
        idLicitacion: 'TEST-001',
        nombre: 'Test Licitación',
        fechaPublicacion: 'fecha-invalida',
        fechaCierre: 'otra-fecha-invalida',
      };

      const result = transformer.mapToLicitacionApiData(row, 'test.xlsx');

      // Ahora debería manejar fechas inválidas retornando strings vacíos
      expect(result.fecha_publicacion).toBe('');
      expect(result.fecha_cierre).toBe('');
    });
  });

  describe('Integration tests', () => {
    it('should process complete workflow correctly', () => {
      const rawHeaders = [
        'ID Licitación',
        'Nombre',
        'Fecha de Publicación',
        'Monto Disponible',
      ];

      const rawData = [
        {
          'ID Licitación': 'LIC-001',
          Nombre: 'Licitación de Prueba',
          'Fecha de Publicación': '2023-01-15',
          'Monto Disponible': '1,000,000',
        },
      ];

      // Step 1: Map headers
      const headerMapping = transformer.mapHeaders(rawHeaders);

      // Step 2: Transform raw data
      const transformedData = transformer.transformRawData(
        rawData,
        headerMapping
      );

      // Step 3: Map to API data
      const apiData = transformer.mapToLicitacionApiData(
        transformedData[0],
        'test.xlsx'
      );

      expect(headerMapping).toEqual({
        Nombre: 'nombre',
        'Fecha de Publicación': 'fechaPublicacion',
        'Monto Disponible': 'montoDisponible',
      });

      expect(transformedData[0]).toEqual({
        nombre: 'Licitación de Prueba',
        fechaPublicacion: '2023-01-15',
        montoDisponible: '1,000,000',
      });

      expect(apiData).toEqual({
        licitacion_id: '',
        nombre: 'Licitación de Prueba',
        fecha_publicacion: '2023-01-15 00:00',
        fecha_cierre: '',
        organismo: '',
        unidad: '',
        monto_disponible: 1000000,
        moneda: 'CLP',
        estado: '',
      });
    });
  });
});
