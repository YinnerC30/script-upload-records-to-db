import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EnvironmentManager } from '../environmentManager';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock de fs/promises
vi.mock('fs/promises');
const mockedFs = vi.mocked(fs);

// Mock de path
vi.mock('path');
const mockedPath = vi.mocked(path);

// Mock de config
vi.mock('../../config/config', () => ({
  config: {
    executable: {
      getWorkingDir: vi.fn().mockReturnValue('/test/working/dir'),
    },
  },
}));

describe('EnvironmentManager', () => {
  let environmentManager: EnvironmentManager;
  const mockEnvFilePath = '/test/working/dir/.env';

  beforeEach(() => {
    vi.clearAllMocks();
    mockedPath.join.mockReturnValue(mockEnvFilePath);
    environmentManager = new EnvironmentManager();

    // Mock de console.log y console.error para evitar output en tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct env file path', () => {
      expect(mockedPath.join).toHaveBeenCalledWith('/test/working/dir', '.env');
    });
  });

  describe('updateEnvFile', () => {
    it('should do nothing when envUpdates is empty', async () => {
      await environmentManager.updateEnvFile({});

      expect(mockedFs.readFile).not.toHaveBeenCalled();
      expect(mockedFs.writeFile).not.toHaveBeenCalled();
    });

    it('should create new env file when it does not exist', async () => {
      mockedFs.readFile.mockRejectedValue(new Error('File not found'));
      mockedFs.writeFile.mockResolvedValue(undefined);

      const envUpdates = { API_KEY: 'test-key', API_URL: 'http://test.com' };
      await environmentManager.updateEnvFile(envUpdates);

      expect(mockedFs.readFile).toHaveBeenCalledWith(mockEnvFilePath, 'utf-8');
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        mockEnvFilePath,
        'API_KEY=test-key\nAPI_URL=http://test.com\n'
      );
    });

    it('should update existing env file with new variables', async () => {
      const existingContent = 'EXISTING_KEY=old-value\n# Comment line\n';
      mockedFs.readFile.mockResolvedValue(existingContent);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const envUpdates = { NEW_KEY: 'new-value', API_KEY: 'api-key' };
      await environmentManager.updateEnvFile(envUpdates);

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        mockEnvFilePath,
        'EXISTING_KEY=old-value\nNEW_KEY=new-value\nAPI_KEY=api-key\n'
      );
    });

    it('should overwrite existing variables with new values', async () => {
      const existingContent = 'API_KEY=old-key\nEXISTING_KEY=old-value\n';
      mockedFs.readFile.mockResolvedValue(existingContent);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const envUpdates = { API_KEY: 'new-key' };
      await environmentManager.updateEnvFile(envUpdates);

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        mockEnvFilePath,
        'API_KEY=new-key\nEXISTING_KEY=old-value\n'
      );
    });

    it('should handle malformed env lines gracefully', async () => {
      const existingContent =
        'VALID_KEY=value\nINVALID_LINE\n# Comment\n=NO_KEY\nKEY_ONLY=';
      mockedFs.readFile.mockResolvedValue(existingContent);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const envUpdates = { NEW_KEY: 'new-value' };
      await environmentManager.updateEnvFile(envUpdates);

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        mockEnvFilePath,
        'VALID_KEY=value\nKEY_ONLY=\nNEW_KEY=new-value\n'
      );
    });

    it('should throw error when writeFile fails', async () => {
      mockedFs.readFile.mockResolvedValue('');
      mockedFs.writeFile.mockRejectedValue(new Error('Write failed'));

      const envUpdates = { API_KEY: 'test-key' };

      await expect(
        environmentManager.updateEnvFile(envUpdates)
      ).rejects.toThrow('Write failed');
    });

    it('should log success messages for each updated variable', async () => {
      mockedFs.readFile.mockResolvedValue('');
      mockedFs.writeFile.mockResolvedValue(undefined);

      const envUpdates = { API_KEY: 'test-key', API_URL: 'http://test.com' };
      await environmentManager.updateEnvFile(envUpdates);

      expect(console.log).toHaveBeenCalledWith(
        '✅ Configurado: API_KEY=test-key'
      );
      expect(console.log).toHaveBeenCalledWith(
        '✅ Configurado: API_URL=http://test.com'
      );
      expect(console.log).toHaveBeenCalledWith(
        `📝 Archivo .env actualizado: ${mockEnvFilePath}`
      );
    });

    it('should log error when writeFile fails', async () => {
      mockedFs.readFile.mockResolvedValue('');
      mockedFs.writeFile.mockRejectedValue(new Error('Write failed'));

      const envUpdates = { API_KEY: 'test-key' };

      try {
        await environmentManager.updateEnvFile(envUpdates);
      } catch (error) {
        // Expected to throw
      }

      expect(console.error).toHaveBeenCalledWith(
        '❌ Error actualizando archivo .env:',
        expect.any(Error)
      );
    });
  });

  describe('envFileExists', () => {
    it('should return true when env file exists', async () => {
      mockedFs.access.mockResolvedValue(undefined);

      const result = await environmentManager.envFileExists();

      expect(result).toBe(true);
      expect(mockedFs.access).toHaveBeenCalledWith(mockEnvFilePath);
    });

    it('should return false when env file does not exist', async () => {
      mockedFs.access.mockRejectedValue(new Error('File not found'));

      const result = await environmentManager.envFileExists();

      expect(result).toBe(false);
      expect(mockedFs.access).toHaveBeenCalledWith(mockEnvFilePath);
    });
  });

  describe('createExampleEnvFile', () => {
    it('should not create file when env file already exists', async () => {
      mockedFs.access.mockResolvedValue(undefined);

      await environmentManager.createExampleEnvFile();

      expect(mockedFs.writeFile).not.toHaveBeenCalled();
    });

    it('should create example env file when it does not exist', async () => {
      mockedFs.access.mockRejectedValue(new Error('File not found'));
      mockedFs.writeFile.mockResolvedValue(undefined);

      await environmentManager.createExampleEnvFile();

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        mockEnvFilePath,
        expect.stringContaining('# Configuración de API REST')
      );
      expect(console.log).toHaveBeenCalledWith(
        `📝 Archivo .env de ejemplo creado: ${mockEnvFilePath}`
      );
    });

    it('should include all required configuration sections in example file', async () => {
      mockedFs.access.mockRejectedValue(new Error('File not found'));
      mockedFs.writeFile.mockResolvedValue(undefined);

      await environmentManager.createExampleEnvFile();

      const writeCall = mockedFs.writeFile.mock.calls[0];
      const content = writeCall[1] as string;

      expect(content).toContain('# Configuración de API REST');
      expect(content).toContain('API_BASE_URL=http://localhost:3000/api');
      expect(content).toContain('API_KEY=your-api-key-here');
      expect(content).toContain('# Configuración del Directorio de Archivos');
      expect(content).toContain('EXCEL_DIRECTORY=./excel-files');
      expect(content).toContain('# Configuración de Logs Mejorada');
      expect(content).toContain('LOG_LEVEL=info');
      expect(content).toContain('# Configuración del Procesamiento');
      expect(content).toContain('BATCH_SIZE=100');
    });

    it('should throw error when creating example file fails', async () => {
      mockedFs.access.mockRejectedValue(new Error('File not found'));
      mockedFs.writeFile.mockRejectedValue(new Error('Write failed'));

      await expect(environmentManager.createExampleEnvFile()).rejects.toThrow(
        'Write failed'
      );
      expect(console.error).toHaveBeenCalledWith(
        '❌ Error creando archivo .env de ejemplo:',
        expect.any(Error)
      );
    });
  });
});
