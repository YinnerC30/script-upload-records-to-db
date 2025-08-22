# 🚀 Mejoras de Progreso en Consola

## 📊 Visión General

Se han implementado mejoras significativas en el sistema de logging para mostrar el progreso detallado de la inserción de registros en consola. Ahora puedes ver en tiempo real:

- Progreso de cada lote de registros
- Tiempo transcurrido y estimado
- Velocidad de inserción
- Estadísticas detalladas

## 🎯 Características Implementadas

### 1. Progreso Detallado por Lotes

```
✅ Lote 1: 100/5,000 registros (2.0%)
✅ Lote 2: 200/5,000 registros (4.0%)
✅ Lote 3: 300/5,000 registros (6.0%)
...
```

### 2. Métricas de Tiempo

```
⏱️  Tiempo transcurrido: 45s | Estimado restante: 120s
📊 Velocidad: 1,200 registros/min
```

### 3. Estadísticas Finales

```
🎉 ¡Inserción completada exitosamente!
   📊 Total de registros insertados: 5,000
   ⏱️  Tiempo total: 165s
   📦 Lotes procesados: 50
   🚀 Velocidad promedio: 1,818 registros/min
   ⏰ Finalizado: 15:30:45
```

## 🛠️ Cómo Usar

### Opción 1: Demostración Automática

```bash
# Ejecutar demostración completa
npm run demo --auto
```

### Opción 2: Pasos Manuales

1. **Crear archivo de prueba grande:**

   ```bash
   npm run test:excel:large 10000
   ```

2. **Iniciar base de datos:**

   ```bash
   npm run db:start
   ```

3. **Ejecutar procesamiento:**
   ```bash
   npm run dev
   ```

### Opción 3: Archivo Pequeño para Pruebas Rápidas

```bash
# Crear archivo con 100 registros
npm run test:excel:large 100

# Procesar
npm run dev
```

## 📈 Ejemplo de Salida Completa

```
🚀 Iniciando procesamiento de archivos Excel...
   📁 Directorio: ./excel-files
   📦 Tamaño de lote: 100
   ⏰ Inicio: 15:25:30

🔍 Buscando archivo Excel más reciente...
✅ Archivo encontrado: licitaciones-large-5000.xlsx
   📏 Tamaño: 2.45 MB

📁 Procesando archivo: licitaciones-large-5000.xlsx
   📏 Tamaño: 2.45 MB
   ⏰ Inicio: 15:25:31

📖 Leyendo archivo Excel...
   ✅ Leídos 5,000 registros en 234ms

🔍 Validando datos...
   ✅ Validación completada en 45ms

📊 Iniciando inserción en base de datos:
   📁 Archivo: licitaciones-large-5000.xlsx
   📈 Total de registros: 5,000
   📦 Tamaño de lote: 100
   ⏱️  Inicio: 15:25:32

   🔄 Procesando lote de 100 registros... ✅
   ✅ Lote 1: 100/5,000 registros (2.0%)
   🔄 Procesando lote de 100 registros... ✅
   ✅ Lote 2: 200/5,000 registros (4.0%)
   ...
   ✅ Lote 5: 500/5,000 registros (10.0%)
   ⏱️  Tiempo transcurrido: 15s | Estimado restante: 135s
   📊 Velocidad: 2,000 registros/min

   ...
   ✅ Lote 50: 5,000/5,000 registros (100.0%)
   ⏱️  Tiempo transcurrido: 165s | Estimado restante: 0s
   📊 Velocidad: 1,818 registros/min

🎉 ¡Inserción completada exitosamente!
   📊 Total de registros insertados: 5,000
   ⏱️  Tiempo total: 165s
   📦 Lotes procesados: 50
   🚀 Velocidad promedio: 1,818 registros/min
   ⏰ Finalizado: 15:28:15

📦 Moviendo archivo a directorio procesado...
   ✅ Archivo movido en 12ms

🎉 ¡Procesamiento completado exitosamente!
   📊 Total de registros procesados: 5,000
   ⏱️  Tiempo total: 165s
   ⏰ Finalizado: 15:28:15

🎉 ¡Procesamiento completado exitosamente!
   ⏱️  Tiempo total: 165s
   ⏰ Finalizado: 15:28:15
```

## 🔧 Configuración

### Variables de Entorno Relevantes

```env
# Tamaño del lote para inserción (por defecto: 100)
BATCH_SIZE=100

# Directorios
EXCEL_DIRECTORY=./excel-files
PROCESSED_DIRECTORY=./processed-files
ERROR_DIRECTORY=./error-files
```

### Personalización

Puedes ajustar la frecuencia de los logs de progreso modificando el archivo `src/services/ExcelProcessor.ts`:

```typescript
// Mostrar tiempo estimado cada N lotes
if (batchCount % 5 === 0 || endIndex === data.length) {
  // Logs de progreso
}
```

## 📊 Métricas Disponibles

- **Progreso por lote**: Muestra registros procesados vs total
- **Tiempo transcurrido**: Tiempo desde el inicio
- **Tiempo estimado**: Basado en la velocidad actual
- **Velocidad**: Registros por minuto
- **Tamaño de archivo**: En MB
- **Estadísticas finales**: Resumen completo

## 🐛 Solución de Problemas

### Progreso muy lento

- Verifica la conexión a la base de datos
- Considera reducir el `BATCH_SIZE`
- Revisa los logs de MySQL

### No se muestra progreso

- Asegúrate de que el archivo Excel tenga datos
- Verifica que la base de datos esté funcionando
- Revisa los permisos de escritura

### Errores durante la inserción

- Los errores se muestran claramente en consola
- El archivo se mueve automáticamente a `error-files/`
- Revisa los logs detallados en `logs/`

## 🎯 Próximas Mejoras

- [ ] Barra de progreso visual
- [ ] Métricas en tiempo real (WebSocket)
- [ ] Exportación de métricas a CSV
- [ ] Comparación de rendimiento entre ejecuciones
