import * as fs from 'fs/promises';
import * as path from 'path';
import { config } from '../config/config';

export class EnvironmentManager {
  private envFilePath: string;

  constructor() {
    this.envFilePath = path.join(config.executable.getWorkingDir(), '.env');
  }

  /**
   * Actualiza el archivo .env con nuevas variables
   */
  async updateEnvFile(envUpdates: Record<string, string>): Promise<void> {
    if (Object.keys(envUpdates).length === 0) {
      return;
    }

    try {
      // Leer el archivo .env existente
      let envContent = '';
      try {
        envContent = await fs.readFile(this.envFilePath, 'utf-8');
      } catch (error) {
        // El archivo no existe, crear uno nuevo
        envContent = '';
      }

      // Parsear el contenido existente
      const envLines = envContent.split('\n');
      const envMap = new Map<string, string>();

      // Procesar líneas existentes
      for (const line of envLines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const equalIndex = trimmedLine.indexOf('=');
          if (equalIndex > 0) {
            const key = trimmedLine.substring(0, equalIndex);
            const value = trimmedLine.substring(equalIndex + 1);
            envMap.set(key, value);
          }
        }
      }

      // Actualizar con nuevas variables
      for (const [key, value] of Object.entries(envUpdates)) {
        envMap.set(key, value);
        console.log(`✅ Configurado: ${key}=${value}`);
      }

      // Reconstruir el contenido del archivo
      const updatedContent = Array.from(envMap.entries())
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // Escribir el archivo actualizado
      await fs.writeFile(this.envFilePath, updatedContent + '\n');

      console.log(`📝 Archivo .env actualizado: ${this.envFilePath}`);
    } catch (error) {
      console.error('❌ Error actualizando archivo .env:', error);
      throw error;
    }
  }

  /**
   * Verifica si el archivo .env existe
   */
  async envFileExists(): Promise<boolean> {
    try {
      await fs.access(this.envFilePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Crea un archivo .env de ejemplo si no existe
   */
  async createExampleEnvFile(): Promise<void> {
    if (await this.envFileExists()) {
      return;
    }

    const exampleContent = `# Configuración de API REST
API_BASE_URL=http://localhost:3000/api
API_KEY=your-api-key-here
API_TIMEOUT=30000
API_RETRY_ATTEMPTS=3

# Configuración del Directorio de Archivos
EXCEL_DIRECTORY=./excel-files
PROCESSED_DIRECTORY=./processed-files
ERROR_DIRECTORY=./error-files

# Configuración de Logs Mejorada
LOG_LEVEL=info
LOG_FILE=./logs/app.log
LOG_MAX_SIZE=5242880
LOG_MAX_FILES=5
LOG_RETENTION_DAYS=30

# Configuración del Procesamiento
BATCH_SIZE=100
`;

    try {
      await fs.writeFile(this.envFilePath, exampleContent);
      console.log(`📝 Archivo .env de ejemplo creado: ${this.envFilePath}`);
    } catch (error) {
      console.error('❌ Error creando archivo .env de ejemplo:', error);
      throw error;
    }
  }
}
