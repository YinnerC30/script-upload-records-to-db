import * as XLSX from 'xlsx';
import * as path from 'path';
import { ApiService } from './ApiService';
import { FileProcessor } from './FileProcessor';
import {
  ExcelValidator,
  ValidationResult,
  HeaderValidationResult,
} from './ExcelValidator';
import { DataTransformer } from './DataTransformer';
import { DatabaseService } from './DatabaseService';
import { ExcelRow, FailedRecord, LicitacionApiData } from '../types/excel';
import logger, { StructuredLogger } from '../utils/logger';
import { config } from '../config/config';

export class ExcelProcessor {
  private readonly fileProcessor: FileProcessor;
  private readonly validator: ExcelValidator;
  private readonly transformer: DataTransformer;
  private readonly apiService: ApiService;
  private readonly dryRun: boolean;
  private readonly logger: StructuredLogger;
  private readonly db: DatabaseService;

  constructor(dryRun: boolean = false) {
    const excelDirectory = config.directories.excel;
    const processedDirectory = config.directories.processed;
    const errorDirectory = config.directories.error;
    this.dryRun = dryRun;

    this.fileProcessor = new FileProcessor(
      excelDirectory,
      processedDirectory,
      errorDirectory
    );
    this.validator = new ExcelValidator();
    this.transformer = new DataTransformer();
    this.apiService = new ApiService();
    this.logger = new StructuredLogger('ExcelProcessor');
    this.db = DatabaseService.getInstance();

    // Crear directorios si no existen
    this.fileProcessor.ensureDirectories();
  }

