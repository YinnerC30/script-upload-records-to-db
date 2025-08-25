import { ExcelRow } from '../types/excel';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
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

  // Campos requeridos para una licitación válida
  private readonly REQUIRED_FIELDS = ['idLicitacion', 'nombre'];

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
    console.log('🚀 ~ ExcelValidator ~ validateRow ~ row:Original', row)
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar campos requeridos
    if (!row.idLicitacion || row.idLicitacion.toString().trim() === '') {
      errors.push(`Fila ${rowIndex + 1}: ID de licitación es requerido`);
    }

    if (!row.nombre || row.nombre.toString().trim() === '') {
      errors.push(`Fila ${rowIndex + 1}: Nombre es requerido`);
    }

    // Validar formato de fechas
    if (row.fechaPublicacion) {
      const date = this.parseDate(row.fechaPublicacion);
      if (!date || isNaN(date.getTime())) {
        errors.push(`Fila ${rowIndex + 1}: Fecha de publicación inválida`);
      }
    }

    if (row.fechaCierre) {
      const date = this.parseDate(row.fechaCierre);
      if (!date || isNaN(date.getTime())) {
        errors.push(`Fila ${rowIndex + 1}: Fecha de cierre inválida`);
      }
    }

    // Validar monto disponible
    if (row.montoDisponible !== undefined && row.montoDisponible !== null) {
      const amount = this.parseNumber(row.montoDisponible);
      if (isNaN(amount) || amount < 0) {
        errors.push(
          `Fila ${rowIndex + 1}: Monto disponible debe ser un número positivo`
        );
      }
    }

    // Advertencias para campos opcionales vacíos
    if (!row.organismo || row.organismo.toString().trim() === '') {
      warnings.push(`Fila ${rowIndex + 1}: Organismo está vacío`);
    }

    if (!row.unidad || row.unidad.toString().trim() === '') {
      warnings.push(`Fila ${rowIndex + 1}: Unidad está vacía`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida un conjunto de datos
   */
  validateData(data: ExcelRow[]): ValidationResult {
    if (!Array.isArray(data) || data.length === 0) {
      return {
        isValid: false,
        errors: ['Los datos deben ser un array no vacío'],
        warnings: [],
      };
    }

    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    let validRows = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      const validation = this.validateRow(row, i);

      allErrors.push(...validation.errors);
      allWarnings.push(...validation.warnings);

      if (validation.isValid) {
        validRows++;
      }
    }

    // Advertencia si hay muchas filas inválidas
    const invalidRows = data.length - validRows;
    if (invalidRows > 0) {
      allWarnings.push(
        `${invalidRows} de ${data.length} filas tienen errores de validación`
      );
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
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
      .replace(/[^\w\s]/g, '');
  }

  /**
   * Parsea una fecha desde string o Date
   */
  private parseDate(dateValue: string | Date | undefined): Date {
    console.log('🚀 ~ ExcelValidator ~ parseDate ~ dateValue:', dateValue);

    if (!dateValue) return new Date();

    if (dateValue instanceof Date) {
      return dateValue;
    }

    const parsed = new Date(dateValue);
    console.log('🚀 ~ ExcelValidator ~ parseDate ~ parsed:', parsed);
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
