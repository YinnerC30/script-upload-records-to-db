import * as XLSX from 'xlsx';
import * as fs from 'fs/promises';
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
    this.ensureDirectories();
  }

  /**
   * Asegura que los directorios necesarios existan
   */
  private async ensureDirectories(): Promise<void> {
    const directories = [
      this.excelDirectory,
      this.processedDirectory,
      this.errorDirectory,
    ];

    for (const dir of directories) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  /**
   * Encuentra el archivo Excel más reciente en el directorio
   */
  public async findLatestExcelFile(): Promise<string | null> {
    try {
      const files = await fs.readdir(this.excelDirectory);
      const excelFiles = files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return ext === '.xlsx' || ext === '.xls';
      });

      if (excelFiles.length === 0) {
        logger.info('No se encontraron archivos Excel en el directorio');
        return null;
      }

      // Obtener estadísticas de todos los archivos
      const fileStats = await Promise.all(
        excelFiles.map(async (file) => {
          const filePath = path.join(this.excelDirectory, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            path: filePath,
            stats,
          };
        })
      );

      // Ordenar por fecha de modificación (más reciente primero)
      fileStats.sort(
        (a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime()
      );

      const latestFile = fileStats[0];
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

    // Asegurar que los directorios existan antes de procesar
    await this.ensureDirectories();

    const fileStats = await fs.stat(filePath);
    console.log(`\n📁 Procesando archivo: ${fileName}`);
    console.log(
      `   📏 Tamaño: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(`   ⏰ Inicio: ${new Date().toLocaleTimeString()}\n`);

    this.logger.info('Iniciando procesamiento del archivo', {
      fileName,
      filePath,
      fileSize: fileStats.size,
    });

    try {
      // Leer archivo Excel
      console.log('📖 Leyendo archivo Excel...');
      const readStartTime = Date.now();
      const data = await this.readExcelFile(filePath);
      const readTime = Date.now() - readStartTime;

      console.log(
        `   ✅ Leídos ${data.length.toLocaleString()} registros en ${readTime}ms\n`
      );

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
      console.log('🔍 Validando datos...');
      const validationStartTime = Date.now();
      const isValid = await this.validateData(data);
      const validationTime = Date.now() - validationStartTime;

      console.log(`   ✅ Validación completada en ${validationTime}ms\n`);

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
      console.log('📦 Moviendo archivo a directorio procesado...');
      const moveStartTime = Date.now();
      await this.moveToProcessed(filePath, fileName);
      const moveTime = Date.now() - moveStartTime;

      console.log(`   ✅ Archivo movido en ${moveTime}ms`);

      this.logger.performance('move_file', moveTime, {
        fileName,
        destination: this.processedDirectory,
      });

      const totalTime = Date.now() - startTime;
      const totalTimeSeconds = Math.round(totalTime / 1000);

      console.log(`\n🎉 ¡Procesamiento completado exitosamente!`);
      console.log(
        `   📊 Total de registros procesados: ${data.length.toLocaleString()}`
      );
      console.log(`   ⏱️  Tiempo total: ${totalTimeSeconds}s`);
      console.log(`   ⏰ Finalizado: ${new Date().toLocaleTimeString()}\n`);

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
      console.log(`\n❌ Error durante el procesamiento:`);
      console.log(
        `   ⏱️  Tiempo transcurrido: ${Math.round(totalTime / 1000)}s`
      );
      console.log(`   📁 Moviendo archivo a directorio de errores...\n`);

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

    console.log(`\n📊 Iniciando inserción en base de datos:`);
    console.log(`   📁 Archivo: ${fileName}`);
    console.log(`   📈 Total de registros: ${data.length.toLocaleString()}`);
    console.log(`   📦 Tamaño de lote: ${this.batchSize}`);
    console.log(`   ⏱️  Inicio: ${new Date().toLocaleTimeString()}\n`);

    // Iniciar transacción global
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (let i = 0; i < data.length; i += this.batchSize) {
        const batchStartTime = Date.now();
        const batch = data.slice(i, i + this.batchSize);
        const startIndex = i + 1;
        const endIndex = Math.min(i + this.batchSize, data.length);

        batchCount++;

        // Procesar lote dentro de la transacción
        await this.processBatchWithTransaction(batch, fileName, queryRunner);

        const batchTime = Date.now() - batchStartTime;
        totalInserted += batch.length;

        // Calcular progreso
        const progress = ((totalInserted / data.length) * 100).toFixed(1);
        const remainingRecords = data.length - totalInserted;
        const estimatedTimeRemaining =
          remainingRecords > 0
            ? Math.round(((batchTime / batch.length) * remainingRecords) / 1000)
            : 0;

        // Mostrar progreso en consola
        console.log(
          `   ✅ Lote ${batchCount}: ${totalInserted.toLocaleString()}/${data.length.toLocaleString()} registros (${progress}%)`
        );

        // Mostrar tiempo estimado cada 5 lotes o en el último
        if (batchCount % 5 === 0 || endIndex === data.length) {
          const elapsedTime = Math.round((Date.now() - startTime) / 1000);
          console.log(
            `   ⏱️  Tiempo transcurrido: ${elapsedTime}s | Estimado restante: ${estimatedTimeRemaining}s`
          );
          console.log(
            `   📊 Velocidad: ${Math.round(
              totalInserted / (elapsedTime / 60)
            )} registros/min\n`
          );
        }
      }

      // Commit de la transacción
      await queryRunner.commitTransaction();

      const totalTime = Date.now() - startTime;
      const totalTimeSeconds = Math.round(totalTime / 1000);

      console.log(`\n🎉 ¡Inserción completada exitosamente!`);
      console.log(
        `   📊 Total de registros insertados: ${totalInserted.toLocaleString()}`
      );
      console.log(`   ⏱️  Tiempo total: ${totalTimeSeconds}s`);
      console.log(`   📦 Lotes procesados: ${batchCount}`);
      console.log(
        `   🚀 Velocidad promedio: ${Math.round(
          totalInserted / (totalTimeSeconds / 60)
        )} registros/min`
      );
      console.log(`   ⏰ Finalizado: ${new Date().toLocaleTimeString()}\n`);

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
      // Rollback automático en caso de error
      await queryRunner.rollbackTransaction();

      const totalTime = Date.now() - startTime;
      console.log(`\n❌ Error durante la inserción - ROLLBACK realizado:`);
      console.log(
        `   📊 Registros procesados hasta el error: ${totalInserted.toLocaleString()}`
      );
      console.log(
        `   ⏱️  Tiempo transcurrido: ${Math.round(totalTime / 1000)}s`
      );
      console.log(
        `   🔄 Todos los cambios han sido revertidos automáticamente\n`
      );

      this.logger.error('Error en inserción - Rollback realizado', error, {
        fileName,
        totalRecords: data.length,
        totalInserted,
        totalTime,
        totalTimeMs: totalTime,
        batchesProcessed: batchCount,
        rollbackPerformed: true,
      });
      throw error;
    } finally {
      // Liberar recursos
      await queryRunner.release();
    }
  }

  /**
   * Procesa un lote de registros dentro de una transacción
   */
  private async processBatchWithTransaction(
    batch: ExcelRow[],
    fileName: string,
    queryRunner: any
  ): Promise<void> {
    const licitacionRepository = queryRunner.manager.getRepository(Licitacion);
    const licitaciones = batch.map((row) =>
      this.mapToLicitacion(row, fileName)
    );

    // Mostrar progreso del lote actual
    process.stdout.write(
      `   🔄 Procesando lote de ${batch.length} registros... `
    );

    await licitacionRepository.save(licitaciones);

    // Confirmar que el lote se completó
    process.stdout.write('✅\n');
  }

  /**
   * Procesa un lote de registros (método original para compatibilidad)
   */
  private async processBatch(
    batch: ExcelRow[],
    fileName: string
  ): Promise<void> {
    const licitacionRepository = AppDataSource.getRepository(Licitacion);
    const licitaciones = batch.map((row) =>
      this.mapToLicitacion(row, fileName)
    );

    // Mostrar progreso del lote actual
    process.stdout.write(
      `   🔄 Procesando lote de ${batch.length} registros... `
    );

    await licitacionRepository.save(licitaciones);

    // Confirmar que el lote se completó
    process.stdout.write('✅\n');
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
    await fs.rename(filePath, destination);
    logger.info(`Archivo movido a procesados: ${fileName}`);
  }

  /**
   * Mueve el archivo al directorio de errores
   */
  private async moveToError(filePath: string, fileName: string): Promise<void> {
    const destination = path.join(this.errorDirectory, fileName);
    await fs.rename(filePath, destination);
    logger.info(`Archivo movido a errores: ${fileName}`);
  }

  /**
   * Ejecuta el procesamiento completo
   */
  public async run(): Promise<void> {
    const startTime = Date.now();
    console.log('\n🚀 Iniciando procesamiento de archivos Excel...');
    console.log(`   📁 Directorio: ${this.excelDirectory}`);
    console.log(`   📦 Tamaño de lote: ${this.batchSize}`);
    console.log(`   ⏰ Inicio: ${new Date().toLocaleTimeString()}\n`);

    this.logger.info('🚀 Iniciando procesamiento de archivos Excel...', {
      excelDirectory: this.excelDirectory,
      batchSize: this.batchSize,
    });

    try {
      console.log('🔍 Buscando archivo Excel más reciente...');
      const latestFile = await this.findLatestExcelFile();

      if (!latestFile) {
        console.log('⚠️  No se encontraron archivos Excel para procesar');
        console.log(`   📁 Directorio revisado: ${this.excelDirectory}\n`);

        this.logger.warn('No se encontraron archivos Excel para procesar', {
          directory: this.excelDirectory,
        });
        return;
      }

      const fileName = path.basename(latestFile);
      const fileSize = (await fs.stat(latestFile)).size;

      console.log(`✅ Archivo encontrado: ${fileName}`);
      console.log(`   📏 Tamaño: ${(fileSize / 1024 / 1024).toFixed(2)} MB\n`);

      this.logger.info('Archivo más reciente encontrado', {
        fileName: fileName,
        filePath: latestFile,
        fileSize: fileSize,
      });

      await this.processExcelFile(latestFile);

      const totalTime = Date.now() - startTime;
      const totalTimeSeconds = Math.round(totalTime / 1000);

      console.log(`\n🎉 ¡Procesamiento completado exitosamente!`);
      console.log(`   ⏱️  Tiempo total: ${totalTimeSeconds}s`);
      console.log(`   ⏰ Finalizado: ${new Date().toLocaleTimeString()}\n`);

      this.logger.info('✅ Procesamiento completado exitosamente', {
        totalTime,
        totalTimeMs: totalTime,
        sessionId: this.logger.getSessionId(),
      });
    } catch (error) {
      const totalTime = Date.now() - startTime;
      const totalTimeSeconds = Math.round(totalTime / 1000);

      console.log(`\n❌ Error en el procesamiento:`);
      console.log(`   ⏱️  Tiempo transcurrido: ${totalTimeSeconds}s`);
      console.log(`   ⏰ Error ocurrido: ${new Date().toLocaleTimeString()}\n`);

      this.logger.error('❌ Error en el procesamiento', error, {
        totalTime,
        totalTimeMs: totalTime,
        sessionId: this.logger.getSessionId(),
      });
      throw error;
    }
  }
}
