# 📊 Script de Procesamiento de Archivos Excel

Este proyecto es una aplicación Node.js que procesa automáticamente archivos Excel, extrae los datos y los envía a una API REST. Está diseñado para manejar licitaciones públicas con un sistema robusto de validación, logging y manejo de errores.

## 🚀 Características Principales

### ✅ Funcionalidades Core

- **Procesamiento automático**: Detecta y procesa el archivo Excel más reciente
- **Validación robusta**: Sistema completo de validación de datos
- **Envío a API REST**: Envío optimizado de datos a API externa
- **Logging estructurado**: Sistema de logs detallado con Winston
- **Manejo de errores**: Archivos con errores se mueven a directorio separado
- **Configuración flexible**: Variables de entorno para personalización

### ✅ Características Avanzadas

- **Mapeo automático de encabezados**: Compatibilidad con diferentes formatos de Excel
- **Lógica de retry**: Reintentos automáticos para llamadas a la API
- **Progreso en tiempo real**: Monitoreo detallado del procesamiento
- **Ejecutable standalone**: No requiere Node.js en el servidor
- **Métricas de rendimiento**: Análisis automático de logs
- **Modo dry-run**: Validación sin envío real de datos

## 📋 Requisitos del Sistema

### Requisitos Mínimos

- **Node.js**: 18.0.0 o superior
- **RAM**: 512MB mínimo
- **Espacio**: 100MB para la aplicación + espacio para archivos
- **Conectividad**: Acceso a internet para API REST

### Requisitos Recomendados

- **Node.js**: 20.0.0 o superior
- **RAM**: 1GB o más
- **Espacio**: 500MB para la aplicación + espacio para archivos
- **Conectividad**: Conexión estable a internet

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
# Configuración de API REST
API_BASE_URL=http://localhost:3000/api/up_compra.php
API_KEY=your-api-key-here
API_TIMEOUT=30000

# Configuración del Directorio de Archivos
EXCEL_DIRECTORY=./excel-files
PROCESSED_DIRECTORY=./processed-files
ERROR_DIRECTORY=./error-files

# Configuración de almacenamiento JSON de IDs procesados
PROCESSED_IDS_PATH=./processed-db/processed_ids.json

# Configuración de Logs Mejorada
LOG_FILE=./logs/app.log
LOG_MAX_SIZE=5242880
LOG_MAX_FILES=5

# Configuración de Limpieza Automática de Consola
CONSOLE_CLEAN_MAX_LOGS=100
CONSOLE_CLEAN_INTERVAL=30000
```

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

# Ejecutar directamente (requiere 'run' o 'run --dry-run')
./bin/script-upload-records-to-db run

# Instalar globalmente (requiere sudo)
sudo ./install.sh

# Instalar en directorio personal (no requiere sudo)
./install.sh -d ~/bin

# Desinstalar (requiere sudo si instalado globalmente)
sudo ./uninstall.sh
```

#### 🔐 Permisos y Sudo

**Instalación Global** (`/usr/local/bin`):

- ✅ Requiere `sudo` para instalación/desinstalación
- ✅ Requiere `sudo` para comandos de configuración
- ✅ Accesible desde cualquier ubicación
- 📁 Archivo `.env` ubicado en `/usr/local/bin/.env`

**Instalación Personal** (`~/bin` o directorio personal):

- ❌ No requiere `sudo` para instalación/desinstalación
- ❌ No requiere `sudo` para comandos de configuración
- ⚠️ Requiere agregar `~/bin` al PATH: `export PATH="$HOME/bin:$PATH"`
- 📁 Archivo `.env` ubicado en `~/bin/.env`

### Opción 3: Configuración desde Línea de Comandos

**⚠️ Importante**: Si instalaste el ejecutable globalmente (en `/usr/local/bin`), los comandos de configuración requieren permisos de administrador (`sudo`).

