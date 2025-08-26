import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';
import { config } from '../config/config';
import logger, { StructuredLogger } from '../utils/logger';

export class DatabaseService {
  private static instance: DatabaseService | null = null;
  private db: Database.Database;
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
    this.db = new Database(dbFilePath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');

    // Crear tabla si no existe
    this.db
      .prepare(
        `CREATE TABLE IF NOT EXISTS processed_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          licitacion_id TEXT NOT NULL UNIQUE,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`
      )
      .run();

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

  hasLicitacionId(licitacionId: string): boolean {
    try {
      const row = this.db
        .prepare(
          'SELECT 1 FROM processed_records WHERE licitacion_id = ? LIMIT 1'
        )
        .get(licitacionId);
      return !!row;
    } catch (error: any) {
      this.logger.error('Error consultando licitacion_id', {
        licitacion_id: licitacionId,
        error: error.message,
      });
      return false;
    }
  }

  addLicitacionId(licitacionId: string): void {
    try {
      this.db
        .prepare(
          'INSERT OR IGNORE INTO processed_records (licitacion_id) VALUES (?)'
        )
        .run(licitacionId);
    } catch (error: any) {
      this.logger.error('Error insertando licitacion_id', {
        licitacion_id: licitacionId,
        error: error.message,
      });
    }
  }

  addManyLicitacionIds(licitacionIds: string[]): void {
    const insert = this.db.prepare(
      'INSERT OR IGNORE INTO processed_records (licitacion_id) VALUES (?)'
    );
    const transaction = this.db.transaction((ids: string[]) => {
      for (const id of ids) insert.run(id);
    });
    try {
      transaction(licitacionIds.filter(Boolean));
    } catch (error: any) {
      this.logger.error('Error insertando múltiples licitacion_id', {
        count: licitacionIds.length,
        error: error.message,
      });
    }
  }

  close(): void {
    try {
      this.db.close();
    } catch (error: any) {
      this.logger.error('Error cerrando base de datos', {
        error: error.message,
      });
    }
  }
}
