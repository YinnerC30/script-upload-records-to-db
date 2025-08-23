#!/bin/bash

# Script para crear una release del proyecto
# Uso: ./scripts/create-release.sh [VERSION] [MESSAGE]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  CREACIÓN DE RELEASE v$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Obtener versión actual del package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_message "Versión actual: $CURRENT_VERSION"

# Obtener parámetros
NEW_VERSION=${1:-$CURRENT_VERSION}
RELEASE_MESSAGE=${2:-"Release v$NEW_VERSION"}

print_header "$NEW_VERSION"

# Verificar que el repositorio esté limpio
if [ -n "$(git status --porcelain)" ]; then
    print_error "El repositorio tiene cambios sin commitear. Por favor, haz commit de todos los cambios antes de crear una release."
    exit 1
fi

# Verificar que estemos en la rama main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "No estás en la rama main. Cambiando a main..."
    git checkout main
fi

# Actualizar versión en package.json si es diferente
if [ "$NEW_VERSION" != "$CURRENT_VERSION" ]; then
    print_message "Actualizando versión en package.json de $CURRENT_VERSION a $NEW_VERSION"
    npm version $NEW_VERSION --no-git-tag-version
fi

# Construir el proyecto
print_message "Construyendo el proyecto..."
npm run build:all:clean

# Verificar que la construcción fue exitosa
if [ ! -f "bin/script-upload-records-to-db" ]; then
    print_error "La construcción del ejecutable falló. Verifica los errores de build."
    exit 1
fi

print_message "✅ Ejecutable construido exitosamente"

# Crear commit con los cambios de versión
if [ "$NEW_VERSION" != "$CURRENT_VERSION" ]; then
    print_message "Creando commit con la nueva versión..."
    git add package.json package-lock.json
    git commit -m "chore(release): bump version to $NEW_VERSION"
fi

# Crear tag
print_message "Creando tag v$NEW_VERSION..."
git tag -a "v$NEW_VERSION" -m "$RELEASE_MESSAGE"

# Generar notas de release
print_message "Generando notas de release..."
RELEASE_NOTES_FILE="RELEASE_NOTES_v$NEW_VERSION.md"

# Obtener commits desde el último tag (o desde el inicio si no hay tags)
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -z "$LAST_TAG" ]; then
    COMMITS=$(git log --oneline --reverse)
else
    COMMITS=$(git log --oneline --reverse $LAST_TAG..HEAD)
fi

cat > "$RELEASE_NOTES_FILE" << EOF
# Release v$NEW_VERSION

## Fecha
$(date '+%Y-%m-%d %H:%M:%S')

## Descripción
$RELEASE_MESSAGE

## Cambios

### Features
$(echo "$COMMITS" | grep -E "^[a-f0-9]+ feat" | sed 's/^[a-f0-9]* //' | sed 's/^/- /')

### Fixes
$(echo "$COMMITS" | grep -E "^[a-f0-9]+ fix" | sed 's/^[a-f0-9]* //' | sed 's/^/- /')

### Chores
$(echo "$COMMITS" | grep -E "^[a-f0-9]+ chore" | sed 's/^[a-f0-9]* //' | sed 's/^/- /')

### Documentation
$(echo "$COMMITS" | grep -E "^[a-f0-9]+ docs" | sed 's/^[a-f0-9]* //' | sed 's/^/- /')

## Instalación

### Opción 1: Instalación automática
\`\`\`bash
curl -sSL https://raw.githubusercontent.com/tu-usuario/script-upload-records-to-db/main/install.sh | bash
\`\`\`

### Opción 2: Descarga manual
1. Descarga el ejecutable desde la sección de releases
2. Dale permisos de ejecución: \`chmod +x script-upload-records-to-db\`
3. Configura las variables de entorno según \`env.example\`

## Archivos incluidos
- \`script-upload-records-to-db\`: Ejecutable principal
- \`env.example\`: Archivo de ejemplo para configuración
- \`README.md\`: Documentación completa del proyecto

## Compatibilidad
- Node.js: 18.x o superior
- Sistema operativo: Linux x64
- Base de datos: MySQL 8.0 o superior

## Notas importantes
- Asegúrate de configurar correctamente las variables de entorno antes de usar el script
- El script requiere permisos de escritura en el directorio donde se ejecute
- Consulta la documentación completa en \`DOCUMENTACION_CONSOLIDADA.md\` para más detalles
EOF

print_message "✅ Notas de release generadas en $RELEASE_NOTES_FILE"

# Crear directorio de release
RELEASE_DIR="release-v$NEW_VERSION"
mkdir -p "$RELEASE_DIR"

# Copiar archivos necesarios para la release
print_message "Preparando archivos para la release..."
cp "bin/script-upload-records-to-db" "$RELEASE_DIR/"
cp "env.example" "$RELEASE_DIR/"
cp "README.md" "$RELEASE_DIR/"
cp "DOCUMENTACION_CONSOLIDADA.md" "$RELEASE_DIR/"
cp "$RELEASE_NOTES_FILE" "$RELEASE_DIR/"

# Crear script de instalación para la release
cat > "$RELEASE_DIR/install.sh" << 'EOF'
#!/bin/bash

# Script de instalación para la release
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="/usr/local/bin"
SCRIPT_NAME="script-upload-records-to-db"

echo "🚀 Instalando $SCRIPT_NAME..."

# Verificar permisos de administrador
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  Se requieren permisos de administrador para la instalación"
    echo "Ejecutando con sudo..."
    sudo "$0" "$@"
    exit $?
fi

# Copiar ejecutable
cp "$SCRIPT_DIR/$SCRIPT_NAME" "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR/$SCRIPT_NAME"

# Crear archivo de configuración si no existe
CONFIG_FILE="/etc/$SCRIPT_NAME.env"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "📝 Creando archivo de configuración en $CONFIG_FILE"
    cp "$SCRIPT_DIR/env.example" "$CONFIG_FILE"
    echo "⚠️  IMPORTANTE: Edita $CONFIG_FILE con tus configuraciones de base de datos"
fi

echo "✅ $SCRIPT_NAME instalado exitosamente en $INSTALL_DIR"
echo "📖 Documentación disponible en: $SCRIPT_DIR/DOCUMENTACION_CONSOLIDADA.md"
echo "📋 Notas de release en: $SCRIPT_DIR/RELEASE_NOTES_v*.md"
EOF

chmod +x "$RELEASE_DIR/install.sh"

# Crear archivo ZIP de la release
print_message "Creando archivo ZIP de la release..."
zip -r "script-upload-records-to-db-v$NEW_VERSION.zip" "$RELEASE_DIR/"

print_message "✅ Release creada exitosamente!"
print_message "📁 Archivos generados:"
echo "   - $RELEASE_DIR/ (directorio con archivos de release)"
echo "   - script-upload-records-to-db-v$NEW_VERSION.zip (archivo comprimido)"
echo "   - $RELEASE_NOTES_FILE (notas de release)"

print_message "📋 Próximos pasos:"
echo "   1. Revisa los archivos generados"
echo "   2. Sube el tag: git push origin v$NEW_VERSION"
echo "   3. Sube los cambios: git push origin main"
echo "   4. Crea una release en GitHub con el archivo ZIP"
echo "   5. Actualiza la documentación si es necesario"

print_header "$NEW_VERSION"
print_message "🎉 ¡Release v$NEW_VERSION creada exitosamente!"
