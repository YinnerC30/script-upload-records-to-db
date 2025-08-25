#!/usr/bin/env node

/**
 * Script consolidado para pruebas de API REST
 * Combina funcionalidad de test-api-simple.js y test-api-integration.js
 */

const axios = require('axios');
const { ApiService } = require('../../dist/services/ApiService');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Datos de prueba
const TEST_DATA = [
  {
    licitacion_id: '5178-4406-COT25',
    nombre: '400145/B5/SP 1010890/IZ (SERVICIO DE COFFE)',
    fecha_publicacion: '2025-08-22 21:00',
    fecha_cierre: '2025-08-25 20:00',
    organismo: 'UNIVERSIDAD DE CHILE',
    unidad: 'UCHILE Facultad Medicina (5178)',
    monto_disponible: 650000,
    moneda: 'CLP',
    estado: 'Publicada',
  },
  {
    licitacion_id: 'LIC-002-2024',
    nombre: 'Servicios de mantenimiento de software',
    fecha_publicacion: '2024-01-20 10:00',
    fecha_cierre: '2024-02-20 18:00',
    organismo: 'Ministerio de Tecnología',
    unidad: 'Dirección de Sistemas',
    monto_disponible: 25000000,
    moneda: 'CLP',
    estado: 'Abierta',
  },
];

class ApiTester {
  constructor() {
    this.apiService = new ApiService();
  }

  async testBasicConnectivity() {
    console.log('1️⃣ Probando conectividad básica...');
    try {
      const response = await axios.get(API_BASE_URL, { timeout: 10000 });
      console.log(`✅ Conectividad OK - Status: ${response.status}`);
      return true;
    } catch (error) {
      console.log(`❌ Error de conectividad: ${error.message}`);
      return false;
    }
  }

  async testSimpleEndpoint() {
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

    try {
      const response = await axios.post(
        `${API_BASE_URL}/up_compra.php`,
        testData,
        {
          timeout: 15000,
          headers: { 'Content-Type': 'application/json' },
        }
      );
      console.log(
        `✅ Datos enviados exitosamente - Status: ${response.status}`
      );
      console.log(`🆔 ID único usado: ${uniqueId}`);
      return true;
    } catch (error) {
      console.log(`❌ Error enviando datos: ${error.message}`);
      return false;
    }
  }

  async testApiService() {
    console.log('3️⃣ Probando ApiService...');
    try {
      const isHealthy = await this.apiService.checkApiHealth();
      console.log(`✅ API Service - Health: ${isHealthy ? 'OK' : 'FAIL'}`);
      return isHealthy;
    } catch (error) {
      console.log(`❌ Error en ApiService: ${error.message}`);
      return false;
    }
  }

  async testIndividualOperations() {
    console.log('  🔄 Probando operaciones individuales...');
    try {
      const licitacion = this.createTestLicitacion();
      const response = await this.apiService.sendLicitacion(licitacion);
      return response.success;
    } catch (error) {
      console.error('    ❌ Error en operaciones individuales:', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🧪 Iniciando pruebas completas de API REST\n');
    console.log(`🌐 URL: ${API_BASE_URL}\n`);

    const results = {
      connectivity: await this.testBasicConnectivity(),
      simple: await this.testSimpleEndpoint(),
      service: await this.testApiService(),
      individual: await this.testIndividualOperations(),
    };

    console.log('\n📊 RESUMEN DE PRUEBAS');
    console.log('='.repeat(50));
    console.log(
      `🔗 Conectividad básica: ${results.connectivity ? '✅ OK' : '❌ FALLA'}`
    );
    console.log(`🎯 Endpoint simple: ${results.simple ? '✅ OK' : '❌ FALLA'}`);
    console.log(`🔧 ApiService: ${results.service ? '✅ OK' : '❌ FALLA'}`);
    console.log(
      `📋 Operaciones individuales: ${
        results.individual ? '✅ OK' : '❌ FALLA'
      }`
    );

    const allPassed = Object.values(results).every((result) => result);
    if (allPassed) {
      console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    } else {
      console.log('\n⚠️  Algunas pruebas fallaron. Revisa la configuración.');
    }

    return allPassed;
  }

  async runQuickTest() {
    console.log('⚡ Prueba rápida de API REST\n');
    console.log(`🌐 URL: ${API_BASE_URL}\n`);

    const connectivity = await this.testBasicConnectivity();
    if (!connectivity) {
      console.log('\n❌ La API no está disponible');
      return false;
    }

    const simple = await this.testSimpleEndpoint();
    console.log(
      `\n${simple ? '✅' : '❌'} Prueba rápida ${
        simple ? 'exitosa' : 'fallida'
      }`
    );
    return simple;
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const tester = new ApiTester();

  try {
    if (args.includes('--quick') || args.includes('-q')) {
      await tester.runQuickTest();
    } else {
      await tester.runAllTests();
    }
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { ApiTester };
