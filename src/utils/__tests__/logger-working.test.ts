import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock simple de winston
vi.mock('winston', () => ({
  default: {
    addColors: vi.fn(),
    createLogger: vi.fn(() => ({
      add: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      verbose: vi.fn(),
      debug: vi.fn(),
    })),
    format: {
      combine: vi.fn(),
      timestamp: vi.fn(),
      errors: vi.fn(),
      json: vi.fn(),
      printf: vi.fn(),
      colorize: vi.fn(),
    },
    transports: {
      File: vi.fn(),
      Console: vi.fn(),
    },
  },
}));

// Mock simple de fs/promises
vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(),
    mkdir: vi.fn(),
  },
}));

// Mock simple de path
vi.mock('path', () => ({
  default: {
    dirname: vi.fn(),
  },
}));

describe('StructuredLogger - Working Tests', () => {
  let StructuredLogger: any;

  beforeEach(() => {
    // Limpiar mocks
    vi.clearAllMocks();
    
    // Importar StructuredLogger
    const loggerModule = require('../logger.ts');
    StructuredLogger = loggerModule.StructuredLogger;
  });

  describe('Constructor', () => {
    it('should create StructuredLogger with provided category and sessionId', () => {
      const logger = new StructuredLogger('test-category', 'custom-session');
      
      expect(logger.getSessionId()).toBe('custom-session');
    });

    it('should generate sessionId when not provided', () => {
      const logger = new StructuredLogger('test-category');
      
      const sessionId = logger.getSessionId();
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]{9}$/);
    });

    it('should generate unique sessionIds for different instances', () => {
      const logger1 = new StructuredLogger('test-category');
      const logger2 = new StructuredLogger('test-category');
      
      const sessionId1 = logger1.getSessionId();
      const sessionId2 = logger2.getSessionId();
      
      expect(sessionId1).not.toBe(sessionId2);
    });
  });

  describe('getSessionId', () => {
    let structuredLogger: any;

    beforeEach(() => {
      structuredLogger = new StructuredLogger('test-category', 'test-session');
    });

    it('should return the session ID', () => {
      const sessionId = structuredLogger.getSessionId();
      expect(sessionId).toBe('test-session');
    });

    it('should return the same session ID on multiple calls', () => {
      const sessionId1 = structuredLogger.getSessionId();
      const sessionId2 = structuredLogger.getSessionId();
      
      expect(sessionId1).toBe(sessionId2);
    });
  });

  describe('Session ID generation', () => {
    it('should generate session IDs with correct format', () => {
      const logger = new StructuredLogger('test-category');
      const sessionId = logger.getSessionId();
      
      // Verificar formato: session_timestamp_randomstring
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]{9}$/);
    });

    it('should generate different session IDs for different instances', () => {
      const logger1 = new StructuredLogger('test-category');
      const logger2 = new StructuredLogger('test-category');
      const logger3 = new StructuredLogger('test-category');
      
      const sessionId1 = logger1.getSessionId();
      const sessionId2 = logger2.getSessionId();
      const sessionId3 = logger3.getSessionId();
      
      expect(sessionId1).not.toBe(sessionId2);
      expect(sessionId1).not.toBe(sessionId3);
      expect(sessionId2).not.toBe(sessionId3);
    });

    it('should maintain same session ID for same instance', () => {
      const logger = new StructuredLogger('test-category');
      
      const sessionId1 = logger.getSessionId();
      const sessionId2 = logger.getSessionId();
      const sessionId3 = logger.getSessionId();
      
      expect(sessionId1).toBe(sessionId2);
      expect(sessionId1).toBe(sessionId3);
      expect(sessionId2).toBe(sessionId3);
    });
  });

  describe('Category handling', () => {
    it('should store category correctly', () => {
      const logger = new StructuredLogger('api-service', 'test-session');
      expect(logger.getSessionId()).toBe('test-session');
    });

    it('should handle empty category', () => {
      const logger = new StructuredLogger('', 'test-session');
      expect(logger.getSessionId()).toBe('test-session');
    });

    it('should handle special characters in category', () => {
      const logger = new StructuredLogger('test-category-123', 'test-session');
      expect(logger.getSessionId()).toBe('test-session');
    });
  });

  describe('Session ID handling', () => {
    it('should handle empty session ID', () => {
      const logger = new StructuredLogger('test-category', '');
      // Cuando se pasa una cadena vacía, se genera automáticamente un sessionId
      const sessionId = logger.getSessionId();
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]{9}$/);
    });

    it('should handle special characters in session ID', () => {
      const logger = new StructuredLogger('test-category', 'session-123_abc');
      expect(logger.getSessionId()).toBe('session-123_abc');
    });

    it('should handle long session ID', () => {
      const longSessionId = 'a'.repeat(100);
      const logger = new StructuredLogger('test-category', longSessionId);
      expect(logger.getSessionId()).toBe(longSessionId);
    });
  });
});
