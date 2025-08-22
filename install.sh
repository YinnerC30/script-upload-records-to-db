#!/bin/bash

# Script de instalación para el ejecutable de procesamiento de Excel
# Autor: Script de instalación automática
# Versión: 1.0.0

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
    echo "  -c, --config        Crear archivo de configuración"
    echo "  -s, --service       Instalar como servicio systemd"
    echo ""
    echo "Ejemplos:"
    echo "  $0                    # Instalación básica"
    echo "  $0 -d ~/bin          # Instalar en directorio personal"
    echo "  $0 -c                # Solo crear configuración"
    echo "  $0 -s                # Instalar como servicio"
}

# Variables por defecto
INSTALL_DIR="/usr/local/bin"
CREATE_CONFIG=false
INSTALL_SERVICE=false
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
        -c|--config)
            CREATE_CONFIG=true
            shift
            ;;
        -s|--service)
            INSTALL_SERVICE=true
            shift
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

# Crear archivo de configuración si se solicita
if [ "$CREATE_CONFIG" = true ]; then
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
    print_warning "⚠️  Recuerda editar las variables de entorno según tu configuración"
fi

# Instalar como servicio systemd si se solicita
if [ "$INSTALL_SERVICE" = true ]; then
    print_info "Instalando como servicio systemd..."
    
    SERVICE_FILE="/etc/systemd/system/excel-processor.service"
    
    cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Excel Processor Service
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
EnvironmentFile=$INSTALL_DIR/.env
ExecStart=$INSTALL_DIR/$EXECUTABLE_NAME
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    # Recargar systemd y habilitar servicio
    sudo systemctl daemon-reload
    sudo systemctl enable excel-processor.service
    
    print_success "Servicio instalado y habilitado"
    print_info "Comandos útiles:"
    echo "  sudo systemctl start excel-processor    # Iniciar servicio"
    echo "  sudo systemctl stop excel-processor     # Detener servicio"
    echo "  sudo systemctl status excel-processor   # Ver estado"
    echo "  sudo journalctl -u excel-processor -f   # Ver logs en tiempo real"
fi

print_success "🎉 Instalación completada exitosamente!"
print_info "Para usar el ejecutable:"
echo "  $EXECUTABLE_NAME                    # Ejecutar directamente"
echo "  $EXECUTABLE_NAME --help             # Ver ayuda"
echo "  $EXECUTABLE_NAME --version          # Ver versión"
echo "  $EXECUTABLE_NAME --config           # Ver configuración"
echo "  $EXECUTABLE_NAME --watch            # Modo monitoreo continuo"

if [ "$INSTALL_SERVICE" = true ]; then
    print_info "Para iniciar el servicio:"
    echo "  sudo systemctl start excel-processor"
fi
