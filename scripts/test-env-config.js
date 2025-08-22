#!/usr/bin/env node

/**
 * Script de prueba para la funcionalidad de configuración del archivo .env
 * Este script prueba las diferentes opciones de configuración disponibles
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    log(`\n🔧 Ejecutando: ${command} ${args.join(' ')}`, 'cyan');

    const child = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject({ stdout, stderr, code });
      }
    });

    child.on('error', (error) => {
      reject({ error, stdout, stderr });
    });
  });
}

async function testEnvConfiguration() {
  log('🧪 Iniciando pruebas de configuración del archivo .env', 'bright');

  try {
    // Verificar que el ejecutable existe
    const executablePath = path.join(
      __dirname,
      '..',
      'bin',
      'script-upload-records-to-db'
    );
    if (!fs.existsSync(executablePath)) {
      log(
        '❌ Ejecutable no encontrado. Ejecuta "npm run build:all" primero.',
        'red'
      );
      return;
    }

    // Crear una copia de respaldo del .env actual
    const envPath = path.join(__dirname, '..', '.env');
    const backupPath = path.join(__dirname, '..', '.env.backup');

    if (fs.existsSync(envPath)) {
      fs.copyFileSync(envPath, backupPath);
      log('📋 Copia de respaldo del .env creada', 'yellow');
    }

    // Test 1: Mostrar ayuda
    log('\n📖 Test 1: Mostrar ayuda', 'blue');
    await runCommand(executablePath, ['--help']);

    // Test 2: Mostrar configuración actual
    log('\n📋 Test 2: Mostrar configuración actual', 'blue');
    await runCommand(executablePath, ['--config']);

    // Test 3: Cambiar configuración de base de datos
    log('\n🗄️ Test 3: Cambiar configuración de base de datos', 'blue');
    await runCommand(executablePath, [
      '--db-host',
      '192.168.1.100',
      '--db-port',
      '3307',
      '--db-username',
      'testuser',
      '--db-database',
      'test_database',
    ]);

    // Test 4: Cambiar directorios
    log('\n📁 Test 4: Cambiar directorios', 'blue');
    await runCommand(executablePath, [
      '--excel-dir',
      './test-excel-files',
      '--processed-dir',
      './test-processed-files',
      '--error-dir',
      './test-error-files',
    ]);

    // Test 5: Cambiar configuración de procesamiento
    log('\n⚙️ Test 5: Cambiar configuración de procesamiento', 'blue');
    await runCommand(executablePath, [
      '--batch-size',
      '200',
      '--log-level',
      'debug',
    ]);

    // Test 6: Cambiar configuración de logs
    log('\n📝 Test 6: Cambiar configuración de logs', 'blue');
    await runCommand(executablePath, [
      '--log-file',
      './test-logs/app.log',
      '--log-console',
      'false',
      '--log-performance',
      'true',
    ]);

    // Test 7: Verificar configuración actualizada
    log('\n✅ Test 7: Verificar configuración actualizada', 'blue');
    await runCommand(executablePath, ['--config']);

    // Test 8: Probar validación de errores
    log('\n🚫 Test 8: Probar validación de errores', 'blue');
    try {
      await runCommand(executablePath, ['--db-port', 'invalid']);
    } catch (error) {
      log('✅ Error esperado capturado correctamente', 'green');
    }

    try {
      await runCommand(executablePath, ['--log-level', 'invalid']);
    } catch (error) {
      log('✅ Error esperado capturado correctamente', 'green');
    }

    // Test 9: Modo dry-run con nueva configuración
    log('\n🔍 Test 9: Modo dry-run con nueva configuración', 'blue');
    await runCommand(executablePath, ['--dry-run']);

    log('\n🎉 Todas las pruebas completadas exitosamente!', 'green');
  } catch (error) {
    log(`❌ Error durante las pruebas: ${error.message}`, 'red');
    if (error.stdout) log(`STDOUT: ${error.stdout}`, 'yellow');
    if (error.stderr) log(`STDERR: ${error.stderr}`, 'yellow');
  } finally {
    // Restaurar configuración original
    const envPath = path.join(__dirname, '..', '.env');
    const backupPath = path.join(__dirname, '..', '.env.backup');

    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, envPath);
      fs.unlinkSync(backupPath);
      log('\n🔄 Configuración original restaurada', 'yellow');
    }
  }
}

// Ejecutar pruebas
if (require.main === module) {
  testEnvConfiguration().catch(console.error);
}

module.exports = { testEnvConfiguration };
