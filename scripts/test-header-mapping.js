// Script de ejemplo para demostrar el mapeo de encabezados
const XLSX = require('xlsx');

// Mapeo de encabezados del Excel a campos del código (normalizados)
const HEADER_MAPPING = {
  'id': 'idLicitacion',
  'nombre': 'nombre',
  'fecha de publicacion': 'fechaPublicacion',
  'fecha de cierre': 'fechaCierre',
  'organismo': 'organismo',
  'unidad': 'unidad',
  'monto disponible': 'montoDisponible',
  'moneda': 'moneda',
  'estado': 'estado',
  // Variaciones adicionales para mayor compatibilidad
  'id_licitacion': 'idLicitacion',
  'idlicitacion': 'idLicitacion',
  'fecha_publicacion': 'fechaPublicacion',
  'fechapublicacion': 'fechaPublicacion',
  'fecha_cierre': 'fechaCierre',
  'fechacierre': 'fechaCierre',
  'monto_disponible': 'montoDisponible',
  'montodisponible': 'montoDisponible'
};

/**
 * Normaliza un encabezado para facilitar el mapeo
 */
function normalizeHeader(header) {
  return header
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalizar espacios múltiples
    .replace(/[áéíóúüñ]/g, (match) => {
      const accents = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u', 'ñ': 'n'
      };
      return accents[match] || match;
    });
}

/**
 * Mapea los encabezados del Excel y transforma los datos
 */
function mapHeadersAndTransformData(rawData) {
  if (!rawData || rawData.length === 0) {
    return [];
  }

  // Obtener el primer registro para identificar los encabezados
  const firstRow = rawData[0];
  const headers = Object.keys(firstRow);
  
  console.log('📋 Encabezados encontrados en el archivo:');
  headers.forEach(header => console.log(`  - "${header}"`));

  // Crear mapeo de encabezados originales a campos normalizados
  const headerMapping = {};
  const unmappedHeaders = [];

  headers.forEach(header => {
    const normalizedHeader = normalizeHeader(header);
    if (HEADER_MAPPING[normalizedHeader]) {
      headerMapping[header] = HEADER_MAPPING[normalizedHeader];
      console.log(`✅ "${header}" → "${HEADER_MAPPING[normalizedHeader]}"`);
    } else {
      unmappedHeaders.push(header);
      console.log(`⚠️  Encabezado no mapeado: "${header}"`);
    }
  });

  if (unmappedHeaders.length > 0) {
    console.log(`\n⚠️  Encabezados no mapeados: ${unmappedHeaders.join(', ')}`);
  }

  // Transformar cada fila usando el mapeo
  return rawData.map((row, index) => {
    const transformedRow = {};
    
    headers.forEach(originalHeader => {
      const mappedField = headerMapping[originalHeader];
      if (mappedField) {
        transformedRow[mappedField] = row[originalHeader];
      }
    });

    return transformedRow;
  });
}

// Datos de ejemplo que simulan los encabezados del archivo Excel
const exampleData = [
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
  }
];

console.log('🚀 Demostración del Mapeo de Encabezados\n');
console.log('📊 Datos originales del Excel:');
console.log(JSON.stringify(exampleData, null, 2));

console.log('\n🔄 Procesando mapeo de encabezados...\n');

const transformedData = mapHeadersAndTransformData(exampleData);

console.log('\n✅ Datos transformados:');
console.log(JSON.stringify(transformedData, null, 2));

console.log('\n📋 Resumen del mapeo:');
console.log('- ID → idLicitacion');
console.log('- Nombre → nombre');
console.log('- Fecha de Publicación → fechaPublicacion');
console.log('- Fecha de cierre → fechaCierre');
console.log('- Organismo → organismo');
console.log('- Unidad → unidad');
console.log('- Monto Disponible → montoDisponible');
console.log('- Moneda → moneda');
console.log('- Estado → estado');

console.log('\n✨ El mapeo funciona correctamente y resuelve la incompatibilidad de encabezados!');
