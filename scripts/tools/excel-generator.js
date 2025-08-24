#!/usr/bin/env node

/**
 * Script consolidado para generar archivos Excel de prueba
 * Combina funcionalidad de create-test-excel.js y create-large-test-excel.js
 */

const XLSX = require('xlsx');
const fs = require('fs/promises');
const path = require('path');

class ExcelGenerator {
  constructor() {
    this.organismos = [
      'Ministerio de Hacienda',
      'Ministerio de Educación',
      'Ministerio de Transportes',
      'Ministerio de Salud',
      'Ministerio de Defensa',
      'Ministerio de Justicia',
      'Ministerio de Agricultura',
      'Ministerio de Energía',
    ];

    this.unidades = [
      'Dirección de Presupuestos',
      'División de Administración General',
      'Departamento de Tecnología',
      'Unidad de Compras',
      'Dirección de Finanzas',
      'Departamento de Recursos Humanos',
      'Unidad de Logística',
      'Dirección de Planificación',
    ];

    this.tiposLicitacion = [
      'Servicios de Mantenimiento',
      'Adquisición de Equipos Informáticos',
      'Servicios de Consultoría IT',
      'Suministro de Materiales',
      'Servicios de Limpieza',
      'Mantenimiento de Infraestructura',
      'Servicios de Seguridad',
      'Adquisición de Software',
    ];
  }

  generateUniqueId(prefix = 'LIC', index = 0) {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${prefix}${timestamp}${randomSuffix}${index
      .toString()
      .padStart(6, '0')}`;
  }

  createBasicTestData() {
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

    return baseData.map((record, index) => ({
      ID: this.generateUniqueId('LIC', index),
      ...record,
    }));
  }

  generateLargeTestData(count = 1000) {
    const data = [];

    for (let i = 1; i <= count; i++) {
      const id = this.generateUniqueId('LIC', i);
      const organismo =
        this.organismos[Math.floor(Math.random() * this.organismos.length)];
      const unidad =
        this.unidades[Math.floor(Math.random() * this.unidades.length)];
      const tipo =
        this.tiposLicitacion[
          Math.floor(Math.random() * this.tiposLicitacion.length)
        ];
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

  async ensureExcelDirectory() {
    const excelDir = path.join(__dirname, '..', '..', 'excel-files');
    try {
      await fs.access(excelDir);
    } catch {
      await fs.mkdir(excelDir, { recursive: true });
    }
    return excelDir;
  }

  async createExcelFile(data, options = {}) {
    const {
      filename = null,
      sheetName = 'Licitaciones',
      showProgress = true,
    } = options;

    try {
      if (showProgress) {
        console.log(
          `📊 Generando archivo Excel con ${data.length.toLocaleString()} registros...`
        );
        if (data.length > 1000) {
          console.log('⏳ Esto puede tomar unos segundos...\n');
        }
      }

      // Crear workbook y worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Agregar worksheet al workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Asegurar que el directorio existe
      const excelDir = await this.ensureExcelDirectory();

      // Generar nombre de archivo
      let finalFilename = filename;
      if (!finalFilename) {
        const timestamp = new Date()
          .toISOString()
          .replace(/[:.]/g, '-')
          .slice(0, -5);
        const sizeSuffix = data.length > 100 ? `-${data.length}` : '';
        finalFilename = `licitaciones-test${sizeSuffix}-${timestamp}.xlsx`;
      }

      const filePath = path.join(excelDir, finalFilename);

      if (showProgress) {
        console.log('💾 Guardando archivo...');
      }

      XLSX.writeFile(workbook, filePath);

      // Obtener estadísticas del archivo
      const stats = await fs.stat(filePath);
      const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);

      if (showProgress) {
        console.log('\n✅ Archivo Excel creado exitosamente');
        console.log(`📁 Ubicación: ${filePath}`);
        console.log(`📊 Registros: ${data.length.toLocaleString()}`);
        console.log(`📏 Tamaño: ${fileSizeMB} MB`);
        console.log(`⏰ Creado: ${new Date().toLocaleString()}`);

        console.log('\n📋 Encabezados incluidos:');
        Object.keys(data[0]).forEach((header) => {
          console.log(`  - ${header}`);
        });

        // Mostrar algunos ejemplos de IDs únicos generados
        console.log('\n🆔 Ejemplos de IDs únicos generados:');
        data.slice(0, 5).forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.ID}`);
        });
        if (data.length > 5) {
          console.log(`  ... y ${data.length - 5} más`);
        }
      }

      return { filePath, stats, fileSizeMB };
    } catch (error) {
      throw new Error(`Error creando archivo Excel: ${error.message}`);
    }
  }

  async createBasicTestFile() {
    console.log('📋 Creando archivo Excel básico de prueba...\n');
    const data = this.createBasicTestData();
    return await this.createExcelFile(data, {
      filename: 'licitaciones-basic-test.xlsx',
    });
  }

  async createLargeTestFile(count = 5000) {
    console.log(
      `📊 Creando archivo Excel grande con ${count.toLocaleString()} registros...\n`
    );
    const data = this.generateLargeTestData(count);
    return await this.createExcelFile(data, {
      filename: `licitaciones-large-${count}.xlsx`,
    });
  }

  async createCustomTestFile(options = {}) {
    const { count = 100, filename = null, customData = null } = options;

    console.log(
      `📊 Creando archivo Excel personalizado con ${count.toLocaleString()} registros...\n`
    );

    const data = customData || this.generateLargeTestData(count);
    return await this.createExcelFile(data, { filename });
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const generator = new ExcelGenerator();

  try {
    if (args.includes('--basic') || args.includes('-b')) {
      await generator.createBasicTestFile();
    } else if (args.includes('--large') || args.includes('-l')) {
      const count = parseInt(args.find((arg) => /^\d+$/.test(arg))) || 5000;
      await generator.createLargeTestFile(count);
    } else if (args.includes('--custom') || args.includes('-c')) {
      const count = parseInt(args.find((arg) => /^\d+$/.test(arg))) || 100;
      await generator.createCustomTestFile({ count });
    } else {
      // Modo interactivo
      console.log('📊 Generador de Archivos Excel de Prueba\n');
      console.log('Opciones disponibles:');
      console.log('  --basic, -b     Crear archivo básico (3 registros)');
      console.log(
        '  --large, -l     Crear archivo grande (5000 registros por defecto)'
      );
      console.log(
        '  --custom, -c    Crear archivo personalizado (100 registros por defecto)'
      );
      console.log('\nEjemplos:');
      console.log('  node scripts/tools/excel-generator.js --basic');
      console.log('  node scripts/tools/excel-generator.js --large 10000');
      console.log('  node scripts/tools/excel-generator.js --custom 500');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { ExcelGenerator };