```bash
# Mostrar ayuda
./bin/script-upload-records-to-db --help

# Ver configuración actual
./bin/script-upload-records-to-db --config                    # Si instalado localmente
sudo ./bin/script-upload-records-to-db --config               # Si instalado globalmente

# Configurar API (solo aplica cambios, no ejecuta)
./bin/script-upload-records-to-db --api-url https://api.example.com --api-key my-key

# Ejecutar después de configurar
./bin/script-upload-records-to-db run

# Configurar directorios (solo aplica cambios)
./bin/script-upload-records-to-db --excel-dir ./my-excel-files --processed-dir ./my-processed-files

# Configurar almacenamiento JSON de IDs (solo aplica cambios)
./bin/script-upload-records-to-db --processed-ids-path ./processed-db/processed_ids.json

# Validar sin enviar datos (ejecuta en modo validación)
./bin/script-upload-records-to-db run --dry-run

# Configuración completa (aplica cambios) y luego ejecución
./bin/script-upload-records-to-db \
  --api-url https://api.example.com \
  --api-key secret123 \
  --excel-dir ./excel-files \
  --processed-ids-path ./processed-db/processed_ids.json \
  --log-level info
./bin/script-upload-records-to-db run

# Alternativa: Instalar en directorio personal para evitar sudo
./install.sh -d ~/bin
~/bin/excel-processor --api-url https://api.example.com --api-key my-key
~/bin/excel-processor run
```

````

### 🧹 Limpieza Automática de Consola

La aplicación incluye un sistema de limpieza automática de terminal que mantiene la consola limpia sin afectar los logs guardados en archivos.

#### Características

- **Limpieza automática**: La terminal se limpia automáticamente cada cierto número de logs o tiempo
- **Preservación de logs**: Todos los logs se siguen guardando en archivos normalmente
- **Configuración flexible**: Ajustable mediante variables de entorno
- **Controles manuales**: API para controlar la limpieza programáticamente

#### Configuración

```env
# Número máximo de logs antes de limpiar la terminal
CONSOLE_CLEAN_MAX_LOGS=100

# Intervalo en milisegundos para limpieza automática por tiempo
CONSOLE_CLEAN_INTERVAL=30000
````

#### Uso Programático

```javascript
const { consoleCleaner } = require('./dist/utils/logger');

// Limpiar terminal manualmente
consoleCleaner.cleanNow();

// Obtener estadísticas de limpieza
const stats = consoleCleaner.getStats();
console.log('Logs procesados:', stats.logCount);

// Configurar parámetros de limpieza
consoleCleaner.configure(50, 15000); // 50 logs o 15 segundos

// Detener limpieza automática
consoleCleaner.stop();
```

#### Ejemplo de Uso

```bash
# Ejecutar ejemplo de limpieza automática
node scripts/examples/console-cleaner-example.js
```

### 📜 Scripts Shell Disponibles

El proyecto incluye los siguientes scripts shell para facilitar la instalación y configuración:

#### `install.sh` - Script de Instalación

```bash
# Instalar el ejecutable globalmente (requiere sudo)
sudo ./install.sh

# Instalar en directorio personal (no requiere sudo)
./install.sh -d ~/bin

# Opciones disponibles:
./install.sh --help              # Mostrar ayuda
./install.sh -d <directorio>     # Especificar directorio de instalación
```

#### `uninstall.sh` - Script de Desinstalación

```bash
# Desinstalar el ejecutable (requiere sudo si instalado globalmente)
sudo ./uninstall.sh

# Desinstalar desde directorio personal
./uninstall.sh -d ~/bin

