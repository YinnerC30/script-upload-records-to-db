#!/bin/bash

# Script para generar el ejecutable de la aplicación
# Uso: ./scripts/dev-tools/create-release.sh

set -e

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

print_message "🚀 Generando ejecutable de la aplicación..."

# Limpiar directorio bin si existe
if [ -d "bin" ]; then
    print_message "Limpiando directorio bin..."
    rm -rf bin
fi

# Construir el proyecto y generar el ejecutable
print_message "Construyendo el proyecto..."
npm run build:all:clean

# Verificar que la construcción fue exitosa
if [ ! -f "bin/script-upload-records-to-db" ]; then
    print_error "La construcción del ejecutable falló. Verifica los errores de build."
    exit 1
fi

print_message "✅ Ejecutable generado exitosamente en bin/script-upload-records-to-db"
print_message "📁 Ubicación: $(pwd)/bin/script-upload-records-to-db"
