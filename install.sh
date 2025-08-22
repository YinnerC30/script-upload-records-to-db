#!/bin/bash

# Script de instalación para el ejecutable de procesamiento de Excel
# Autor: Script de instalación automática
# Versión: 2.0.0 - Simplificado

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [OPCIONES]"
    echo ""
    echo "Opciones:"
    echo "  -h, --help          Mostrar esta ayuda"
    echo "  -d, --directory     Directorio de instalación (default: /usr/local/bin)"
    echo ""
    echo "Ejemplos:"
    echo "  $0                    # Instalación estándar en /usr/local/bin"
    echo "  $0 -d ~/bin          # Instalar en directorio personal"
    echo ""
    echo "El script instalará:"
    echo "  ✅ Ejecutable excel-processor"
    echo "  ✅ Archivo de configuración .env"
    echo "  ✅ Permisos de ejecución"
}

# Variables por defecto
INSTALL_DIR="/usr/local/bin"
EXECUTABLE_NAME="excel-processor"

# Procesar argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--directory)
            INSTALL_DIR="$2"
            shift 2
            ;;
        *)
            print_error "Opción desconocida: $1"
            show_help
            exit 1
            ;;
    esac
done

print_info "🚀 Iniciando instalación del procesador de Excel..."

# Verificar si el ejecutable existe
if [ ! -f "bin/script-upload-records-to-db" ]; then
    print_error "No se encontró el ejecutable. Ejecuta 'npm run build:all' primero."
    exit 1
fi

# Crear directorio de instalación si no existe
if [ ! -d "$INSTALL_DIR" ]; then
    print_info "Creando directorio de instalación: $INSTALL_DIR"
    sudo mkdir -p "$INSTALL_DIR"
fi

# Copiar ejecutable
print_info "Copiando ejecutable a $INSTALL_DIR..."
sudo cp "bin/script-upload-records-to-db" "$INSTALL_DIR/$EXECUTABLE_NAME"
sudo chmod +x "$INSTALL_DIR/$EXECUTABLE_NAME"

print_success "Ejecutable instalado en $INSTALL_DIR/$EXECUTABLE_NAME"

# Crear archivo de configuración (siempre necesario)
print_info "Creando archivo de configuración..."
CONFIG_FILE="$INSTALL_DIR/.env"

# Usar sudo si el directorio requiere permisos de administrador
if [ "$INSTALL_DIR" = "/usr/local/bin" ] || [ "$INSTALL_DIR" = "/usr/bin" ]; then
    sudo tee "$CONFIG_FILE" > /dev/null << EOF
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
PROCESSING_INTERVAL=30000
EOF
else
    cat > "$CONFIG_FILE" << EOF
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
PROCESSING_INTERVAL=30000
EOF
fi

print_success "Archivo de configuración creado en $CONFIG_FILE"

# Mostrar información de configuración
print_warning "⚠️  IMPORTANTE: Edita el archivo de configuración antes de usar:"
echo "  sudo nano $CONFIG_FILE"
echo ""

print_success "🎉 Instalación completada exitosamente!"
echo ""
print_info "📋 Próximos pasos:"
echo "  1. Editar configuración: sudo nano $CONFIG_FILE"
echo "  2. Configurar base de datos MySQL"
echo "  3. Crear directorios de trabajo"
echo ""
print_info "🚀 Comandos útiles:"
echo "  $EXECUTABLE_NAME                    # Ejecutar directamente"
echo "  $EXECUTABLE_NAME --help             # Ver ayuda"
echo "  $EXECUTABLE_NAME --version          # Ver versión"
echo "  $EXECUTABLE_NAME --config           # Ver configuración"
echo "  $EXECUTABLE_NAME --dry-run          # Ejecutar sin procesar (solo validar)"
echo ""
print_info "⏰ Para programar ejecución automática:"
echo "  # Ejecutar cada 24 horas a las 2:00 AM"
echo "  crontab -e"
echo "  # Agregar: 0 2 * * * $EXECUTABLE_NAME"
echo ""
print_info "📁 Directorios que se crearán automáticamente:"
echo "  ./excel-files/      # Archivos Excel a procesar"
echo "  ./processed-files/  # Archivos procesados exitosamente"
echo "  ./error-files/      # Archivos que generaron errores"
echo "  ./logs/             # Archivos de logs"
