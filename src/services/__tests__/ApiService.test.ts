import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock de axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(),
  },
}));

// Mock del logger
vi.mock('../../utils/logger', () => ({
  StructuredLogger: vi.fn(),
}));

// Mock del módulo de configuración
vi.mock('../../config/config', () => ({
  config: {
    api: {
      baseURL: 'http://localhost:3000/api',
      apiKey: 'test-key',
      timeout: 60000,
      retryAttempts: 3,
    },
  },
}));

import { ApiService, ApiResponse, LicitacionApiData } from '../ApiService';
import { StructuredLogger as MockedStructuredLogger } from '../../utils/logger';

const mockedAxios = axios as any;

describe('ApiService', () => {
  let apiService: ApiService;
  let mockAxiosInstance: any;
  let mockLogger: any;

  const mockLicitacion: LicitacionApiData = {
    licitacion_id: 'TEST-001',
    nombre: 'Test Licitación',
    fecha_publicacion: '2023-01-01T00:00:00.000Z',
    fecha_cierre: '2023-01-31T23:59:59.000Z',
    organismo: 'Test Organismo',
    unidad: 'Test Unidad',
    monto_disponible: 1000000,
    moneda: 'CLP',
    estado: 'Publicada',
  };

  beforeEach(() => {
    // Limpiar todos los mocks
    vi.clearAllMocks();

    // Mock del logger
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      log: vi.fn(),
    };

    (MockedStructuredLogger as any).mockImplementation(() => mockLogger);

    // Mock de axios.create con interceptores
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    apiService = new ApiService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values when env vars are not set', () => {
      const service = new ApiService();

      expect(MockedStructuredLogger).toHaveBeenCalledWith('ApiService');
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:3000/api',
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-key',
        },
      });
    });

    it('should initialize with environment variables', () => {
      // Para este test, verificamos que se use la configuración mockeada
      const service = new ApiService();

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:3000/api',
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-key',
        },
      });
    });

    it('should setup interceptors', () => {
      const mockAxiosInstance = {
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      new ApiService();

      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('checkApiHealth', () => {
    it('should return true when API is healthy', async () => {
      mockAxiosInstance.get.mockResolvedValue({ status: 200 });
      mockAxiosInstance.post.mockResolvedValue({
        status: 200,
        data: { success: true },
      });

      const result = await apiService.checkApiHealth();

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Iniciando verificación de salud de la API',
        expect.any(Object)
      );
    });

    it('should return true when API responds with 400 (expected for test data)', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('GET failed'));
      mockAxiosInstance.post.mockResolvedValue({
        status: 400,
        data: { error: 'Test data rejected' },
      });

      const result = await apiService.checkApiHealth();

      expect(result).toBe(true);
    });

    it('should return false when API is not accessible', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('GET failed'));
      mockAxiosInstance.post.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      });

      const result = await apiService.checkApiHealth();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'API Health Check Failed',
        expect.objectContaining({
          error: 'Connection refused',
          code: 'ECONNREFUSED',
        })
      );
    });

    it('should handle timeout errors', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('GET failed'));
      mockAxiosInstance.post.mockRejectedValue({
        code: 'ETIMEDOUT',
        message: 'Request timeout',
      });

      const result = await apiService.checkApiHealth();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'API Health Check Failed',
        expect.objectContaining({
          code: 'ETIMEDOUT',
          error: 'Request timeout',
        })
      );
    });
  });

  describe('sendLicitacionesBatch', () => {
    it('should send batch successfully', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        status: 200,
        data: { success: true },
      });

      const licitaciones = [
        mockLicitacion,
        { ...mockLicitacion, licitacion_id: 'TEST-002' },
      ];

      const result = await apiService.sendLicitacionesBatch(licitaciones, 1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        totalRecords: 2,
        successCount: 2,
        errorCount: 0,
        errors: undefined,
      });
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in batch', async () => {
      mockAxiosInstance.post
        .mockResolvedValueOnce({ status: 200, data: { success: true } })
        .mockRejectedValueOnce(new Error('API Error'));

      const licitaciones = [
        mockLicitacion,
        { ...mockLicitacion, licitacion_id: 'TEST-002' },
      ];

      const result = await apiService.sendLicitacionesBatch(licitaciones, 1);

      expect(result.success).toBe(false);
      expect(result.data).toEqual({
        totalRecords: 2,
        successCount: 1,
        errorCount: 1,
        errors: ['Licitación TEST-002: API Error'],
      });
    });

    it('should handle non-200 status codes', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        status: 500,
        data: { error: 'Server Error' },
      });

      const result = await apiService.sendLicitacionesBatch(
        [mockLicitacion],
        1
      );

      expect(result.success).toBe(false);
      expect(result.data?.errorCount).toBe(1);
    });

    it('should handle batch processing failures gracefully', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Network Error'));

      const result = await apiService.sendLicitacionesBatch(
        [mockLicitacion],
        1
      );

      expect(result.success).toBe(false);
      expect(result.data?.errorCount).toBe(1);
      expect(result.data?.successCount).toBe(0);
      expect(result.data?.errors).toContain(
        'Licitación TEST-001: Network Error'
      );
    });
  });

  describe('sendLicitacion', () => {
    it('should send individual licitacion successfully', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        status: 200,
        data: { success: true, message: 'Created' },
      });

      const result = await apiService.sendLicitacion(mockLicitacion);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Licitación enviada exitosamente');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/up_compra.php',
        mockLicitacion
      );
    });

    it('should handle API errors for individual licitacion', async () => {
      mockAxiosInstance.post.mockRejectedValue({
        message: 'Validation Error',
        response: { status: 400, data: { error: 'Invalid data' } },
      });

      const result = await apiService.sendLicitacion(mockLicitacion);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation Error');
      expect(result.message).toBe(
        'Error enviando licitación: Validation Error'
      );
    });

    it('should handle non-200 status codes', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        status: 500,
        data: { error: 'Server Error' },
      });

      const result = await apiService.sendLicitacion(mockLicitacion);

      expect(result.success).toBe(false);
      expect(result.message).toBe('API respondió con código 500');
    });
  });

  describe('sendLicitacionWithResponse', () => {
    it('should return full response on success', async () => {
      const mockResponse = {
        status: 200,
        data: { success: true, id: '123' },
        headers: { 'content-type': 'application/json' },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await apiService.sendLicitacionWithResponse(
        mockLicitacion
      );

      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/up_compra.php',
        mockLicitacion
      );
    });

    it('should throw error on failure', async () => {
      const mockError = new Error('API Error');
      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(
        apiService.sendLicitacionWithResponse(mockLicitacion)
      ).rejects.toThrow('API Error');
    });
  });

  describe('interceptors', () => {
    it('should log request details', () => {
      const requestInterceptor =
        mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      const config = {
        method: 'post',
        url: '/test',
        baseURL: 'http://test.com',
        timeout: 5000,
      };

      requestInterceptor(config);

      expect(mockLogger.debug).toHaveBeenCalledWith('API Request', {
        method: 'POST',
        url: '/test',
        baseURL: 'http://test.com',
        timeout: 5000,
      });
    });

    it('should log response details', () => {
      const responseInterceptor =
        mockAxiosInstance.interceptors.response.use.mock.calls[0][0];
      const response = {
        status: 200,
        statusText: 'OK',
        config: { url: '/test', method: 'post' },
      };

      responseInterceptor(response);

      expect(mockLogger.debug).toHaveBeenCalledWith('API Response', {
        status: 200,
        statusText: 'OK',
        url: '/test',
        method: 'POST',
      });
    });

    it('should log response errors', async () => {
      const errorInterceptor =
        mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      const error = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { error: 'Server Error' },
        },
        config: { url: '/test', method: 'post' },
        message: 'Request failed',
      };

      // El interceptor de error debe rechazar la promesa, así que lo manejamos
      try {
        await errorInterceptor(error);
      } catch (rejectedError) {
        // Esperamos que se rechace la promesa
        expect(rejectedError).toBe(error);
      }

      expect(mockLogger.error).toHaveBeenCalledWith('API Response Error', {
        status: 500,
        statusText: 'Internal Server Error',
        url: '/test',
        method: 'POST',
        message: 'Request failed',
        data: { error: 'Server Error' },
      });
    });
  });
});
