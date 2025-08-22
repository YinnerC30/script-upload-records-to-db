import { describe, it, expect } from 'vitest';

// Mapeo de encabezados del Excel a campos del código (normalizados)
const HEADER_MAPPING: { [key: string]: string } = {
  'id': 'idLicitacion',
  'nombre': 'nombre',
  'fecha de publicacion': 'fechaPublicacion',
  'fecha de cierre': 'fechaCierre',
  'organismo': 'organismo',
  'unidad': 'unidad',
  'monto disponible': 'montoDisponible',
  'moneda': 'moneda',
  'estado': 'estado',
  // Variaciones adicionales para mayor compatibilidad
  'id_licitacion': 'idLicitacion',
  'idlicitacion': 'idLicitacion',
  'fecha_publicacion': 'fechaPublicacion',
  'fechapublicacion': 'fechaPublicacion',
  'fecha_cierre': 'fechaCierre',
  'fechacierre': 'fechaCierre',
  'monto_disponible': 'montoDisponible',
  'montodisponible': 'montoDisponible'
};

/**
 * Normaliza un encabezado para facilitar el mapeo
 */
function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalizar espacios múltiples
    .replace(/[áéíóúüñ]/g, (match) => {
      const accents: { [key: string]: string } = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u', 'ñ': 'n'
      };
      return accents[match] || match;
    });
}

/**
 * Mapea los encabezados del Excel y transforma los datos
 */
function mapHeadersAndTransformData(rawData: any[]): any[] {
  if (!rawData || rawData.length === 0) {
    return [];
  }

  // Obtener el primer registro para identificar los encabezados
  const firstRow = rawData[0];
  const headers = Object.keys(firstRow);
  
  console.log('Encabezados encontrados en el archivo:', headers);

  // Crear mapeo de encabezados originales a campos normalizados
  const headerMapping: { [key: string]: string } = {};
  const unmappedHeaders: string[] = [];

  headers.forEach(header => {
    const normalizedHeader = normalizeHeader(header);
    if (HEADER_MAPPING[normalizedHeader]) {
      headerMapping[header] = HEADER_MAPPING[normalizedHeader];
    } else {
      unmappedHeaders.push(header);
      console.warn(`Encabezado no mapeado: "${header}"`);
    }
  });

  if (unmappedHeaders.length > 0) {
    console.warn(`Encabezados no mapeados: ${unmappedHeaders.join(', ')}`);
  }

  // Transformar cada fila usando el mapeo
  return rawData.map((row, index) => {
    const transformedRow: any = {};
    
    headers.forEach(originalHeader => {
      const mappedField = headerMapping[originalHeader];
      if (mappedField) {
        transformedRow[mappedField] = row[originalHeader];
      }
    });

    return transformedRow;
  });
}

describe('Mapeo de Encabezados', () => {
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
        { input: 'Fecha   de   Publicación', expected: 'fecha de publicacion' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = normalizeHeader(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle accented characters', () => {
      const testCases = [
        { input: 'Publicación', expected: 'publicacion' },
        { input: 'Organismo', expected: 'organismo' },
        { input: 'Unidad', expected: 'unidad' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = normalizeHeader(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('mapHeadersAndTransformData', () => {
    it('should map headers correctly', () => {
      const rawData = [
        {
          'ID': 'LIC001',
          'Nombre': 'Licitación Test',
          'Fecha de Publicación': '2024-01-01',
          'Fecha de cierre': '2024-02-01',
          'Organismo': 'Ministerio Test',
          'Unidad': 'Unidad Test',
          'Monto Disponible': '1000000',
          'Moneda': 'CLP',
          'Estado': 'Activa'
        }
      ];

      const result = mapHeadersAndTransformData(rawData);

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
        estado: 'Activa'
      });
    });

    it('should handle empty data', () => {
      const result = mapHeadersAndTransformData([]);
      expect(result).toEqual([]);
    });

    it('should handle unmapped headers', () => {
      const rawData = [
        {
          'ID': 'LIC001',
          'Nombre': 'Licitación Test',
          'Campo Desconocido': 'valor',
          'Estado': 'Activa'
        }
      ];

      const result = mapHeadersAndTransformData(rawData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        idLicitacion: 'LIC001',
        nombre: 'Licitación Test',
        estado: 'Activa'
      });
      // El campo 'Campo Desconocido' no debería estar en el resultado
      expect(result[0]['Campo Desconocido']).toBeUndefined();
    });

    it('should handle real Excel headers from image', () => {
      const rawData = [
        {
          'ID': 'LIC001',
          'Nombre': 'Licitación de Servicios',
          'Fecha de Publicación': '2024-01-15',
          'Fecha de cierre': '2024-02-15',
          'Organismo': 'Ministerio de Hacienda',
          'Unidad': 'Dirección de Presupuestos',
          'Monto Disponible': '50000000',
          'Moneda': 'CLP',
          'Estado': 'Activa'
        }
      ];

      const result = mapHeadersAndTransformData(rawData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        idLicitacion: 'LIC001',
        nombre: 'Licitación de Servicios',
        fechaPublicacion: '2024-01-15',
        fechaCierre: '2024-02-15',
        organismo: 'Ministerio de Hacienda',
        unidad: 'Dirección de Presupuestos',
        montoDisponible: '50000000',
        moneda: 'CLP',
        estado: 'Activa'
      });
    });
  });
});
