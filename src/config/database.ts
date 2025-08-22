import { DataSource } from 'typeorm';
import { Licitacion } from '../entities/Licitacion';
import { config } from './config';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  entities: [Licitacion],
  // synchronize: process.env.NODE_ENV !== 'production',
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  ssl: false,
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Base de datos conectada exitosamente');
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    throw error;
  }
};
