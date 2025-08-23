import axios from 'axios';
import { config } from '../config/config';
import logger, { StructuredLogger } from '../utils/logger';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LicitacionApiData {
  licitacion_id: string;
  nombre: string;
  fecha_publicacion: string;
  fecha_cierre: string;
  organismo: string;
  unidad: string;
  monto_disponible: number;
  moneda: string;
  estado: string;
}

export class ApiService {
  private readonly client: any;
  private readonly logger: StructuredLogger;
  private readonly baseURL: string;
  private readonly apiKey?: string;
  private readonly timeout: number;

  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'http://localhost:3000/api';
    this.apiKey = process.env.API_KEY;
    this.timeout = parseInt(process.env.API_TIMEOUT || '30000');
    this.logger = new StructuredLogger('ApiService');

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
    });

    // Configurar interceptores para logging
    this.setupInterceptors();
  }

  /**
   * Configura interceptores para logging de requests y responses
   */
  private setupInterceptors(): void {
    // Interceptor de requests
    this.client.interceptors.request.use(
      (config: any) => {
        this.logger.debug('API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          timeout: config.timeout,
        });
        return config;
      },
      (error: any) => {
        this.logger.error('API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Interceptor de responses
    this.client.interceptors.response.use(
      (response: any) => {
        this.logger.debug('API Response', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
          method: response.config.method?.toUpperCase(),
        });
        return response;
      },
      (error: any) => {
        this.logger.error('API Response Error', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          message: error.message,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Verifica la conectividad con la API
   */
  async checkApiHealth(): Promise<boolean> {
    try {
      // Intentar hacer una petición POST vacía al endpoint para verificar conectividad
      const response = await this.client.post('/up_compra.php', {});
      const isHealthy = response.status === 200 || response.status === 400; // 400 es esperado para datos vacíos
      
      this.logger.info('API Health Check', {
        status: response.status,
        healthy: isHealthy,
        url: `${this.baseURL}/up_compra.php`,
      });

      return isHealthy;
    } catch (error) {
      this.logger.error('API Health Check Failed', error);
      return false;
    }
  }

  /**
   * Envía un lote de licitaciones a la API (uno por uno)
   */
  async sendLicitacionesBatch(
    licitaciones: LicitacionApiData[],
    batchNumber: number
  ): Promise<ApiResponse> {
    try {
      this.logger.info('Enviando lote de licitaciones a la API', {
        batchNumber,
        recordsCount: licitaciones.length,
        endpoint: '/up_compra.php',
      });

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Enviar cada licitación individualmente
      for (let i = 0; i < licitaciones.length; i++) {
        const licitacion = licitaciones[i];
        if (!licitacion) continue;
        
        try {
          const response: any = await this.client.post(
            '/up_compra.php',
            licitacion
          );

          if (response.status === 200) {
            successCount++;
            this.logger.debug('Licitación enviada exitosamente', {
              licitacion_id: licitacion.licitacion_id,
              index: i + 1,
              total: licitaciones.length,
            });
          } else {
            errorCount++;
            errors.push(`Licitación ${licitacion.licitacion_id}: Status ${response.status}`);
          }
        } catch (error: any) {
          errorCount++;
          const errorMsg = `Licitación ${licitacion.licitacion_id}: ${error.message}`;
          errors.push(errorMsg);
          this.logger.error('Error enviando licitación individual', {
            licitacion_id: licitacion.licitacion_id,
            error: error.message,
            index: i + 1,
            total: licitaciones.length,
          });
        }

        // Pequeña pausa entre envíos para no sobrecargar la API
        if (i < licitaciones.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      this.logger.info('Lote procesado', {
        batchNumber,
        totalRecords: licitaciones.length,
        successCount,
        errorCount,
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined, // Solo mostrar primeros 5 errores
      });

      return {
        success: errorCount === 0,
        data: {
          totalRecords: licitaciones.length,
          successCount,
          errorCount,
          errors: errors.length > 0 ? errors : undefined,
        },
        message: errorCount === 0 
          ? `Lote ${batchNumber} enviado exitosamente` 
          : `Lote ${batchNumber} procesado con ${errorCount} errores`,
      };
    } catch (error: any) {
      this.logger.error('Error procesando lote', {
        error: error.message,
        batchNumber,
        recordsCount: licitaciones.length,
      });

      throw new Error(
        `Error procesando lote ${batchNumber}: ${error.message}`
      );
    }
  }

  /**
   * Envía una licitación individual a la API
   */
  async sendLicitacion(licitacion: LicitacionApiData): Promise<ApiResponse> {
    try {
      this.logger.debug('Enviando licitación individual a la API', {
        licitacion_id: licitacion.licitacion_id,
        endpoint: '/up_compra.php',
      });

      const response: any = await this.client.post(
        '/up_compra.php',
        licitacion
      );

      this.logger.debug('Licitación enviada exitosamente', {
        licitacion_id: licitacion.licitacion_id,
        responseStatus: response.status,
        success: response.status === 200,
      });

      return {
        success: response.status === 200,
        data: response.data,
        message: response.status === 200 ? 'Licitación enviada exitosamente' : 'Error enviando licitación',
      };
    } catch (error: any) {
      this.logger.error('Error enviando licitación a la API', {
        error: error.message,
        licitacion_id: licitacion.licitacion_id,
        status: error.response?.status,
        data: error.response?.data,
      });

      throw new Error(
        `Error enviando licitación ${licitacion.licitacion_id} a la API: ${error.message}`
      );
    }
  }

  /**
   * Verifica si una licitación ya existe en la API
   * Nota: Este endpoint no está disponible en la API actual
   */
  async checkLicitacionExists(licitacion_id: string): Promise<boolean> {
    this.logger.warn('Verificación de existencia no disponible en esta API', {
      licitacion_id,
    });
    return false; // Asumimos que no existe para evitar duplicados
  }

  /**
   * Obtiene estadísticas de la API
   * Nota: Este endpoint no está disponible en la API actual
   */
  async getApiStats(): Promise<any> {
    this.logger.warn('Estadísticas no disponibles en esta API');
    return {
      message: 'Estadísticas no disponibles en esta API',
      available: false,
    };
  }

  /**
   * Ejecuta una operación con retry automático
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    operationName: string = 'api_operation'
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(
          `Ejecutando ${operationName} (intento ${attempt}/${maxRetries})`
        );
        return await operation();
      } catch (error) {
        lastError = error as Error;

        this.logger.warn(
          `Error en ${operationName} (intento ${attempt}/${maxRetries})`,
          {
            error: error instanceof Error ? error.message : String(error),
            operationName,
            attempt,
            maxRetries,
          }
        );

        // Si es el último intento, no esperar
        if (attempt === maxRetries) {
          break;
        }

        // Esperar antes del siguiente intento con backoff exponencial
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    this.logger.error(`Falló ${operationName} después de ${maxRetries} intentos`, {
      operationName,
      maxRetries,
      lastError: lastError?.message,
    });

    throw new Error(
      `${operationName} falló después de ${maxRetries} intentos: ${lastError?.message}`
    );
  }
}
