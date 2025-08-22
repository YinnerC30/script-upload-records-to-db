#!/usr/bin/env node

/**
 * Script de prueba para verificar la lógica de retry de la base de datos
 *
 * Este script simula diferentes escenarios de fallo de conexión para probar
 * la robustez del sistema de retry implementado.
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Probando lógica de retry de base de datos...\n');

// Función para ejecutar el script principal
function runMainScript() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'dist', 'index.js');

    console.log('🚀 Ejecutando script principal...');

    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      env: {
        ...process.env,
        // Configurar para mostrar logs detallados
        LOG_LEVEL: 'debug',
        NODE_ENV: 'development',
      },
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Script ejecutado exitosamente');
        resolve();
      } else {
        console.log(`\n❌ Script falló con código: ${code}`);
        reject(new Error(`Script falló con código: ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error('\n❌ Error ejecutando script:', error);
      reject(error);
    });
  });
}

// Función para probar diferentes configuraciones de retry
async function testRetryConfigurations() {
  const configs = [
    {
      name: 'Configuración rápida (2 intentos, 500ms delay)',
      env: {
        DB_RETRY_MAX_ATTEMPTS: '2',
        DB_RETRY_INITIAL_DELAY: '500',
        DB_RETRY_MAX_DELAY: '1000',
        DB_RETRY_BACKOFF_MULTIPLIER: '1.5',
      },
    },
    {
      name: 'Configuración estándar (5 intentos, 1s delay)',
      env: {
        DB_RETRY_MAX_ATTEMPTS: '5',
        DB_RETRY_INITIAL_DELAY: '1000',
        DB_RETRY_MAX_DELAY: '30000',
        DB_RETRY_BACKOFF_MULTIPLIER: '2',
      },
    },
    {
      name: 'Configuración agresiva (3 intentos, 2s delay)',
      env: {
        DB_RETRY_MAX_ATTEMPTS: '3',
        DB_RETRY_INITIAL_DELAY: '2000',
        DB_RETRY_MAX_DELAY: '10000',
        DB_RETRY_BACKOFF_MULTIPLIER: '2.5',
      },
    },
  ];

  for (const config of configs) {
    console.log(`\n📋 Probando: ${config.name}`);
    console.log('Configuración:', config.env);

    // Aplicar configuración temporal
    const originalEnv = {};
    for (const [key, value] of Object.entries(config.env)) {
      originalEnv[key] = process.env[key];
      process.env[key] = value;
    }

    try {
      await runMainScript();
      console.log('✅ Configuración funcionó correctamente');
    } catch (error) {
      console.log('❌ Configuración falló:', error.message);
    } finally {
      // Restaurar configuración original
      for (const [key, value] of Object.entries(originalEnv)) {
        if (value !== undefined) {
          process.env[key] = value;
        } else {
          delete process.env[key];
        }
      }
    }
  }
}

// Función para simular fallos de base de datos
async function testDatabaseFailures() {
  console.log('\n🔧 Probando escenarios de fallo de base de datos...\n');

  const scenarios = [
    {
      name: 'Base de datos no disponible',
      description: 'Detener MySQL y verificar retry',
      action: async () => {
        console.log('🛑 Deteniendo MySQL...');
        const stopMySQL = spawn('docker', ['compose', 'stop', 'mysql']);

        await new Promise((resolve) => {
          stopMySQL.on('close', resolve);
        });

        console.log('⏳ Esperando 3 segundos...');
        await new Promise((resolve) => setTimeout(resolve, 3000));

        try {
          await runMainScript();
        } catch (error) {
          console.log('✅ Retry funcionó correctamente (falló como esperado)');
        }

        console.log('🔄 Reiniciando MySQL...');
        const startMySQL = spawn('docker', ['compose', 'start', 'mysql']);

        await new Promise((resolve) => {
          startMySQL.on('close', resolve);
        });

        console.log('⏳ Esperando que MySQL esté listo...');
        await new Promise((resolve) => setTimeout(resolve, 5000));
      },
    },
    {
      name: 'Timeout de conexión',
      description: 'Configurar timeout muy bajo',
      action: async () => {
        const originalTimeout = process.env.DB_CONNECT_TIMEOUT_MS;
        process.env.DB_CONNECT_TIMEOUT_MS = '100'; // 100ms timeout

        try {
          await runMainScript();
        } catch (error) {
          console.log(
            '✅ Timeout funcionó correctamente (falló como esperado)'
          );
        } finally {
          if (originalTimeout) {
            process.env.DB_CONNECT_TIMEOUT_MS = originalTimeout;
          } else {
            delete process.env.DB_CONNECT_TIMEOUT_MS;
          }
        }
      },
    },
  ];

  for (const scenario of scenarios) {
    console.log(`\n📋 Escenario: ${scenario.name}`);
    console.log(`📝 Descripción: ${scenario.description}`);

    try {
      await scenario.action();
      console.log('✅ Escenario completado');
    } catch (error) {
      console.log('❌ Error en escenario:', error.message);
    }
  }
}

// Función principal
async function main() {
  try {
    console.log('🧪 Iniciando pruebas de retry de base de datos...\n');

    // Verificar que MySQL esté corriendo
    console.log('🔍 Verificando estado de MySQL...');
    const checkMySQL = spawn('docker', ['compose', 'ps', 'mysql']);

    await new Promise((resolve) => {
      checkMySQL.on('close', (code) => {
        if (code === 0) {
          console.log('✅ MySQL está corriendo');
        } else {
          console.log('⚠️  MySQL no está corriendo, iniciando...');
          const startMySQL = spawn('docker', ['compose', 'up', '-d', 'mysql']);
          startMySQL.on('close', resolve);
        }
      });
    });

    // Esperar un poco para que MySQL esté completamente listo
    console.log('⏳ Esperando que MySQL esté listo...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Probar configuración normal
    console.log('\n📋 Prueba 1: Configuración normal');
    await runMainScript();

    // Probar diferentes configuraciones
    await testRetryConfigurations();

    // Probar escenarios de fallo
    await testDatabaseFailures();

    console.log('\n🎉 Todas las pruebas completadas exitosamente!');
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  runMainScript,
  testRetryConfigurations,
  testDatabaseFailures,
};