# Opciones disponibles:
./uninstall.sh --help            # Mostrar ayuda
./uninstall.sh -d <directorio>   # Especificar directorio de instalación
./uninstall.sh --force           # Forzar desinstalación sin confirmación
```

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

## 🔧 Configuración Avanzada

### Variables de Entorno Detalladas

| Variable                 | Descripción                          | Valor por Defecto                         | Tipo   |
| ------------------------ | ------------------------------------ | ----------------------------------------- | ------ |
| `API_BASE_URL`           | URL completa del endpoint de la API  | `http://localhost:3000/api/up_compra.php` | string |
| `API_KEY`                | Clave de autenticación para la API   | `''`                                      | string |
| `API_TIMEOUT`            | Timeout para llamadas API en ms      | `30000`                                   | number |
| `EXCEL_DIRECTORY`        | Directorio a monitorear              | `./excel-files`                           | string |
| `PROCESSED_DIRECTORY`    | Directorio para archivos procesados  | `./processed-files`                       | string |
| `ERROR_DIRECTORY`        | Directorio para archivos con errores | `./error-files`                           | string |
| `LOG_FILE`               | Archivo de logs                      | `./logs/app.log`                          | string |
| `LOG_MAX_SIZE`           | Tamaño máximo del archivo de log     | `5242880` (5MB)                           | number |
| `LOG_MAX_FILES`          | Número máximo de archivos de log     | `5`                                       | number |
| `CONSOLE_CLEAN_MAX_LOGS` | Máximo de logs antes de limpiar      | `100`                                     | number |
| `CONSOLE_CLEAN_INTERVAL` | Intervalo de limpieza en ms          | `30000`                                   | number |

### Directorios Automáticos

El script crea automáticamente:

- `excel-files/`: Archivos Excel a procesar
- `processed-files/`: Archivos procesados exitosamente
- `error-files/`: Archivos que generaron errores
- `logs/`: Archivos de logs

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
- `logs/app.performance.log`: Métricas de rendimiento detalladas (si está habilitado)
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

## 🔄 Manejo de Errores y Retry

### Lógica de Retry para API REST

#### Configuración de Retry

```env
API_TIMEOUT=30000                 # Timeout en ms
```

#### Estrategia de Retry

- Intento 1: Envío inmediato
- Intento 2: Espera 1 segundo
- Intento 3: Espera 2 segundos

### Tipos de Errores Manejados

1. **Archivo no encontrado**: No hay archivos Excel en el directorio
2. **Archivo corrupto**: El archivo Excel no se puede leer
3. **Datos inválidos**: Los datos no cumplen con la estructura esperada
4. **Error de API**: Problemas de conectividad o respuesta de la API
5. **Error de permisos**: Problemas de acceso a archivos
6. **Encabezados no mapeados**: Columnas del Excel que no coinciden con el mapeo

### Recuperación Automática

- Los archivos con errores se mueven a `error-files/`
- Los logs detallan el error específico
- El servicio continúa funcionando después de un error
- Reintentos automáticos para llamadas a la API

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
🎉 ¡Envío completado exitosamente!
   📊 Total de registros enviados: 5,000
   ⏱️  Tiempo total: 165s
   📦 Lotes procesados: 50
   🚀 Velocidad promedio: 1,818 registros/min
   ⏰ Finalizado: 15:30:45
```

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

# Probar integración con API
npm run test:api

# Probar sistema de logging
npm run logs:test
```

### Scripts de Generación de Datos

```bash
# Crear archivo Excel de prueba básico
npm run generate:excel:basic

# Crear archivo Excel de prueba grande
npm run generate:excel:large

# Crear archivo Excel personalizado
npm run generate:excel:custom
```

### Scripts de Diagnóstico y Configuración

```bash
# Diagnosticar problemas de API
npm run diagnose:api

# Configurar API interactivamente
npm run configure:api

# Probar API rápidamente
npm run test:api:quick
```

### Scripts Disponibles

```bash
npm run build          # Compilar TypeScript
npm run build:all      # Compilar y crear ejecutable
npm run dev            # Ejecutar en modo desarrollo
npm run start          # Ejecutar en modo producción
npm run test           # Ejecutar pruebas
npm run test:watch     # Ejecutar pruebas en modo watch
npm run test:coverage  # Ejecutar pruebas con cobertura
npm run test:ui        # Ejecutar pruebas con UI
```

