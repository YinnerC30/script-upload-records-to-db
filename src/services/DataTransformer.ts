import { ExcelRow } from '../types/excel';
import { LicitacionApiData } from './ApiService';

export class DataTransformer {
  /**
   * Mapea una fila del Excel a LicitacionApiData
   */
  mapToLicitacionApiData(row: ExcelRow, fileName: string): LicitacionApiData {
    const fechaPublicacion = this.parseDate(row['fecha_publicacion']);
    const fechaCierre = this.parseDate(row['fecha_cierre']);

    return {
      licitacion_id: row.idLicitacion || '',
      nombre: row.nombre || '',
      fecha_publicacion: fechaPublicacion
        ? this.formatDateForApi(fechaPublicacion)
        : '',
      fecha_cierre: fechaCierre ? this.formatDateForApi(fechaCierre) : '',
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
  normalizeHeaders(headers: string[]): string[] {
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
    const normalizedHeaders = this.normalizeHeaders(rawHeaders);
    const headerMapping: { [key: string]: string } = {
      id: 'licitacion_id',
      nombre: 'nombre',
      'unidad de compra': 'unidad',
      'fecha de publicacion': 'fecha_publicacion',
      'fecha de cierre': 'fecha_cierre',
      estado: 'estado',
      'cotizaciones enviadas': 'cotizaciones_enviadas',
      institucion: 'organismo',
      'presupuesto estimado': 'monto_disponible',
      'tipo moneda': 'moneda',
      'estado de convocatoria': 'estado_convocatoria',
    };

    const mappedHeaders: { [key: string]: string } = {};

    for (let i = 0; i < normalizedHeaders.length; i++) {
      const normalizedHeader = normalizedHeaders[i];
      const originalHeader = rawHeaders[i];

      if (
        normalizedHeader &&
        originalHeader &&
        headerMapping[normalizedHeader]
      ) {
        mappedHeaders[originalHeader] = headerMapping[normalizedHeader];
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

    // Intentar parsear la fecha con diferentes formatos
    const dateString = dateValue.toString().trim();

    // Formato ISO: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const parts = dateString.split('-').map(Number);
      if (parts.length === 3 && parts.every((p) => !isNaN(p))) {
        const year = parts[0]!;
        const month = parts[1]!;
        const day = parts[2]!;
        const date = new Date(year, month - 1, day, 0, 0, 0, 0);
        return isNaN(date.getTime()) ? null : date;
      }
      return null;
    }

    // Formato con hora: YYYY-MM-DD HH:mm:ss o YYYY-MM-DD HH:mm
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(dateString)) {
      const parsed = new Date(dateString);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    // Formato ISO con T: YYYY-MM-DDTHH:mm:ss
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateString)) {
      const parsed = new Date(dateString);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    // Formato DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const parts = dateString.split('/').map(Number);
      if (parts.length === 3 && parts.every((p) => !isNaN(p))) {
        const day = parts[0]!;
        const month = parts[1]!;
        const year = parts[2]!;
        const date = new Date(year, month - 1, day, 0, 0, 0, 0);
        return isNaN(date.getTime()) ? null : date;
      }
      return null;
    }

    // Formato YYYY/MM/DD
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateString)) {
      const parts = dateString.split('/').map(Number);
      if (parts.length === 3 && parts.every((p) => !isNaN(p))) {
        const year = parts[0]!;
        const month = parts[1]!;
        const day = parts[2]!;
        const date = new Date(year, month - 1, day, 0, 0, 0, 0);
        return isNaN(date.getTime()) ? null : date;
      }
      return null;
    }

    // Intentar parseo general como último recurso
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? null : parsed;
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

  /**
   * Limpia y normaliza un string
   */
  cleanString(value: string | undefined): string {
    if (!value) return '';
    return value.toString().trim();
  }

  /**
   * Valida y limpia datos antes de la transformación
   */
  preprocessData(rawData: any[]): any[] {
    return rawData.map((row) => {
      const cleanedRow: any = {};

      for (const [key, value] of Object.entries(row)) {
        if (value !== null && value !== undefined) {
          cleanedRow[key] = value;
        }
      }

      return cleanedRow;
    });
  }
}
