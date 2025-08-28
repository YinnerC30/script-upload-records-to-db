import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config/config';
import { StructuredLogger } from '../utils/logger';

export class DatabaseService {
  private static instance: DatabaseService | null = null;
  private readonly logger: StructuredLogger;
  private readonly storeFilePath: string;
  private readonly tempFilePath: string;
  private processedIndex: Set<string>;
  private isDirty: boolean;

  private constructor() {
    this.logger = new StructuredLogger('DatabaseService');
    this.storeFilePath = this.getStorePath();
    this.tempFilePath = `${this.storeFilePath}.tmp`;
    this.processedIndex = new Set<string>();
    this.isDirty = false;

    // Asegurar directorio del archivo JSON
    const dir = path.dirname(this.storeFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Cargar archivo existente o inicializar
    try {
      if (fs.existsSync(this.storeFilePath)) {
        const content = fs.readFileSync(this.storeFilePath, 'utf-8');
        if (content.trim().length > 0) {
          const data = JSON.parse(content);
          if (Array.isArray(data)) {
            // Backward compatibility (array de ids)
            data.forEach((id) => id && this.processedIndex.add(String(id)));
          } else if (data && Array.isArray(data.records)) {
            for (const rec of data.records) {
              if (rec && rec.licitacion_id)
                this.processedIndex.add(String(rec.licitacion_id));
            }
          }
        }
      } else {
        this.persistSync();
      }
      this.logger.info('Almacenamiento JSON inicializado', {
        path: this.storeFilePath,
      });
    } catch (error: any) {
      this.logger.error('Error cargando almacenamiento JSON', {
        error: error.message,
      });
      // Intentar reinicializar vacio para no bloquear el proceso
      this.processedIndex.clear();
      this.persistSync();
    }
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private getStorePath(): string {
    const storePath =
      (config as any).directories.processedIdsPath ||
      './processed-db/processed_ids.json';
    if (!path.isAbsolute(storePath)) {
      const baseDir = config.executable.getWorkingDir();
      return path.join(baseDir, storePath);
    }
    return storePath;
  }

  private persistSync(): void {
    try {
      const payload = {
        records: Array.from(this.processedIndex).map((licitacion_id) => ({
          licitacion_id,
          created_at: new Date().toISOString(),
        })),
      };
      fs.writeFileSync(
        this.tempFilePath,
        JSON.stringify(payload, null, 2),
        'utf-8'
      );
      fs.renameSync(this.tempFilePath, this.storeFilePath);
      this.isDirty = false;
    } catch (error: any) {
      this.logger.error('Error persistiendo almacenamiento JSON', {
        error: error.message,
      });
    }
  }

  async hasLicitacionId(licitacionId: string): Promise<boolean> {
    return this.processedIndex.has(licitacionId);
  }

  async addLicitacionId(licitacionId: string): Promise<void> {
    try {
      if (!licitacionId) return;
      if (!this.processedIndex.has(licitacionId)) {
        this.processedIndex.add(licitacionId);
        this.isDirty = true;
        this.persistSync();
      }
    } catch (error: any) {
      this.logger.error('Error insertando licitacion_id', {
        licitacion_id: licitacionId,
        error: error.message,
      });
    }
  }

  async addManyLicitacionIds(licitacionIds: string[]): Promise<void> {
    try {
      const filteredIds = licitacionIds.filter(Boolean);
      if (filteredIds.length === 0) return;
      let added = false;
      for (const id of filteredIds) {
        if (!this.processedIndex.has(id)) {
          this.processedIndex.add(id);
          added = true;
        }
      }
      if (added) {
        this.isDirty = true;
        this.persistSync();
      }
    } catch (error: any) {
      this.logger.error('Error insertando múltiples licitacion_id', {
        count: licitacionIds.length,
        error: error.message,
      });
    }
  }

  async close(): Promise<void> {
    try {
      if (this.isDirty) this.persistSync();
    } catch (error: any) {
      this.logger.error('Error cerrando almacenamiento JSON', {
        error: error.message,
      });
    }
  }
}
