# Script de Procesamiento de Archivos Excel

Este proyecto es una aplicación Node.js que procesa automáticamente archivos Excel, extrae los datos y los inserta en una base de datos MySQL usando TypeORM.

## 🚀 Características

- **Procesamiento automático**: Detecta y procesa el archivo Excel más reciente en un directorio

- **Validación de datos**: Valida la estructura y contenido de los archivos Excel
- **Procesamiento por lotes**: Inserta registros en la base de datos en lotes para mejor rendimiento
- **Logging completo**: Sistema de logs detallado con Winston
- **Manejo de errores**: Archivos con errores se mueven a un directorio separado
- **Configuración flexible**: Variables de entorno para personalizar el comportamiento

## 📋 Requisitos

- Node.js 18+
- MySQL 8.0+
- TypeScript

## 🛠️ Instalación

1. **Clonar o navegar al directorio del proyecto:**

```bash
cd script-upload-records-to-db
```

2. **Instalar dependencias:**

```bash
npm install
```

3. **Configurar variables de entorno:**

```bash
cp env.example .env
```

4. **Editar el archivo `.env` con tus configuraciones:**

```env
# Configuración de Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=tu_password
DB_DATABASE=excel_data

# Configuración del Directorio de Archivos
EXCEL_DIRECTORY=./excel-files
PROCESSED_DIRECTORY=./processed-files
ERROR_DIRECTORY=./error-files

# Configuración de Logs
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Configuración del Procesamiento
BATCH_SIZE=100
PROCESSING_INTERVAL=30000
```

## 🏃‍♂️ Uso

### 🚀 Opción 1: Ejecutable (Recomendado)

El proyecto incluye un ejecutable que no requiere Node.js instalado en el servidor:

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

**Ventajas del ejecutable:**

- ✅ No requiere Node.js en el servidor
- ✅ Un solo archivo ejecutable
- ✅ Más rápido y portable
- ✅ Fácil de distribuir

### 🔧 Configuración del Archivo .env

El script permite modificar la configuración del archivo `.env` directamente desde la línea de comandos:

