#!/usr/bin/env node

/**
 * Script de migración para actualizar referencias a scripts antiguos
 * Ayuda a los usuarios a migrar de la estructura antigua a la nueva
 */

const fs = require('fs');
const path = require('path');

const MIGRATION_MAP = {
  // Scripts consolidados
  'scripts/test-api-simple.js': 'scripts/tools/api-tester.js --quick',
  'scripts/test-api-integration.js': 'scripts/tools/api-tester.js',
  'scripts/create-test-excel.js': 'scripts/tools/excel-generator.js --basic',
  'scripts/create-large-test-excel.js':
    'scripts/tools/excel-generator.js --large',

  // Scripts movidos
  'scripts/diagnose-api.js': 'scripts/tools/api-diagnostic.js',
  'scripts/configure-api.js': 'scripts/tools/api-configurator.js',
  'scripts/log-analyzer.ts': 'scripts/tools/log-analyzer.ts',
  'scripts/example-usage.js': 'scripts/examples/usage-example.js',
  'scripts/demo-progress.js': 'scripts/examples/demo-progress.js',
  'scripts/create-release.sh': 'scripts/dev-tools/create-release.sh',
  'scripts/release-config.json': 'scripts/dev-tools/release-config.json',

  // Scripts eliminados (obsoletos)
  'scripts/test-database-retry.js':
    'ELIMINADO - Funcionalidad integrada en el código principal',
  'scripts/test-env-config.js': 'ELIMINADO - Reemplazado por configure:api',
  'scripts/test-failed-records.js':
    'ELIMINADO - Funcionalidad integrada en el código principal',
  'scripts/test-header-mapping.js':
    'ELIMINADO - Funcionalidad integrada en el código principal',
  'scripts/test-improved-logging.js':
    'ELIMINADO - Funcionalidad integrada en el código principal',
  'scripts/test-improved-validations.js':
    'ELIMINADO - Funcionalidad integrada en el código principal',
};

const NPM_SCRIPTS_MIGRATION = {
  // Scripts actualizados
  'test:api': 'test:api',
  'test:api:quick': 'test:api:quick',
  'generate:excel:basic': 'generate:excel:basic',
  'generate:excel:large': 'generate:excel:large',
  'generate:excel:custom': 'generate:excel:custom',
  'diagnose:api': 'diagnose:api',
  'configure:api': 'configure:api',
  'demo:progress': 'demo:progress',

  // Scripts eliminados
  'test:excel': 'generate:excel:basic',
  'test:excel:large': 'generate:excel:large',
  'test:retry': 'ELIMINADO - Funcionalidad integrada',
  'test:env-config': 'configure:api',
  'test:failed-records': 'ELIMINADO - Funcionalidad integrada',
  'logs:test': 'ELIMINADO - Funcionalidad integrada',
  demo: 'demo:progress',
};

