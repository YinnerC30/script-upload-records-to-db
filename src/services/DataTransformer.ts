import { ExcelRow } from '../types/excel';
import { LicitacionApiData } from './ApiService';
import { HEADER_MAPPING } from './ExcelValidator';

export class DataTransformer {
  /**
   * Mapea una fila del Excel a LicitacionApiData
   */
  mapToLicitacionApiData(row: ExcelRow, fileName: string): LicitacionApiData {
    const fechaPublicacion = this.parseDate(row['fecha_publicacion']);
    const fechaCierre = this.parseDate(row['fecha_cierre']);

    return {
      licitacion_id: row['licitacion_id'] || '',
      nombre: row.nombre || '',
      fecha_publicacion: this.formatDateForApi(fechaPublicacion!) || '',
      fecha_cierre: this.formatDateForApi(fechaCierre!) || '',
      organismo: row.organismo || '',
      unidad: row.unidad || '',
      monto_disponible: this.parseNumber(row['monto_disponible']),
      moneda: row.moneda || '',
      estado: row.estado || '',
    };
  }

  /**
   * Normaliza encabezados para mapeo
   */
  static normalizeHeaders(headers: string[]): string[] {
    return headers.map((header) =>
      header
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/g, '')
        .replace(/[áéíóúÁÉÍÓÚ]/g, (match: string) => {
          const map: { [key: string]: string } = {
            á: 'a',
            é: 'e',
            í: 'i',
            ó: 'o',
            ú: 'u',
            Á: 'A',
            É: 'E',
            Í: 'I',
            Ó: 'O',
            Ú: 'U',
          };
          return map[match] || match;
        })
    );
  }

  /**
   * Mapea encabezados del Excel a campos del código
   */
  mapHeaders(rawHeaders: string[]): { [key: string]: string } {
    const normalizedHeaders = DataTransformer.normalizeHeaders(rawHeaders);

    const mappedHeaders: { [key: string]: string } = {};

    for (let i = 0; i < normalizedHeaders.length; i++) {
      const normalizedHeader = normalizedHeaders[i];
      const originalHeader = rawHeaders[i];

      if (
        normalizedHeader &&
        originalHeader &&
        HEADER_MAPPING[normalizedHeader]
      ) {
        mappedHeaders[originalHeader] = HEADER_MAPPING[normalizedHeader];
      }
    }

    return mappedHeaders;
  }

  /**
   * Transforma datos raw del Excel usando el mapeo de encabezados
   */
  transformRawData(
    rawData: any[],
    headerMapping: { [key: string]: string }
  ): ExcelRow[] {
    return rawData.map((row) => {
      const transformedRow: ExcelRow = {};

      for (const [originalHeader, mappedField] of Object.entries(
        headerMapping
      )) {
        if (row[originalHeader] !== undefined) {
          transformedRow[mappedField as keyof ExcelRow] = row[originalHeader];
        }
      }

      return transformedRow;
    });
  }

  /**
   * Formatea una fecha para el formato requerido por la API (YYYY-MM-DD HH:mm)
   */
  formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  /**
   * Parsea una fecha desde string o Date
   */
  parseDate(dateValue: string | Date | undefined): Date | null {
    if (!dateValue) return null;

    if (dateValue instanceof Date) {
      return dateValue;
    }

    // Intentar formato antiguo: DD/MM/YYYY HH:mm
    const oldFormatRegex = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/;
    const oldMatch = dateValue.match(oldFormatRegex);

    if (oldMatch) {
      const [, day = 0, month = 0, year = 0, hours = 0, minutes = 0] =
        oldMatch.map(Number);
      return new Date(year, month - 1, day, hours, minutes);
    }

    // Intentar formato nuevo: YYYY-MM-DD HH:mm
    const newFormatRegex = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;
    const newMatch = dateValue.match(newFormatRegex);

    if (newMatch) {
      const [, year = 0, month = 0, day = 0, hours = 0, minutes = 0] =
        newMatch.map(Number);
      return new Date(year, month - 1, day, hours, minutes);
    }

    // Si no coincide con ninguno de los dos formatos:
    throw new Error(
      'Formato de fecha inválido. Esperado: DD/MM/YYYY HH:mm o YYYY-MM-DD HH:mm'
    );
  }
  /**
   * Parsea un número desde string o number
   */
  parseNumber(value: string | number | undefined): number {
    if (value === undefined || value === null) return 0;

    if (typeof value === 'number') {
      return value;
    }

    const parsed = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
}