```bash
# Mostrar ayuda de configuración
./bin/script-upload-records-to-db --help

# Ver configuración actual
./bin/script-upload-records-to-db --config

# Cambiar configuración de base de datos
./bin/script-upload-records-to-db --db-host 192.168.1.100 --db-port 3307

# Cambiar directorios
./bin/script-upload-records-to-db --excel-dir ./my-excel-files --processed-dir ./my-processed-files

# Cambiar configuración de procesamiento
./bin/script-upload-records-to-db --batch-size 200 --log-level debug

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

**Opciones disponibles:**

- `--db-host`, `--db-port`, `--db-username`, `--db-password`, `--db-database`
- `--excel-dir`, `--processed-dir`, `--error-dir`
- `--batch-size`, `--log-level`
- `--log-file`, `--log-console`, `--log-performance`

📖 Ver [documentación completa de configuración](docs/CONFIGURACION_AMBIENTE.md)

### Ejecución

Para procesar archivos Excel:

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

### Scripts Disponibles

```bash
npm run build          # Compilar TypeScript
npm run build:all      # Compilar y crear ejecutable
npm run dev            # Ejecutar en modo desarrollo
npm run start          # Ejecutar en modo producción
npm run test           # Ejecutar pruebas
npm run test:watch     # Ejecutar pruebas en modo watch
npm run test:env-config # Probar configuración del archivo .env
```

## 📁 Estructura del Proyecto

```
script-upload-records-to-db/
├── src/
│   ├── config/
│   │   └── database.ts          # Configuración de TypeORM
│   ├── entities/
│   │   └── Licitacion.ts        # Entidad para licitaciones
│   ├── services/
│   │   └── ExcelProcessor.ts    # Lógica principal de procesamiento
│   ├── utils/
│   │   └── logger.ts            # Configuración de Winston
│   └── index.ts                 # Punto de entrada principal
├── package.json
├── tsconfig.json
├── env.example
└── README.md
```

## 📊 Estructura de Datos Esperada

El script espera archivos Excel con las siguientes columnas. **Importante**: El sistema incluye un mapeo automático de encabezados que permite compatibilidad con diferentes formatos de nombres de columnas.

### Campos Esperados por el Sistema

| Campo del Sistema | Tipo   | Descripción               | Requerido |
| ----------------- | ------ | ------------------------- | --------- |
| idLicitacion      | string | ID único de la licitación | ✅        |
| nombre            | string | Nombre de la licitación   | ❌        |
| fechaPublicacion  | date   | Fecha de publicación      | ❌        |
| fechaCierre       | date   | Fecha de cierre           | ❌        |
| organismo         | string | Organismo que publica     | ❌        |
| unidad            | string | Unidad del organismo      | ❌        |
| montoDisponible   | number | Monto disponible          | ❌        |
| moneda            | string | Moneda (CLP, USD, etc.)   | ❌        |
| estado            | string | Estado de la licitación   | ❌        |

### Mapeo Automático de Encabezados

El sistema mapea automáticamente los siguientes encabezados del Excel a los campos del sistema:

| Encabezado del Excel   | Campo del Sistema  |
| ---------------------- | ------------------ |
| `ID`                   | `idLicitacion`     |
| `Nombre`               | `nombre`           |
| `Fecha de Publicación` | `fechaPublicacion` |
| `Fecha de cierre`      | `fechaCierre`      |
| `Organismo`            | `organismo`        |
| `Unidad`               | `unidad`           |
| `Monto Disponible`     | `montoDisponible`  |
| `Moneda`               | `moneda`           |
| `Estado`               | `estado`           |

**Características del mapeo:**

- ✅ **Insensible a mayúsculas/minúsculas**
- ✅ **Maneja acentos y caracteres especiales**
- ✅ **Normaliza espacios múltiples**
- ✅ **Soporta variaciones de nombres**
- ✅ **Logs detallados de mapeo**

### Ejemplo de Compatibilidad

Tu archivo Excel puede tener encabezados como:

```
ID | Nombre | Fecha de Publicación | Fecha de cierre | Organismo | Unidad | Monto Disponible | Moneda | Estado
```

Y el sistema los mapeará automáticamente a:

```
idLicitacion | nombre | fechaPublicacion | fechaCierre | organismo | unidad | montoDisponible | moneda | estado
```

## 🔧 Configuración

### Variables de Entorno

| Variable              | Descripción                          | Valor por Defecto   |
| --------------------- | ------------------------------------ | ------------------- |
| `DB_HOST`             | Host de la base de datos             | `localhost`         |
| `DB_PORT`             | Puerto de la base de datos           | `3306`              |
| `DB_USERNAME`         | Usuario de la base de datos          | `root`              |
| `DB_PASSWORD`         | Contraseña de la base de datos       | `password`          |
| `DB_DATABASE`         | Nombre de la base de datos           | `excel_data`        |
| `EXCEL_DIRECTORY`     | Directorio a monitorear              | `./excel-files`     |
| `PROCESSED_DIRECTORY` | Directorio para archivos procesados  | `./processed-files` |
| `ERROR_DIRECTORY`     | Directorio para archivos con errores | `./error-files`     |
| `LOG_LEVEL`           | Nivel de logging                     | `info`              |
| `LOG_FILE`            | Archivo de logs                      | `./logs/app.log`    |
| `BATCH_SIZE`          | Tamaño del lote para inserción       | `100`               |
| `PROCESSING_INTERVAL` | Intervalo de procesamiento (ms)      | `30000`             |

### Directorios

El script crea automáticamente los siguientes directorios:

- `excel-files/`: Archivos Excel a procesar
- `processed-files/`: Archivos procesados exitosamente
- `error-files/`: Archivos que generaron errores
- `logs/`: Archivos de logs

## 📝 Logs Mejorados

El sistema genera logs estructurados y detallados con las siguientes características:

### Archivos de Log

- `logs/app.log`: Logs generales con toda la información
- `logs/app.error.log`: Solo errores para monitoreo rápido
- `logs/app.performance.log`: Métricas de rendimiento detalladas
- `logs/report.md`: Reporte automático de análisis
- `logs/report.json`: Datos estructurados para análisis

### Características del Logging

- **Categorías**: Cada componente tiene su propia categoría
- **Sesiones Únicas**: Rastreo de procesos individuales
- **Métricas de Rendimiento**: Tiempos de operación automáticos
- **Formato Estructurado**: JSON para análisis automatizado
- **Rotación Automática**: Gestión de archivos de log

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

### Ejemplo de Log Mejorado

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

📖 **Documentación completa**: [docs/LOGGING_IMPROVEMENTS.md](docs/LOGGING_IMPROVEMENTS.md)

## 🧪 Pruebas

```bash
# Ejecutar todas las pruebas
npm test



