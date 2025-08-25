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
    if [ "$INSTALL_DIR" = "/usr/local/bin" ] || [ "$INSTALL_DIR" = "/usr/bin" ]; then
        sudo mkdir -p "$INSTALL_DIR"
    else
        mkdir -p "$INSTALL_DIR"
    fi
fi

# Copiar ejecutable
print_info "Copiando ejecutable a $INSTALL_DIR..."
if [ "$INSTALL_DIR" = "/usr/local/bin" ] || [ "$INSTALL_DIR" = "/usr/bin" ]; then
    sudo cp "bin/script-upload-records-to-db" "$INSTALL_DIR/$EXECUTABLE_NAME"
    sudo chmod +x "$INSTALL_DIR/$EXECUTABLE_NAME"
else
    cp "bin/script-upload-records-to-db" "$INSTALL_DIR/$EXECUTABLE_NAME"
    chmod +x "$INSTALL_DIR/$EXECUTABLE_NAME"
fi

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
print_warning "⚠️  IMPORTANTE: Configura las variables de entorno antes de usar:"
echo ""

print_success "🎉 Instalación completada exitosamente!"
echo ""
print_info "📋 Próximo paso - Configurar el entorno:"
if [ "$INSTALL_DIR" = "/usr/local/bin" ] || [ "$INSTALL_DIR" = "/usr/bin" ]; then
    echo "  1. Ver configuración actual: sudo $EXECUTABLE_NAME --config"
    echo "  2. Configurar API: sudo $EXECUTABLE_NAME --api-url <URL> --api-key <KEY>"
    echo "  3. Configurar directorios: sudo $EXECUTABLE_NAME --excel-dir <PATH> --processed-dir <PATH>"
    echo "  4. Configurar procesamiento: sudo $EXECUTABLE_NAME --batch-size <NUMBER> --log-level <LEVEL>"
else
    echo "  1. Ver configuración actual: $EXECUTABLE_NAME --config"
    echo "  2. Configurar API: $EXECUTABLE_NAME --api-url <URL> --api-key <KEY>"
    echo "  3. Configurar directorios: $EXECUTABLE_NAME --excel-dir <PATH> --processed-dir <PATH>"
    echo "  4. Configurar procesamiento: $EXECUTABLE_NAME --batch-size <NUMBER> --log-level <LEVEL>"
fi
echo ""
print_info "💡 Nota: Los comandos de configuración actualizan automáticamente el archivo .env"
echo "   ubicado en el directorio de instalación."
echo ""
print_warning "⚠️  IMPORTANTE: Si instalaste en /usr/local/bin (instalación por defecto),"
echo "   los comandos de configuración SÍ requieren permisos de administrador (sudo)."
echo "   Para evitar esto, puedes instalar en un directorio personal: ./install.sh -d ~/bin"


echo ""
print_info "🚀 Comandos útiles:"
if [ "$INSTALL_DIR" = "/usr/local/bin" ] || [ "$INSTALL_DIR" = "/usr/bin" ]; then
    echo "  $EXECUTABLE_NAME                    # Ejecutar directamente"
    echo "  $EXECUTABLE_NAME --help             # Ver ayuda completa"
    echo "  $EXECUTABLE_NAME --version          # Ver versión"
    echo "  sudo $EXECUTABLE_NAME --config      # Ver configuración actual"
    echo "  $EXECUTABLE_NAME run --dry-run          # Ejecutar sin procesar (solo validar)"
else
    echo "  $EXECUTABLE_NAME                    # Ejecutar directamente"
    echo "  $EXECUTABLE_NAME --help             # Ver ayuda completa"
    echo "  $EXECUTABLE_NAME --version          # Ver versión"
    echo "  $EXECUTABLE_NAME --config           # Ver configuración actual"
    echo "  $EXECUTABLE_NAME run --dry-run          # Ejecutar sin procesar (solo validar)"
fi
echo ""
print_info "🔧 Comandos de configuración:"
if [ "$INSTALL_DIR" = "/usr/local/bin" ] || [ "$INSTALL_DIR" = "/usr/bin" ]; then
    echo "  sudo $EXECUTABLE_NAME --api-url https://api.example.com --api-key my-key"
    echo "  sudo $EXECUTABLE_NAME --excel-dir ./my-excel-files --processed-dir ./my-processed-files"
    echo "  sudo $EXECUTABLE_NAME --batch-size 200 --log-level debug"
    echo ""
    print_info "💡 Alternativa: Instalar en directorio personal para evitar sudo:"
    echo "  ./install.sh -d ~/bin"
    echo "  $EXECUTABLE_NAME --api-url https://api.example.com --api-key my-key"
else
    echo "  $EXECUTABLE_NAME --api-url https://api.example.com --api-key my-key"
    echo "  $EXECUTABLE_NAME --excel-dir ./my-excel-files --processed-dir ./my-processed-files"
    echo "  $EXECUTABLE_NAME --batch-size 200 --log-level debug"
fi
echo ""
print_info "⏰ Para programar ejecución automática:"
echo "  # Usar el script de programación incluido:"
echo "  ./setup-scheduler.sh -d          # Ejecutar diariamente a las 2:00 AM"
echo "  ./setup-scheduler.sh -w          # Ejecutar semanalmente los domingos"
echo "  ./setup-scheduler.sh -c          # Configurar programación personalizada"
echo ""
print_info "📁 Directorios que se crearán automáticamente:"
echo "  ./excel-files/      # Archivos Excel a procesar"
echo "  ./processed-files/  # Archivos procesados exitosamente"
echo "  ./error-files/      # Archivos que generaron errores"
echo "  ./logs/             # Archivos de logs"
