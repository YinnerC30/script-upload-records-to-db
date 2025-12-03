import z from 'zod';
import { ExcelRow } from '../types/excel';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface HeaderValidationResult {
  isValid: boolean;
  mappedHeaders: string[];
  missingHeaders: string[];
  extraHeaders: string[];
}

export const HEADER_MAPPING: { [key: string]: string } = {
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
  unidad: 'unidad',
  'monto disponible': 'monto_disponible',
  moneda: 'moneda',
  organismo: 'organismo',
};

export class ExcelValidator {
  // Mapeo de encabezados del Excel a campos del código (normalizados)

  // Campos requeridos para una licitación válida
  private readonly REQUIRED_FIELDS = [
    'licitacion_id',
    'nombre',
    'fecha_publicacion',
    'fecha_cierre',
    'organismo',
    'unidad',
    'monto_disponible',
    'moneda',
    'estado',
  ];

  /**
   * Valida los encabezados del archivo Excel
   */
  validateHeaders(headers: string[]): HeaderValidationResult {
    const normalizedHeaders = headers.map((header) =>
      this.normalizeHeader(header)
    );

    const mappedHeaders: string[] = [];
    const missingHeaders: string[] = [];
    const extraHeaders: string[] = [];

    // Verificar encabezados mapeados
    for (const header of normalizedHeaders) {
      if (HEADER_MAPPING[header]) {
        mappedHeaders.push(HEADER_MAPPING[header]);
      } else {
        extraHeaders.push(header);
      }
    }

    // Verificar campos requeridos
    for (const requiredField of this.REQUIRED_FIELDS) {
      if (!mappedHeaders.includes(requiredField)) {
        missingHeaders.push(requiredField);
      }
    }

    const isValid = missingHeaders.length === 0;

    return {
      isValid,
      mappedHeaders,
      missingHeaders,
      extraHeaders,
    };
  }

