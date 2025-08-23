# Refactorización: Migración de Base de Datos Directa a API REST

## 📋 Resumen de Cambios

Este documento describe la refactorización realizada para cambiar el sistema de inserción directa a base de datos por un sistema de inserción a través de API REST.

## 🎯 Objetivos de la Refactorización

- **Desacoplamiento**: Separar la lógica de procesamiento de Excel de la persistencia de datos
- **Escalabilidad**: Permitir que múltiples instancias del procesador trabajen con la misma API
- **Flexibilidad**: Facilitar cambios en la capa de persistencia sin afectar el procesamiento
- **Mantenibilidad**: Simplificar la arquitectura y reducir dependencias directas

## 🔄 Cambios Principales

### 1. Nuevas Dependencias

Se agregó `axios` para realizar llamadas HTTP a la API REST:

```json
{
  "axios": "^1.6.7"
}
```

### 2. Nuevo Servicio: ApiService

Se creó `src/services/ApiService.ts` que maneja todas las comunicaciones con la API REST:

#### Características principales:
- **Configuración flexible**: URL base, API key, timeout configurables
- **Interceptores de logging**: Logging automático de requests y responses
- **Retry automático**: Reintentos con backoff exponencial
- **Health check**: Verificación de conectividad con la API
- **Manejo de errores**: Gestión robusta de errores de red y API

#### Métodos principales:
- `checkApiHealth()`: Verifica conectividad con la API
- `sendLicitacionesBatch()`: Envía lotes de licitaciones
- `sendLicitacion()`: Envía una licitación individual
- `checkLicitacionExists()`: Verifica si una licitación existe
- `getApiStats()`: Obtiene estadísticas de la API
- `executeWithRetry()`: Ejecuta operaciones con retry automático

### 3. Refactorización de ExcelProcessor

#### Cambios en el constructor:
```typescript
// Antes
constructor(dryRun: boolean = false) {
  // ... configuración de directorios
  this.logger = new StructuredLogger('ExcelProcessor');
}

// Después
constructor(dryRun: boolean = false) {
  // ... configuración de directorios
  this.apiService = new ApiService();
  this.logger = new StructuredLogger('ExcelProcessor');
}
```

#### Reemplazo de métodos:
- `saveToDatabase()` → `sendToApi()`
- `processBatchWithTransaction()` → `processBatchWithApi()`
- `mapToLicitacion()` → `mapToLicitacionApiData()`

### 4. Actualización de Configuración

#### Nuevas variables de entorno:
```bash
# Configuración de API REST
API_BASE_URL=http://localhost:3000/api
API_KEY=your-api-key-here
API_TIMEOUT=30000
API_RETRY_ATTEMPTS=3
```

#### Variables eliminadas:
```bash
# Configuración de Base de Datos (ya no necesarias)
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=excel_data
```

### 5. Actualización de CLI

#### Nuevas opciones de línea de comandos:
```bash
# Opciones de API REST
--api-url <url>               # Configurar URL base de la API
--api-key <key>               # Configurar API key para autenticación
--api-timeout <timeout>       # Configurar timeout de la API (ms)
```

#### Opciones eliminadas:
```bash
# Opciones de base de datos (ya no necesarias)
--db-host <host>
--db-port <port>
--db-username <username>
--db-password <password>
--db-database <database>
```

## 🏗️ Arquitectura Nueva

### Diagrama de flujo:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Archivo Excel │───▶│ ExcelProcessor  │───▶│   ApiService    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Validación    │    │   API REST      │
                       │   de Datos      │    │   Endpoint      │
                       └─────────────────┘    └─────────────────┘
```

### Componentes principales:

1. **ExcelProcessor**: Procesa archivos Excel y coordina el envío
2. **ApiService**: Maneja la comunicación con la API REST
3. **Config**: Gestiona la configuración de la API
4. **Logger**: Registra todas las operaciones y errores

## 🔧 Configuración

### 1. Variables de entorno requeridas:

```bash
# API REST
API_BASE_URL=http://localhost:3000/api
API_KEY=your-api-key-here
API_TIMEOUT=30000
API_RETRY_ATTEMPTS=3

# Directorios
EXCEL_DIRECTORY=./excel-files
PROCESSED_DIRECTORY=./processed-files
ERROR_DIRECTORY=./error-files

# Procesamiento
BATCH_SIZE=100

# Logs
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### 2. Configuración desde línea de comandos:

```bash
# Configurar API
excel-processor --api-url https://api.example.com
excel-processor --api-key my-secret-key
excel-processor --api-timeout 60000

# Ver configuración actual
excel-processor --config
```