  /**
   * Ejecuta el procesamiento completo
   */
  public async run(): Promise<{
    total: number;
    successCount: number;
    failedCount: number;
    hadFile: boolean;
  }> {
    const startTime = Date.now();
    console.log('\n🚀 Iniciando procesamiento de archivos Excel...');
    console.log(`   📁 Directorio: ${config.directories.excel}`);
    console.log(`   ⏰ Inicio: ${new Date().toLocaleTimeString()}\n`);

    this.logger.info('🚀 Iniciando procesamiento de archivos Excel...', {
      excelDirectory: config.directories.excel,
    });

    try {
      console.log('🔍 Buscando archivo Excel más reciente...');
      const latestFile = await this.fileProcessor.findLatestExcelFile();

      if (!latestFile) {
        console.log('⚠️  No se encontraron archivos Excel para procesar');
        console.log(`   📁 Directorio revisado: ${config.directories.excel}\n`);

        this.logger.warn('No se encontraron archivos Excel para procesar', {
          directory: config.directories.excel,
        });
        return { total: 0, successCount: 0, failedCount: 0, hadFile: false };
      }

      const fileName = path.basename(latestFile);
      console.log(`📄 Archivo encontrado: ${fileName}`);

      // Procesar el archivo
      const result = await this.processFile(latestFile, fileName);

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      console.log(`\n⏱️  Tiempo total de procesamiento: ${duration} segundos`);
      if (result.failedCount === 0 && result.total > 0) {
        console.log(`✅ Procesamiento completado exitosamente`);
      } else if (result.total === 0) {
        console.log(`ℹ️  No hubo registros válidos para procesar`);
      }
      return { ...result, hadFile: true };
    } catch (error) {
      console.error('\n❌ Error durante el procesamiento:', error);
      this.logger.error('❌ Error durante el procesamiento', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Procesa un archivo Excel específico
   */
  private async processFile(
    filePath: string,
    fileName: string
  ): Promise<{ total: number; successCount: number; failedCount: number }> {
    try {
      console.log(`📖 Leyendo archivo: ${fileName}`);

      // Leer archivo Excel
      const fileBuffer = await this.fileProcessor.readExcelFile(filePath);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('No se encontró ninguna hoja en el archivo Excel');
      }
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        throw new Error('No se pudo acceder a la hoja del archivo Excel');
      }

      // Convertir a JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet);
      // console.log('🚀 ~ ExcelProcessor ~ processFile ~ rawData:', rawData)

      console.log(`📊 Registros encontrados: ${rawData.length}`);

      if (rawData.length === 0) {
        console.log('⚠️  El archivo no contiene datos válidos');
        await this.fileProcessor.moveToError(filePath, fileName);
        return { total: 0, successCount: 0, failedCount: 0 };
      }

      // Obtener encabezados
      const headers = Object.keys(rawData[0] || {});
      console.log(`📋 Encabezados encontrados: ${headers.join(', ')}`);

      // Validar encabezados
      const headerValidation = this.validator.validateHeaders(headers);
      if (!headerValidation.isValid) {
        console.log('❌ Encabezados inválidos:');
        headerValidation.missingHeaders.forEach((header) =>
          console.log(`   - Falta: ${header}`)
        );
        await this.fileProcessor.moveToError(filePath, fileName);
        return { total: 0, successCount: 0, failedCount: 0 };
      }

      // Mapear encabezados y transformar datos
      const headerMapping = this.transformer.mapHeaders(headers);
      const transformedData = this.transformer.transformRawData(
        rawData,
        headerMapping
      );

      // Validar datos
      const dataValidation = this.validator.validateData(transformedData);

      if (!dataValidation.isValid) {
        console.log('❌ Errores de validación encontrados:');
        dataValidation.errors
          .slice(0, 5)
          .forEach((error) => console.log(`   - ${error}`));
        if (dataValidation.errors.length > 5) {
          console.log(
            `   ... y ${dataValidation.errors.length - 5} errores más`
          );
        }
      }

      if (dataValidation.warnings.length > 0) {
        console.log('⚠️  Advertencias:');
        dataValidation.warnings
          .slice(0, 3)
          .forEach((warning) => console.log(`   - ${warning}`));
        if (dataValidation.warnings.length > 3) {
          console.log(
            `   ... y ${dataValidation.warnings.length - 3} advertencias más`
          );
        }
      }

      // Procesar datos
      if (this.dryRun) {
        console.log('🔍 Modo dry-run: Solo validación, no se enviarán datos');
        console.log(`📊 Registros válidos: ${transformedData.length}`);
        return {
          total: transformedData.length,
          successCount: transformedData.length,
          failedCount: 0,
        };
      } else {
        const dataResult = await this.processData(
          transformedData,
          fileName,
          filePath
        );
        return {
          total: transformedData.length,
          successCount: dataResult.successCount,
          failedCount: dataResult.failedRecords.length,
        };
      }
    } catch (error) {
      console.error(`❌ Error procesando archivo ${fileName}:`, error);
      this.logger.error('Error procesando archivo', {
        fileName,
        error: error instanceof Error ? error.message : String(error),
      });
      await this.fileProcessor.moveToError(filePath, fileName);
      throw error;
    }
  }

  /**
   * Procesa los datos transformados
   */
  private async processData(
    data: ExcelRow[],
    fileName: string,
    filePath: string
  ): Promise<{ successCount: number; failedRecords: FailedRecord[] }> {
    // console.log('🚀 ~ ExcelProcessor ~ processData ~ data:', data)
    console.log(`🚀 Procesando ${data.length} registros...`);

    // Filtrar registros ya procesados por licitacion_id
    const filteredData = data.filter((row) => {
      const id = row.idLicitacion;
      if (!id) return true; // permitir que validaciones manejen casos sin ID
      const exists = this.db.hasLicitacionId(id);
      if (exists) {
        this.logger.debug('Registro omitido por duplicado (SQLite)', {
          licitacion_id: id,
        });
      }
      return !exists;
    });

    if (filteredData.length !== data.length) {
      console.log(
        `🔎 Filtrado por SQLite: ${filteredData.length} nuevos / ${
          data.length - filteredData.length
        } duplicados`
      );
    }

    // Procesar registros individualmente sobre los nuevos
    const result = await this.processRecordsIndividually(
      filteredData,
      fileName
    );

    console.log(`\n📊 Resumen del procesamiento:`);
    console.log(`   ✅ Registros exitosos: ${result.successCount}`);
    console.log(`   ❌ Registros fallidos: ${result.failedRecords.length}`);
    console.log(`   📄 Total procesados: ${data.length}`);

    // Crear archivo de registros fallidos si es necesario
    if (result.failedRecords.length > 0 && result.successCount > 0) {
      await this.createFailedRecordsFile(result.failedRecords, fileName);
    }

    // Mover archivo original
    if (result.successCount > 0) {
      await this.fileProcessor.moveToProcessed(filePath, fileName);
    } else if (result.successCount === 0 && result.failedRecords.length > 0) {
      await this.fileProcessor.moveToError(filePath, fileName);
    }
    return result;
  }

  /**
   * Procesa registros individualmente y maneja errores por registro
   */
  private async processRecordsIndividually(
    data: ExcelRow[],
    fileName: string
  ): Promise<{ successCount: number; failedRecords: FailedRecord[] }> {
    let successCount = 0;
    const failedRecords: FailedRecord[] = [];

    console.log(`📤 Enviando registros individualmente...`);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;

      try {
        const licitacionData = this.transformer.mapToLicitacionApiData(
          row,
          fileName
        );

        // Enviar registro individual a la API
        const response = await this.apiService.sendLicitacionWithResponse(
          licitacionData
        );

        // Verificar si la respuesta es exitosa
        if (response.status === 200) {
          successCount++;

          // Registrar ID como procesado en SQLite
          if (licitacionData.licitacion_id) {
            this.db.addLicitacionId(licitacionData.licitacion_id);
          }

          // Mostrar progreso cada 100 registros
          if (successCount % 100 === 0 || i === data.length - 1) {
            const progress = (((i + 1) / data.length) * 100).toFixed(1);
            console.log(
              `   ✅ Progreso: ${i + 1}/${
                data.length
              } (${progress}%) - Exitosos: ${successCount}`
            );
          }
        } else {
          // Registro falló pero la API respondió
          const failedRecord: FailedRecord = {
            originalRow: row,
            licitacionData,
            error: `API respondió con código ${response.status}`,
            statusCode: response.status,
            rowIndex: i,
          };
          failedRecords.push(failedRecord);

          this.logger.warn('Registro falló en API', {
            rowIndex: i + 1,
            licitacion_id: licitacionData.licitacion_id,
            statusCode: response.status,
            error: `API respondió con código ${response.status}`,
          });
        }
      } catch (error: any) {
        // Error de red, timeout, etc.
        const licitacionData = this.transformer.mapToLicitacionApiData(
          row,
          fileName
        );

        // Si la API devuelve 400 y el body indica duplicado, registrar el ID en SQLite
        const statusCode = error.response?.status;
        const responseData = error.response?.data;
        if (
          statusCode === 400 &&
          responseData &&
          (responseData.licitacion_id ||
            responseData.error ||
            responseData.message)
        ) {
          const responseId =
            responseData.licitacion_id || licitacionData.licitacion_id;
          const errorText = `${responseData.error || ''} ${
            responseData.message || ''
          }`.toLowerCase();
          // Guardar si claramente es un duplicado en la API
          if (
            responseId &&
            (errorText.includes('ya existe') || errorText.includes('duplic'))
          ) {
            this.db.addLicitacionId(responseId);
            this.logger.info(
              'ID registrado en SQLite por respuesta 400 (duplicado en API)',
              {
                licitacion_id: responseId,
                statusCode,
              }
            );
          }
        }

        const failedRecord: FailedRecord = {
          originalRow: row,
          licitacionData,
          error: error.message || 'Error de conexión',
          statusCode,
          rowIndex: i,
        };
        failedRecords.push(failedRecord);

        this.logger.error('Error procesando registro individual', {
          rowIndex: i + 1,
          licitacion_id: row.idLicitacion,
          error: error.message,
          statusCode: error.response?.status,
        });
      }

      // Pequeña pausa entre envíos para no sobrecargar la API
      if (i < data.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    return { successCount, failedRecords };
  }

  /**
   * Crea un archivo Excel con los registros fallidos
   */
  private async createFailedRecordsFile(
    failedRecords: FailedRecord[],
    originalFileName: string
  ): Promise<string> {
    if (failedRecords.length === 0) {
      return '';
    }

    // Crear nombre del archivo de registros fallidos
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    const baseName = path.parse(originalFileName).name;
    const failedFileName = `${baseName}_failed_${timestamp}.xlsx`;
    const failedFilePath = path.join(config.directories.error, failedFileName);

    // Preparar datos para el Excel
    const workbook = XLSX.utils.book_new();
    const worksheetData = failedRecords.map((record, index) => ({
      'Fila Original': record.rowIndex + 1,
      'ID Licitación': record.originalRow.idLicitacion || '',
      Nombre: record.originalRow.nombre || '',
      'Fecha Publicación': record.originalRow.fechaPublicacion || '',
      'Fecha Cierre': record.originalRow.fechaCierre || '',
      Organismo: record.originalRow.organismo || '',
      Unidad: record.originalRow.unidad || '',
      'Monto Disponible': record.originalRow.montoDisponible || '',
      Moneda: record.originalRow.moneda || '',
      Estado: record.originalRow.estado || '',
      Error: record.error,
      'Código de Estado': record.statusCode || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros Fallidos');

    // Escribir el archivo
    XLSX.writeFile(workbook, failedFilePath);

    this.logger.info('Archivo de registros fallidos creado', {
      failedFileName,
      failedFilePath,
      failedRecordsCount: failedRecords.length,
      originalFileName,
    });

    return failedFilePath;
  }
}
