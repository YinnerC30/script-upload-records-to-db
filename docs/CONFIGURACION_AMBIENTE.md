# Configuración del Archivo .env

## Descripción

El script `excel-processor` ahora permite modificar la configuración del archivo `.env` directamente desde la línea de comandos usando banderas. Esto facilita la configuración del entorno sin necesidad de editar manualmente el archivo.

## Opciones Disponibles

### Opciones Generales

| Opción          | Descripción                                      |
| --------------- | ------------------------------------------------ |
| `-h, --help`    | Mostrar ayuda completa                           |
| `-v, --version` | Mostrar versión del programa                     |
| `-c, --config`  | Mostrar configuración actual                     |
| `-d, --dry-run` | Ejecutar sin procesar archivos (solo validación) |

### Configuración de Base de Datos

| Opción          | Descripción                    | Ejemplo                     |
| --------------- | ------------------------------ | --------------------------- |
| `--db-host`     | Host de la base de datos       | `--db-host 192.168.1.100`   |
| `--db-port`     | Puerto de la base de datos     | `--db-port 3307`            |
| `--db-username` | Usuario de la base de datos    | `--db-username myuser`      |
| `--db-password` | Contraseña de la base de datos | `--db-password mypassword`  |
| `--db-database` | Nombre de la base de datos     | `--db-database my_database` |

### Configuración de Directorios

| Opción            | Descripción                        | Ejemplo                                |
| ----------------- | ---------------------------------- | -------------------------------------- |
| `--excel-dir`     | Directorio de archivos Excel       | `--excel-dir ./my-excel-files`         |
| `--processed-dir` | Directorio de archivos procesados  | `--processed-dir ./my-processed-files` |
| `--error-dir`     | Directorio de archivos con errores | `--error-dir ./my-error-files`         |

### Configuración de Procesamiento

| Opción         | Descripción                              | Ejemplo             |
| -------------- | ---------------------------------------- | ------------------- |
| `--batch-size` | Tamaño de lote para procesamiento        | `--batch-size 200`  |
| `--log-level`  | Nivel de logs (debug, info, warn, error) | `--log-level debug` |

### Configuración de Logs

| Opción              | Descripción                                | Ejemplo                        |
| ------------------- | ------------------------------------------ | ------------------------------ |
| `--log-file`        | Archivo de logs                            | `--log-file ./my-logs/app.log` |
| `--log-console`     | Habilitar/deshabilitar logs en consola     | `--log-console false`          |
| `--log-performance` | Habilitar/deshabilitar logs de rendimiento | `--log-performance true`       |

## Ejemplos de Uso

### Configuración Básica de Base de Datos

```bash
# Cambiar host y puerto de la base de datos
excel-processor --db-host 192.168.1.100 --db-port 3307

# Configurar credenciales completas
excel-processor --db-host localhost --db-username admin --db-password secret123 --db-database my_data
```

### Configuración de Directorios

```bash
# Cambiar directorio de archivos Excel
excel-processor --excel-dir /path/to/excel/files

# Configurar todos los directorios
excel-processor --excel-dir ./input --processed-dir ./output --error-dir ./errors
```

### Configuración de Procesamiento

```bash
# Cambiar tamaño de lote y nivel de logs
excel-processor --batch-size 500 --log-level debug

# Solo cambiar nivel de logs
excel-processor --log-level info
```

### Configuración de Logs

```bash
# Configurar archivo de logs personalizado
excel-processor --log-file ./custom-logs/processor.log

# Deshabilitar logs en consola
excel-processor --log-console false

# Habilitar logs de rendimiento
excel-processor --log-performance true
```

### Combinación de Opciones

```bash
# Configuración completa en un solo comando
excel-processor \
  --db-host 192.168.1.100 \
  --db-port 3307 \
  --db-username admin \
  --db-password secret123 \
  --db-database production_data \
  --excel-dir ./production/excel \
  --processed-dir ./production/processed \
  --error-dir ./production/errors \
  --batch-size 1000 \
  --log-level info \
  --log-file ./production/logs/app.log
```

## Comportamiento

### Modo de Configuración