  /**
   * Valida una fila de datos
   */
  validateRow(row: ExcelRow, rowIndex: number): ValidationResult {
    // Definir esquema Zod para validación de fila
    const rowSchema = z.object({
      licitacion_id: z
        .string({
          message: `Fila ${rowIndex + 1}: ID de licitación es requerido`,
        })
        .min(1, `Fila ${rowIndex + 1}: ID de licitación es requerido`),
      nombre: z
        .string({
          message: `Fila ${rowIndex + 1}: Nombre es requerido`,
        })
        .min(1, `Fila ${rowIndex + 1}: Nombre es requerido`),
      fecha_publicacion: z
        .string({
          message: `Fila ${rowIndex + 1}: Fecha de publicación es requerida`,
        })
        .regex(
          /^(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}|\d{4}-\d{2}-\d{2} \d{2}:\d{2})$/,
          `Fila ${
            rowIndex + 1
          }: Fecha de publicación debe tener formato DD/MM/YYYY HH:MM o YYYY-MM-DD HH:MM`
        )
        .refine((dateStr) => {
          let day = 0,
            month = 0,
            year = 0,
            hour = 0,
            minute = 0;

          if (dateStr.includes('/')) {
            // Formato antiguo: DD/MM/YYYY HH:MM
            const [datePart = '', timePart = ''] = dateStr.split(' ');
            [day = 0, month = 0, year = 0] = datePart.split('/').map(Number);
            [hour = 0, minute = 0] = timePart.split(':').map(Number);
          } else if (dateStr.includes('-')) {
            // Formato nuevo: YYYY-MM-DD HH:MM
            const [datePart = '', timePart = ''] = dateStr.split(' ');
            [year = 0, month = 0, day = 0] = datePart.split('-').map(Number);
            [hour = 0, minute = 0] = timePart.split(':').map(Number);
          } else {
            return false;
          }

          // Validar rangos básicos
          if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900)
            return false;
          if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return false;

          // Verificar fecha/hora real
          const date = new Date(year, month - 1, day, hour, minute);
          return (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day &&
            date.getHours() === hour &&
            date.getMinutes() === minute
          );
        }, `Fila ${rowIndex + 1}: Fecha de publicación no es una fecha válida`),
      fecha_cierre: z
        .string({
          message: `Fila ${rowIndex + 1}: Fecha de cierre es requerida`,
        })
        .regex(
          /^(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}|\d{4}-\d{2}-\d{2} \d{2}:\d{2})$/,
          `Fila ${
            rowIndex + 1
          }: Fecha de cierre debe tener formato DD/MM/YYYY HH:MM o YYYY-MM-DD HH:MM`
        )
        .refine((dateStr) => {
          let day = 0,
            month = 0,
            year = 0,
            hour = 0,
            minute = 0;

          if (dateStr.includes('/')) {
            // Formato antiguo: DD/MM/YYYY HH:MM
            const [datePart = '', timePart = ''] = dateStr.split(' ');
            [day = 0, month = 0, year = 0] = datePart.split('/').map(Number);
            [hour = 0, minute = 0] = timePart.split(':').map(Number);
          } else if (dateStr.includes('-')) {
            // Formato nuevo: YYYY-MM-DD HH:MM
            const [datePart = '', timePart = ''] = dateStr.split(' ');
            [year = 0, month = 0, day = 0] = datePart.split('-').map(Number);
            [hour = 0, minute = 0] = timePart.split(':').map(Number);
          } else {
            return false;
          }

          // Validar rangos básicos
          if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900)
            return false;
          if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return false;

          // Verificar fecha/hora real
          const date = new Date(year, month - 1, day, hour, minute);
          return (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day &&
            date.getHours() === hour &&
            date.getMinutes() === minute
          );
        }, `Fila ${rowIndex + 1}: Fecha de cierre no es una fecha válida`),
      monto_disponible: z
        .number({
          message: `Fila ${rowIndex + 1}: Monto disponible es requerido`,
        })
        .min(
          0,
          `Fila ${rowIndex + 1}: Monto disponible debe ser un número positivo`
        ),
      organismo: z
        .string({
          message: `Fila ${rowIndex + 1}: Organismo es requerido`,
        })
        .min(1, `Fila ${rowIndex + 1}: Organismo es requerido`),
      unidad: z
        .string({
          message: `Fila ${rowIndex + 1}: Unidad es requerido`,
        })
        .min(1, `Fila ${rowIndex + 1}: Unidad es requerido`),
      moneda: z
        .string({
          message: `Fila ${rowIndex + 1}: Moneda es requerido`,
        })
        .min(1, `Fila ${rowIndex + 1}: Moneda es requerido`),
      cotizaciones_enviadas: z.number().optional(),
      estado_convocatoria: z
        .string({
          message: `Fila ${rowIndex + 1}: Estado de convocatoria es requerido`,
        })
        .optional(),
      estado: z
        .string({
          message: `Fila ${rowIndex + 1}: Estado es requerido`,
        })
        .min(1, `Fila ${rowIndex + 1}: Estado es requerido`),
    });

    rowSchema.safeParse(row);
    const result = rowSchema.safeParse(row);

    if (result.success) {
      return {
        isValid: true,
        errors: [],
      };
    } else {
      return {
        isValid: false,
        errors: result.error.issues.map((issue) => issue.message),
      };
    }
  }

  /**
   * Valida un conjunto de datos
   */
  validateData(data: ExcelRow[]): ValidationResult & {
    invalidRowsCount: number;
    validRowsCount: number;
    validRows: ExcelRow[];
    invalidRows: ExcelRow[];
  } {
    if (!Array.isArray(data) || data.length === 0) {
      return {
        isValid: false,
        errors: ['Los datos deben ser un array no vacío'],
        invalidRowsCount: 0,
        validRowsCount: 0,
        validRows: [],
        invalidRows: [],
      };
    }

    // const validRows = [];
    const allErrors: string[] = [];

    let validRows: ExcelRow[] = [];
    let invalidRows: ExcelRow[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      const validation = this.validateRow(row, i);

      if (validation.isValid) {
        validRows.push(row);
      } else {
        invalidRows.push(row);
      }

      allErrors.push(...validation.errors);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      invalidRowsCount: invalidRows.length,
      validRowsCount: validRows.length,
      validRows,
      invalidRows,
    };
  }

  /**
   * Normaliza un encabezado para comparación
   */
  normalizeHeader(header: string): string {
    return header
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
      });
  }
}
