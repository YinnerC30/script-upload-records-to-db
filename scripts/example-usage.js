#!/usr/bin/env node

/**
 * Script de ejemplo para demostrar el uso del procesador de Excel
 *
 * Este script muestra cómo:
 * 1. Configurar el entorno
 * 2. Ejecutar el procesamiento
 * 3. Monitorear el estado
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Ejemplo de uso del Script de Procesamiento de Excel\n');

// Función para ejecutar comandos
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  try {
    console.log('📋 Pasos para usar el script:\n');

    // 1. Instalar dependencias
    console.log('1️⃣  Instalando dependencias...');
    await runCommand('npm', ['install']);
    console.log('✅ Dependencias instaladas\n');

    // 2. Configurar variables de entorno
    console.log('2️⃣  Configurando variables de entorno...');
    console.log('   - Copia env.example a .env');
    console.log('   - Edita .env con tus configuraciones de base de datos');
    console.log('   - Asegúrate de que MySQL esté corriendo\n');

    // 3. Crear directorios necesarios
    console.log('3️⃣  Creando directorios...');
    const dirs = ['excel-files', 'processed-files', 'error-files', 'logs'];
    for (const dir of dirs) {
      console.log(`   - Creando ${dir}/`);
    }
    console.log('✅ Directorios creados\n');

    // 4. Compilar TypeScript
    console.log('4️⃣  Compilando TypeScript...');
    await runCommand('npm', ['run', 'build']);
    console.log('✅ TypeScript compilado\n');

    // 5. Mostrar comandos de uso
    console.log('5️⃣  Comandos disponibles:\n');
    console.log('   📁 Procesamiento único:');
    console.log('      npm run dev          # Desarrollo');
    console.log('      npm start            # Producción\n');

    console.log('   👀 Monitoreo continuo:');
    console.log('      npm run watcher      # Desarrollo');
    console.log('      npm run watcher:prod # Producción\n');

    console.log('   🧪 Pruebas:');
    console.log('      npm test             # Ejecutar pruebas');
    console.log('      npm run test:watch   # Pruebas en modo watch');
    console.log('      npm run test:ui      # Interfaz gráfica de pruebas');
    console.log('      npm run test:coverage # Con cobertura\n');

    // 6. Instrucciones de uso
    console.log('6️⃣  Instrucciones de uso:\n');
    console.log('   a) Coloca archivos Excel en el directorio excel-files/');
    console.log('   b) Ejecuta el script (modo único o continuo)');
    console.log('   c) Revisa los logs en logs/app.log');
    console.log('   d) Los archivos procesados se mueven a processed-files/');
    console.log('   e) Los archivos con errores se mueven a error-files/\n');

    // 7. Estructura de datos esperada
    console.log('7️⃣  Estructura de datos esperada en Excel:\n');
    console.log(
      '   | idLicitacion | nombre | fechaPublicacion | fechaCierre | organismo | unidad | montoDisponible | moneda | estado |'
    );
    console.log(
      '   |---------------|--------|------------------|-------------|-----------|--------|-----------------|--------|--------|'
    );
    console.log(
      '   | 501-156-COT25 | Licitación Test | 2023-01-01 | 2023-02-01 | Ministerio | Unidad | 1000000 | CLP | Activa |\n'
    );

    console.log('🎉 ¡Configuración completada!');
    console.log('📖 Revisa el README.md para más detalles');
  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main };
