#!/bin/bash

# Script de demostración para el ejecutable de procesamiento de Excel
# Autor: Script de demostración
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

print_header() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "🚀 DEMOSTRACIÓN DEL EJECUTABLE"
    echo "=========================================="
    echo -e "${NC}"
}

print_header

# Verificar que el ejecutable existe
if [ ! -f "bin/script-upload-records-to-db" ]; then
    print_error "No se encontró el ejecutable. Ejecuta 'npm run build:all' primero."
    exit 1
fi

print_success "Ejecutable encontrado: bin/script-upload-records-to-db"

# Verificar que la base de datos esté ejecutándose
print_info "Verificando estado de la base de datos..."
if ! docker ps | grep -q mysql; then
    print_warning "MySQL no está ejecutándose. Iniciando..."
    npm run db:start
    sleep 5
else
    print_success "MySQL está ejecutándose"
fi

# Crear directorios necesarios
print_info "Creando directorios necesarios..."
mkdir -p excel-files processed-files error-files logs

# Crear un archivo Excel de prueba
print_info "Creando archivo Excel de prueba..."
node scripts/create-test-excel.js

# Mostrar información del ejecutable
print_info "Información del ejecutable:"
echo "  📁 Tamaño: $(du -h bin/script-upload-records-to-db | cut -f1)"
echo "  🔧 Permisos: $(ls -la bin/script-upload-records-to-db | awk '{print $1}')"
echo "  📅 Fecha: $(ls -la bin/script-upload-records-to-db | awk '{print $6, $7, $8}')"

# Mostrar configuración actual
print_info "Configuración actual (.env):"
if [ -f ".env" ]; then
    echo "  📄 Archivo .env encontrado"
    echo "  🗄️  Base de datos: $(grep DB_HOST .env | cut -d'=' -f2):$(grep DB_PORT .env | cut -d'=' -f2)/$(grep DB_DATABASE .env | cut -d'=' -f2)"
else
    print_warning "No se encontró archivo .env"
fi

# Ejecutar el procesador
print_info "Ejecutando el procesador de Excel..."
echo ""

# Ejecutar con timeout para evitar que se quede ejecutando indefinidamente
timeout 30s ./bin/script-upload-records-to-db || {
    if [ $? -eq 124 ]; then
        print_warning "Ejecución terminada por timeout (30s) - esto es normal"
    else
        print_error "Error durante la ejecución"
        exit 1
    fi
}

echo ""
print_success "🎉 Demostración completada!"

# Mostrar resultados
print_info "Resultados:"
echo "  📁 Archivos procesados: $(ls -1 processed-files/ 2>/dev/null | wc -l)"
echo "  ❌ Archivos con error: $(ls -1 error-files/ 2>/dev/null | wc -l)"
echo "  📊 Logs generados: $(ls -1 logs/ 2>/dev/null | wc -l)"

# Mostrar comandos útiles
echo ""
print_info "Comandos útiles:"
echo "  🔧 Instalar ejecutable: ./install.sh"
echo "  🚀 Ejecutar directamente: ./bin/script-upload-records-to-db"
echo "  📊 Ver logs: tail -f logs/app.log"
echo "  🗄️  Ver estado DB: npm run db:status"
echo "  🧹 Limpiar archivos: rm -rf processed-files/* error-files/*"

print_success "¡El ejecutable está funcionando correctamente!"
