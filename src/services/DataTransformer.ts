import { ExcelRow } from './ExcelProcessor';
import { LicitacionApiData } from './ApiService';

export class DataTransformer {
  /**
   * Mapea una fila del Excel a LicitacionApiData
   */
  mapToLicitacionApiData(row: ExcelRow, fileName: string): LicitacionApiData {
    return {
      licitacion_id: row.idLicitacion || '',
      nombre: row.nombre || '',
      fecha_publicacion: this.formatDateForApi(
        this.parseDate(row.fechaPublicacion)
      ),
      fecha_cierre: this.formatDateForApi(this.parseDate(row.fechaCierre)),
      organismo: row.organismo || '',
      unidad: row.unidad || '',
      monto_disponible: this.parseNumber(row.montoDisponible),
      moneda: row.moneda || 'CLP',
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
        .replace(/[^\w\s]/g, '')
    );
  }

  /**
   * Mapea encabezados del Excel a campos del código
   */
  mapHeaders(rawHeaders: string[]): { [key: string]: string } {
    const normalizedHeaders = this.normalizeHeaders(rawHeaders);
    const headerMapping: { [key: string]: string } = {
      id: 'idLicitacion',
      nombre: 'nombre',
      'fecha de publicacion': 'fechaPublicacion',
      'fecha de cierre': 'fechaCierre',
      organismo: 'organismo',
      unidad: 'unidad',
      'monto disponible': 'montoDisponible',
      moneda: 'moneda',
      estado: 'estado',
      // Variaciones adicionales para mayor compatibilidad
      id_licitacion: 'idLicitacion',
      idlicitacion: 'idLicitacion',
      fecha_publicacion: 'fechaPublicacion',
      fechapublicacion: 'fechaPublicacion',
      fecha_cierre: 'fechaCierre',
      fechacierre: 'fechaCierre',
      monto_disponible: 'montoDisponible',
      montodisponible: 'montoDisponible',
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
  parseDate(dateValue: string | Date | undefined): Date {
    if (!dateValue) return new Date();

    if (dateValue instanceof Date) {
      return dateValue;
    }

    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
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
