# 📦 Guía de Instalación del Ejecutable

Este documento explica cómo convertir tu proyecto Node.js en un ejecutable para Linux y cómo instalarlo.

## 🚀 Requisitos Previos

- Node.js 18+ instalado
- npm o yarn
- Docker (para la base de datos MySQL)
- Permisos de administrador (para instalación global)

## 📋 Pasos para Crear el Ejecutable

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Construir el Ejecutable

```bash
npm run build:all
```

Este comando:

- Compila el código TypeScript
- Crea el ejecutable usando pkg
- Asigna permisos de ejecución

### 3. Verificar el Ejecutable

El ejecutable se creará en `bin/script-upload-records-to-db-linux`

```bash
ls -la bin/
```

## 🔧 Opciones de Instalación

### Opción 1: Instalación Básica

```bash
chmod +x install.sh
./install.sh
```

### Opción 2: Instalación con Configuración

```bash
./install.sh -c
```

Esto creará un archivo `.env` en el directorio de instalación.

### Opción 3: Instalación como Servicio

```bash
./install.sh -s
```

Esto instalará el ejecutable como un servicio systemd que se ejecuta automáticamente.

### Opción 4: Instalación Personalizada

```bash
./install.sh -d ~/bin -c -s
```

Instala en un directorio personalizado con configuración y como servicio.

## ⚙️ Configuración de Variables de Entorno

### Método 1: Archivo .env

Crea un archivo `.env` en el directorio donde ejecutes el programa:

```bash
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
LOG_ENABLE_CONSOLE=true
LOG_ENABLE_PERFORMANCE=true
LOG_MAX_SIZE=5242880
LOG_MAX_FILES=5
LOG_RETENTION_DAYS=30

# Configuración del Procesamiento
BATCH_SIZE=100
PROCESSING_INTERVAL=30000
```

### Método 2: Variables de Entorno del Sistema

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USERNAME=root
export DB_PASSWORD=tu_password
export DB_DATABASE=excel_data
# ... otras variables

excel-processor
```

### Método 3: Variables de Entorno en Línea

```bash
DB_HOST=localhost DB_PASSWORD=tu_password excel-processor
```

## 🏃‍♂️ Uso del Ejecutable

### Ejecución Directa

```bash
# Desde el directorio del proyecto
./bin/script-upload-records-to-db-linux

# Si está instalado globalmente
excel-processor
```

### Ejecución con Configuración Personalizada

```bash
# Cambiar al directorio donde está el .env
cd /ruta/a/tu/configuracion
excel-processor

# O especificar el archivo .env
ENV_FILE=/ruta/al/archivo/.env excel-processor
```

## 🐳 Configuración con Docker

### 1. Iniciar la Base de Datos

```bash
npm run db:start
```

### 2. Ejecutar el Procesador

```bash
excel-processor
```

### 3. Verificar Logs

```bash
npm run db:logs
```

## 🔍 Monitoreo y Logs

### Logs del Ejecutable

Los logs se guardan en el directorio especificado en `LOG_FILE`:

```bash
tail -f logs/app.log
```

### Logs del Servicio (si instalado como servicio)

```bash
# Ver logs en tiempo real
sudo journalctl -u excel-processor -f

# Ver logs de hoy
sudo journalctl -u excel-processor --since today

# Ver estado del servicio
sudo systemctl status excel-processor
```

## 🛠️ Comandos de Mantenimiento

### Reiniciar el Servicio

```bash
sudo systemctl restart excel-processor
```

### Detener el Servicio

```bash
sudo systemctl stop excel-processor
```

### Habilitar/Deshabilitar Inicio Automático

```bash
sudo systemctl enable excel-processor   # Habilitar
sudo systemctl disable excel-processor  # Deshabilitar
```

### Verificar Estado

```bash
sudo systemctl status excel-processor
```

## 🔧 Solución de Problemas

### Error: "No se encontró el ejecutable"

```bash
# Reconstruir el ejecutable
npm run build:all
```

### Error: "Variable de entorno requerida"

```bash
# Verificar que el archivo .env existe
ls -la .env

# Crear archivo .env desde el ejemplo
cp env.example .env
# Editar las variables según tu configuración
nano .env
```

### Error: "Base de datos no disponible"

```bash
# Verificar que MySQL está ejecutándose
npm run db:status

# Iniciar MySQL si no está ejecutándose
npm run db:start
```

### Error: "Permisos denegados"

```bash
# Dar permisos de ejecución
chmod +x bin/script-upload-records-to-db-linux

# O reinstalar con el script
./install.sh
```

## 📁 Estructura de Directorios

Después de la instalación, tendrás:

```
/usr/local/bin/
├── excel-processor          # Ejecutable principal
└── .env                     # Configuración (si se creó)

/etc/systemd/system/
└── excel-processor.service  # Servicio systemd (si se instaló)
```

## 🔄 Actualizaciones

Para actualizar el ejecutable:

1. Reconstruir:

   ```bash
   npm run build:all
   ```

2. Reinstalar:

   ```bash
   ./install.sh
   ```

3. Reiniciar el servicio (si está instalado):
   ```bash
   sudo systemctl restart excel-processor
   ```

## 🗑️ Desinstalación

Para desinstalar completamente el ejecutable:

### Desinstalación Básica

```bash
sudo ./uninstall.sh
```

### Opciones de Desinstalación

```bash
# Desinstalación forzada sin confirmación
sudo ./uninstall.sh -f

# Desinstalar desde directorio personalizado
sudo ./uninstall.sh -d ~/bin

# Solo eliminar configuración
sudo ./uninstall.sh -c

# Solo eliminar servicio systemd
sudo ./uninstall.sh -s

# Ver ayuda
./uninstall.sh -h
```

### Verificación Post-Desinstalación

```bash
# Verificar que el ejecutable ya no existe
which excel-processor

# Verificar que el servicio ya no existe
sudo systemctl status excel-processor

# Verificar que los archivos se eliminaron
ls -la /usr/local/bin/excel-processor
ls -la /etc/systemd/system/excel-processor.service
```

## 📞 Soporte

Si encuentras problemas:

1. Verifica los logs: `tail -f logs/app.log`
2. Verifica la configuración: `cat .env`
3. Verifica el estado del servicio: `sudo systemctl status excel-processor`
4. Revisa la documentación del proyecto principal

## 🎯 Ventajas del Ejecutable

- ✅ **Portabilidad**: No requiere Node.js instalado en el servidor
- ✅ **Simplicidad**: Un solo archivo ejecutable
- ✅ **Seguridad**: No expone el código fuente
- ✅ **Rendimiento**: Inicio más rápido
- ✅ **Distribución**: Fácil de distribuir e instalar
