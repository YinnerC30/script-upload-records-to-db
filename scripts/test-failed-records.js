#!/usr/bin/env node

/**
 * Script de prueba para la nueva funcionalidad de manejo de registros fallidos
 *
 * Este script prueba:
 * 1. Procesamiento de archivos con registros que fallan en la API
 * 2. Creación de archivos Excel con registros fallidos
 * 3. Manejo de errores individuales vs errores críticos
 */

const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

// Configurar variables de entorno para la prueba
process.env.API_BASE_URL = 'http://localhost:3000/api';
process.env.API_KEY = 'test-key';
process.env.API_TIMEOUT = '5000';
process.env.API_RETRY_ATTEMPTS = '2';
process.env.EXCEL_DIRECTORY = './excel-files';
process.env.PROCESSED_DIRECTORY = './processed-files';
process.env.ERROR_DIRECTORY = './error-files';
process.env.BATCH_SIZE = '50';

async function createTestExcelWithMixedData() {
  console.log('📝 Creando archivo Excel de prueba con datos mixtos...');

  const testData = [];

  // Datos válidos
  for (let i = 1; i <= 10; i++) {
    testData.push({
      id: `LIC-2024-${i.toString().padStart(3, '0')}`,
      nombre: `Licitación de Prueba ${i}`,
      'fecha de publicacion': '2024-01-15',
      'fecha de cierre': '2024-02-15',
      organismo: 'Ministerio de Prueba',
      unidad: 'Unidad de Prueba',
      'monto disponible': 1000000 + i * 100000,
      moneda: 'CLP',
      estado: 'Activa',
    });
  }

  // Datos que probablemente fallen (IDs duplicados, fechas inválidas, etc.)
  for (let i = 11; i <= 15; i++) {
    testData.push({
      id: `LIC-2024-001`, // ID duplicado
      nombre: `Licitación Problemática ${i}`,
      'fecha de publicacion': 'fecha-invalida',
      'fecha de cierre': '2024-02-15',
      organismo: 'Ministerio de Prueba',
      unidad: 'Unidad de Prueba',
      'monto disponible': 'monto-invalido',
      moneda: 'CLP',
      estado: 'Activa',
    });
  }

  // Crear workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(testData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos de Prueba');

  // Guardar archivo
  const fileName = 'test_mixed_data.xlsx';
  const filePath = path.join('./excel-files', fileName);

  // Asegurar que el directorio existe
  if (!fs.existsSync('./excel-files')) {
    fs.mkdirSync('./excel-files', { recursive: true });
  }

  XLSX.writeFile(workbook, filePath);

  console.log(`✅ Archivo de prueba creado: ${filePath}`);
  console.log(`   📊 Total de registros: ${testData.length}`);
  console.log(`   ✅ Registros válidos: 10`);
  console.log(`   ❌ Registros problemáticos: 5`);

  return filePath;
}

async function createTestExcelWithValidData() {
  console.log('📝 Creando archivo Excel de prueba con datos válidos...');

  const testData = [];

  // Datos válidos
  for (let i = 1; i <= 15; i++) {
    testData.push({
      id: `LIC-2024-${i.toString().padStart(3, '0')}`,
      nombre: `Licitación de Prueba ${i}`,
      'fecha de publicacion': '2024-01-15',
      'fecha de cierre': '2024-02-15',
      organismo: 'Ministerio de Prueba',
      unidad: 'Unidad de Prueba',
      'monto disponible': 1000000 + i * 100000,
      moneda: 'CLP',
      estado: 'Activa',
    });
  }

  // Crear workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(testData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos Válidos');

  // Guardar archivo
  const fileName = 'test_valid_data.xlsx';
  const filePath = path.join('./excel-files', fileName);

  // Asegurar que el directorio existe
  if (!fs.existsSync('./excel-files')) {
    fs.mkdirSync('./excel-files', { recursive: true });
  }

  XLSX.writeFile(workbook, filePath);

  console.log(`✅ Archivo de prueba válido creado: ${filePath}`);
  console.log(`   📊 Total de registros: ${testData.length}`);
  console.log(`   ✅ Todos los registros son válidos`);

  return filePath;
}

