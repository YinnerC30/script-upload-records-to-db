# 🔄 Lógica de Retry para Conexiones a Base de Datos

## 📋 Resumen

Este documento describe la implementación de una lógica de retry robusta para las conexiones a la base de datos MySQL, diseñada para manejar fallos temporales de conectividad y mejorar la resiliencia de la aplicación.

## 🎯 Objetivos

- **Resiliencia**: Manejar fallos temporales de red y base de datos
- **Recuperación automática**: Reintentar conexiones fallidas automáticamente
- **Configurabilidad**: Permitir ajustar parámetros de retry según el entorno
- **Logging detallado**: Proporcionar información completa sobre intentos y fallos
- **Backoff exponencial**: Implementar delays inteligentes entre reintentos

## ⚙️ Configuración

### Variables de Entorno

```bash
# Configuración de Retry
DB_RETRY_MAX_ATTEMPTS=5              # Número máximo de intentos
DB_RETRY_INITIAL_DELAY=1000          # Delay inicial en ms
DB_RETRY_MAX_DELAY=30000             # Delay máximo en ms
DB_RETRY_BACKOFF_MULTIPLIER=2        # Multiplicador de backoff exponencial

# Configuración de Pool de Conexiones
DB_CONNECTION_LIMIT=10               # Límite de conexiones en el pool
DB_ACQUIRE_TIMEOUT=60000             # Timeout para adquirir conexión (ms)
DB_TIMEOUT=60000                     # Timeout general de conexión (ms)
DB_MAX_RECONNECT_ATTEMPTS=5          # Intentos de reconexión automática
DB_RECONNECT_DELAY=1000              # Delay entre reconexiones (ms)
DB_CONNECT_TIMEOUT_MS=30000          # Timeout de conexión inicial (ms)
```

### Valores por Defecto

| Variable                      | Valor   | Descripción                       |
| ----------------------------- | ------- | --------------------------------- |
| `DB_RETRY_MAX_ATTEMPTS`       | 5       | Máximo 5 intentos de conexión     |
| `DB_RETRY_INITIAL_DELAY`      | 1000ms  | 1 segundo de espera inicial       |
| `DB_RETRY_MAX_DELAY`          | 30000ms | Máximo 30 segundos de espera      |
| `DB_RETRY_BACKOFF_MULTIPLIER` | 2       | Duplicar el delay en cada intento |

## 🔧 Implementación

### 1. Configuración de DataSource

```typescript
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  entities: [Licitacion],
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  ssl: false,

  // Configuración de pool de conexiones
  extra: {
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'),
    timeout: parseInt(process.env.DB_TIMEOUT || '60000'),
    reconnect: true,
    maxReconnectAttempts: parseInt(
      process.env.DB_MAX_RECONNECT_ATTEMPTS || '5'
    ),
    reconnectDelay: parseInt(process.env.DB_RECONNECT_DELAY || '1000'),
  },

  // Configuración de timeouts
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '30000'),

  // Configuración de logging detallado
  logger:
    process.env.NODE_ENV === 'development'
      ? 'advanced-console'
      : 'simple-console',
});
```

### 2. Lógica de Retry con Backoff Exponencial

```typescript
// Función para calcular delay con backoff exponencial
function calculateDelay(attempt: number): number {
  const delay =
    RETRY_CONFIG.initialDelay *
    Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
}
```

**Ejemplo de delays:**

- Intento 1: 1000ms
- Intento 2: 2000ms
- Intento 3: 4000ms
- Intento 4: 8000ms
- Intento 5: 16000ms (limitado a 30000ms)

### 3. Inicialización con Retry

```typescript
export const initializeDatabase = async (): Promise<void> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      logger.info(
        `🔄 Intento ${attempt}/${RETRY_CONFIG.maxAttempts} de conexión a la base de datos`
      );

      await AppDataSource.initialize();
      await AppDataSource.query('SELECT 1 as health_check');

      logger.info('✅ Base de datos conectada exitosamente');
      return;
    } catch (error) {
      lastError = error as Error;

      if (attempt === RETRY_CONFIG.maxAttempts) {
        break;
      }

      const delay = calculateDelay(attempt);
      await sleep(delay);
    }
  }

  throw new Error(
    `Falló la conexión después de ${RETRY_CONFIG.maxAttempts} intentos`
  );
};
```

### 4. Función de Retry Genérica

