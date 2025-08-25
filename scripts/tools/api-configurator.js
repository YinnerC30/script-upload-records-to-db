#!/usr/bin/env node

/**
 * Script interactivo para configurar la API REST
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Crear interfaz de lectura
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Función para hacer preguntas
function askQuestion(question, defaultValue = '') {
  return new Promise((resolve) => {
    const prompt = defaultValue
      ? `${question} (${defaultValue}): `
      : `${question}: `;
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

// Función para validar URL
function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Función para crear/actualizar archivo .env
function updateEnvFile(updates) {
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';

  // Leer archivo .env existente si existe
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else {
    // Crear contenido básico si no existe
    envContent = `# Configuración de API REST
API_BASE_URL=http://localhost:3000/api
API_KEY=your-api-key-here
API_TIMEOUT=30000
API_RETRY_ATTEMPTS=3

# Configuración del Directorio de Archivos
EXCEL_DIRECTORY=./excel-files
PROCESSED_DIRECTORY=./processed-files
ERROR_DIRECTORY=./error-files

# Configuración de Logs Mejorada
LOG_LEVEL=info
LOG_FILE=./logs/app.log
LOG_MAX_SIZE=5242880
LOG_MAX_FILES=5
LOG_RETENTION_DAYS=30

# Configuración del Procesamiento
BATCH_SIZE=100
`;
  }

  // Dividir el contenido en líneas
  const lines = envContent.split('\n');
  const updatedLines = [];
  const updatedKeys = new Set();

  // Procesar cada línea
  for (const line of lines) {
    const trimmedLine = line.trim();

    // Si es un comentario o línea vacía, mantenerla
    if (trimmedLine.startsWith('#') || trimmedLine === '') {
      updatedLines.push(line);
      continue;
    }

    // Buscar variable de entorno
    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex === -1) {
      updatedLines.push(line);
      continue;
    }

    const key = trimmedLine.substring(0, equalIndex).trim();

    // Si esta variable está en las actualizaciones, reemplazarla
    if (updates[key] !== undefined) {
      updatedLines.push(`${key}=${updates[key]}`);
      updatedKeys.add(key);
    } else {
      updatedLines.push(line);
    }
  }

  // Agregar variables nuevas que no existían
  for (const [key, value] of Object.entries(updates)) {
    if (!updatedKeys.has(key)) {
      updatedLines.push(`${key}=${value}`);
    }
  }

  // Escribir el archivo actualizado
  const updatedContent = updatedLines.join('\n');
  fs.writeFileSync(envPath, updatedContent, 'utf8');

  return envPath;
}

// Función principal de configuración
async function configureAPI() {
  console.log('🔧 Configuración de API REST\n');
  console.log(
    'Este script te ayudará a configurar la conexión con tu API REST.\n'
  );

  try {
    // 1. Configurar URL base
    console.log('1️⃣ CONFIGURACIÓN DE URL BASE');
    console.log('='.repeat(40));

    let apiBaseURL = await askQuestion(
      'Ingresa la URL base de tu API REST',
      'http://localhost:3000/api'
    );

    // Validar URL
    while (!isValidURL(apiBaseURL)) {
      console.log('❌ URL inválida. Por favor ingresa una URL válida.');
      apiBaseURL = await askQuestion(
        'Ingresa la URL base de tu API REST',
        'http://localhost:3000/api'
      );
    }

    console.log(`✅ URL configurada: ${apiBaseURL}\n`);

    // 2. Configurar API Key (opcional)
    console.log('2️⃣ CONFIGURACIÓN DE API KEY');
    console.log('='.repeat(40));

    const hasApiKey = await askQuestion(
      '¿Tu API requiere una clave de autenticación? (s/n)',
      'n'
    );

    let apiKey = '';
    if (hasApiKey.toLowerCase() === 's' || hasApiKey.toLowerCase() === 'si') {
      apiKey = await askQuestion('Ingresa tu API Key');
      console.log('✅ API Key configurada\n');
    } else {
      console.log('ℹ️  No se configurará API Key\n');
    }

    // 3. Configurar timeout
    console.log('3️⃣ CONFIGURACIÓN DE TIMEOUT');
    console.log('='.repeat(40));

    let timeout = await askQuestion(
      'Ingresa el timeout en milisegundos para las peticiones',
      '30000'
    );

    // Validar que sea un número
    while (isNaN(parseInt(timeout))) {
      console.log('❌ Timeout inválido. Debe ser un número.');
      timeout = await askQuestion(
        'Ingresa el timeout en milisegundos para las peticiones',
        '30000'
      );
    }

    console.log(`✅ Timeout configurado: ${timeout}ms\n`);

    // 4. Configurar intentos de reintento
    console.log('4️⃣ CONFIGURACIÓN DE REINTENTOS');
    console.log('='.repeat(40));

    let retryAttempts = await askQuestion(
      'Ingresa el número de intentos de reintento',
      '3'
    );

    // Validar que sea un número
    while (isNaN(parseInt(retryAttempts))) {
      console.log('❌ Número de intentos inválido. Debe ser un número.');
      retryAttempts = await askQuestion(
        'Ingresa el número de intentos de reintento',
        '3'
      );
    }

    console.log(`✅ Intentos de reintento configurados: ${retryAttempts}\n`);

    // 5. Guardar configuración
    console.log('5️⃣ GUARDANDO CONFIGURACIÓN');
    console.log('='.repeat(40));

    const updates = {
      API_BASE_URL: apiBaseURL,
      API_KEY: apiKey,
      API_TIMEOUT: timeout,
      API_RETRY_ATTEMPTS: retryAttempts,
    };

    const envPath = updateEnvFile(updates);

    console.log(`✅ Configuración guardada en: ${envPath}`);
    console.log('\n📋 Resumen de la configuración:');
    console.log(`   🌐 Base URL: ${apiBaseURL}`);
    console.log(`   🔑 API Key: ${apiKey ? 'Configurada' : 'No configurada'}`);
    console.log(`   ⏱️  Timeout: ${timeout}ms`);
    console.log(`   🔄 Reintentos: ${retryAttempts}`);

    // 6. Preguntar si quiere probar la conexión
    console.log('\n6️⃣ PRUEBA DE CONEXIÓN');
    console.log('='.repeat(40));

    const testConnection = await askQuestion(
      '¿Quieres probar la conexión con la API ahora? (s/n)',
      's'
    );

    if (
      testConnection.toLowerCase() === 's' ||
      testConnection.toLowerCase() === 'si'
    ) {
      console.log('\n🔍 Probando conexión...');

      // Importar y ejecutar el script de diagnóstico
      const { diagnoseAPI } = require('./diagnose-api');
      await diagnoseAPI();
    }

    console.log('\n🎉 Configuración completada exitosamente!');
    console.log('\n💡 Próximos pasos:');
    console.log(
      '   • Ejecuta el script principal para procesar archivos Excel'
    );
    console.log(
      '   • Si tienes problemas, ejecuta: node scripts/diagnose-api.js'
    );
    console.log('   • Revisa los logs en ./logs/ para más detalles');
  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
  } finally {
    rl.close();
  }
}

// Ejecutar configuración si el script se ejecuta directamente
if (require.main === module) {
  configureAPI();
}

module.exports = { configureAPI };