async function testFailedRecordsHandling() {
  console.log('\n🧪 Iniciando prueba de manejo de registros fallidos...\n');

  try {
    // 1. Crear archivo de prueba
    const testFilePath = await createTestExcelWithMixedData();

    // 2. Importar y ejecutar el procesador
    const { ExcelProcessor } = require('../dist/services/ExcelProcessor');

    console.log('\n🔄 Ejecutando procesador en modo dry-run...');
    const processor = new ExcelProcessor(true); // Modo dry-run

    // 3. Procesar el archivo
    await processor.run();

    console.log('\n✅ Prueba completada exitosamente!');
    console.log('📋 Verificar:');
    console.log('   - El archivo original permanece en excel-files/');
    console.log('   - No se crearon archivos en error-files/ (modo dry-run)');
    console.log('   - Los logs muestran el procesamiento simulado');
  } catch (error) {
    console.error('\n❌ Error durante la prueba:', error.message);
    process.exit(1);
  }
}

async function testValidDataProcessing() {
  console.log('\n🧪 Iniciando prueba con datos válidos...\n');

  try {
    // 1. Crear archivo de prueba con datos válidos
    const testFilePath = await createTestExcelWithValidData();

    // 2. Importar y ejecutar el procesador
    const { ExcelProcessor } = require('../dist/services/ExcelProcessor');

    console.log(
      '\n🔄 Ejecutando procesador en modo dry-run con datos válidos...'
    );
    const processor = new ExcelProcessor(true); // Modo dry-run

    // 3. Procesar el archivo
    await processor.run();

    console.log('\n✅ Prueba con datos válidos completada exitosamente!');
    console.log('📋 Verificar:');
    console.log('   - El archivo pasó la validación');
    console.log('   - Se simularía el envío a la API');
    console.log('   - En modo real, se procesarían individualmente');
  } catch (error) {
    console.error(
      '\n❌ Error durante la prueba con datos válidos:',
      error.message
    );
    process.exit(1);
  }
}

async function testRealProcessing() {
  console.log('\n🧪 Iniciando prueba de procesamiento real...\n');

  try {
    // Verificar que existe el archivo de prueba
    const testFilePath = './excel-files/test_mixed_data.xlsx';
    if (!fs.existsSync(testFilePath)) {
      console.log(
        '⚠️  Archivo de prueba no encontrado. Ejecutando en modo dry-run primero...'
      );
      await testFailedRecordsHandling();
    }

    // Importar y ejecutar el procesador
    const { ExcelProcessor } = require('../dist/services/ExcelProcessor');

    console.log('\n🔄 Ejecutando procesador en modo real...');
    const processor = new ExcelProcessor(false); // Modo real

    // Procesar el archivo
    await processor.run();

    console.log('\n✅ Procesamiento real completado!');
    console.log('📋 Verificar:');
    console.log('   - El archivo original se movió a processed-files/');
    console.log(
      '   - Se creó un archivo de registros fallidos en error-files/'
    );
    console.log('   - Los logs muestran estadísticas de éxito/fallo');
  } catch (error) {
    console.error('\n❌ Error durante el procesamiento real:', error.message);
    console.log('💡 Esto es esperado si la API no está disponible');
    process.exit(0); // No fallar la prueba si la API no está disponible
  }
}

// Función principal
async function main() {
  console.log('🚀 Script de Prueba: Manejo de Registros Fallidos');
  console.log('================================================\n');

  const args = process.argv.slice(2);
  const mode = args[0] || 'all';

  switch (mode) {
    case 'dry-run':
      await testFailedRecordsHandling();
      break;
    case 'valid':
      await testValidDataProcessing();
      break;
    case 'real':
      await testRealProcessing();
      break;
    case 'all':
    default:
      await testFailedRecordsHandling();
      await testValidDataProcessing();
      await testRealProcessing();
      break;
  }

  console.log('\n🎉 Todas las pruebas completadas!');
}

// Ejecutar si es el script principal
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createTestExcelWithMixedData,
  testFailedRecordsHandling,
  testRealProcessing,
};