```typescript
export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  operationName: string = 'database_operation'
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!(await checkDatabaseConnection())) {
        throw new Error('Conexión a BD no disponible');
      }

      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      const delay = calculateDelay(attempt);
      await sleep(delay);
    }
  }

  throw new Error(`${operationName} falló después de ${maxRetries} intentos`);
};
```

## 📊 Monitoreo y Logging

### Logs de Conexión

```typescript
logger.info(
  `🔄 Intento ${attempt}/${RETRY_CONFIG.maxAttempts} de conexión a la base de datos`,
  {
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    attempt,
    maxAttempts: RETRY_CONFIG.maxAttempts,
  }
);
```

### Logs de Error

```typescript
logger.error(
  `❌ Error en intento ${attempt}/${RETRY_CONFIG.maxAttempts} de conexión a la base de datos`,
  {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    attempt,
    maxAttempts: RETRY_CONFIG.maxAttempts,
  }
);
```

### Logs de Progreso

```typescript
logger.info(`⏳ Esperando ${delay}ms antes del siguiente intento`, {
  attempt,
  nextAttempt: attempt + 1,
  delay,
  maxDelay: RETRY_CONFIG.maxDelay,
});
```

## 🧪 Pruebas

### Script de Pruebas

```bash
npm run test:retry
```

Este script prueba:

1. **Configuraciones diferentes**: Rápida, estándar y agresiva
2. **Escenarios de fallo**: BD no disponible, timeouts
3. **Recuperación**: Verificar que el sistema se recupera correctamente

### Casos de Prueba

1. **Conexión exitosa**: Verificar que funciona con BD disponible
2. **BD no disponible**: Detener MySQL y verificar retry
3. **Timeout bajo**: Configurar timeout muy bajo para forzar fallos
4. **Diferentes configuraciones**: Probar con diferentes parámetros de retry

## 🚀 Uso en el Código

### Inicialización

```typescript
// En index.ts
await initializeDatabase();
```

### Operaciones con Retry

```typescript
// En ExcelProcessor.ts
const queryRunner = await executeWithRetry(
  async () => {
    const runner = AppDataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    return runner;
  },
  3,
  'create_transaction'
);

await executeWithRetry(
  async () => {
    const licitacionRepository = queryRunner.manager.getRepository(Licitacion);
    return await licitacionRepository.save(licitaciones);
  },
  3,
  `save_batch_${batch.length}_records`
);
```

### Verificación de Estado

```typescript
const isConnected = await checkDatabaseConnection();
if (!isConnected) {
  logger.warn('Base de datos no disponible');
}
```

## 🔍 Troubleshooting

### Problemas Comunes

1. **Demasiados intentos**: Reducir `DB_RETRY_MAX_ATTEMPTS`
2. **Delays muy largos**: Ajustar `DB_RETRY_MAX_DELAY`
3. **Timeouts**: Aumentar `DB_CONNECT_TIMEOUT_MS`
4. **Pool agotado**: Aumentar `DB_CONNECTION_LIMIT`

### Logs de Debug

```bash
LOG_LEVEL=debug npm start
```

### Verificación Manual

```typescript
// Verificar conexión
const isConnected = await checkDatabaseConnection();
console.log('Conexión activa:', isConnected);

// Verificar configuración
console.log('Configuración de retry:', RETRY_CONFIG);
```

## 📈 Métricas y Monitoreo

### Métricas Recomendadas

- **Tasa de éxito de conexión**: `conexiones_exitosas / total_intentos`
- **Tiempo promedio de conexión**: Tiempo desde intento hasta éxito
- **Número de reintentos**: Promedio de reintentos por operación
- **Errores por tipo**: Clasificar errores de conexión

### Alertas

- **Fallos consecutivos**: Alertar después de N fallos seguidos
- **Tiempo de conexión alto**: Alertar si toma más de X segundos
- **Pool agotado**: Alertar si se agotan las conexiones del pool

## 🔒 Consideraciones de Seguridad

1. **Logs sensibles**: No loggear contraseñas o tokens
2. **Timeouts**: Configurar timeouts apropiados para evitar DoS
3. **Rate limiting**: Considerar límites de reintentos por IP/usuario
4. **Auditoría**: Loggear intentos de conexión para auditoría

## 📚 Referencias

- [TypeORM Documentation](https://typeorm.io/)
- [MySQL2 Connection Options](https://github.com/sidorares/node-mysql2#connection-options)
- [Exponential Backoff Strategy](https://en.wikipedia.org/wiki/Exponential_backoff)