# Ejecutar pruebas específicas del mapeo de encabezados
npm test -- --run src/services/__tests__/HeaderMapping.test.ts
```

### Probar el Mapeo de Encabezados

Para verificar que el mapeo de encabezados funciona correctamente:

```bash
# Ejecutar script de demostración
node scripts/test-header-mapping.js
```

Este script muestra:

- 📋 Encabezados detectados en el archivo
- ✅ Mapeo exitoso de cada encabezado
- ⚠️ Encabezados no mapeados (si los hay)
- 📊 Datos transformados

## 🔍 Monitoreo

### Logs de Monitoreo

Los logs incluyen información sobre:

- Archivos detectados
- Progreso de procesamiento
- Errores y advertencias
- Estadísticas de inserción

## 🚨 Manejo de Errores

### Tipos de Errores

1. **Archivo no encontrado**: No hay archivos Excel en el directorio
2. **Archivo corrupto**: El archivo Excel no se puede leer
3. **Datos inválidos**: Los datos no cumplen con la estructura esperada
4. **Error de base de datos**: Problemas de conexión o inserción
5. **Error de permisos**: Problemas de acceso a archivos
6. **Encabezados no mapeados**: Columnas del Excel que no coinciden con el mapeo

### Problemas Comunes con Encabezados

#### Encabezados No Mapeados

Si ves en los logs mensajes como:

```
⚠️ Encabezado no mapeado: "Campo Desconocido"
```

**Solución:**

1. Verifica que los encabezados de tu Excel coincidan con los esperados
2. Revisa el mapeo en `src/services/ExcelProcessor.ts`
3. Agrega nuevos mapeos si es necesario

#### Datos No Se Procesan

Si los datos no se insertan en la base de datos:

**Verificar:**

1. Que al menos el campo `idLicitacion` esté presente
2. Que los encabezados se mapeen correctamente
3. Revisar los logs para ver el mapeo realizado

### Recuperación

- Los archivos con errores se mueven a `error-files/`
- Los logs detallan el error específico
- El servicio continúa funcionando después de un error

## 🔄 Flujo de Procesamiento

1. **Detección**: Busca el archivo Excel más reciente
2. **Lectura**: Lee y parsea el archivo Excel
3. **Validación**: Valida la estructura de datos
4. **Inserción**: Inserta registros en la base de datos por lotes
5. **Movimiento**: Mueve archivo a directorio procesado
6. **Logging**: Registra todo el proceso

## 📈 Rendimiento

### Optimizaciones

- **Procesamiento por lotes**: Configurable con `BATCH_SIZE`
- **Validación eficiente**: Solo valida campos requeridos
- **Logging asíncrono**: No bloquea el procesamiento
- **Manejo de memoria**: Libera recursos después de cada archivo

### Recomendaciones

- Ajusta `BATCH_SIZE` según la memoria disponible
- Usa `PROCESSING_INTERVAL` para controlar la frecuencia
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
3. Asegúrate de que la base de datos esté accesible
4. Verifica que los archivos Excel tengan la estructura correcta

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
- `demo-executable.sh`: Script de demostración
- `README-EXECUTABLE.md`: Documentación completa del ejecutable

### Comandos del Ejecutable

```bash
# Construir
npm run build:all

# Ejecutar
./bin/script-upload-records-to-db

# Instalar
./install.sh

# Demostración
./demo-executable.sh
```

Para más información sobre el ejecutable, consulta `README-EXECUTABLE.md`.
