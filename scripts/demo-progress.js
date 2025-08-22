#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 DEMOSTRACIÓN: Progreso de Inserción de Registros');
console.log('==================================================\n');

console.log('📋 Pasos para ver el progreso en acción:');
console.log('');
console.log('1️⃣  Crear un archivo Excel de prueba con muchos registros:');
console.log('   npm run test:excel:large 10000');
console.log('');
console.log('2️⃣  Iniciar la base de datos MySQL:');
console.log('   npm run db:start');
console.log('');
console.log('3️⃣  Ejecutar el procesamiento:');
console.log('   npm run dev');
console.log('');
console.log('📊 Lo que verás en consola:');
console.log('   • Progreso detallado de cada lote');
console.log('   • Tiempo transcurrido y estimado');
console.log('   • Velocidad de inserción (registros/min)');
console.log('   • Estadísticas finales');
console.log('');

// Función para ejecutar comandos automáticamente
async function runDemo() {
  const args = process.argv.slice(2);

  if (args.includes('--auto')) {
    console.log('🤖 Ejecutando demostración automática...\n');

    try {
      // 1. Crear archivo de prueba
      console.log('📊 Creando archivo Excel de prueba...');
      await runCommand('npm', ['run', 'test:excel:large', '1000']);

      // 2. Iniciar base de datos
      console.log('\n🗄️  Iniciando base de datos MySQL...');
      await runCommand('npm', ['run', 'db:start']);

      // Esperar un poco para que MySQL se inicie
      console.log('⏳ Esperando que MySQL se inicie...');
      await sleep(5000);

      // 3. Ejecutar procesamiento
      console.log('\n🚀 Ejecutando procesamiento...');
      await runCommand('npm', ['run', 'dev']);
    } catch (error) {
      console.error('❌ Error en la demostración:', error.message);
    }
  } else {
    console.log(
      '💡 Para ejecutar automáticamente: node scripts/demo-progress.js --auto'
    );
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, '..'),
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Comando falló con código ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Ejecutar demostración
runDemo();
