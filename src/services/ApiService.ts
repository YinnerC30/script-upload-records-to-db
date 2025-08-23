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
  idLicitacion: string;
  nombre: string;
  fechaPublicacion: string;
  fechaCierre: string;
  organismo: string;
  unidad: string;
  montoDisponible: number;
  moneda: string;
  estado: string;
  fileName: string;
  processedAt: string;
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
      const response = await this.client.get('/health');
      const isHealthy = response.status === 200;
      
      this.logger.info('API Health Check', {
        status: response.status,
        healthy: isHealthy,
        url: `${this.baseURL}/health`,
      });

      return isHealthy;
    } catch (error) {
      this.logger.error('API Health Check Failed', error);
      return false;
    }
  }

  /**
   * Envía un lote de licitaciones a la API
   */
  async sendLicitacionesBatch(
    licitaciones: LicitacionApiData[],
    batchNumber: number
  ): Promise<ApiResponse> {
    try {
      this.logger.info('Enviando lote de licitaciones a la API', {
        batchNumber,
        recordsCount: licitaciones.length,
        endpoint: '/licitaciones/batch',
      });

      const response: any = await this.client.post(
        '/licitaciones/batch',
        {
          licitaciones,
          batchNumber,
          totalRecords: licitaciones.length,
        }
      );

      this.logger.info('Lote enviado exitosamente', {
        batchNumber,
        recordsCount: licitaciones.length,
        responseStatus: response.status,
        success: response.data.success,
      });

      return response.data;
    } catch (error: any) {
      this.logger.error('Error enviando lote a la API', {
        error: error.message,
        batchNumber,
        recordsCount: licitaciones.length,
        status: error.response?.status,
        data: error.response?.data,
      });

      throw new Error(
        `Error enviando lote ${batchNumber} a la API: ${error.message}`
      );
    }
  }

  /**
   * Envía una licitación individual a la API
   */
  async sendLicitacion(licitacion: LicitacionApiData): Promise<ApiResponse> {
    try {
      this.logger.debug('Enviando licitación individual a la API', {
        idLicitacion: licitacion.idLicitacion,
        endpoint: '/licitaciones',
      });

      const response: any = await this.client.post(
        '/licitaciones',
        licitacion
      );

      this.logger.debug('Licitación enviada exitosamente', {
        idLicitacion: licitacion.idLicitacion,
        responseStatus: response.status,
        success: response.data.success,
      });

      return response.data;
    } catch (error: any) {
      this.logger.error('Error enviando licitación a la API', {
        error: error.message,
        idLicitacion: licitacion.idLicitacion,
        status: error.response?.status,
        data: error.response?.data,
      });

      throw new Error(
        `Error enviando licitación ${licitacion.idLicitacion} a la API: ${error.message}`
      );
    }
  }

  /**
   * Verifica si una licitación ya existe en la API
   */
  async checkLicitacionExists(idLicitacion: string): Promise<boolean> {
    try {
      const response = await this.client.get(`/licitaciones/${idLicitacion}/exists`);
      return response.data.exists === true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false;
      }
      this.logger.error('Error verificando existencia de licitación', {
        error: error.message,
        idLicitacion,
      });
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de la API
   */
  async getApiStats(): Promise<any> {
    try {
      const response = await this.client.get('/stats');
      return response.data;
    } catch (error: any) {
      this.logger.error('Error obteniendo estadísticas de la API', {
        error: error.message,
      });
      throw error;
    }
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
