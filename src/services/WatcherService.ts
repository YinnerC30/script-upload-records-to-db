import * as fs from 'fs/promises';
import * as path from 'path';
import logger from '../utils/logger';
import { ExcelProcessor } from './ExcelProcessor';

export class WatcherService {
  private readonly processor: ExcelProcessor;
  private readonly watchDirectory: string;
  private readonly processingInterval: number;
  private isProcessing: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private watcherId: NodeJS.Timeout | null = null;

  constructor() {
    this.processor = new ExcelProcessor();
    this.watchDirectory = process.env.EXCEL_DIRECTORY || './excel-files';
    this.processingInterval = parseInt(
      process.env.PROCESSING_INTERVAL || '30000'
    ); // 30 segundos por defecto
  }

  /**
   * Inicia el monitoreo continuo del directorio
   */
  public async startWatching(): Promise<void> {
    logger.info(
      `👀 Iniciando monitoreo del directorio: ${this.watchDirectory}`
    );
    logger.info(`⏱️  Intervalo de procesamiento: ${this.processingInterval}ms`);

    // Procesar archivos existentes al inicio
    await this.processFiles();

    // Configurar intervalo de procesamiento
    this.intervalId = setInterval(async () => {
      await this.processFiles();
    }, this.processingInterval);

    // Configurar watcher de archivos (opcional, para respuesta inmediata)
    await this.setupFileWatcher();
  }

  /**
   * Detiene el monitoreo
   */
  public stopWatching(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.watcherId) {
      clearTimeout(this.watcherId);
      this.watcherId = null;
    }
    
    logger.info('🛑 Monitoreo detenido');
  }

  /**
   * Procesa archivos en el directorio
   */
  private async processFiles(): Promise<void> {
    if (this.isProcessing) {
      logger.debug('⏳ Procesamiento en curso, saltando ciclo...');
      return;
    }

    try {
      this.isProcessing = true;

      const latestFile = await this.processor.findLatestExcelFile();

      if (latestFile) {
        logger.info(`📁 Archivo encontrado, iniciando procesamiento...`);
        await this.processor.processExcelFile(latestFile);
      } else {
        logger.debug('📁 No hay archivos nuevos para procesar');
      }
    } catch (error) {
      logger.error('❌ Error durante el procesamiento:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Configura un watcher de archivos para respuesta inmediata
   */
  private async setupFileWatcher(): Promise<void> {
    try {
      // Verificar que el directorio existe
      try {
        await fs.access(this.watchDirectory);
      } catch {
        await fs.mkdir(this.watchDirectory, { recursive: true });
        logger.info(`📁 Directorio creado: ${this.watchDirectory}`);
      }

      // Usar fs.watchFile para mejor compatibilidad
      const { watchFile } = await import('fs');
      
      watchFile(this.watchDirectory, { interval: 1000 }, async (curr, prev) => {
        // Solo procesar si el directorio fue modificado
        if (curr.mtime > prev.mtime) {
          logger.info(`📁 Cambios detectados en el directorio: ${this.watchDirectory}`);
          
          // Esperar un poco para asegurar que el archivo esté completamente escrito
          if (this.watcherId) {
            clearTimeout(this.watcherId);
          }
          
          this.watcherId = setTimeout(async () => {
            await this.processFiles();
          }, 2000);
        }
      });

      logger.info('👁️  Watcher de archivos configurado');
    } catch (error) {
      logger.warn('⚠️  No se pudo configurar el watcher de archivos:', error);
    }
  }

  /**
   * Obtiene estadísticas del servicio
   */
  public getStats(): {
    isWatching: boolean;
    isProcessing: boolean;
    watchDirectory: string;
    processingInterval: number;
  } {
    return {
      isWatching: this.intervalId !== null,
      isProcessing: this.isProcessing,
      watchDirectory: this.watchDirectory,
      processingInterval: this.processingInterval,
    };
  }
}
