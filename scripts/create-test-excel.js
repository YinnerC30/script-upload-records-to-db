const XLSX = require('xlsx');
const fs = require('fs/promises');
const path = require('path');

// Crear datos de ejemplo
const testData = [
  {
    'ID': 'LIC001',
    'Nombre': 'Licitación de Servicios de Mantenimiento',
    'Fecha de Publicación': '2024-01-15',
    'Fecha de cierre': '2024-02-15',
    'Organismo': 'Ministerio de Hacienda',
    'Unidad': 'Dirección de Presupuestos',
    'Monto Disponible': '50000000',
    'Moneda': 'CLP',
    'Estado': 'Activa'
  },
  {
    'ID': 'LIC002',
    'Nombre': 'Adquisición de Equipos Informáticos',
    'Fecha de Publicación': '2024-01-20',
    'Fecha de cierre': '2024-02-20',
    'Organismo': 'Ministerio de Educación',
    'Unidad': 'División de Administración General',
    'Monto Disponible': '75000000',
    'Moneda': 'CLP',
    'Estado': 'Activa'
  },
  {
    'ID': 'LIC003',
    'Nombre': 'Servicios de Consultoría IT',
    'Fecha de Publicación': '2024-01-25',
    'Fecha de cierre': '2024-03-25',
    'Organismo': 'Ministerio de Transportes',
    'Unidad': 'Departamento de Tecnología',
    'Monto Disponible': '120000000',
    'Moneda': 'CLP',
    'Estado': 'Activa'
  }
];

async function createTestExcel() {
  try {
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

    // Guardar archivo
    const filePath = path.join(excelDir, 'licitaciones-test.xlsx');
    XLSX.writeFile(workbook, filePath);

    console.log('✅ Archivo Excel de prueba creado exitosamente');
    console.log(`📁 Ubicación: ${filePath}`);
    console.log(`📊 Registros: ${testData.length}`);
    console.log('\n📋 Encabezados incluidos:');
    Object.keys(testData[0]).forEach(header => {
      console.log(`  - ${header}`);
    });
  } catch (error) {
    console.error('❌ Error creando archivo Excel de prueba:', error);
    process.exit(1);
  }
}

// Ejecutar la función
createTestExcel();
