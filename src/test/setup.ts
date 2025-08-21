import { config } from 'dotenv';

// Cargar variables de entorno para pruebas
config({ path: '.env.test' });

// Configuración global para pruebas
process.env.NODE_ENV = 'test';
process.env.DB_DATABASE = 'excel_data_test';
process.env.LOG_LEVEL = 'error'; // Solo errores en pruebas
