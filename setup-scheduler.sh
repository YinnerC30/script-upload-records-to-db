#!/bin/bash

# Script para configurar programación automática del procesador de Excel
# Autor: Script de configuración de programación
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
    echo "  -d, --daily         Configurar ejecución diaria (default: 2:00 AM)"
    echo "  -w, --weekly        Configurar ejecución semanal (domingo 2:00 AM)"
    echo "  -c, --custom        Configurar programación personalizada"
    echo "  -r, --remove        Remover programación existente"
    echo "  -s, --show          Mostrar programación actual"
    echo ""
    echo "Ejemplos:"
    echo "  $0 -d                # Ejecutar diariamente a las 2:00 AM"
    echo "  $0 -w                # Ejecutar semanalmente los domingos"
    echo "  $0 -c                # Configurar programación personalizada"
    echo "  $0 -r                # Remover programación"
    echo "  $0 -s                # Ver programación actual"
}

# Variables por defecto
EXECUTABLE_NAME="excel-processor"
SCHEDULE_TYPE=""
REMOVE_SCHEDULE=false
SHOW_SCHEDULE=false

# Procesar argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--daily)
            SCHEDULE_TYPE="daily"
            shift
            ;;
        -w|--weekly)
            SCHEDULE_TYPE="weekly"
            shift
            ;;
        -c|--custom)
            SCHEDULE_TYPE="custom"
            shift
            ;;
        -r|--remove)
            REMOVE_SCHEDULE=true
            shift
            ;;
        -s|--show)
            SHOW_SCHEDULE=true
            shift
            ;;
        *)
            print_error "Opción desconocida: $1"
            show_help
            exit 1
            ;;
    esac
done

# Función para verificar si el ejecutable está instalado
check_executable() {
    if ! command -v "$EXECUTABLE_NAME" &> /dev/null; then
        print_error "No se encontró el ejecutable $EXECUTABLE_NAME"
        print_info "Ejecuta './install.sh' primero para instalar el programa"
        exit 1
    fi
}

# Función para mostrar programación actual
show_current_schedule() {
    print_info "Programación actual en crontab:"
    echo ""
    if crontab -l 2>/dev/null | grep -q "$EXECUTABLE_NAME"; then
        crontab -l 2>/dev/null | grep "$EXECUTABLE_NAME" || true
    else
        print_warning "No hay programación configurada"
    fi
    echo ""
}

# Función para remover programación
remove_schedule() {
    print_info "Removiendo programación existente..."
    
    if crontab -l 2>/dev/null | grep -q "$EXECUTABLE_NAME"; then
        # Crear nuevo crontab sin las líneas del excel-processor
        crontab -l 2>/dev/null | grep -v "$EXECUTABLE_NAME" | crontab -
        print_success "Programación removida correctamente"
    else
        print_info "No había programación para remover"
    fi
}

# Función para configurar programación diaria
setup_daily_schedule() {
    print_info "Configurando ejecución diaria a las 2:00 AM..."
    
    # Remover programación existente
    remove_schedule
    
    # Agregar nueva programación
    (crontab -l 2>/dev/null; echo "0 2 * * * $EXECUTABLE_NAME >> /var/log/excel-processor.log 2>&1") | crontab -
    
    print_success "Programación diaria configurada: ejecutará cada día a las 2:00 AM"
}

# Función para configurar programación semanal
setup_weekly_schedule() {
    print_info "Configurando ejecución semanal los domingos a las 2:00 AM..."
    
    # Remover programación existente
    remove_schedule
    
    # Agregar nueva programación
    (crontab -l 2>/dev/null; echo "0 2 * * 0 $EXECUTABLE_NAME >> /var/log/excel-processor.log 2>&1") | crontab -
    
    print_success "Programación semanal configurada: ejecutará cada domingo a las 2:00 AM"
}

# Función para configurar programación personalizada
setup_custom_schedule() {
    print_info "Configuración personalizada de cron"
    echo ""
    echo "Formato: minuto hora día mes día_semana comando"
    echo "Ejemplos:"
    echo "  0 2 * * *     # Diariamente a las 2:00 AM"
    echo "  0 9 * * 1-5   # Lunes a viernes a las 9:00 AM"
    echo "  0 */6 * * *   # Cada 6 horas"
    echo "  30 15 * * 6   # Sábados a las 3:30 PM"
    echo ""
    
    read -p "Ingresa el formato cron (ej: 0 2 * * *): " cron_format
    
    if [[ -z "$cron_format" ]]; then
        print_error "Formato cron no puede estar vacío"
        exit 1
    fi
    
    print_info "Configurando programación personalizada..."
    
    # Remover programación existente
    remove_schedule
    
    # Agregar nueva programación
    (crontab -l 2>/dev/null; echo "$cron_format $EXECUTABLE_NAME >> /var/log/excel-processor.log 2>&1") | crontab -
    
    print_success "Programación personalizada configurada"
}

# Función principal
main() {
    print_info "⏰ Configurador de programación automática para excel-processor"
    echo ""
    
    # Verificar ejecutable
    check_executable
    
    # Mostrar programación actual si se solicita
    if [ "$SHOW_SCHEDULE" = true ]; then
        show_current_schedule
        exit 0
    fi
    
    # Remover programación si se solicita
    if [ "$REMOVE_SCHEDULE" = true ]; then
        remove_schedule
        exit 0
    fi
    
    # Si no se especificó tipo, mostrar menú interactivo
    if [ -z "$SCHEDULE_TYPE" ]; then
        echo "Selecciona el tipo de programación:"
        echo "  1. Diaria (cada día a las 2:00 AM)"
        echo "  2. Semanal (cada domingo a las 2:00 AM)"
        echo "  3. Personalizada"
        echo "  4. Remover programación existente"
        echo "  5. Ver programación actual"
        echo ""
        read -p "Selecciona una opción (1-5): " choice
        
        case $choice in
            1) SCHEDULE_TYPE="daily" ;;
            2) SCHEDULE_TYPE="weekly" ;;
            3) SCHEDULE_TYPE="custom" ;;
            4) REMOVE_SCHEDULE=true ;;
            5) SHOW_SCHEDULE=true ;;
            *) print_error "Opción inválida"; exit 1 ;;
        esac
    fi
    
    # Ejecutar acción según el tipo
    case $SCHEDULE_TYPE in
        "daily")
            setup_daily_schedule
            ;;
        "weekly")
            setup_weekly_schedule
            ;;
        "custom")
            setup_custom_schedule
            ;;
        *)
            print_error "Tipo de programación inválido"
            exit 1
            ;;
    esac
    
    # Mostrar programación final
    echo ""
    show_current_schedule
    
    print_info "📋 Comandos útiles:"
    echo "  crontab -l                    # Ver programación completa"
    echo "  crontab -e                    # Editar programación manualmente"
    echo "  tail -f /var/log/excel-processor.log  # Ver logs en tiempo real"
    echo "  sudo systemctl status cron    # Verificar que cron esté activo"
}

# Ejecutar función principal
main "$@"
