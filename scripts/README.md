# 📁 Scripts - Documentación

Esta carpeta contiene scripts organizados para diferentes propósitos del proyecto.

## 📂 Estructura de Carpetas

```
scripts/
├── tools/           # Herramientas principales y utilitarios
├── examples/        # Ejemplos de uso y demostraciones
├── dev-tools/       # Herramientas de desarrollo y release
└── README.md        # Esta documentación
```

## 🛠️ Tools - Herramientas Principales

### `api-tester.js`

Script consolidado para pruebas de API REST que combina funcionalidad de múltiples scripts anteriores.

**Uso:**

```bash
# Prueba completa
node scripts/tools/api-tester.js

# Prueba rápida
node scripts/tools/api-tester.js --quick
```

**Funcionalidades:**

- ✅ Conectividad básica
- ✅ Pruebas de endpoint
- ✅ Pruebas de ApiService
- ✅ Operaciones en lote
- ✅ Operaciones individuales

### `excel-generator.js`

Script consolidado para generar archivos Excel de prueba.

**Uso:**

```bash
# Archivo básico (3 registros)
node scripts/tools/excel-generator.js --basic

# Archivo grande (5000 registros por defecto)
node scripts/tools/excel-generator.js --large

# Archivo personalizado (100 registros por defecto)
node scripts/tools/excel-generator.js --custom

# Con cantidad específica
node scripts/tools/excel-generator.js --large 10000
```

**Funcionalidades:**

- ✅ Generación de datos básicos
- ✅ Generación de datos masivos
- ✅ IDs únicos automáticos
- ✅ Datos realistas y variados

### `api-diagnostic.js`

Script de diagnóstico para identificar problemas de conexión con la API.

**Uso:**

```bash
node scripts/tools/api-diagnostic.js
```

**Funcionalidades:**

- ✅ Verificación de conectividad
- ✅ Pruebas de endpoint
- ✅ Análisis de errores
- ✅ Recomendaciones de solución

### `api-configurator.js`

Script interactivo para configurar la API REST.

**Uso:**

```bash
node scripts/tools/api-configurator.js
```

**Funcionalidades:**

- ✅ Configuración interactiva
- ✅ Validación de parámetros
- ✅ Actualización de .env
- ✅ Prueba de conexión integrada

### `log-analyzer.ts`

Analizador de logs para debugging y monitoreo.

**Uso:**

```bash
npx ts-node scripts/tools/log-analyzer.ts
```

## 📚 Examples - Ejemplos y Demostraciones

### `usage-example.js`

Ejemplo completo de uso del procesador de Excel.

**Uso:**

```bash
node scripts/examples/usage-example.js
```

### `demo-progress.js`

Demostración del progreso de inserción de registros.

**Uso:**

```bash
# Modo manual
node scripts/examples/demo-progress.js

# Modo automático
node scripts/examples/demo-progress.js --auto
```

## 🔧 Dev-Tools - Herramientas de Desarrollo

### `create-release.sh`

Script para crear releases del proyecto.

**Uso:**

```bash
./scripts/dev-tools/create-release.sh
```

### `release-config.json`

Configuración para el proceso de release.

## 🗑️ Scripts Eliminados/Consolidados

Los siguientes scripts fueron eliminados o consolidados para mejorar la organización:

### ❌ Eliminados (funcionalidad duplicada):

- `test-api-simple.js` → Consolidado en `api-tester.js`
- `test-api-integration.js` → Consolidado en `api-tester.js`
- `create-test-excel.js` → Consolidado en `excel-generator.js`
- `create-large-test-excel.js` → Consolidado en `excel-generator.js`

### ❌ Eliminados (obsoletos):

- `test-database-retry.js`
- `test-env-config.js`
- `test-failed-records.js`
- `test-header-mapping.js`
- `test-improved-logging.js`
- `test-improved-validations.js`

### ✅ Movidos y renombrados:

- `diagnose-api.js` → `tools/api-diagnostic.js`
- `configure-api.js` → `tools/api-configurator.js`
- `log-analyzer.ts` → `tools/log-analyzer.ts`
- `example-usage.js` → `examples/usage-example.js`
- `demo-progress.js` → `examples/demo-progress.js`
- `create-release.sh` → `dev-tools/create-release.sh`
- `release-config.json` → `dev-tools/release-config.json`

## 🚀 Comandos NPM Actualizados

Para facilitar el uso, se recomienda agregar estos scripts al `package.json`:

```json
{
  "scripts": {
    "test:api": "node scripts/tools/api-tester.js",
    "test:api:quick": "node scripts/tools/api-tester.js --quick",
    "generate:excel:basic": "node scripts/tools/excel-generator.js --basic",
    "generate:excel:large": "node scripts/tools/excel-generator.js --large",
    "generate:excel:custom": "node scripts/tools/excel-generator.js --custom",
    "diagnose:api": "node scripts/tools/api-diagnostic.js",
    "configure:api": "node scripts/tools/api-configurator.js",
    "analyze:logs": "npx ts-node scripts/tools/log-analyzer.ts",
    "demo:progress": "node scripts/examples/demo-progress.js",
    "create:release": "./scripts/dev-tools/create-release.sh"
  }
}
```

## 📋 Beneficios de la Reorganización

1. **🎯 Claridad**: Cada script tiene un propósito específico y bien definido
2. **🔄 Reutilización**: Eliminación de código duplicado
3. **📁 Organización**: Estructura lógica por categorías
4. **📚 Documentación**: Cada herramienta está documentada
5. **🛠️ Mantenibilidad**: Más fácil de mantener y actualizar
6. **🚀 Productividad**: Comandos más intuitivos y opciones configurables

## 🔄 Migración

Si tienes scripts que dependen de los archivos antiguos, actualiza las referencias:

```bash
# Antes
node scripts/test-api-simple.js

# Después
node scripts/tools/api-tester.js --quick
```

```bash
# Antes
node scripts/create-test-excel.js

# Después
node scripts/tools/excel-generator.js --basic
```
