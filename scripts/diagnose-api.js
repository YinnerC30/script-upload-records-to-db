#!/usr/bin/env node

/**
 * Script de diagnóstico para identificar problemas de conexión con la API
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Función para cargar variables de entorno
function loadEnvVars() {
  const envPath = path.join(process.cwd(), '.env');
  const envVars = {};

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=');
        }
      }
    });
  }

  return envVars;
}

// Función para probar conectividad básica
async function testBasicConnectivity(url) {
  console.log(`🔍 Probando conectividad básica a: ${url}`);

  try {
    const response = await axios.get(url, { timeout: 5000 });
    console.log(`✅ Conectividad exitosa - Status: ${response.status}`);
    return true;
  } catch (error) {
    console.log(`❌ Error de conectividad: ${error.message}`);

    if (error.code === 'ECONNREFUSED') {
      console.log('   💡 El servidor no está ejecutándose en ese puerto');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   💡 El dominio no se puede resolver');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   💡 La conexión se agotó por tiempo');
    }

    return false;
  }
}

// Función para probar endpoint específico
async function testEndpoint(baseURL, endpoint) {
  const fullURL = `${baseURL}${endpoint}`;
  console.log(`🔍 Probando endpoint: ${fullURL}`);

  try {
    // Probar con POST vacío
    const response = await axios.post(
      fullURL,
      {},
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Endpoint responde - Status: ${response.status}`);
    console.log(`   📄 Headers:`, response.headers);

    if (response.data) {
      console.log(
        `   📦 Response data:`,
        JSON.stringify(response.data, null, 2)
      );
    }

    return true;
  } catch (error) {
    console.log(`❌ Error en endpoint: ${error.message}`);

    if (error.response) {
      console.log(`   📊 Status: ${error.response.status}`);
      console.log(`   📄 Headers:`, error.response.headers);
      console.log(
        `   📦 Error data:`,
        JSON.stringify(error.response.data, null, 2)
      );
    }

    return false;
  }
}

// Función para probar con datos reales
async function testWithRealData(baseURL, endpoint) {
  const testData = {
    licitacion_id: 'TEST-001-2024',
    nombre: 'Prueba de API',
    fecha_publicacion: '2024-01-01 10:00',
    fecha_cierre: '2024-01-31 18:00',
    organismo: 'Organismo de Prueba',
    unidad: 'Unidad de Prueba',
    monto_disponible: 1000000,
    moneda: 'CLP',
    estado: 'Publicada',
  };

  const fullURL = `${baseURL}${endpoint}`;
  console.log(`🔍 Probando con datos reales: ${fullURL}`);

  try {
    const response = await axios.post(fullURL, testData, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`✅ Datos enviados exitosamente - Status: ${response.status}`);
    console.log(`   📦 Response:`, JSON.stringify(response.data, null, 2));

    return true;
  } catch (error) {
    console.log(`❌ Error enviando datos: ${error.message}`);

    if (error.response) {
      console.log(`   📊 Status: ${error.response.status}`);
      console.log(
        `   📦 Error details:`,
        JSON.stringify(error.response.data, null, 2)
      );
    }

    return false;
  }
}

// Función principal de diagnóstico
async function diagnoseAPI() {
  console.log('🔧 Diagnóstico de API REST\n');

  // Cargar variables de entorno
  const envVars = loadEnvVars();
  const baseURL = envVars.API_BASE_URL || 'http://localhost:3000/api';
  const apiKey = envVars.API_KEY;
  const timeout = parseInt(envVars.API_TIMEOUT || '30000');

  console.log('📋 Configuración detectada:');
  console.log(`   🌐 Base URL: ${baseURL}`);
  console.log(`   🔑 API Key: ${apiKey ? 'Configurada' : 'No configurada'}`);
  console.log(`   ⏱️  Timeout: ${timeout}ms`);
  console.log(
    `   📁 Archivo .env: ${
      fs.existsSync('.env') ? 'Encontrado' : 'No encontrado'
    }\n`
  );

  // 1. Probar conectividad básica
  console.log('1️⃣ PRUEBA DE CONECTIVIDAD BÁSICA');
  console.log('='.repeat(50));
  const basicConnectivity = await testBasicConnectivity(baseURL);

  if (!basicConnectivity) {
    console.log('\n💡 RECOMENDACIONES:');
    console.log('   • Verifica que el servidor esté ejecutándose');
    console.log('   • Confirma la URL correcta en API_BASE_URL');
    console.log('   • Verifica que el puerto esté abierto');
    console.log('   • Revisa el firewall y configuración de red');
    return;
  }

  // 2. Probar endpoint específico
  console.log('\n2️⃣ PRUEBA DE ENDPOINT ESPECÍFICO');
  console.log('='.repeat(50));
  const endpointTest = await testEndpoint(baseURL, '/up_compra.php');

  if (!endpointTest) {
    console.log('\n💡 RECOMENDACIONES:');
    console.log('   • Verifica que el endpoint /up_compra.php exista');
    console.log('   • Confirma la ruta correcta del endpoint');
    console.log('   • Revisa la configuración del servidor web');
  }

  // 3. Probar con datos reales
  console.log('\n3️⃣ PRUEBA CON DATOS REALES');
  console.log('='.repeat(50));
  const dataTest = await testWithRealData(baseURL, '/up_compra.php');

  if (!dataTest) {
    console.log('\n💡 RECOMENDACIONES:');
    console.log('   • Verifica el formato de datos esperado por la API');
    console.log('   • Revisa la validación de datos en el servidor');
    console.log(
      '   • Confirma que todos los campos requeridos estén presentes'
    );
  }

  // 4. Resumen final
  console.log('\n📊 RESUMEN DEL DIAGNÓSTICO');
  console.log('='.repeat(50));
  console.log(
    `   🔗 Conectividad básica: ${basicConnectivity ? '✅ OK' : '❌ FALLA'}`
  );
  console.log(
    `   🎯 Endpoint específico: ${endpointTest ? '✅ OK' : '❌ FALLA'}`
  );
  console.log(`   📤 Envío de datos: ${dataTest ? '✅ OK' : '❌ FALLA'}`);

  if (basicConnectivity && endpointTest && dataTest) {
    console.log('\n🎉 ¡La API está funcionando correctamente!');
  } else {
    console.log('\n⚠️  Se detectaron problemas que requieren atención');
  }
}

// Ejecutar diagnóstico si el script se ejecuta directamente
if (require.main === module) {
  diagnoseAPI().catch(console.error);
}

module.exports = { diagnoseAPI };