function showMigrationGuide() {
  console.log('🔄 GUÍA DE MIGRACIÓN DE SCRIPTS');
  console.log('='.repeat(50));
  console.log('\n📋 Scripts Consolidados:');
  console.log(
    'Los siguientes scripts fueron consolidados para eliminar duplicación:'
  );

  Object.entries(MIGRATION_MAP).forEach(([oldPath, newPath]) => {
    if (newPath.startsWith('scripts/')) {
      console.log(`\n   🔄 ${oldPath}`);
      console.log(`      → ${newPath}`);
    }
  });

  console.log('\n🗑️ Scripts Eliminados:');
  console.log('Los siguientes scripts fueron eliminados por ser obsoletos:');

  Object.entries(MIGRATION_MAP).forEach(([oldPath, newPath]) => {
    if (newPath.startsWith('ELIMINADO')) {
      console.log(`\n   ❌ ${oldPath}`);
      console.log(`      → ${newPath}`);
    }
  });

  console.log('\n📦 Comandos NPM Actualizados:');
  console.log('Actualiza tu package.json con estos nuevos comandos:');

  Object.entries(NPM_SCRIPTS_MIGRATION).forEach(([oldScript, newScript]) => {
    if (newScript.startsWith('ELIMINADO')) {
      console.log(`\n   ❌ "${oldScript}": "..."`);
      console.log(`      → ${newScript}`);
    } else if (oldScript !== newScript) {
      console.log(`\n   🔄 "${oldScript}": "..."`);
      console.log(`      → "${newScript}": "..."`);
    }
  });

  console.log('\n🚀 Nuevos Comandos Disponibles:');
  console.log('   npm run test:api          # Pruebas completas de API');
  console.log('   npm run test:api:quick    # Prueba rápida de API');
  console.log('   npm run generate:excel:basic   # Generar Excel básico');
  console.log('   npm run generate:excel:large   # Generar Excel grande');
  console.log(
    '   npm run generate:excel:custom  # Generar Excel personalizado'
  );
  console.log('   npm run diagnose:api      # Diagnosticar problemas de API');
  console.log('   npm run configure:api     # Configurar API interactivamente');
  console.log('   npm run demo:progress     # Demostración de progreso');
}

function checkForOldReferences() {
  console.log('\n🔍 BUSCANDO REFERENCIAS ANTIGUAS...');
  console.log('='.repeat(50));

  const filesToCheck = [
    'package.json',
    'README.md',
    'docs/',
    'src/',
    'scripts/',
  ];

  let foundReferences = false;

  filesToCheck.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');

        Object.keys(MIGRATION_MAP).forEach((oldPath) => {
          if (content.includes(oldPath)) {
            console.log(`\n⚠️  Referencia encontrada en ${filePath}:`);
            console.log(`   ${oldPath}`);
            console.log(`   → Cambiar a: ${MIGRATION_MAP[oldPath]}`);
            foundReferences = true;
          }
        });
      } catch (error) {
        // Ignorar errores de lectura
      }
    }
  });

  if (!foundReferences) {
    console.log('✅ No se encontraron referencias a scripts antiguos');
  }
}

function showNewStructure() {
  console.log('\n📁 NUEVA ESTRUCTURA DE SCRIPTS:');
  console.log('='.repeat(50));
  console.log(`
scripts/
├── tools/           # Herramientas principales
│   ├── api-tester.js        # Pruebas de API (consolidado)
│   ├── excel-generator.js   # Generador de Excel (consolidado)
│   ├── api-diagnostic.js    # Diagnóstico de API
│   ├── api-configurator.js  # Configurador de API
│   └── log-analyzer.ts      # Analizador de logs
├── examples/        # Ejemplos y demostraciones
│   ├── usage-example.js     # Ejemplo de uso
│   └── demo-progress.js     # Demostración de progreso
├── dev-tools/       # Herramientas de desarrollo
│   ├── create-release.sh    # Script de release
│   └── release-config.json  # Configuración de release
└── README.md        # Documentación
  `);
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log('🔄 Script de Migración de Scripts');
    console.log('\nUso:');
    console.log('  node scripts/migrate-scripts.js [opciones]');
    console.log('\nOpciones:');
    console.log('  --check, -c     Buscar referencias antiguas');
    console.log('  --structure, -s Mostrar nueva estructura');
    console.log('  --help, -h      Mostrar esta ayuda');
    console.log('\nSin opciones: Mostrar guía completa de migración');
    return;
  }

  if (args.includes('--check') || args.includes('-c')) {
    checkForOldReferences();
    return;
  }

  if (args.includes('--structure') || args.includes('-s')) {
    showNewStructure();
    return;
  }

  // Mostrar guía completa por defecto
  showMigrationGuide();
  showNewStructure();
  checkForOldReferences();

  console.log('\n🎉 ¡Migración completada!');
  console.log('📖 Revisa scripts/README.md para más detalles');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  showMigrationGuide,
  checkForOldReferences,
  showNewStructure,
};
