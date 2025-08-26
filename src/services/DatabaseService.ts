import * as fs from 'fs';
import * as path from 'path';
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/config';
import { StructuredLogger } from '../utils/logger';

export class DatabaseService {
  private static instance: DatabaseService | null = null;
  private db: sqlite3.Database;
  private readonly logger: StructuredLogger;

  private constructor() {
    this.logger = new StructuredLogger('DatabaseService');

    // Asegurar directorio de la BD
    const dbFilePath = this.getDatabasePath();
    const dbDir = path.dirname(dbFilePath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Abrir/crear BD
    this.db = new sqlite3.Database(dbFilePath);

    // Configurar la base de datos
    this.db.serialize(() => {
      // Configurar pragmas
      this.db.run('PRAGMA journal_mode = WAL');
      this.db.run('PRAGMA synchronous = NORMAL');

      // Crear tabla si no existe con UUID como PRIMARY KEY
      this.db.run(
        `CREATE TABLE IF NOT EXISTS processed_records (
          id TEXT PRIMARY KEY,
          licitacion_id TEXT NOT NULL UNIQUE,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`
      );
    });

    this.logger.info('SQLite inicializado', { dbPath: dbFilePath });
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private getDatabasePath(): string {
    // Si está empaquetado, usar directorio de trabajo configurable
    const dbPath = config.directories.sqliteDbPath;
    // Si es ruta relativa, resolver relativa al cwd/ejecutable
    if (!path.isAbsolute(dbPath)) {
      const baseDir = config.executable.getWorkingDir();
      return path.join(baseDir, dbPath);
    }
    return dbPath;
  }

  hasLicitacionId(licitacionId: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.db.get(
          'SELECT 1 FROM processed_records WHERE licitacion_id = ? LIMIT 1',
          [licitacionId],
          (err, row) => {
            if (err) {
              this.logger.error('Error consultando licitacion_id', {
                licitacion_id: licitacionId,
                error: err.message,
              });
              resolve(false);
            } else {
              resolve(!!row);
            }
          }
        );
      } catch (error: any) {
        this.logger.error('Error consultando licitacion_id', {
          licitacion_id: licitacionId,
          error: error.message,
        });
        resolve(false);
      }
    });
  }

  addLicitacionId(licitacionId: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        const uuid = uuidv4();
        this.db.run(
          'INSERT OR IGNORE INTO processed_records (id, licitacion_id) VALUES (?, ?)',
          [uuid, licitacionId],
          (err) => {
            if (err) {
              this.logger.error('Error insertando licitacion_id', {
                licitacion_id: licitacionId,
                error: err.message,
              });
            }
            resolve();
          }
        );
      } catch (error: any) {
        this.logger.error('Error insertando licitacion_id', {
          licitacion_id: licitacionId,
          error: error.message,
        });
        resolve();
      }
    });
  }

  addManyLicitacionIds(licitacionIds: string[]): Promise<void> {
    return new Promise((resolve) => {
      try {
        const filteredIds = licitacionIds.filter(Boolean);
        if (filteredIds.length === 0) {
          resolve();
          return;
        }

        this.db.serialize(() => {
          this.db.run('BEGIN TRANSACTION');

          const insert = this.db.prepare(
            'INSERT OR IGNORE INTO processed_records (id, licitacion_id) VALUES (?, ?)'
          );

          for (const id of filteredIds) {
            const uuid = uuidv4();
            insert.run([uuid, id]);
          }

          insert.finalize((err) => {
            if (err) {
              this.logger.error('Error finalizando inserción múltiple', {
                error: err.message,
              });
              this.db.run('ROLLBACK', () => resolve());
            } else {
              this.db.run('COMMIT', () => resolve());
            }
          });
        });
      } catch (error: any) {
        this.logger.error('Error insertando múltiples licitacion_id', {
          count: licitacionIds.length,
          error: error.message,
        });
        resolve();
      }
    });
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.db.close((err) => {
          if (err) {
            this.logger.error('Error cerrando base de datos', {
              error: err.message,
            });
          }
          resolve();
        });
      } catch (error: any) {
        this.logger.error('Error cerrando base de datos', {
          error: error.message,
        });
        resolve();
      }
    });
  }
}
