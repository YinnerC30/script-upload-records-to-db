#!/usr/bin/env node

/**
 * Script de prueba simple para la API REST
 */

const axios = require('axios');

const API_BASE_URL = 'https://apicompra.licita.me';

async function testAPI() {
  console.log('🧪 Prueba simple de API REST\n');
  console.log(`🌐 URL: ${API_BASE_URL}\n`);

  try {
    // 1. Probar conectividad básica
    console.log('1️⃣ Probando conectividad básica...');
    const healthResponse = await axios.get(API_BASE_URL, { timeout: 10000 });
    console.log(`✅ Conectividad OK - Status: ${healthResponse.status}\n`);

    // 2. Probar endpoint con datos únicos
    console.log('2️⃣ Probando endpoint con datos únicos...');
    const uniqueId = `TEST_${Date.now()}`;
    const testData = {
      licitacion_id: uniqueId,
      nombre: 'Prueba de API',
      fecha_publicacion: '2024-01-01 10:00',
      fecha_cierre: '2024-01-31 18:00',
      organismo: 'Organismo de Prueba',
      unidad: 'Unidad de Prueba',
      monto_disponible: 1000000,
      moneda: 'CLP',
      estado: 'Publicada',
    };

    const response = await axios.post(
      `${API_BASE_URL}/up_compra.php`,
      testData,
      {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Datos enviados exitosamente - Status: ${response.status}`);
    console.log(`📦 Response:`, JSON.stringify(response.data, null, 2));
    console.log(`🆔 ID único usado: ${uniqueId}\n`);

    // 3. Probar con datos reales de ejemplo
    console.log('3️⃣ Probando con datos reales...');
    const realData = [
      {
        licitacion_id: `REAL_${Date.now()}_1`,
        nombre: 'Servicios de mantenimiento informático',
        fecha_publicacion: '2024-01-15 09:00',
        fecha_cierre: '2024-02-15 17:00',
        organismo: 'Ministerio de Tecnología',
        unidad: 'Dirección de Sistemas',
        monto_disponible: 50000000,
        moneda: 'CLP',
        estado: 'Abierta',
      },
      {
        licitacion_id: `REAL_${Date.now()}_2`,
        nombre: 'Suministro de equipos de oficina',
        fecha_publicacion: '2024-01-20 10:00',
        fecha_cierre: '2024-02-20 18:00',
        organismo: 'Servicio Público',
        unidad: 'Administración',
        monto_disponible: 15000000,
        moneda: 'CLP',
        estado: 'Publicada',
      },
    ];

    for (let i = 0; i < realData.length; i++) {
      const data = realData[i];
      try {
        const realResponse = await axios.post(
          `${API_BASE_URL}/up_compra.php`,
          data,
          {
            timeout: 15000,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        console.log(`✅ Licitación ${i + 1} enviada: ${data.licitacion_id}`);
        console.log(
          `   Status: ${realResponse.status}, Success: ${realResponse.data.success}`
        );
      } catch (error) {
        console.log(
          `❌ Error en licitación ${i + 1}: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }

    console.log('\n🎉 ¡Prueba completada exitosamente!');
    console.log('✅ La API está funcionando correctamente');
    console.log(
      '✅ Puedes usar el script principal para procesar archivos Excel'
    );
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);

    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📦 Data:', JSON.stringify(error.response.data, null, 2));
    }

    process.exit(1);
  }
}

// Ejecutar prueba
testAPI();