## 🔧 Solución de Problemas

### Problemas Comunes

#### 1. Error: "No se encontraron archivos Excel"

**Causa**: No hay archivos Excel en el directorio configurado
**Solución**:

```bash
# Verificar directorio
ls -la ./excel-files/

# Crear archivo de prueba
npm run generate:excel:basic
```

#### 2. Error: "API no disponible"

**Causa**: La API REST no está accesible o configuración incorrecta
**Solución**:

```bash
# Verificar conectividad
curl -X GET http://localhost:3000/api

# Verificar configuración
./bin/script-upload-records-to-db --config

# Probar con modo dry-run
./bin/script-upload-records-to-db run --dry-run

# Diagnosticar problemas de API
npm run diagnose:api
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
# Ver logs en tiempo real (siempre con máximo detalle)
tail -f logs/app.log

# Ver solo errores
tail -f logs/app.error.log

# Ver métricas de rendimiento
tail -f logs/app.performance.log
```

### Verificación de Funcionalidad

```bash
# Probar ejecutable
./bin/script-upload-records-to-db run --dry-run

# Verificar conectividad con API
npm run test:api

# Probar sistema de logging
npm run logs:test
```

## 📁 Estructura del Proyecto

```
script-upload-records-to-db/
├── src/
│   ├── config/
│   │   └── config.ts          # Configuración general
│   ├── services/
│   │   ├── __tests__/
│   │   │   ├── ExcelProcessor.test.ts
│   │   │   ├── ApiService.test.ts
│   │   │   ├── DataTransformer.test.ts
│   │   │   ├── ExcelValidator.test.ts
│   │   │   └── FileProcessor.test.ts
│   │   ├── ApiService.ts      # Servicio para API REST
│   │   ├── ExcelProcessor.ts  # Lógica principal de procesamiento
│   │   ├── ExcelValidator.ts  # Validación de datos
│   │   ├── DataTransformer.ts # Transformación de datos
│   │   └── FileProcessor.ts   # Manejo de archivos
│   ├── cli/
│   │   ├── __tests__/
│   │   │   ├── argumentParser.test.ts
│   │   │   ├── commandHandler.test.ts
│   │   │   └── environmentManager.test.ts
│   │   ├── argumentParser.ts  # Parser de argumentos CLI
│   │   ├── commandHandler.ts  # Manejador de comandos
│   │   └── environmentManager.ts # Gestor de variables de entorno
│   ├── utils/
│   │   ├── __tests__/
│   │   │   ├── console-cleaner.test.ts
│   │   │   ├── logger-exit.test.ts
│   │   │   └── logger-working.test.ts
│   │   └── logger.ts          # Configuración de Winston
│   ├── types/
│   │   ├── excel.ts           # Tipos para datos de Excel
│   │   └── index.ts           # Tipos generales
│   ├── test/
│   │   └── setup.ts           # Configuración de pruebas
│   └── index.ts               # Punto de entrada principal
├── scripts/
│   ├── dev-tools/
│   │   ├── create-release.sh  # Script para crear releases
│   │   └── release-config.json
│   ├── tools/
│   │   ├── api-configurator.js # Configurador interactivo de API
│   │   ├── api-diagnostic.js   # Diagnóstico de problemas de API
│   │   ├── api-tester.js       # Probador de API
│   │   ├── excel-generator.js  # Generador de archivos Excel de prueba
│   │   └── log-analyzer.ts     # Analizador de logs
│   └── examples/
│       └── usage-example.js    # Ejemplo de uso
├── bin/                       # Ejecutables generados
├── logs/                      # Archivos de log
├── excel-files/               # Archivos Excel a procesar
├── processed-files/           # Archivos procesados
├── error-files/               # Archivos con errores
├── install.sh                 # Script de instalación
├── uninstall.sh               # Script de desinstalación
├── docker-compose.yml         # Configuración de Docker para MySQL
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## 📦 Información del Ejecutable

### ¿Qué es el ejecutable?

El ejecutable es una versión compilada del proyecto que incluye todas las dependencias necesarias. No requiere Node.js instalado en el servidor donde se ejecute.

### Características del Ejecutable

- **Portabilidad**: Funciona en cualquier sistema Linux x64
- **Autocontenido**: Incluye todas las dependencias
- **Configuración flexible**: Usa variables de entorno o archivo .env
- **Logging completo**: Mantiene todos los logs del proyecto original

### Archivos Generados

- `bin/script-upload-records-to-db`: Ejecutable principal
- `install.sh`: Script de instalación
- `uninstall.sh`: Script de desinstalación

### Comandos del Ejecutable

```bash
# Construir
npm run build:all

