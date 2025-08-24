import axios from 'axios';
import { StructuredLogger } from '../utils/logger';
import { config } from '../config/config';

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
    this.baseURL = config.api.baseURL;
    this.apiKey = config.api.apiKey;
    this.timeout = config.api.timeout;
    this.logger = new StructuredLogger('ApiService');

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
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
      this.logger.info('Iniciando verificación de salud de la API', {
        baseURL: this.baseURL,
        endpoint: '/up_compra.php',
        timeout: this.timeout,
      });

      // Primero verificar conectividad básica con GET
      try {
        const healthResponse = await this.client.get('/');
        this.logger.info('API Health Check - Conectividad básica OK', {
          status: healthResponse.status,
          url: this.baseURL,
        });
      } catch (getError: any) {
        // Si GET falla, intentar con POST vacío (algunas APIs solo aceptan POST)
        this.logger.debug('GET falló, intentando POST vacío para health check');
      }

      // Intentar hacer una petición POST con datos mínimos para verificar conectividad
      const testData = {
        licitacion_id: `HEALTH_CHECK_${Date.now()}`, // ID único para evitar duplicados
        nombre: 'Health Check',
        fecha_publicacion: new Date().toISOString(),
        fecha_cierre: new Date(Date.now() + 86400000).toISOString(), // +24 horas
        organismo: 'Health Check',
        unidad: 'Health Check',
        monto_disponible: 0,
        moneda: 'CLP',
        estado: 'Publicada',
      };

      const response = await this.client.post('/up_compra.php', testData);

      // Considerar saludable si responde con 200 o 400 (400 puede ser esperado para datos de prueba)
      const isHealthy = response.status === 200 || response.status === 400;

      this.logger.info('API Health Check', {
        status: response.status,
        healthy: isHealthy,
        url: `${this.baseURL}/up_compra.php`,
        responseData: response.data,
      });

      return isHealthy;
    } catch (error: any) {
      this.logger.error('API Health Check Failed', {
        error: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        baseURL: this.baseURL,
        endpoint: '/up_compra.php',
      });

      // Proporcionar información más específica sobre el error
      if (error.code === 'ECONNREFUSED') {
        this.logger.error(
          'El servidor no está ejecutándose o no es accesible',
          {
            baseURL: this.baseURL,
            suggestion:
              'Verifica que el servidor esté ejecutándose y la URL sea correcta',
          }
        );
      } else if (error.code === 'ENOTFOUND') {
        this.logger.error('El dominio no se puede resolver', {
          baseURL: this.baseURL,
          suggestion: 'Verifica la URL y la conectividad de red',
        });
      } else if (error.code === 'ETIMEDOUT') {
        this.logger.error('La conexión se agotó por tiempo', {
          timeout: this.timeout,
          suggestion:
            'Considera aumentar el timeout o verificar la conectividad',
        });
      }

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
            errors.push(
              `Licitación ${licitacion.licitacion_id}: Status ${response.status}`
            );
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
          await new Promise((resolve) => setTimeout(resolve, 100));
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
        message:
          errorCount === 0
            ? `Lote ${batchNumber} enviado exitosamente`
            : `Lote ${batchNumber} procesado con ${errorCount} errores`,
      };
    } catch (error: any) {
      this.logger.error('Error procesando lote', {
        error: error.message,
        batchNumber,
        recordsCount: licitaciones.length,
      });

      throw new Error(`Error procesando lote ${batchNumber}: ${error.message}`);
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
        message:
          response.status === 200
            ? 'Licitación enviada exitosamente'
            : `API respondió con código ${response.status}`,
      };
    } catch (error: any) {
      this.logger.error('Error enviando licitación individual', {
        licitacion_id: licitacion.licitacion_id,
        error: error.message,
        statusCode: error.response?.status,
      });

      return {
        success: false,
        error: error.message,
        message: `Error enviando licitación: ${error.message}`,
      };
    }
  }

  /**
   * Envía una licitación individual y retorna la respuesta completa
   */
  async sendLicitacionWithResponse(
    licitacion: LicitacionApiData
  ): Promise<any> {
    try {
      this.logger.debug('Enviando licitación individual a la API', {
        licitacion_id: licitacion.licitacion_id,
        endpoint: '/up_compra.php',
      });

      const response = await this.client.post('/up_compra.php', licitacion);

      this.logger.debug('Licitación enviada exitosamente', {
        licitacion_id: licitacion.licitacion_id,
        responseStatus: response.status,
        success: response.status === 200,
      });

      return response;
    } catch (error: any) {
      this.logger.error('Error enviando licitación individual', {
        licitacion_id: licitacion.licitacion_id,
        error: error.message,
        statusCode: error.response?.status,
      });

      throw error;
    }
  }
}
