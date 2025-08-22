# 📋 Documentación Consolidada - Script de Procesamiento de Archivos Excel

## 📖 Índice

1. [Descripción General](#descripción-general)
2. [Características Principales](#características-principales)
3. [Requisitos del Sistema](#requisitos-del-sistema)
4. [Instalación y Configuración](#instalación-y-configuración)
5. [Uso del Aplicativo](#uso-del-aplicativo)
6. [Estructura de Datos](#estructura-de-datos)
7. [Configuración Avanzada](#configuración-avanzada)
8. [Sistema de Logging](#sistema-de-logging)
9. [Validaciones de Datos](#validaciones-de-datos)
10. [Manejo de Errores y Retry](#manejo-de-errores-y-retry)
11. [Monitoreo y Progreso](#monitoreo-y-progreso)
12. [Pruebas y Desarrollo](#pruebas-y-desarrollo)
13. [Solución de Problemas](#solución-de-problemas)
14. [Referencias Técnicas](#referencias-técnicas)

---

## 🎯 Descripción General

Este proyecto es una aplicación Node.js que procesa automáticamente archivos Excel, extrae los datos y los inserta en una base de datos MySQL usando TypeORM. Está diseñado para manejar licitaciones públicas con un sistema robusto de validación, logging y manejo de errores.

### Versión Actual

- **Versión**: 1.0.0
- **Node.js**: 18+
- **Base de Datos**: MySQL 8.0+
- **Framework**: TypeORM
- **Lenguaje**: TypeScript

---

## 🚀 Características Principales

### ✅ Funcionalidades Core

- **Procesamiento automático**: Detecta y procesa el archivo Excel más reciente
- **Validación robusta**: Sistema completo de validación de datos
- **Procesamiento por lotes**: Inserción optimizada en la base de datos
- **Logging estructurado**: Sistema de logs detallado con Winston
- **Manejo de errores**: Archivos con errores se mueven a directorio separado
- **Configuración flexible**: Variables de entorno para personalización

### ✅ Características Avanzadas

- **Mapeo automático de encabezados**: Compatibilidad con diferentes formatos de Excel
- **Lógica de retry**: Reconexión automática a la base de datos
- **Progreso en tiempo real**: Monitoreo detallado del procesamiento
- **Ejecutable standalone**: No requiere Node.js en el servidor
- **Métricas de rendimiento**: Análisis automático de logs

---

## 💻 Requisitos del Sistema

### Requisitos Mínimos

- **Node.js**: 18.0.0 o superior
- **MySQL**: 8.0.0 o superior
- **RAM**: 512MB mínimo
- **Espacio**: 100MB para la aplicación + espacio para archivos

### Requisitos Recomendados

- **Node.js**: 20.0.0 o superior
- **MySQL**: 8.0.0 o superior
- **RAM**: 1GB o más
- **Espacio**: 500MB para la aplicación + espacio para archivos

---

## 🛠️ Instalación y Configuración

### 1. Instalación Básica

```bash
# Clonar o navegar al directorio del proyecto
cd script-upload-records-to-db

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env
```

### 2. Configuración del Archivo .env

```env
# Configuración de Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=tu_password
DB_DATABASE=excel_data

# Configuración de Retry y Pool de Conexiones
DB_RETRY_MAX_ATTEMPTS=5
DB_RETRY_INITIAL_DELAY=1000
DB_RETRY_MAX_DELAY=30000
DB_RETRY_BACKOFF_MULTIPLIER=2
DB_CONNECTION_LIMIT=10
DB_CONNECT_TIMEOUT_MS=30000

# Configuración del Directorio de Archivos
EXCEL_DIRECTORY=./excel-files
PROCESSED_DIRECTORY=./processed-files
ERROR_DIRECTORY=./error-files

# Configuración de Logs
LOG_LEVEL=info
LOG_FILE=./logs/app.log
LOG_ENABLE_CONSOLE=true
LOG_ENABLE_PERFORMANCE=true
LOG_MAX_SIZE=5242880
LOG_MAX_FILES=5
LOG_RETENTION_DAYS=30

# Configuración del Procesamiento
BATCH_SIZE=100
PROCESSING_INTERVAL=30000
```

### 3. Configuración de Base de Datos

```bash
# Iniciar MySQL con Docker
npm run db:start

# Verificar estado
npm run db:status

# Ver logs
npm run db:logs
```

---

## 🏃‍♂️ Uso del Aplicativo

### Opción 1: Desarrollo

```bash
# Ejecutar en modo desarrollo
npm run dev

# Ejecutar en modo producción
npm run build
npm start
```

### Opción 2: Ejecutable (Recomendado)

```bash
# Construir el ejecutable
npm run build:all

# Ejecutar directamente
./bin/script-upload-records-to-db

# Instalar globalmente
./install.sh

# Ver demostración
./demo-executable.sh
```

### Opción 3: Configuración desde Línea de Comandos

```bash
# Mostrar ayuda
./bin/script-upload-records-to-db --help

# Ver configuración actual
./bin/script-upload-records-to-db --config

# Configurar base de datos
./bin/script-upload-records-to-db --db-host 192.168.1.100 --db-port 3307

# Configurar directorios
./bin/script-upload-records-to-db --excel-dir ./my-excel-files --processed-dir ./my-processed-files

# Configuración completa
./bin/script-upload-records-to-db \
  --db-host 192.168.1.100 \
  --db-port 3307 \
  --db-username admin \
  --db-password secret123 \
  --db-database production_data \
  --excel-dir ./production/excel \
  --batch-size 1000 \
  --log-level info
```

---

## 📊 Estructura de Datos

### Campos Esperados por el Sistema

| Campo del Sistema | Tipo   | Descripción               | Requerido | Límite |
| ----------------- | ------ | ------------------------- | --------- | ------ |
| idLicitacion      | string | ID único de la licitación | ✅        | 50     |
| nombre            | string | Nombre de la licitación   | ✅        | 500    |
| fechaPublicacion  | date   | Fecha de publicación      | ❌        | -      |
| fechaCierre       | date   | Fecha de cierre           | ❌        | -      |
| organismo         | string | Organismo que publica     | ❌        | 300    |
| unidad            | string | Unidad del organismo      | ❌        | 200    |
| montoDisponible   | number | Monto disponible          | ❌        | 15,2   |
| moneda            | string | Moneda (CLP, USD, etc.)   | ❌        | 10     |
| estado            | string | Estado de la licitación   | ❌        | 50     |

### Mapeo Automático de Encabezados

El sistema mapea automáticamente los siguientes encabezados del Excel:

| Encabezado del Excel   | Campo del Sistema  | Variaciones Soportadas              |
| ---------------------- | ------------------ | ----------------------------------- |
| `ID`                   | `idLicitacion`     | id_licitacion, idlicitacion         |
| `Nombre`               | `nombre`           | -                                   |
| `Fecha de Publicación` | `fechaPublicacion` | fecha_publicacion, fechapublicacion |
| `Fecha de cierre`      | `fechaCierre`      | fecha_cierre, fechacierre           |
| `Organismo`            | `organismo`        | -                                   |
| `Unidad`               | `unidad`           | -                                   |
| `Monto Disponible`     | `montoDisponible`  | monto_disponible, montodisponible   |
| `Moneda`               | `moneda`           | -                                   |
| `Estado`               | `estado`           | -                                   |

**Características del mapeo:**

- ✅ Insensible a mayúsculas/minúsculas
- ✅ Maneja acentos y caracteres especiales
- ✅ Normaliza espacios múltiples
- ✅ Soporta variaciones de nombres

---

## ⚙️ Configuración Avanzada

### Variables de Entorno Detalladas

| Variable                 | Descripción                          | Valor por Defecto   | Tipo   |
| ------------------------ | ------------------------------------ | ------------------- | ------ |
| `DB_HOST`                | Host de la base de datos             | `localhost`         | string |
| `DB_PORT`                | Puerto de la base de datos           | `3306`              | number |
| `DB_USERNAME`            | Usuario de la base de datos          | `root`              | string |
| `DB_PASSWORD`            | Contraseña de la base de datos       | `password`          | string |
| `DB_DATABASE`            | Nombre de la base de datos           | `excel_data`        | string |
| `DB_RETRY_MAX_ATTEMPTS`  | Máximo intentos de reconexión        | `5`                 | number |
| `DB_RETRY_INITIAL_DELAY` | Delay inicial en ms                  | `1000`              | number |
| `DB_RETRY_MAX_DELAY`     | Delay máximo en ms                   | `30000`             | number |
| `DB_CONNECTION_LIMIT`    | Límite de conexiones en el pool      | `10`                | number |
| `DB_CONNECT_TIMEOUT_MS`  | Timeout de conexión en ms            | `30000`             | number |
| `EXCEL_DIRECTORY`        | Directorio a monitorear              | `./excel-files`     | string |
| `PROCESSED_DIRECTORY`    | Directorio para archivos procesados  | `./processed-files` | string |
| `ERROR_DIRECTORY`        | Directorio para archivos con errores | `./error-files`     | string |
| `LOG_LEVEL`              | Nivel de logging                     | `info`              | string |
| `LOG_FILE`               | Archivo de logs                      | `./logs/app.log`    | string |
| `BATCH_SIZE`             | Tamaño del lote para inserción       | `100`               | number |
| `PROCESSING_INTERVAL`    | Intervalo de procesamiento (ms)      | `30000`             | number |

### Directorios Automáticos

El script crea automáticamente:

- `excel-files/`: Archivos Excel a procesar
- `processed-files/`: Archivos procesados exitosamente
- `error-files/`: Archivos que generaron errores
- `logs/`: Archivos de logs

---

## 📊 Sistema de Logging

### Características del Logging

- **Categorías**: Cada componente tiene su propia categoría
- **Sesiones Únicas**: Rastreo de procesos individuales
- **Métricas de Rendimiento**: Tiempos de operación automáticos
- **Formato Estructurado**: JSON para análisis automatizado
- **Rotación Automática**: Gestión de archivos de log

### Archivos de Log

- `logs/app.log`: Logs generales con toda la información
- `logs/app.error.log`: Solo errores para monitoreo rápido
- `logs/app.performance.log`: Métricas de rendimiento detalladas
- `logs/report.md`: Reporte automático de análisis
- `logs/report.json`: Datos estructurados para análisis

### Niveles de Log

- `error`: Errores críticos
- `warn`: Advertencias
- `info`: Información general
- `verbose`: Información detallada (métricas)
- `debug`: Información de depuración

### Comandos de Análisis

```bash
npm run logs:analyze    # Genera reporte completo
npm run logs:report     # Genera reporte y muestra resumen
npm run logs:clean      # Limpia logs antiguos (>30 días)
npm run logs:test       # Prueba el sistema de logging
```

### Ejemplo de Log Estructurado

```json
{
  "timestamp": "2025-08-22 08:38:31",
  "level": "info",
  "category": "ExcelProcessor",
  "sessionId": "session_1755869911295_dma0shv4i",
  "operation": "read_excel_file",
  "duration": 151,
  "message": "Performance: read_excel_file",
  "fileName": "test-file.xlsx",
  "recordsCount": 1000
}
```

---

## 🔍 Validaciones de Datos

### Validaciones Implementadas

#### 1. Campos Obligatorios

- **idLicitacion**: Debe estar presente y no estar vacío (máximo 50 caracteres)
- **nombre**: Debe estar presente y no estar vacío (máximo 500 caracteres)

#### 2. Campos Opcionales con Validación

- **organismo**: Si está presente, máximo 300 caracteres
- **unidad**: Si está presente, máximo 200 caracteres
- **moneda**: Si está presente, máximo 10 caracteres
- **estado**: Si está presente, máximo 50 caracteres

#### 3. Validación de Fechas

- **fechaPublicacion**: Formato de fecha válido (opcional)
- **fechaCierre**: Formato de fecha válido (opcional)
- **Rango de fechas**: La fecha de cierre debe ser posterior o igual a la fecha de publicación

#### 4. Validación de Montos

- **montoDisponible**: Debe ser un número válido y no negativo (opcional)
- Soporta tanto números como strings numéricos
- Maneja formatos de moneda (ej: "$1,234.56")

#### 5. Validación de Estructura

- Verifica que no haya filas `undefined` o vacías
- Valida que los datos sean un array válido

### Métricas de Validación

- **Límite de logs**: Máximo 10 errores detallados para evitar saturación
- **Logs estructurados**: Incluyen número de fila y valor problemático
- **Resumen final**: Total de errores encontrados vs registros procesados

### Ejemplo de Logs de Validación

```
11:54:38 warn  Registro 1: idLicitacion inválido o faltante {"value":null,"rowNumber":1}
11:54:38 warn  Registro 2: fechaPublicacion inválida {"value":"fecha-invalida","rowNumber":2}
11:54:38 error Validación fallida: 2 errores encontrados en 10 registros
```

---

## 🔄 Manejo de Errores y Retry

### Lógica de Retry para Base de Datos

#### Configuración de Retry

```env
DB_RETRY_MAX_ATTEMPTS=5              # Número máximo de intentos
DB_RETRY_INITIAL_DELAY=1000          # Delay inicial en ms
DB_RETRY_MAX_DELAY=30000             # Delay máximo en ms
DB_RETRY_BACKOFF_MULTIPLIER=2        # Multiplicador de backoff exponencial
```

#### Backoff Exponencial

- Intento 1: 1000ms
- Intento 2: 2000ms
- Intento 3: 4000ms
- Intento 4: 8000ms
- Intento 5: 16000ms (limitado a 30000ms)

#### Configuración de Pool de Conexiones

```env
DB_CONNECTION_LIMIT=10               # Límite de conexiones en el pool
DB_CONNECT_TIMEOUT_MS=30000          # Timeout de conexión inicial (ms)
```

### Tipos de Errores Manejados

1. **Archivo no encontrado**: No hay archivos Excel en el directorio
2. **Archivo corrupto**: El archivo Excel no se puede leer
3. **Datos inválidos**: Los datos no cumplen con la estructura esperada
4. **Error de base de datos**: Problemas de conexión o inserción
5. **Error de permisos**: Problemas de acceso a archivos
6. **Encabezados no mapeados**: Columnas del Excel que no coinciden con el mapeo

### Recuperación Automática

- Los archivos con errores se mueven a `error-files/`
- Los logs detallan el error específico
- El servicio continúa funcionando después de un error
- Reconexión automática a la base de datos

---

## 📈 Monitoreo y Progreso

### Progreso Detallado por Lotes

```
✅ Lote 1: 100/5,000 registros (2.0%)
✅ Lote 2: 200/5,000 registros (4.0%)
✅ Lote 3: 300/5,000 registros (6.0%)
```

### Métricas de Tiempo

```
⏱️  Tiempo transcurrido: 45s | Estimado restante: 120s
📊 Velocidad: 1,200 registros/min
```

### Estadísticas Finales

```
🎉 ¡Inserción completada exitosamente!
   📊 Total de registros insertados: 5,000
   ⏱️  Tiempo total: 165s
   📦 Lotes procesados: 50
   🚀 Velocidad promedio: 1,818 registros/min
   ⏰ Finalizado: 15:30:45
```

### Ejemplo de Salida Completa

```
🚀 Iniciando procesamiento de archivos Excel...
   📁 Directorio: ./excel-files
   📦 Tamaño de lote: 100
   ⏰ Inicio: 15:25:30

🔍 Buscando archivo Excel más reciente...
✅ Archivo encontrado: licitaciones-large-5000.xlsx
   📏 Tamaño: 2.45 MB

📁 Procesando archivo: licitaciones-large-5000.xlsx
   📏 Tamaño: 2.45 MB
   ⏰ Inicio: 15:25:31

📖 Leyendo archivo Excel...
   ✅ Leídos 5,000 registros en 234ms

🔍 Validando datos...
   ✅ Validación completada en 45ms

📊 Iniciando inserción en base de datos:
   📁 Archivo: licitaciones-large-5000.xlsx
   📈 Total de registros: 5,000
   📦 Tamaño de lote: 100
   ⏱️  Inicio: 15:25:32

   🔄 Procesando lote de 100 registros... ✅
   ✅ Lote 1: 100/5,000 registros (2.0%)
   ...
   ✅ Lote 50: 5,000/5,000 registros (100.0%)
   ⏱️  Tiempo transcurrido: 165s | Estimado restante: 0s
   📊 Velocidad: 1,818 registros/min

🎉 ¡Inserción completada exitosamente!
   📊 Total de registros insertados: 5,000
   ⏱️  Tiempo total: 165s
   📦 Lotes procesados: 50
   🚀 Velocidad promedio: 1,818 registros/min
   ⏰ Finalizado: 15:28:15
```

---

## 🧪 Pruebas y Desarrollo

### Scripts de Prueba Disponibles

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo watch
npm run test:watch

# Ejecutar pruebas con UI
npm run test:ui

# Ejecutar pruebas con cobertura
npm run test:coverage

# Probar configuración del archivo .env
npm run test:env-config

# Probar lógica de retry de base de datos
npm run test:retry

# Probar sistema de logging
npm run logs:test
```

### Scripts de Generación de Datos

```bash
# Crear archivo Excel de prueba pequeño
npm run test:excel

# Crear archivo Excel de prueba grande
npm run test:excel:large 10000

# Ejecutar demostración de progreso
npm run demo
```

### Comandos de Base de Datos

```bash
# Iniciar base de datos
npm run db:start

# Detener base de datos
npm run db:stop

# Reiniciar base de datos
npm run db:restart

# Ver logs de base de datos
npm run db:logs

# Ver estado de base de datos
npm run db:status

# Limpiar base de datos
npm run db:clean
```

### Estructura de Pruebas

```
src/services/__tests__/
├── ExcelProcessor.test.ts    # Pruebas del procesador principal
└── HeaderMapping.test.ts     # Pruebas del mapeo de encabezados
```

---

## 🔧 Solución de Problemas

### Problemas Comunes

#### 1. Error: "No se encontraron archivos Excel"

**Causa**: No hay archivos Excel en el directorio configurado
**Solución**:

```bash
# Verificar directorio
ls -la ./excel-files/

# Crear archivo de prueba
npm run test:excel
```

#### 2. Error: "Base de datos no disponible"

**Causa**: MySQL no está ejecutándose o configuración incorrecta
**Solución**:

```bash
# Verificar estado de MySQL
npm run db:status

# Iniciar MySQL si no está ejecutándose
npm run db:start

# Verificar configuración
./bin/script-upload-records-to-db --config
```

#### 3. Error: "Encabezado no mapeado"

**Causa**: Los encabezados del Excel no coinciden con el mapeo esperado
**Solución**:

```bash
# Verificar mapeo de encabezados
node scripts/test-header-mapping.js

# Revisar logs para ver encabezados detectados
tail -f logs/app.log
```

#### 4. Error: "Permisos denegados"

**Causa**: Problemas de permisos en archivos o directorios
**Solución**:

```bash
# Dar permisos de ejecución
chmod +x bin/script-upload-records-to-db

# Verificar permisos de directorios
ls -la excel-files/ processed-files/ error-files/
```

#### 5. Error: "Variable de entorno requerida"

**Causa**: Falta configuración en el archivo .env
**Solución**:

```bash
# Crear archivo .env desde ejemplo
cp env.example .env

# Editar configuración
nano .env
```

### Logs de Debug

```bash
# Ejecutar con nivel de log debug
LOG_LEVEL=debug npm run dev

# Ver logs en tiempo real
tail -f logs/app.log

# Ver solo errores
tail -f logs/app.error.log

# Ver métricas de rendimiento
tail -f logs/app.performance.log
```

### Verificación de Funcionalidad

```bash
# Probar ejecutable
./bin/script-upload-records-to-db --dry-run

# Verificar conexión a base de datos
npm run test:retry

# Probar sistema de logging
npm run logs:test
```

---

## 📚 Referencias Técnicas

### Estructura del Proyecto

```
script-upload-records-to-db/
├── src/
│   ├── config/
│   │   ├── config.ts          # Configuración general
│   │   └── database.ts        # Configuración de TypeORM
│   ├── entities/
│   │   └── Licitacion.ts      # Entidad para licitaciones
│   ├── services/
│   │   ├── __tests__/
│   │   │   ├── ExcelProcessor.test.ts
│   │   │   └── HeaderMapping.test.ts
│   │   └── ExcelProcessor.ts  # Lógica principal de procesamiento
│   ├── utils/
│   │   └── logger.ts          # Configuración de Winston
│   └── index.ts               # Punto de entrada principal
├── scripts/
│   ├── create-test-excel.js
│   ├── create-large-test-excel.js
│   ├── demo-progress.js
│   ├── log-analyzer.ts
│   ├── test-database-retry.js
│   ├── test-env-config.js
│   └── test-header-mapping.js
├── docs/                      # Documentación técnica
├── bin/                       # Ejecutables generados
├── logs/                      # Archivos de log
├── excel-files/               # Archivos Excel a procesar
├── processed-files/           # Archivos procesados
├── error-files/               # Archivos con errores
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### Dependencias Principales

| Dependencia        | Versión | Propósito                       |
| ------------------ | ------- | ------------------------------- |
| `typeorm`          | ^0.3.20 | ORM para base de datos          |
| `mysql2`           | ^3.9.2  | Driver de MySQL                 |
| `xlsx`             | ^0.18.5 | Procesamiento de archivos Excel |
| `winston`          | ^3.13.0 | Sistema de logging              |
| `dotenv`           | ^16.4.5 | Variables de entorno            |
| `reflect-metadata` | ^0.2.1  | Metadatos para TypeORM          |

### Scripts de Build

```bash
npm run build                    # Compilar TypeScript
npm run build:executable         # Crear ejecutable
npm run build:executable:clean   # Crear ejecutable sin warnings
npm run build:all               # Compilar y crear ejecutable
npm run build:all:clean         # Build completo sin warnings
```

### Configuración de TypeScript

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Configuración de Vitest

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

---

## 📞 Soporte y Contacto

### Antes de Contactar

1. **Revisa los logs**: `tail -f logs/app.log`
2. **Verifica la configuración**: `./bin/script-upload-records-to-db --config`
3. **Ejecuta las pruebas**: `npm test`
4. **Consulta esta documentación**: Busca en la sección de solución de problemas

### Recursos Adicionales

- **Documentación de TypeORM**: https://typeorm.io/
- **Documentación de MySQL2**: https://github.com/sidorares/node-mysql2
- **Documentación de XLSX**: https://github.com/SheetJS/sheetjs
- **Documentación de Winston**: https://github.com/winstonjs/winston

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**Última actualización**: Agosto 2025  
**Versión de la documentación**: 1.0.0