# Ejecutar (requiere 'run' o 'run --dry-run')
./bin/script-upload-records-to-db run

# Instalar
./install.sh

# Desinstalar
./uninstall.sh
```

## 🔄 Flujo de Procesamiento

1. **Configuración (opcional)**: Puedes cambiar variables vía CLI; no ejecuta hasta usar `run` o `run --dry-run`
2. **Detección**: Busca el archivo Excel más reciente
3. **Lectura**: Lee y parsea el archivo Excel
4. **Validación**: Valida la estructura de datos
5. **Transformación**: Convierte datos al formato esperado por la API
6. **Envío**: Envía registros a la API REST por lotes
7. **Movimiento**: Mueve archivo a directorio procesado
8. **Logging**: Registra todo el proceso

## 📈 Rendimiento

### Optimizaciones

- **Validación eficiente**: Solo valida campos requeridos
- **Logging asíncrono**: No bloquea el procesamiento
- **Manejo de memoria**: Libera recursos después de cada archivo
- **Reintentos inteligentes**: Manejo de errores de red

### Recomendaciones

- Usa `API_TIMEOUT` para controlar timeouts de red
- Monitorea los logs para detectar problemas de rendimiento

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa los logs en `logs/app.log`
2. Verifica la configuración en `.env`
3. Asegúrate de que la API REST esté accesible
4. Verifica que los archivos Excel tengan la estructura correcta
5. Usa el modo dry-run para validar sin enviar datos
6. Usa los scripts de diagnóstico: `npm run diagnose:api`

## 📚 Referencias Técnicas

### Dependencias Principales

| Dependencia         | Versión | Propósito                       |
| ------------------- | ------- | ------------------------------- |
| `axios`             | ^1.6.7  | Cliente HTTP para API REST      |
| `xlsx`              | ^0.18.5 | Procesamiento de archivos Excel |
| `winston`           | ^3.13.0 | Sistema de logging              |
| `dotenv`            | ^16.4.5 | Variables de entorno            |
| `class-transformer` | ^0.5.1  | Transformación de datos         |
| `class-validator`   | ^0.14.1 | Validación de datos             |
| `mysql2`            | ^3.9.2  | Driver de MySQL                 |
| `typeorm`           | ^0.3.20 | ORM para base de datos          |
| `reflect-metadata`  | ^0.2.1  | Metadatos para decoradores      |

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

### Configuración de Docker (MySQL)

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: excel_data_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: excel_data
      MYSQL_USER: excel_user
      MYSQL_PASSWORD: excel_password
    ports:
      - '3306:3306'
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - excel_network
    command: --default-authentication-plugin=mysql_native_password
```

### Scripts de Base de Datos

```bash
npm run db:start      # Iniciar MySQL con Docker
npm run db:stop       # Detener MySQL
npm run db:reset      # Reiniciar MySQL y limpiar datos
npm run db:restart    # Reiniciar MySQL
npm run db:logs       # Ver logs de MySQL
npm run db:clean      # Limpiar volumen de datos
npm run db:status     # Ver estado de MySQL
```

---

**Última actualización**: Octubre 2025  
**Versión**: 1.2.3
