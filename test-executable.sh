#!/bin/bash

echo "🧪 Probando ejecutable..."

# Verificar que el ejecutable existe
if [ ! -f "./bin/script-upload-records-to-db" ]; then
    echo "❌ Error: No se encontró el ejecutable"
    exit 1
fi

echo "✅ Ejecutable encontrado"

# Probar ayuda
echo "📋 Probando comando de ayuda..."
./bin/script-upload-records-to-db --help > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Comando de ayuda funciona"
else
    echo "❌ Error en comando de ayuda"
    exit 1
fi

# Probar configuración
echo "⚙️ Probando comando de configuración..."
./bin/script-upload-records-to-db --config > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Comando de configuración funciona"
else
    echo "❌ Error en comando de configuración"
    exit 1
fi

# Probar dry-run
echo "🔍 Probando modo dry-run..."
./bin/script-upload-records-to-db --dry-run > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Modo dry-run funciona"
else
    echo "❌ Error en modo dry-run"
    exit 1
fi

echo "🎉 ¡Todas las pruebas pasaron! El ejecutable funciona correctamente."
echo ""
echo "📊 Información del ejecutable:"
echo "   Tamaño: $(ls -lh ./bin/script-upload-records-to-db | awk '{print $5}')"
echo "   Permisos: $(ls -l ./bin/script-upload-records-to-db | awk '{print $1}')"
echo ""
echo "🚀 El ejecutable está listo para usar:"
echo "   ./bin/script-upload-records-to-db [opciones]"
