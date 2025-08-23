import * as XLSX from 'xlsx';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ApiService, LicitacionApiData } from './ApiService';
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
  private readonly dryRun: boolean;
  private readonly apiService: ApiService;
  private logger: StructuredLogger;

  constructor(dryRun: boolean = false) {
    this.excelDirectory = process.env.EXCEL_DIRECTORY || './excel-files';
    this.processedDirectory =
      process.env.PROCESSED_DIRECTORY || './processed-files';
    this.errorDirectory = process.env.ERROR_DIRECTORY || './error-files';
    this.batchSize = parseInt(process.env.BATCH_SIZE || '100');
    this.dryRun = dryRun;
    this.apiService = new ApiService();
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

      // Enviar a API REST (saltar en modo dry-run)
      if (this.dryRun) {
        console.log('🔍 [DRY-RUN] Simulando envío a API REST...');
        console.log(
          `   📊 Se simularían ${data.length.toLocaleString()} registros`
        );
        console.log(`   📦 Tamaño de lote: ${this.batchSize}`);

        // Simular tiempo de envío
        const simulatedSendTime = Math.round(data.length * 0.1); // 0.1ms por registro
        console.log(`   ⏱️  Tiempo simulado: ${simulatedSendTime}ms`);

        this.logger.info('Simulación de envío a API REST (dry-run)', {
          fileName,
          recordsCount: data.length,
          batchSize: this.batchSize,
          simulatedTime: simulatedSendTime,
        });
      } else {
        const sendStartTime = Date.now();
        await this.sendToApi(data, fileName);
        const sendTime = Date.now() - sendStartTime;

        this.logger.performance('send_to_api', sendTime, {
          fileName,
          recordsCount: data.length,
          batchSize: this.batchSize,
        });
      }

      // Mover archivo a directorio procesado (saltar en modo dry-run)
      if (this.dryRun) {
        console.log('🔍 [DRY-RUN] Simulando movimiento de archivo...');
        console.log(`   📁 Origen: ${filePath}`);
        console.log(`   📁 Destino: ${this.processedDirectory}/${fileName}`);

        this.logger.info('Simulación de movimiento de archivo (dry-run)', {
          fileName,
          source: filePath,
          destination: this.processedDirectory,
        });
      } else {
        console.log('📦 Moviendo archivo a directorio procesado...');
        const moveStartTime = Date.now();
        await this.moveToProcessed(filePath, fileName);
        const moveTime = Date.now() - moveStartTime;

        console.log(`   ✅ Archivo movido en ${moveTime}ms`);

        this.logger.performance('move_file', moveTime, {
          fileName,
          destination: this.processedDirectory,
        });
      }

      const totalTime = Date.now() - startTime;
      const totalTimeSeconds = Math.round(totalTime / 1000);

      if (this.dryRun) {
        console.log(`\n🔍 ¡Validación completada exitosamente! (MODO DRY-RUN)`);
        console.log(
          `   📊 Total de registros validados: ${data.length.toLocaleString()}`
        );
        console.log(`   ⏱️  Tiempo total: ${totalTimeSeconds}s`);
        console.log(`   ⏰ Finalizado: ${new Date().toLocaleTimeString()}`);
        console.log(
          `   💡 No se realizaron cambios en la base de datos ni archivos\n`
        );

        this.logger.info('Validación completada exitosamente (dry-run)', {
          fileName,
          recordsCount: data.length,
          totalTime,
          totalTimeMs: totalTime,
          sessionId: this.logger.getSessionId(),
        });
      } else {
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
      }

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
   * Valida los datos del Excel con validaciones completas
   */
  private async validateData(data: ExcelRow[]): Promise<boolean> {
    if (!Array.isArray(data) || data.length === 0) {
      logger.warn('Datos inválidos: array vacío o no es un array');
      return false;
    }

    let validationErrors = 0;
    const maxErrorsToLog = 10; // Limitar logs para no saturar

    // Validar cada registro individualmente
    for (let index = 0; index < data.length; index++) {
      const row = data[index];
      if (!row) {
        logger.warn(`Registro ${index + 1}: fila vacía o undefined`);
        validationErrors++;
        continue;
      }
      const rowNumber = index + 1;
      let rowHasErrors = false;

      // 1. Validar idLicitacion (campo obligatorio)
      if (!this.isValidIdLicitacion(row.idLicitacion)) {
        if (validationErrors < maxErrorsToLog) {
          logger.warn(
            `Registro ${rowNumber}: idLicitacion inválido o faltante`,
            {
              value: row.idLicitacion,
              rowNumber,
            }
          );
        }
        validationErrors++;
        rowHasErrors = true;
      }

      // 2. Validar nombre (campo obligatorio)
      if (!this.isValidNombre(row.nombre)) {
        if (validationErrors < maxErrorsToLog) {
          logger.warn(`Registro ${rowNumber}: nombre inválido o faltante`, {
            value: row.nombre,
            rowNumber,
          });
        }
        validationErrors++;
        rowHasErrors = true;
      }

      // 3. Validar fechaPublicacion
      if (!this.isValidDate(row.fechaPublicacion)) {
        if (validationErrors < maxErrorsToLog) {
          logger.warn(`Registro ${rowNumber}: fechaPublicacion inválida`, {
            value: row.fechaPublicacion,
            rowNumber,
          });
        }
        validationErrors++;
        rowHasErrors = true;
      }

      // 4. Validar fechaCierre
      if (!this.isValidDate(row.fechaCierre)) {
        if (validationErrors < maxErrorsToLog) {
          logger.warn(`Registro ${rowNumber}: fechaCierre inválida`, {
            value: row.fechaCierre,
            rowNumber,
          });
        }
        validationErrors++;
        rowHasErrors = true;
      }

      // 5. Validar organismo (campo obligatorio)
      if (!this.isValidOrganismo(row.organismo)) {
        if (validationErrors < maxErrorsToLog) {
          logger.warn(`Registro ${rowNumber}: organismo inválido o faltante`, {
            value: row.organismo,
            rowNumber,
          });
        }
        validationErrors++;
        rowHasErrors = true;
      }

      // 6. Validar unidad (campo obligatorio)
      if (!this.isValidUnidad(row.unidad)) {
        if (validationErrors < maxErrorsToLog) {
          logger.warn(`Registro ${rowNumber}: unidad inválida o faltante`, {
            value: row.unidad,
            rowNumber,
          });
        }
        validationErrors++;
        rowHasErrors = true;
      }

      // 7. Validar montoDisponible
      if (!this.isValidMontoDisponible(row.montoDisponible)) {
        if (validationErrors < maxErrorsToLog) {
          logger.warn(`Registro ${rowNumber}: montoDisponible inválido`, {
            value: row.montoDisponible,
            rowNumber,
          });
        }
        validationErrors++;
        rowHasErrors = true;
      }

      // 8. Validar moneda
      if (!this.isValidMoneda(row.moneda)) {
        if (validationErrors < maxErrorsToLog) {
          logger.warn(`Registro ${rowNumber}: moneda inválida`, {
            value: row.moneda,
            rowNumber,
          });
        }
        validationErrors++;
        rowHasErrors = true;
      }

      // 9. Validar estado
      if (!this.isValidEstado(row.estado)) {
        if (validationErrors < maxErrorsToLog) {
          logger.warn(`Registro ${rowNumber}: estado inválido`, {
            value: row.estado,
            rowNumber,
          });
        }
        validationErrors++;
        rowHasErrors = true;
      }

      // 10. Validar coherencia de fechas
      if (!this.isValidDateRange(row.fechaPublicacion, row.fechaCierre)) {
        if (validationErrors < maxErrorsToLog) {
          logger.warn(`Registro ${rowNumber}: rango de fechas inválido`, {
            fechaPublicacion: row.fechaPublicacion,
            fechaCierre: row.fechaCierre,
            rowNumber,
          });
        }
        validationErrors++;
        rowHasErrors = true;
      }

      if (rowHasErrors && validationErrors >= maxErrorsToLog) {
        logger.warn(
          `Demasiados errores de validación. Deteniendo logs detallados.`
        );
        break;
      }
    }

    if (validationErrors > 0) {
      logger.error(
        `Validación fallida: ${validationErrors} errores encontrados en ${data.length} registros`
      );
      return false;
    }

    logger.info(`Validación exitosa: ${data.length} registros válidos`);
    return true;
  }

  /**
   * Valida el campo idLicitacion
   */
  private isValidIdLicitacion(value: any): boolean {
    if (!value || typeof value !== 'string') return false;
    const trimmed = value.toString().trim();
    return trimmed.length > 0 && trimmed.length <= 50;
  }

  /**
   * Valida el campo nombre
   */
  private isValidNombre(value: any): boolean {
    if (!value || typeof value !== 'string') return false;
    const trimmed = value.toString().trim();
    return trimmed.length > 0 && trimmed.length <= 500;
  }

  /**
   * Valida el campo organismo
   */
  private isValidOrganismo(value: any): boolean {
    if (!value) return true; // Campo opcional
    if (typeof value !== 'string') return false;
    const trimmed = value.toString().trim();
    return trimmed.length <= 300;
  }

  /**
   * Valida el campo unidad
   */
  private isValidUnidad(value: any): boolean {
    if (!value) return true; // Campo opcional
    if (typeof value !== 'string') return false;
    const trimmed = value.toString().trim();
    return trimmed.length <= 200;
  }

  /**
   * Valida el campo moneda
   */
  private isValidMoneda(value: any): boolean {
    if (!value) return true; // Campo opcional
    if (typeof value !== 'string') return false;
    const trimmed = value.toString().trim();
    return trimmed.length <= 10;
  }

  /**
   * Valida el campo estado
   */
  private isValidEstado(value: any): boolean {
    if (!value) return true; // Campo opcional
    if (typeof value !== 'string') return false;
    const trimmed = value.toString().trim();
    return trimmed.length <= 50;
  }

  /**
   * Valida el campo montoDisponible
   */
  private isValidMontoDisponible(value: any): boolean {
    if (value === undefined || value === null) return true; // Campo opcional

    // Si es número, validar que sea positivo
    if (typeof value === 'number') {
      return value >= 0 && !isNaN(value) && isFinite(value);
    }

    // Si es string, intentar parsear
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return true; // Campo opcional

      const parsed = parseFloat(trimmed.replace(/[^\d.-]/g, ''));
      return !isNaN(parsed) && isFinite(parsed) && parsed >= 0;
    }

    return false;
  }

  /**
   * Valida una fecha
   */
  private isValidDate(value: any): boolean {
    if (!value) return true; // Campo opcional

    if (value instanceof Date) {
      return !isNaN(value.getTime());
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return true; // Campo opcional

      const parsed = new Date(trimmed);
      return !isNaN(parsed.getTime());
    }

    return false;
  }

  /**
   * Valida el rango de fechas (fechaPublicacion debe ser anterior a fechaCierre)
   */
  private isValidDateRange(fechaPublicacion: any, fechaCierre: any): boolean {
    if (!fechaPublicacion || !fechaCierre) return true; // Si alguna fecha es opcional

    const pubDate = this.parseDate(fechaPublicacion);
    const cierreDate = this.parseDate(fechaCierre);

    return pubDate <= cierreDate;
  }

  /**
   * Envía los datos a la API REST por lotes
   */
  private async sendToApi(
    data: ExcelRow[],
    fileName: string
  ): Promise<void> {
    const startTime = Date.now();
    let totalSent = 0;
    let batchCount = 0;

    console.log(`\n🌐 Iniciando envío a API REST:`);
    console.log(`   📁 Archivo: ${fileName}`);
    console.log(`   📈 Total de registros: ${data.length.toLocaleString()}`);
    console.log(`   📦 Tamaño de lote: ${this.batchSize}`);
    console.log(`   ⏱️  Inicio: ${new Date().toLocaleTimeString()}\n`);

    // Verificar conectividad con la API
    console.log('🔍 Verificando conectividad con la API...');
    const isApiHealthy = await this.apiService.checkApiHealth();
    if (!isApiHealthy) {
      throw new Error('No se pudo conectar con la API REST');
    }
    console.log('✅ API REST disponible\n');

    try {
      for (let i = 0; i < data.length; i += this.batchSize) {
        const batchStartTime = Date.now();
        const batch = data.slice(i, i + this.batchSize);
        const startIndex = i + 1;
        const endIndex = Math.min(i + this.batchSize, data.length);

        batchCount++;

        // Procesar lote enviándolo a la API
        await this.processBatchWithApi(batch, fileName, batchCount);

        const batchTime = Date.now() - batchStartTime;
        totalSent += batch.length;

        // Calcular progreso
        const progress = ((totalSent / data.length) * 100).toFixed(1);
        const remainingRecords = data.length - totalSent;
        const estimatedTimeRemaining =
          remainingRecords > 0
            ? Math.round(((batchTime / batch.length) * remainingRecords) / 1000)
            : 0;

        // Mostrar progreso en consola
        console.log(
          `   ✅ Lote ${batchCount}: ${totalSent.toLocaleString()}/${data.length.toLocaleString()} registros (${progress}%)`
        );

        // Mostrar tiempo estimado cada 5 lotes o en el último
        if (batchCount % 5 === 0 || endIndex === data.length) {
          const elapsedTime = Math.round((Date.now() - startTime) / 1000);
          console.log(
            `   ⏱️  Tiempo transcurrido: ${elapsedTime}s | Estimado restante: ${estimatedTimeRemaining}s`
          );
          console.log(
            `   📊 Velocidad: ${Math.round(
              totalSent / (elapsedTime / 60)
            )} registros/min\n`
          );
        }
      }

      const totalTime = Date.now() - startTime;
      const totalTimeSeconds = Math.round(totalTime / 1000);

      console.log(`\n🎉 ¡Envío a API completado exitosamente!`);
      console.log(
        `   📊 Total de registros enviados: ${totalSent.toLocaleString()}`
      );
      console.log(`   ⏱️  Tiempo total: ${totalTimeSeconds}s`);
      console.log(`   📦 Lotes procesados: ${batchCount}`);
      console.log(
        `   🚀 Velocidad promedio: ${Math.round(
          totalSent / (totalTimeSeconds / 60)
        )} registros/min`
      );
      console.log(`   ⏰ Finalizado: ${new Date().toLocaleTimeString()}\n`);

      this.logger.info('Envío a API completado', {
        fileName,
        totalRecords: data.length,
        totalSent,
        totalTime,
        totalTimeMs: totalTime,
        averageTimePerRecord: totalTime / data.length,
        batchesProcessed: batchCount,
      });
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.log(`\n❌ Error durante el envío a la API:`);
      console.log(
        `   📊 Registros procesados hasta el error: ${totalSent.toLocaleString()}`
      );
      console.log(
        `   ⏱️  Tiempo transcurrido: ${Math.round(totalTime / 1000)}s`
      );
      console.log(
        `   🔄 Los registros ya enviados permanecen en la API\n`
      );

      this.logger.error('Error en envío a API', error, {
        fileName,
        totalRecords: data.length,
        totalSent,
        totalTime,
        totalTimeMs: totalTime,
        batchesProcessed: batchCount,
      });
      throw error;
    }
  }

  /**
   * Procesa un lote de registros enviándolo a la API
   */
  private async processBatchWithApi(
    batch: ExcelRow[],
    fileName: string,
    batchNumber: number
  ): Promise<void> {
    const licitaciones = batch.map((row) =>
      this.mapToLicitacionApiData(row, fileName)
    );

    // Mostrar progreso del lote actual
    process.stdout.write(
      `   🔄 Enviando lote ${batchNumber} de ${batch.length} registros a la API... `
    );

    await this.apiService.executeWithRetry(
      async () => {
        return await this.apiService.sendLicitacionesBatch(
          licitaciones,
          batchNumber
        );
      },
      3,
      `send_batch_${batchNumber}_${batch.length}_records`
    );

    // Confirmar que el lote se completó
    process.stdout.write('✅\n');
  }

  /**
   * Mapea una fila del Excel a LicitacionApiData
   */
  private mapToLicitacionApiData(row: ExcelRow, fileName: string): LicitacionApiData {
    return {
      idLicitacion: row.idLicitacion || '',
      nombre: row.nombre || '',
      fechaPublicacion: this.parseDate(row.fechaPublicacion).toISOString(),
      fechaCierre: this.parseDate(row.fechaCierre).toISOString(),
      organismo: row.organismo || '',
      unidad: row.unidad || '',
      montoDisponible: this.parseNumber(row.montoDisponible),
      moneda: row.moneda || 'CLP',
      estado: row.estado || '',
      fileName: fileName,
      processedAt: new Date().toISOString(),
    };
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
