import z, { ZodError } from 'zod';
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

export class ExcelValidator {
  // Mapeo de encabezados del Excel a campos del código (normalizados)
  private readonly HEADER_MAPPING: { [key: string]: string } = {
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
      if (this.HEADER_MAPPING[header]) {
        mappedHeaders.push(this.HEADER_MAPPING[header]);
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
        .string()
        .min(1, `Fila ${rowIndex + 1}: ID de licitación es requerido`),
      nombre: z.string().min(1, `Fila ${rowIndex + 1}: Nombre es requerido`),
      fecha_publicacion: z
        .string()
        .regex(
          /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/,
          `Fila ${
            rowIndex + 1
          }: Fecha de publicación debe tener formato DD/MM/YYYY HH:MM`
        )
        .refine((dateStr) => {
          const [datePart = '', timePart = ''] = dateStr.split(' ');
          const [day = 0, month = 0, year = 0] = datePart
            .split('/')
            .map(Number);
          const [hour = 0, minute = 0] = timePart.split(':').map(Number);

          // Validar rangos
          if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900)
            return false;
          if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return false;

          // Crear fecha y verificar que sea válida
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
        .string()
        .regex(
          /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/,
          `Fila ${
            rowIndex + 1
          }: Fecha de cierre debe tener formato DD/MM/YYYY HH:MM`
        )
        .refine((dateStr) => {
          const [datePart = '', timePart = ''] = dateStr.split(' ');
          const [day = 0, month = 0, year = 0] = datePart
            .split('/')
            .map(Number);
          const [hour = 0, minute = 0] = timePart.split(':').map(Number);

          // Validar rangos
          if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900)
            return false;
          if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return false;

          // Crear fecha y verificar que sea válida
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
        .number()
        .min(
          0,
          `Fila ${rowIndex + 1}: Monto disponible debe ser un número positivo`
        ),
      organismo: z
        .string()
        .min(1, `Fila ${rowIndex + 1}: Organismo es requerido`),
      unidad: z.string().min(1, `Fila ${rowIndex + 1}: Unidad es requerido`),
      moneda: z.string().min(1, `Fila ${rowIndex + 1}: Moneda es requerido`),
      cotizaciones_enviadas: z.number().optional(),
      estado_convocatoria: z.string().optional(),
      estado: z.string().min(1, `Fila ${rowIndex + 1}: Estado es requerido`),
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
  validateData(
    data: ExcelRow[]
  ): ValidationResult & { invalidRowsCount: number; validRowsCount: number } {
    if (!Array.isArray(data) || data.length === 0) {
      return {
        isValid: false,
        errors: ['Los datos deben ser un array no vacío'],
        invalidRowsCount: 0,
        validRowsCount: 0,
      };
    }

    const allErrors: string[] = [];

    let validRows = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      const validation = this.validateRow(row, i);

      allErrors.push(...validation.errors);

      if (validation.isValid) {
        validRows++;
      }
    }

    // Advertencia si hay muchas filas inválidas
    const invalidRows = data.length - validRows;

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      invalidRowsCount: invalidRows,
      validRowsCount: validRows,
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

  /**
   * Parsea una fecha desde string o Date
   */
  private parseDate(dateValue: string | Date | undefined): Date {
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
  private parseNumber(value: string | number | undefined): number {
    if (value === undefined || value === null) return 0;

    if (typeof value === 'number') {
      return value;
    }

    const parsed = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
}
