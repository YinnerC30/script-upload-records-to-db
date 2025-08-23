# Proceso de Release

Este documento describe el proceso para crear releases del proyecto `script-upload-records-to-db`.

## 📋 Prerrequisitos

Antes de crear una release, asegúrate de que:

1. **El repositorio esté limpio**: No hay cambios sin commitear
2. **Estés en la rama main**: `git checkout main`
3. **Los tests pasen**: `npm test`
4. **El build funcione**: `npm run build:all:clean`

## 🚀 Crear una Release

### Opción 1: Release con versión específica

```bash
# Crear release con versión específica
npm run release 1.0.0 "Primera release estable"

# O usar el script directamente
./scripts/create-release.sh 1.0.0 "Primera release estable"
```

### Opción 2: Release automática con incremento de versión

```bash
# Incremento de patch (1.0.0 -> 1.0.1)
npm run release:patch

# Incremento de minor (1.0.0 -> 1.1.0)
npm run release:minor

# Incremento de major (1.0.0 -> 2.0.0)
npm run release:major
```

## 📁 Archivos Generados

El proceso de release genera los siguientes archivos:

```
release-v1.0.0/
├── script-upload-records-to-db    # Ejecutable principal
├── env.example                    # Archivo de configuración de ejemplo
├── README.md                      # Documentación del proyecto
├── DOCUMENTACION_CONSOLIDADA.md   # Documentación completa
├── RELEASE_NOTES_v1.0.0.md       # Notas de la release
└── install.sh                     # Script de instalación

script-upload-records-to-db-v1.0.0.zip  # Archivo comprimido
```

## 🔧 Configuración

El proceso de release se configura mediante el archivo `scripts/release-config.json`:

```json
{
  "project": {
    "name": "script-upload-records-to-db",
    "repository": "https://github.com/tu-usuario/script-upload-records-to-db"
  },
  "release": {
    "files": ["bin/script-upload-records-to-db", "env.example", "README.md"],
    "create_zip": true,
    "auto_version": true
  }
}
```

## 📝 Notas de Release

Las notas de release se generan automáticamente basándose en los commits desde la última release. Se organizan por tipo:

- **Features**: Nuevas funcionalidades
- **Fixes**: Correcciones de bugs
- **Chores**: Tareas de mantenimiento
- **Documentation**: Cambios en documentación

## 🚀 Después de la Release

Una vez creada la release, sigue estos pasos:

1. **Revisar los archivos generados**:
   ```bash
   ls -la release-v1.0.0/
   ls -la script-upload-records-to-db-v1.0.0.zip
   ```

2. **Subir el tag a GitHub**:
   ```bash
   git push origin v1.0.0
   ```

3. **Subir los cambios**:
   ```bash
   git push origin main
   ```

4. **Crear release en GitHub**:
   - Ve a la sección "Releases" en GitHub
   - Crea una nueva release con el tag `v1.0.0`
   - Sube el archivo `script-upload-records-to-db-v1.0.0.zip`
   - Copia el contenido de `RELEASE_NOTES_v1.0.0.md`

## 🔍 Verificación

Para verificar que la release se creó correctamente:

```bash
# Verificar que el tag existe
git tag -l

# Verificar que el ejecutable funciona
./release-v1.0.0/script-upload-records-to-db --help

# Verificar el contenido del ZIP
unzip -l script-upload-records-to-db-v1.0.0.zip
```

## 🛠️ Solución de Problemas

### Error: "El repositorio tiene cambios sin commitear"

```bash
# Ver cambios pendientes
git status

# Hacer commit de los cambios
git add .
git commit -m "feat: preparar release"

# O descartar cambios si no son necesarios
git checkout -- .
```

### Error: "La construcción del ejecutable falló"

```bash
# Verificar dependencias
npm install

# Limpiar build anterior
rm -rf dist/ bin/

# Intentar build manual
npm run build:all:clean
```

### Error: "No estás en la rama main"

```bash
# Cambiar a main
git checkout main

# O crear release desde otra rama (no recomendado)
git checkout -b release/v1.0.0
```

## 📚 Convenciones de Versionado

Seguimos [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH** (ej: 1.0.0)
- **MAJOR**: Cambios incompatibles con versiones anteriores
- **MINOR**: Nuevas funcionalidades compatibles
- **PATCH**: Correcciones de bugs compatibles

## 🔄 Automatización

Para automatizar el proceso de release, puedes:

1. **Configurar GitHub Actions** para releases automáticas
2. **Usar hooks de Git** para validaciones pre-release
3. **Integrar con CI/CD** para builds automáticos

## 📞 Soporte

Si tienes problemas con el proceso de release:

1. Revisa este documento
2. Verifica los logs del script
3. Consulta la documentación del proyecto
4. Abre un issue en GitHub
