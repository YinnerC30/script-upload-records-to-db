const { StructuredLogger } = require('../dist/utils/logger');

// Simular diferentes escenarios de logging
async function testImprovedLogging() {
  console.log('🧪 Probando sistema de logging mejorado...\n');

  // Crear loggers para diferentes categorías
  const processorLogger = new StructuredLogger('ExcelProcessor');
  const dbLogger = new StructuredLogger('Database');
  const fileLogger = new StructuredLogger('FileSystem');

  // Simular procesamiento de archivo
  console.log('📁 Simulando procesamiento de archivo...');

  processorLogger.info('🚀 Iniciando procesamiento de archivos Excel...', {
    excelDirectory: './excel-files',
    batchSize: 100,
  });

  // Simular lectura de archivo
  const readStartTime = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 150)); // Simular tiempo de lectura
  const readTime = Date.now() - readStartTime;

  processorLogger.performance('read_excel_file', readTime, {
    fileName: 'test-file.xlsx',
    recordsCount: 1000,
  });

  // Simular validación
  const validationStartTime = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 50)); // Simular tiempo de validación
  const validationTime = Date.now() - validationStartTime;

  processorLogger.performance('validate_data', validationTime, {
    fileName: 'test-file.xlsx',
    recordsCount: 1000,
  });

  // Simular inserción en base de datos
  console.log('💾 Simulando inserción en base de datos...');

  dbLogger.info('Iniciando inserción en base de datos', {
    fileName: 'test-file.xlsx',
    totalRecords: 1000,
    batchSize: 100,
  });

  let totalInserted = 0;
  for (let i = 0; i < 10; i++) {
    const batchStartTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 20)); // Simular tiempo de inserción
    const batchTime = Date.now() - batchStartTime;
    totalInserted += 100;

    if (i % 3 === 0) {
      dbLogger.verbose('Progreso de inserción', {
        fileName: 'test-file.xlsx',
        batchNumber: i + 1,
        recordsProcessed: totalInserted,
        totalRecords: 1000,
        progress: `${((totalInserted / 1000) * 100).toFixed(1)}%`,
        batchTime,
        averageTimePerRecord: batchTime / 100,
      });
    }
  }

  const saveTime = Date.now() - readStartTime;
  processorLogger.performance('save_to_database', saveTime, {
    fileName: 'test-file.xlsx',
    recordsCount: 1000,
    batchSize: 100,
  });

  // Simular movimiento de archivo
  const moveStartTime = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 10)); // Simular tiempo de movimiento
  const moveTime = Date.now() - moveStartTime;

  fileLogger.performance('move_file', moveTime, {
    fileName: 'test-file.xlsx',
    destination: './processed-files',
  });

  // Logging de métricas
  processorLogger.metrics('records_processed', 1000, 'records', {
    fileName: 'test-file.xlsx',
    processingTime: Date.now() - readStartTime,
  });

  // Simular error
  console.log('⚠️ Simulando error...');

  try {
    throw new Error('Error simulado para pruebas');
  } catch (error) {
    processorLogger.error('Error procesando archivo', error, {
      fileName: 'test-file.xlsx',
      totalTime: Date.now() - readStartTime,
    });
  }

  // Simular advertencia
  processorLogger.warn('Archivo con formato no estándar', {
    fileName: 'test-file.xlsx',
    warning: 'Algunos campos están vacíos',
  });

  console.log('\n✅ Pruebas de logging completadas!');
  console.log('📊 Revisa los archivos de log en ./logs/');
  console.log('🔍 Ejecuta "npm run logs:analyze" para generar reporte');
}

// Ejecutar pruebas
testImprovedLogging().catch(console.error);
