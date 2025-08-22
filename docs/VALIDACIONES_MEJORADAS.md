# Validaciones Mejoradas del ExcelProcessor

## 📋 Resumen

Se han implementado validaciones completas y robustas en el método `validateData` del `ExcelProcessor` para garantizar la integridad y calidad de los datos antes de su inserción en la base de datos.

## 🔧 Validaciones Implementadas

### 1. **Campos Obligatorios**
- **idLicitacion**: Debe estar presente y no estar vacío (máximo 50 caracteres)
- **nombre**: Debe estar presente y no estar vacío (máximo 500 caracteres)

### 2. **Campos Opcionales con Validación**
- **organismo**: Si está presente, máximo 300 caracteres
- **unidad**: Si está presente, máximo 200 caracteres
- **moneda**: Si está presente, máximo 10 caracteres
- **estado**: Si está presente, máximo 50 caracteres

### 3. **Validación de Fechas**
- **fechaPublicacion**: Formato de fecha válido (opcional)
- **fechaCierre**: Formato de fecha válido (opcional)
- **Rango de fechas**: La fecha de cierre debe ser posterior o igual a la fecha de publicación

### 4. **Validación de Montos**
- **montoDisponible**: Debe ser un número válido y no negativo (opcional)
- Soporta tanto números como strings numéricos
- Maneja formatos de moneda (ej: "$1,234.56")

### 5. **Validación de Estructura**
- Verifica que no haya filas `undefined` o vacías
- Valida que los datos sean un array válido

## 📊 Métricas de Validación

### Logging Inteligente
- **Límite de logs**: Máximo 10 errores detallados para evitar saturación
- **Logs estructurados**: Incluyen número de fila y valor problemático
- **Resumen final**: Total de errores encontrados vs registros procesados

### Ejemplo de Logs
```
11:54:38 warn  Registro 1: idLicitacion inválido o faltante {"value":null,"rowNumber":1}
11:54:38 warn  Registro 2: fechaPublicacion inválida {"value":"fecha-invalida","rowNumber":2}
11:54:38 error Validación fallida: 2 errores encontrados en 10 registros
```

## 🧪 Casos de Prueba Cubiertos

### ✅ Casos Válidos
1. **Datos completos**: Todos los campos con valores válidos
2. **Datos mínimos**: Solo campos obligatorios
3. **Campos opcionales vacíos**: Campos opcionales con valores vacíos
4. **Fechas válidas**: Formato ISO y rangos correctos
5. **Montos válidos**: Números y strings numéricos

### ❌ Casos Inválidos
1. **Campos obligatorios faltantes**: Sin idLicitacion o nombre
2. **Fechas inválidas**: Formato incorrecto o fechas inexistentes
3. **Rangos de fechas incorrectos**: Cierre antes que publicación
4. **Montos inválidos**: Strings no numéricos o valores negativos
5. **Longitud excedida**: Campos que superan límites de caracteres
6. **Filas corruptas**: Filas undefined o vacías

## 🔍 Métodos de Validación

### `isValidIdLicitacion(value)`
- Valida que el ID de licitación esté presente y tenga longitud válida
- **Límite**: 50 caracteres máximo

### `isValidNombre(value)`
- Valida que el nombre esté presente y tenga longitud válida
- **Límite**: 500 caracteres máximo

### `isValidDate(value)`
- Valida formato de fecha (string o Date)
- Permite campos opcionales (vacíos o undefined)
- Maneja fechas ISO y otros formatos comunes

### `isValidMontoDisponible(value)`
- Valida números y strings numéricos
- Permite campos opcionales
- Rechaza valores negativos
- Maneja formatos de moneda

### `isValidDateRange(fechaPublicacion, fechaCierre)`
- Valida coherencia temporal entre fechas
- La fecha de cierre debe ser posterior o igual a la de publicación

## 📈 Beneficios de las Mejoras

### 1. **Prevención de Errores**
- Detecta problemas antes de la inserción en BD
- Evita errores de constraint en la base de datos
- Reduce fallos durante el procesamiento

### 2. **Calidad de Datos**
- Garantiza integridad de datos críticos
- Valida formatos y rangos apropiados
- Mantiene consistencia en la información

### 3. **Debugging Mejorado**
- Logs detallados con contexto específico
- Identificación precisa de filas problemáticas
- Información de valores problemáticos

### 4. **Flexibilidad**
- Campos opcionales permiten datos incompletos
- Validación progresiva (continúa hasta encontrar errores)
- Manejo graceful de casos edge

## 🚀 Uso

### Validación Automática
```typescript
const processor = new ExcelProcessor();
const isValid = await processor['validateData'](excelData);

if (isValid) {
  // Proceder con el procesamiento
  await processor.saveToDatabase(excelData, fileName);
} else {
  // Manejar errores de validación
  console.log('Datos inválidos detectados');
}
```

### Script de Prueba
```bash
# Ejecutar tests de validación
npm test -- src/services/__tests__/ExcelProcessor.test.ts

# Ejecutar script de demostración
node scripts/test-improved-validations.js
```

## 📝 Configuración

### Variables de Entorno
```bash
# Tamaño de lote para procesamiento
BATCH_SIZE=100

# Directorios de archivos
EXCEL_DIRECTORY=./excel-files
PROCESSED_DIRECTORY=./processed-files
ERROR_DIRECTORY=./error-files
```

### Límites de Validación
Los límites están basados en la definición de la entidad `Licitacion`:
- `idLicitacion`: VARCHAR(50)
- `nombre`: VARCHAR(500)
- `organismo`: VARCHAR(300)
- `unidad`: VARCHAR(200)
- `moneda`: VARCHAR(10)
- `estado`: VARCHAR(50)
- `montoDisponible`: DECIMAL(15,2)

## 🔄 Próximas Mejoras

### Validaciones Adicionales Sugeridas
1. **Validación de formato de moneda**: Verificar códigos ISO válidos
2. **Validación de estados**: Lista de estados permitidos
3. **Validación de organismos**: Lista blanca de organismos válidos
4. **Validación de montos**: Rangos mínimos/máximos por tipo de licitación
5. **Validación de fechas**: Límites temporales (no fechas futuras muy lejanas)

### Optimizaciones
1. **Validación paralela**: Procesar validaciones en paralelo para grandes datasets
2. **Cache de validaciones**: Evitar re-validar datos ya procesados
3. **Validación incremental**: Validar por lotes para mejor rendimiento
