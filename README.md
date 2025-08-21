# Script de Procesamiento de Archivos Excel

Este proyecto es una aplicación Node.js que procesa automáticamente archivos Excel, extrae los datos y los inserta en una base de datos MySQL usando TypeORM.

## 🚀 Características

- **Procesamiento automático**: Detecta y procesa el archivo Excel más reciente en un directorio
- **Monitoreo continuo**: Opción de ejecutar como servicio que monitorea continuamente el directorio
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

### Modo Ejecución Única

Para procesar archivos una sola vez:

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

### Modo Monitoreo Continuo

Para ejecutar como servicio que monitorea continuamente el directorio:

```bash
# Desarrollo
npx ts-node src/index-watcher.ts

# Producción
npm run build
node dist/index-watcher.js
```

### Scripts Disponibles

```bash
npm run build          # Compilar TypeScript
npm run dev            # Ejecutar en modo desarrollo
npm run start          # Ejecutar en modo producción
npm run watch          # Ejecutar con nodemon (desarrollo)
npm run test           # Ejecutar pruebas
npm run test:watch     # Ejecutar pruebas en modo watch
```

## 📁 Estructura del Proyecto

```
script-upload-records-to-db/
├── src/
│   ├── config/
│   │   └── database.ts          # Configuración de TypeORM
│   ├── entities/
│   │   ├── Licitacion.ts        # Entidad para licitaciones
│   │   └── ExcelData.ts         # Entidad para respaldo de datos
│   ├── services/
│   │   ├── ExcelProcessor.ts    # Lógica principal de procesamiento
│   │   └── WatcherService.ts    # Servicio de monitoreo continuo
│   ├── utils/
│   │   └── logger.ts            # Configuración de Winston
│   ├── index.ts                 # Punto de entrada (ejecución única)
│   └── index-watcher.ts         # Punto de entrada (monitoreo continuo)
├── package.json
├── tsconfig.json
├── env.example
└── README.md
```

## 📊 Estructura de Datos Esperada

El script espera archivos Excel con las siguientes columnas:

| Columna          | Tipo   | Descripción               | Requerido |
| ---------------- | ------ | ------------------------- | --------- |
| idLicitacion     | string | ID único de la licitación | ✅        |
| nombre           | string | Nombre de la licitación   | ❌        |
| fechaPublicacion | date   | Fecha de publicación      | ❌        |
| fechaCierre      | date   | Fecha de cierre           | ❌        |
| organismo        | string | Organismo que publica     | ❌        |
| unidad           | string | Unidad del organismo      | ❌        |
| montoDisponible  | number | Monto disponible          | ❌        |
| moneda           | string | Moneda (CLP, USD, etc.)   | ❌        |
| estado           | string | Estado de la licitación   | ❌        |

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

## 📝 Logs

El sistema genera logs detallados en:

- `logs/app.log`: Logs generales
- `logs/app.error.log`: Solo errores
- Consola: En modo desarrollo

### Niveles de Log

- `error`: Errores críticos
- `warn`: Advertencias
- `info`: Información general
- `debug`: Información detallada

## 🧪 Pruebas

```bash
# Ejecutar pruebas
npm test

# Ejecutar pruebas en modo watch
npm run test:watch
```

## 🔍 Monitoreo

### Verificar Estado del Servicio

Si ejecutas en modo watcher, puedes verificar el estado:

```typescript
// En el código
const watcher = new WatcherService();
const stats = watcher.getStats();
console.log(stats);
```

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

### Recuperación

- Los archivos con errores se mueven a `error-files/`
- Los logs detallan el error específico
- El servicio continúa funcionando después de un error

## 🔄 Flujo de Procesamiento

1. **Detección**: Busca el archivo Excel más reciente
2. **Lectura**: Lee y parsea el archivo Excel
3. **Validación**: Valida la estructura de datos
4. **Inserción**: Inserta registros en la base de datos por lotes
5. **Respaldo**: Guarda datos originales en tabla `excel_data`
6. **Movimiento**: Mueve archivo a directorio procesado
7. **Logging**: Registra todo el proceso

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