Cuando se usan opciones de configuración:

1. **Solo configuración**: Si solo se especifican opciones de configuración, el programa:

   - Actualiza el archivo `.env`
   - Muestra un mensaje de confirmación
   - Termina sin procesar archivos
   - Sugiere ejecutar el comando nuevamente sin opciones

2. **Configuración + procesamiento**: Si se combinan opciones de configuración con `--dry-run`:
   - Actualiza el archivo `.env`
   - Ejecuta el procesamiento en modo dry-run

### Validaciones

El programa incluye validaciones para:

- **Números**: `--db-port` y `--batch-size` deben ser números válidos
- **Niveles de log**: `--log-level` debe ser `debug`, `info`, `warn` o `error`
- **Booleanos**: `--log-console` y `--log-performance` deben ser `true` o `false`
- **Valores requeridos**: Todas las opciones requieren un valor

### Manejo de Errores

Si se detecta un error de validación:

1. Se muestra un mensaje de error descriptivo
2. El programa termina con código de salida 1
3. No se modifica el archivo `.env`

## Archivo .env

### Estructura

El archivo `.env` se crea automáticamente si no existe, basándose en `env.example` o usando valores por defecto:

```env
# Configuración de Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=excel_data

# Configuración de Retry y Pool de Conexiones
DB_RETRY_MAX_ATTEMPTS=5
DB_RETRY_INITIAL_DELAY=1000
DB_RETRY_MAX_DELAY=30000
DB_RETRY_BACKOFF_MULTIPLIER=2
DB_CONNECTION_LIMIT=10
DB_ACQUIRE_TIMEOUT=60000
DB_TIMEOUT=60000
DB_MAX_RECONNECT_ATTEMPTS=5
DB_RECONNECT_DELAY=1000
DB_CONNECT_TIMEOUT_MS=30000

# Configuración del Directorio de Archivos
EXCEL_DIRECTORY=./excel-files
PROCESSED_DIRECTORY=./processed-files
ERROR_DIRECTORY=./error-files

# Configuración de Logs Mejorada
LOG_LEVEL=info
LOG_FILE=./logs/app.log
LOG_ENABLE_CONSOLE=true
LOG_ENABLE_PERFORMANCE=true
LOG_MAX_SIZE=5242880
LOG_MAX_FILES=5
LOG_RETENTION_DAYS=30

# Configuración del Procesamiento
BATCH_SIZE=100
```

### Preservación de Comentarios

El programa preserva:

- Comentarios existentes (líneas que empiezan con `#`)
- Líneas vacías
- Variables no modificadas
- Orden de las variables

## Pruebas

### Script de Prueba

Se incluye un script de prueba que verifica todas las funcionalidades:

```bash
npm run test:env-config
```

Este script:

1. Crea una copia de respaldo del `.env` actual
2. Prueba todas las opciones de configuración
3. Verifica las validaciones de errores
4. Restaura la configuración original

### Pruebas Manuales

Para probar manualmente:

```bash
# Construir el ejecutable
npm run build:all

# Probar configuración
./bin/script-upload-records-to-db --help
./bin/script-upload-records-to-db --config
./bin/script-upload-records-to-db --db-host 192.168.1.100
```

## Consideraciones de Seguridad

### Contraseñas

- Las contraseñas se muestran como `***` en los mensajes de confirmación
- Se recomienda usar variables de entorno para contraseñas en producción
- El archivo `.env` debe tener permisos restrictivos

### Validación de Entrada

- Todas las entradas se validan antes de escribir al archivo
- Se previenen inyecciones de código malicioso
- Los valores numéricos se verifican como números válidos

## Migración

### Desde Versiones Anteriores

Si ya tienes un archivo `.env` configurado:

1. El programa preservará todas las variables existentes
2. Solo se actualizarán las variables especificadas
3. Se mantendrán los comentarios y el formato

### Backup Automático

Se recomienda hacer backup antes de cambios importantes:

```bash
cp .env .env.backup
```

## Soporte

Para obtener ayuda:

```bash
excel-processor --help
```

Para ver la configuración actual:

```bash
excel-processor --config
```
