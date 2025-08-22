import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { AppDataSource } from '../config/database';
import { Licitacion } from '../entities/Licitacion';
import { ExcelData } from '../entities/ExcelData';
import logger from '../utils/logger';

export interface ExcelRow {
  idLicitacion?: string;
  nombre?: string;
  fechaPublicacion?: string | Date;
  fechaCierre?: string | Date;
  organismo?: string;
  unidad?: string;
  montoDisponible?: number | string;
  moneda?: string;
  estado?: string;
  [key: string]: any;
}

// Mapeo de encabezados del Excel a campos del código (normalizados)
const HEADER_MAPPING: { [key: string]: string } = {
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

export class ExcelProcessor {
  private readonly excelDirectory: string;
  private readonly processedDirectory: string;
  private readonly errorDirectory: string;
  private readonly batchSize: number;

  constructor() {
    this.excelDirectory = process.env.EXCEL_DIRECTORY || './excel-files';
    this.processedDirectory =
      process.env.PROCESSED_DIRECTORY || './processed-files';
    this.errorDirectory = process.env.ERROR_DIRECTORY || './error-files';
    this.batchSize = parseInt(process.env.BATCH_SIZE || '100');

    // Crear directorios si no existen
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    [this.excelDirectory, this.processedDirectory, this.errorDirectory].forEach(
      (dir) => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          logger.info(`Directorio creado: ${dir}`);
        }
      }
    );
  }

  /**
   * Encuentra el archivo Excel más reciente en el directorio
   */
  public findLatestExcelFile(): string | null {
    try {
      const files = fs
        .readdirSync(this.excelDirectory)
        .filter((file) => {
          const ext = path.extname(file).toLowerCase();
          return ext === '.xlsx' || ext === '.xls';
        })
        .map((file) => ({
          name: file,
          path: path.join(this.excelDirectory, file),
          stats: fs.statSync(path.join(this.excelDirectory, file)),
        }))
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      if (files.length === 0) {
        logger.info('No se encontraron archivos Excel en el directorio');
        return null;
      }

      const latestFile = files[0];
      if (latestFile) {
        logger.info(`Archivo más reciente encontrado: ${latestFile.name}`);
        return latestFile.path;
      }
      return null;
    } catch (error) {
      logger.error('Error buscando archivo Excel:', error);
      return null;
    }
  }

  /**
   * Lee y procesa un archivo Excel
   */
  public async processExcelFile(filePath: string): Promise<void> {
    const fileName = path.basename(filePath);
    logger.info(`Iniciando procesamiento del archivo: ${fileName}`);

    try {
      // Leer archivo Excel
      const data = await this.readExcelFile(filePath);

      if (!data || data.length === 0) {
        throw new Error(
          'El archivo Excel está vacío o no contiene datos válidos'
        );
      }

      // Validar datos
      const isValid = await this.validateData(data);
      if (!isValid) {
        throw new Error('Los datos del archivo Excel no son válidos');
      }

      // Guardar en base de datos
      await this.saveToDatabase(data, fileName);

      // Mover archivo a directorio procesado
      await this.moveToProcessed(filePath, fileName);

      logger.info(
        `Archivo ${fileName} procesado exitosamente. ${data.length} registros insertados.`
      );
    } catch (error) {
      logger.error(`Error procesando archivo ${fileName}:`, error);
      await this.moveToError(filePath, fileName);
      throw error;
    }
  }

  /**
   * Lee un archivo Excel y retorna los datos
   */
  private async readExcelFile(filePath: string): Promise<ExcelRow[]> {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('No se encontró ninguna hoja en el archivo Excel');
      }
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        throw new Error('No se pudo acceder a la hoja del archivo Excel');
      }

      // Convertir a JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet) as any[];

      // Mapear encabezados y transformar datos
      const data = this.mapHeadersAndTransformData(rawData);

      logger.info(`Leídos ${data.length} registros del archivo Excel`);
      return data;
    } catch (error) {
      logger.error('Error leyendo archivo Excel:', error);
      throw error;
    }
  }

  /**
   * Mapea los encabezados del Excel y transforma los datos
   */
  private mapHeadersAndTransformData(rawData: any[]): ExcelRow[] {
    if (!rawData || rawData.length === 0) {
      return [];
    }

    // Obtener el primer registro para identificar los encabezados
    const firstRow = rawData[0];
    const headers = Object.keys(firstRow);

    logger.info('Encabezados encontrados en el archivo:', headers);

    // Crear mapeo de encabezados originales a campos normalizados
    const headerMapping: { [key: string]: string } = {};
    const unmappedHeaders: string[] = [];

    headers.forEach((header) => {
      const normalizedHeader = this.normalizeHeader(header);
      if (HEADER_MAPPING[normalizedHeader]) {
        headerMapping[header] = HEADER_MAPPING[normalizedHeader];
      } else {
        unmappedHeaders.push(header);
        logger.warn(`Encabezado no mapeado: "${header}"`);
      }
    });

    if (unmappedHeaders.length > 0) {
      logger.warn(`Encabezados no mapeados: ${unmappedHeaders.join(', ')}`);
    }

    // Transformar cada fila usando el mapeo
    return rawData.map((row, index) => {
      const transformedRow: ExcelRow = {};

      headers.forEach((originalHeader) => {
        const mappedField = headerMapping[originalHeader];
        if (mappedField) {
          transformedRow[mappedField] = row[originalHeader];
        }
      });

      return transformedRow;
    });
  }

  /**
   * Normaliza un encabezado para facilitar el mapeo
   */
  private normalizeHeader(header: string): string {
    return header
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ') // Normalizar espacios múltiples
      .replace(/[áéíóúüñ]/g, (match) => {
        const accents: { [key: string]: string } = {
          á: 'a',
          é: 'e',
          í: 'i',
          ó: 'o',
          ú: 'u',
          ü: 'u',
          ñ: 'n',
        };
        return accents[match] || match;
      });
  }

  /**
   * Valida los datos del Excel
   */
  private async validateData(data: ExcelRow[]): Promise<boolean> {
    if (!Array.isArray(data) || data.length === 0) {
      logger.warn('Datos inválidos: array vacío o no es un array');
      return false;
    }

    // Validar que todos los registros tengan al menos idLicitacion
    const validRecords = data.every((row, index) => {
      if (!row.idLicitacion) {
        logger.warn(`Registro ${index + 1} sin idLicitacion`);
        return false;
      }
      return true;
    });

    if (!validRecords) {
      logger.warn('Algunos registros no tienen idLicitacion');
      return false;
    }

    logger.info(`Validación exitosa: ${data.length} registros válidos`);
    return true;
  }

  /**
   * Guarda los datos en la base de datos
   */
  private async saveToDatabase(
    data: ExcelRow[],
    fileName: string
  ): Promise<void> {
    const licitacionRepository = AppDataSource.getRepository(Licitacion);
    const excelDataRepository = AppDataSource.getRepository(ExcelData);

    try {
      // Guardar resumen de datos procesados en excel_data para respaldo
      const excelData = new ExcelData();
      excelData.fileName = fileName;
      
      // Crear un resumen en lugar de guardar todos los datos
      const summary = {
        totalRecords: data.length,
        headers: Object.keys(data[0] || {}),
        sampleRecord: data[0] || {},
        processedAt: new Date().toISOString(),
        mappingApplied: true
      };
      
      excelData.data = JSON.stringify(summary);
      excelData.processedAt = new Date();

      await excelDataRepository.save(excelData);

      // Procesar registros en lotes
      for (let i = 0; i < data.length; i += this.batchSize) {
        const batch = data.slice(i, i + this.batchSize);
        const licitaciones = batch.map((row) =>
          this.mapToLicitacion(row, fileName)
        );

        await licitacionRepository.save(licitaciones);

        logger.info(
          `Lote procesado: ${i + 1} a ${Math.min(
            i + this.batchSize,
            data.length
          )} de ${data.length}`
        );
      }
    } catch (error) {
      logger.error('Error guardando en base de datos:', error);
      throw error;
    }
  }

  /**
   * Mapea una fila del Excel a la entidad Licitacion
   */
  private mapToLicitacion(row: ExcelRow, fileName: string): Licitacion {
    const licitacion = new Licitacion();

    licitacion.idLicitacion = row.idLicitacion || '';
    licitacion.nombre = row.nombre || '';
    licitacion.fechaPublicacion = this.parseDate(row.fechaPublicacion);
    licitacion.fechaCierre = this.parseDate(row.fechaCierre);
    licitacion.organismo = row.organismo || '';
    licitacion.unidad = row.unidad || '';
    licitacion.montoDisponible = this.parseNumber(row.montoDisponible);
    licitacion.moneda = row.moneda || 'CLP';
    licitacion.estado = row.estado || '';
    licitacion.fileName = fileName;
    licitacion.processedAt = new Date();

    return licitacion;
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

  /**
   * Mueve el archivo al directorio de procesados
   */
  private async moveToProcessed(
    filePath: string,
    fileName: string
  ): Promise<void> {
    const destination = path.join(this.processedDirectory, fileName);
    fs.renameSync(filePath, destination);
    logger.info(`Archivo movido a procesados: ${fileName}`);
  }

  /**
   * Mueve el archivo al directorio de errores
   */
  private async moveToError(filePath: string, fileName: string): Promise<void> {
    const destination = path.join(this.errorDirectory, fileName);
    fs.renameSync(filePath, destination);
    logger.info(`Archivo movido a errores: ${fileName}`);
  }

  /**
   * Ejecuta el procesamiento completo
   */
  public async run(): Promise<void> {
    logger.info('🚀 Iniciando procesamiento de archivos Excel...');

    const latestFile = this.findLatestExcelFile();

    if (!latestFile) {
      logger.info('No hay archivos Excel para procesar');
      return;
    }

    await this.processExcelFile(latestFile);
    logger.info('✅ Procesamiento completado exitosamente');
  }
}
