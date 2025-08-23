const XLSX = require('xlsx');
const fs = require('fs/promises');
const path = require('path');

// Función para generar IDs únicos
function generateUniqueId(prefix = 'LIC', index = 0) {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${prefix}${timestamp}${randomSuffix}${index
    .toString()
    .padStart(6, '0')}`;
}

// Función para generar datos de prueba con muchos registros
function generateTestData(count = 1000) {
  const data = [];
  const organismos = [
    'Ministerio de Hacienda',
    'Ministerio de Educación',
    'Ministerio de Transportes',
    'Ministerio de Salud',
    'Ministerio de Defensa',
    'Ministerio de Justicia',
    'Ministerio de Agricultura',
    'Ministerio de Energía',
  ];

  const unidades = [
    'Dirección de Presupuestos',
    'División de Administración General',
    'Departamento de Tecnología',
    'Unidad de Compras',
    'Dirección de Finanzas',
    'Departamento de Recursos Humanos',
    'Unidad de Logística',
    'Dirección de Planificación',
  ];

  const tiposLicitacion = [
    'Servicios de Mantenimiento',
    'Adquisición de Equipos Informáticos',
    'Servicios de Consultoría IT',
    'Suministro de Materiales',
    'Servicios de Limpieza',
    'Mantenimiento de Infraestructura',
    'Servicios de Seguridad',
    'Adquisición de Software',
  ];

  for (let i = 1; i <= count; i++) {
    const id = generateUniqueId('LIC', i);
    const organismo = organismos[Math.floor(Math.random() * organismos.length)];
    const unidad = unidades[Math.floor(Math.random() * unidades.length)];
    const tipo =
      tiposLicitacion[Math.floor(Math.random() * tiposLicitacion.length)];
    const monto = Math.floor(Math.random() * 100000000) + 1000000; // Entre 1M y 100M

    // Generar fechas aleatorias en 2024
    const fechaPub = new Date(
      2024,
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1
    );
    const fechaCierre = new Date(fechaPub);
    fechaCierre.setDate(
      fechaCierre.getDate() + Math.floor(Math.random() * 60) + 30
    ); // 30-90 días después

    data.push({
      ID: id,
      Nombre: `Licitación de ${tipo} - ${id}`,
      'Fecha de Publicación': fechaPub.toISOString().split('T')[0],
      'Fecha de cierre': fechaCierre.toISOString().split('T')[0],
      Organismo: organismo,
      Unidad: unidad,
      'Monto Disponible': monto.toString(),
      Moneda: 'CLP',
      Estado: Math.random() > 0.3 ? 'Activa' : 'Cerrada',
    });
  }

  return data;
}

async function createLargeTestExcel() {
  try {
    const recordCount = process.argv[2] ? parseInt(process.argv[2]) : 5000;

    console.log(
      `\n📊 Generando archivo Excel con ${recordCount.toLocaleString()} registros...`
    );
    console.log('⏳ Esto puede tomar unos segundos...\n');

    // Generar datos
    const testData = generateTestData(recordCount);

    // Crear workbook y worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(testData);

    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Licitaciones');

    // Asegurar que el directorio existe
    const excelDir = path.join(__dirname, '..', 'excel-files');
    try {
      await fs.access(excelDir);
    } catch {
      await fs.mkdir(excelDir, { recursive: true });
    }

    // Generar nombre de archivo con timestamp para evitar conflictos
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5);
    const fileName = `licitaciones-large-${recordCount}-${timestamp}.xlsx`;
    const filePath = path.join(excelDir, fileName);

    console.log('💾 Guardando archivo...');
    XLSX.writeFile(workbook, filePath);

    // Obtener estadísticas del archivo
    const stats = await fs.stat(filePath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log('\n✅ Archivo Excel de prueba creado exitosamente');
    console.log(`📁 Ubicación: ${filePath}`);
    console.log(`📊 Registros: ${testData.length.toLocaleString()}`);
    console.log(`📏 Tamaño: ${fileSizeMB} MB`);
    console.log(`⏰ Creado: ${new Date().toLocaleString()}`);

    console.log('\n📋 Encabezados incluidos:');
    Object.keys(testData[0]).forEach((header) => {
      console.log(`  - ${header}`);
    });

    // Mostrar algunos ejemplos de IDs únicos generados
    console.log('\n🆔 Ejemplos de IDs únicos generados:');
    testData.slice(0, 5).forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.ID}`);
    });
    if (testData.length > 5) {
      console.log(`  ... y ${testData.length - 5} más`);
    }

    console.log('\n🚀 Ahora puedes ejecutar el procesamiento con:');
    console.log(`   npm start`);
    console.log(`   # o`);
    console.log(`   npm run dev\n`);
  } catch (error) {
    console.error('❌ Error creando archivo Excel de prueba:', error);
    process.exit(1);
  }
}

// Ejecutar la función
createLargeTestExcel();