## 🧪 Pruebas

### Script de prueba de integración:

```bash
npm run test:api
```

Este script verifica:
- Conectividad con la API
- Envío de datos individuales
- Envío de lotes
- Verificación de existencia
- Obtención de estadísticas

### Modo dry-run:

```bash
excel-processor --dry-run
```

Simula el procesamiento sin enviar datos reales a la API.

## 📊 Formato de Datos

### Estructura de LicitacionApiData:

```typescript
interface LicitacionApiData {
  licitacion_id: string;
  nombre: string;
  fecha_publicacion: string; // Formato: "YYYY-MM-DD HH:mm"
  fecha_cierre: string;      // Formato: "YYYY-MM-DD HH:mm"
  organismo: string;
  unidad: string;
  monto_disponible: number;
  moneda: string;
  estado: string;
}
```

**Ejemplo de datos enviados a la API:**
```json
{
  "licitacion_id": "5178-4406-COT25",
  "nombre": "400145/B5/SP 1010890/IZ (SERVICIO DE COFFE)",
  "fecha_publicacion": "2025-08-22 21:00",
  "fecha_cierre": "2025-08-25 20:00",
  "organismo": "UNIVERSIDAD DE CHILE",
  "unidad": "UCHILE Facultad Medicina (5178)",
  "monto_disponible": 650000,
  "moneda": "CLP",
  "estado": "Publicada"
}
```

### Endpoint disponible en la API:

- `POST /up_compra.php` - Crear licitación individual

**Nota**: La API solo acepta un registro por request y no tiene endpoints para verificación de existencia o estadísticas.

## 🚀 Beneficios de la Refactorización

### 1. **Desacoplamiento**
- El procesador de Excel ya no depende directamente de la base de datos
- Cambios en la persistencia no afectan el procesamiento

### 2. **Escalabilidad**
- Múltiples instancias pueden procesar archivos simultáneamente
- La API puede manejar la concurrencia y optimización

### 3. **Flexibilidad**
- Fácil cambio de proveedor de base de datos
- Posibilidad de agregar validaciones adicionales en la API
- Soporte para diferentes tipos de autenticación

### 4. **Mantenibilidad**
- Código más limpio y enfocado
- Separación clara de responsabilidades
- Testing más sencillo

### 5. **Monitoreo**
- Logging detallado de todas las operaciones
- Métricas de rendimiento
- Trazabilidad completa

## 🔄 Migración

### Pasos para migrar:

1. **Actualizar configuración**:
   ```bash
   cp env.example .env
   # Editar .env con la configuración de la API
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Probar conectividad**:
   ```bash
   npm run test:api
   ```

4. **Ejecutar en modo dry-run**:
   ```bash
   excel-processor --dry-run
   ```

5. **Ejecutar procesamiento real**:
   ```bash
   excel-processor
   ```

## ⚠️ Consideraciones

### 1. **Dependencia de la API**
- El sistema ahora depende de la disponibilidad de la API
- Se implementó retry automático para manejar fallos temporales

### 2. **Latencia de red**
- Las operaciones pueden ser más lentas debido a la latencia de red
- Se optimizó con envío por lotes

### 3. **Seguridad**
- Las credenciales de la API deben manejarse de forma segura
- Se recomienda usar variables de entorno

### 4. **Compatibilidad**
- Los archivos procesados mantienen el mismo formato
- La validación de datos sigue siendo la misma

## 📈 Métricas y Monitoreo

### Logs generados:
- Requests y responses de la API
- Tiempos de procesamiento
- Errores y reintentos
- Estadísticas de rendimiento

### Métricas clave:
- Tiempo de envío por lote
- Tasa de éxito de envíos
- Número de reintentos
- Latencia de la API

## 🔮 Próximos Pasos

### Mejoras futuras:
1. **Cache local**: Para reducir llamadas a la API
2. **Compresión**: Para optimizar el tamaño de los datos enviados
3. **Validación en la API**: Para mayor robustez
4. **Webhooks**: Para notificaciones de estado
5. **Rate limiting**: Para respetar límites de la API

### Optimizaciones:
1. **Envío asíncrono**: Para mejorar el rendimiento
2. **Batching inteligente**: Basado en el tamaño de los datos
3. **Compresión de lotes**: Para reducir el uso de ancho de banda
4. **Retry adaptativo**: Basado en el tipo de error

---

**Nota**: Esta refactorización mantiene la compatibilidad con el procesamiento de archivos Excel existente, cambiando únicamente la capa de persistencia de datos.
