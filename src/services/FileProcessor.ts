import * as fs from 'fs/promises';
import * as path from 'path';
import logger from '../utils/logger';

export class FileProcessor {
  private readonly excelDirectory: string;
  private readonly processedDirectory: string;
  private readonly errorDirectory: string;

  constructor(
    excelDirectory: string,
    processedDirectory: string,
    errorDirectory: string
  ) {
    this.excelDirectory = excelDirectory;
    this.processedDirectory = processedDirectory;
    this.errorDirectory = errorDirectory;
  }

  /**
   * Asegura que los directorios necesarios existan
   */
  async ensureDirectories(): Promise<void> {
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
  async findLatestExcelFile(): Promise<string | null> {
    try {
      const files = await fs.readdir(this.excelDirectory);
      const excelFiles = files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return ext === '.xlsx' || ext === '.xls';
      });

      if (excelFiles.length === 0) {
        return null;
      }

      let latestFile = excelFiles[0];
      let latestTime = 0;

      for (const file of excelFiles) {
        const filePath = path.join(this.excelDirectory, file);
        const stats = await fs.stat(filePath);
        if (stats.mtime.getTime() > latestTime) {
          latestTime = stats.mtime.getTime();
          latestFile = file;
        }
      }

      return path.join(this.excelDirectory, latestFile || '');
    } catch (error) {
      logger.error('Error buscando archivo Excel más reciente', {
        directory: this.excelDirectory,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Mueve el archivo al directorio de procesados
   */
  async moveToProcessed(filePath: string, fileName: string): Promise<void> {
    const destination = path.join(this.processedDirectory, fileName);
    await fs.rename(filePath, destination);
    logger.info(`Archivo movido a procesados: ${fileName}`);
  }

  /**
   * Mueve el archivo al directorio de errores
   */
  async moveToError(filePath: string, fileName: string): Promise<void> {
    const destination = path.join(this.errorDirectory, fileName);
    await fs.rename(filePath, destination);
    logger.info(`Archivo movido a errores: ${fileName}`);
  }

  /**
   * Lee el contenido de un archivo Excel
   */
  async readExcelFile(filePath: string): Promise<Buffer> {
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      logger.error('Error leyendo archivo Excel', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Verifica si un archivo existe
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene estadísticas de archivos en un directorio
   */
  async getDirectoryStats(directory: string): Promise<{
    totalFiles: number;
    excelFiles: number;
    processedFiles: number;
    errorFiles: number;
  }> {
    try {
      const files = await fs.readdir(directory);
      const excelFiles = files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return ext === '.xlsx' || ext === '.xls';
      });

      return {
        totalFiles: files.length,
        excelFiles: excelFiles.length,
        processedFiles: 0, // Se calcularía si fuera necesario
        errorFiles: 0, // Se calcularía si fuera necesario
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas del directorio', {
        directory,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        totalFiles: 0,
        excelFiles: 0,
        processedFiles: 0,
        errorFiles: 0,
      };
    }
  }
}
