#!/bin/bash

# Script de desinstalación para el ejecutable de procesamiento de Excel
# Autor: Script de desinstalación automática
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
    echo "  -f, --force         Forzar desinstalación sin confirmación"
    echo ""
    echo "Ejemplos:"
    echo "  $0                    # Desinstalación completa con confirmación"
    echo "  $0 -f                 # Desinstalación forzada sin confirmación"
    echo "  $0 -d ~/bin          # Desinstalar desde directorio personal"
    echo ""
    echo "El script eliminará:"
    echo "  🗑️  Ejecutable excel-processor"
    echo "  🗑️  Archivo de configuración .env"
}

# Variables por defecto
INSTALL_DIR="/usr/local/bin"
FORCE=false
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
        -f|--force)
            FORCE=true
            shift
            ;;
        *)
            print_error "Opción desconocida: $1"
            show_help
            exit 1
            ;;
    esac
done

# Función para confirmar desinstalación
confirm_uninstall() {
    if [ "$FORCE" = false ]; then
        echo ""
        print_warning "¿Estás seguro de que quieres desinstalar excel-processor?"
        echo "Esto eliminará:"
        echo "  - Ejecutable: $INSTALL_DIR/$EXECUTABLE_NAME"
        echo "  - Configuración: $INSTALL_DIR/.env"
        echo ""
        read -p "¿Continuar? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Desinstalación cancelada"
            exit 0
        fi
    fi
}

# Función para verificar si el ejecutable está en uso
check_executable_usage() {
    if pgrep -f "$EXECUTABLE_NAME" > /dev/null; then
        print_warning "El ejecutable está actualmente en ejecución"
        if [ "$FORCE" = false ]; then
            read -p "¿Detener el proceso antes de desinstalar? (y/N): " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_info "Deteniendo proceso..."
                sudo pkill -f "$EXECUTABLE_NAME"
                sleep 2
            fi
        else
            print_info "Deteniendo proceso automáticamente..."
            sudo pkill -f "$EXECUTABLE_NAME"
            sleep 2
        fi
    fi
}

# Función para desinstalar configuración
uninstall_config() {
    if [ -f "$INSTALL_DIR/.env" ]; then
        print_info "Eliminando archivo de configuración..."
        sudo rm -f "$INSTALL_DIR/.env"
        print_success "Archivo de configuración eliminado"
    else
        print_info "No se encontró archivo de configuración para eliminar"
    fi
}

# Función para desinstalar ejecutable
uninstall_executable() {
    if [ -f "$INSTALL_DIR/$EXECUTABLE_NAME" ]; then
        print_info "Eliminando ejecutable..."
        sudo rm -f "$INSTALL_DIR/$EXECUTABLE_NAME"
        print_success "Ejecutable eliminado"
    else
        print_info "No se encontró ejecutable para eliminar en $INSTALL_DIR/$EXECUTABLE_NAME"
    fi
}

# Función para verificar desinstalación
verify_uninstall() {
    echo ""
    print_info "Verificando desinstalación..."
    
    local errors=0
    
    # Verificar ejecutable
    if [ -f "$INSTALL_DIR/$EXECUTABLE_NAME" ]; then
        print_error "❌ El ejecutable aún existe en $INSTALL_DIR/$EXECUTABLE_NAME"
        errors=$((errors + 1))
    else
        print_success "✅ Ejecutable eliminado correctamente"
    fi
    
    # Verificar configuración
    if [ -f "$INSTALL_DIR/.env" ]; then
        print_error "❌ El archivo de configuración aún existe en $INSTALL_DIR/.env"
        errors=$((errors + 1))
    else
        print_success "✅ Archivo de configuración eliminado correctamente"
    fi
    
    # Verificar procesos
    if pgrep -f "$EXECUTABLE_NAME" > /dev/null; then
        print_warning "⚠️  Aún hay procesos ejecutándose con el nombre $EXECUTABLE_NAME"
        print_info "Puedes detenerlos manualmente con: sudo pkill -f $EXECUTABLE_NAME"
    else
        print_success "✅ No hay procesos ejecutándose"
    fi
    
    if [ $errors -eq 0 ]; then
        print_success "🎉 Desinstalación completada exitosamente!"
    else
        print_error "❌ Se encontraron $errors errores durante la desinstalación"
        exit 1
    fi
}

# Función principal de desinstalación
main() {
    print_info "🗑️  Iniciando desinstalación de excel-processor..."
    
    # Verificar permisos de administrador
    if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
        print_error "Este script requiere permisos de administrador"
        print_info "Ejecuta: sudo $0"
        exit 1
    fi
    
    # Confirmar desinstalación
    confirm_uninstall
    
    # Verificar uso del ejecutable
    check_executable_usage
    
    # Desinstalación completa
    uninstall_config
    uninstall_executable
    
    # Verificar desinstalación
    verify_uninstall
    
    print_info "📋 Información adicional:"
    echo "  - Los directorios de trabajo (excel-files, processed-files, etc.) no se eliminan"
    echo "  - Los logs en ./logs/ no se eliminan automáticamente"
    echo "  - Para limpiar todo: rm -rf ./excel-files ./processed-files ./error-files ./logs"
}

# Ejecutar función principal
main "$@"
