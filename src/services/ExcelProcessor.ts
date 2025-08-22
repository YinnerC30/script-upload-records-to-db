import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { AppDataSource } from '../config/database';
import { Licitacion } from '../entities/Licitacion';
import logger, { StructuredLogger } from '../utils/logger';

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
  private logger: StructuredLogger;

  constructor() {
    this.excelDirectory = process.env.EXCEL_DIRECTORY || './excel-files';
    this.processedDirectory =
      process.env.PROCESSED_DIRECTORY || './processed-files';
    this.errorDirectory = process.env.ERROR_DIRECTORY || './error-files';
    this.batchSize = parseInt(process.env.BATCH_SIZE || '100');
    this.logger = new StructuredLogger('ExcelProcessor');

    // Crear directorios si no existen
    [this.excelDirectory, this.processedDirectory, this.errorDirectory].forEach(
      (dir) => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
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
   * Procesa un archivo Excel específico
   */
  public async processExcelFile(filePath: string): Promise<void> {
    const fileName = path.basename(filePath);
    const startTime = Date.now();

    this.logger.info('Iniciando procesamiento del archivo', {
      fileName,
      filePath,
      fileSize: fs.statSync(filePath).size,
    });

    try {
      // Leer archivo Excel
      const readStartTime = Date.now();
      const data = await this.readExcelFile(filePath);
      const readTime = Date.now() - readStartTime;

      this.logger.performance('read_excel_file', readTime, {
        fileName,
        recordsCount: data.length,
      });

      if (!data || data.length === 0) {
        throw new Error(
          'El archivo Excel está vacío o no contiene datos válidos'
        );
      }

      // Validar datos
      const validationStartTime = Date.now();
      const isValid = await this.validateData(data);
      const validationTime = Date.now() - validationStartTime;

      this.logger.performance('validate_data', validationTime, {
        fileName,
        recordsCount: data.length,
      });

      if (!isValid) {
        throw new Error('Los datos del archivo Excel no son válidos');
      }

      // Guardar en base de datos
      const saveStartTime = Date.now();
      await this.saveToDatabase(data, fileName);
      const saveTime = Date.now() - saveStartTime;

      this.logger.performance('save_to_database', saveTime, {
        fileName,
        recordsCount: data.length,
        batchSize: this.batchSize,
      });

      // Mover archivo a directorio procesado
      const moveStartTime = Date.now();
      await this.moveToProcessed(filePath, fileName);
      const moveTime = Date.now() - moveStartTime;

      this.logger.performance('move_file', moveTime, {
        fileName,
        destination: this.processedDirectory,
      });

      const totalTime = Date.now() - startTime;
      this.logger.info('Archivo procesado exitosamente', {
        fileName,
        recordsCount: data.length,
        totalTime,
        totalTimeMs: totalTime,
        sessionId: this.logger.getSessionId(),
      });

      // Logging de métricas
      this.logger.metrics('records_processed', data.length, 'records', {
        fileName,
        processingTime: totalTime,
      });
    } catch (error) {
      const totalTime = Date.now() - startTime;
      this.logger.error('Error procesando archivo', error, {
        fileName,
        totalTime,
        totalTimeMs: totalTime,
        sessionId: this.logger.getSessionId(),
      });

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
   * Guarda los datos en la base de datos por lotes
   */
  private async saveToDatabase(
    data: ExcelRow[],
    fileName: string
  ): Promise<void> {
    const startTime = Date.now();
    let totalInserted = 0;
    let batchCount = 0;

    this.logger.info('Iniciando inserción en base de datos', {
      fileName,
      totalRecords: data.length,
      batchSize: this.batchSize,
    });

    try {
      for (let i = 0; i < data.length; i += this.batchSize) {
        const batchStartTime = Date.now();
        const batch = data.slice(i, i + this.batchSize);
        const startIndex = i + 1;
        const endIndex = Math.min(i + this.batchSize, data.length);

        batchCount++;

        // Procesar lote
        await this.processBatch(batch, fileName);

        const batchTime = Date.now() - batchStartTime;
        totalInserted += batch.length;

        // Log cada 10 lotes o en el último lote
        if (batchCount % 10 === 0 || endIndex === data.length) {
          this.logger.verbose('Progreso de inserción', {
            fileName,
            batchNumber: batchCount,
            recordsProcessed: totalInserted,
            totalRecords: data.length,
            progress: `${((totalInserted / data.length) * 100).toFixed(1)}%`,
            batchTime,
            averageTimePerRecord: batchTime / batch.length,
          });
        }
      }

      const totalTime = Date.now() - startTime;
      this.logger.info('Inserción en base de datos completada', {
        fileName,
        totalRecords: data.length,
        totalInserted,
        totalTime,
        totalTimeMs: totalTime,
        averageTimePerRecord: totalTime / data.length,
        batchesProcessed: batchCount,
      });
    } catch (error) {
      const totalTime = Date.now() - startTime;
      this.logger.error('Error en inserción de base de datos', error, {
        fileName,
        totalRecords: data.length,
        totalInserted,
        totalTime,
        totalTimeMs: totalTime,
        batchesProcessed: batchCount,
      });
      throw error;
    }
  }

  /**
   * Procesa un lote de registros
   */
  private async processBatch(
    batch: ExcelRow[],
    fileName: string
  ): Promise<void> {
    const licitacionRepository = AppDataSource.getRepository(Licitacion);
    const licitaciones = batch.map((row) =>
      this.mapToLicitacion(row, fileName)
    );
    await licitacionRepository.save(licitaciones);
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
    const startTime = Date.now();
    this.logger.info('🚀 Iniciando procesamiento de archivos Excel...', {
      excelDirectory: this.excelDirectory,
      batchSize: this.batchSize,
    });

    try {
      const latestFile = this.findLatestExcelFile();

      if (!latestFile) {
        this.logger.warn('No se encontraron archivos Excel para procesar', {
          directory: this.excelDirectory,
        });
        return;
      }

      this.logger.info('Archivo más reciente encontrado', {
        fileName: path.basename(latestFile),
        filePath: latestFile,
        fileSize: fs.statSync(latestFile).size,
      });

      await this.processExcelFile(latestFile);

      const totalTime = Date.now() - startTime;
      this.logger.info('✅ Procesamiento completado exitosamente', {
        totalTime,
        totalTimeMs: totalTime,
        sessionId: this.logger.getSessionId(),
      });
    } catch (error) {
      const totalTime = Date.now() - startTime;
      this.logger.error('❌ Error en el procesamiento', error, {
        totalTime,
        totalTimeMs: totalTime,
        sessionId: this.logger.getSessionId(),
      });
      throw error;
    }
  }
}
