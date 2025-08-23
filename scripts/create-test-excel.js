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
    .padStart(2, '0')}`;
}

// Función para crear datos de ejemplo con IDs únicos
function createTestData() {
  const baseData = [
    {
      Nombre: 'Licitación de Servicios de Mantenimiento',
      'Fecha de Publicación': '2024-01-15',
      'Fecha de cierre': '2024-02-15',
      Organismo: 'Ministerio de Hacienda',
      Unidad: 'Dirección de Presupuestos',
      'Monto Disponible': '50000000',
      Moneda: 'CLP',
      Estado: 'Activa',
    },
    {
      Nombre: 'Adquisición de Equipos Informáticos',
      'Fecha de Publicación': '2024-01-20',
      'Fecha de cierre': '2024-02-20',
      Organismo: 'Ministerio de Educación',
      Unidad: 'División de Administración General',
      'Monto Disponible': '75000000',
      Moneda: 'CLP',
      Estado: 'Activa',
    },
    {
      Nombre: 'Servicios de Consultoría IT',
      'Fecha de Publicación': '2024-01-25',
      'Fecha de cierre': '2024-03-25',
      Organismo: 'Ministerio de Transportes',
      Unidad: 'Departamento de Tecnología',
      'Monto Disponible': '120000000',
      Moneda: 'CLP',
      Estado: 'Activa',
    },
  ];

  // Agregar IDs únicos a cada registro
  return baseData.map((record, index) => ({
    ID: generateUniqueId('LIC', index),
    ...record,
  }));
}

async function createTestExcel() {
  try {
    // Generar datos con IDs únicos
    const testData = createTestData();

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
    const fileName = `licitaciones-test-${timestamp}.xlsx`;
    const filePath = path.join(excelDir, fileName);

    // Guardar archivo
    XLSX.writeFile(workbook, filePath);

    console.log('✅ Archivo Excel de prueba creado exitosamente');
    console.log(`📁 Ubicación: ${filePath}`);
    console.log(`📊 Registros: ${testData.length}`);
    console.log('\n📋 Encabezados incluidos:');
    Object.keys(testData[0]).forEach((header) => {
      console.log(`  - ${header}`);
    });

    console.log('\n🆔 IDs únicos generados:');
    testData.forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.ID}`);
    });
  } catch (error) {
    console.error('❌ Error creando archivo Excel de prueba:', error);
    process.exit(1);
  }
}

// Ejecutar la función
createTestExcel();
