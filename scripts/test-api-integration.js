#!/usr/bin/env node

/**
 * Script de prueba para verificar la integración con la API REST
 * Este script simula el procesamiento de un archivo Excel y envía datos a la API
 */

const { ExcelProcessor } = require('../dist/services/ExcelProcessor');
const { ApiService } = require('../dist/services/ApiService');

// Mock de datos de prueba
const mockExcelData = [
  {
    licitacion_id: '5178-4406-COT25',
    nombre: '400145/B5/SP 1010890/IZ (SERVICIO DE COFFE)',
    fecha_publicacion: '2025-08-22 21:00',
    fecha_cierre: '2025-08-25 20:00',
    organismo: 'UNIVERSIDAD DE CHILE',
    unidad: 'UCHILE Facultad Medicina (5178)',
    monto_disponible: 650000,
    moneda: 'CLP',
    estado: 'Publicada'
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
    estado: 'Abierta'
  }
];

async function testApiIntegration() {
  console.log('🧪 Iniciando prueba de integración con API REST...\n');

  try {
    // 1. Probar conectividad con la API
    console.log('1️⃣ Verificando conectividad con la API...');
    const apiService = new ApiService();
    const isHealthy = await apiService.checkApiHealth();
    
    if (isHealthy) {
      console.log('✅ API REST disponible');
    } else {
      console.log('⚠️  API REST no disponible - ejecutando en modo simulación');
    }

    // 2. Probar envío de datos individuales
    console.log('\n2️⃣ Probando envío de datos individuales...');
    for (const data of mockExcelData) {
      try {
        if (isHealthy) {
          const response = await apiService.sendLicitacion(data);
          console.log(`✅ Licitación ${data.licitacion_id} enviada:`, response.success);
        } else {
          console.log(`🔍 [SIMULACIÓN] Licitación ${data.licitacion_id} sería enviada`);
        }
      } catch (error) {
        console.log(`❌ Error enviando licitación ${data.licitacion_id}:`, error.message);
      }
    }

    // 3. Probar envío de lote
    console.log('\n3️⃣ Probando envío de lote...');
    try {
      if (isHealthy) {
        const response = await apiService.sendLicitacionesBatch(mockExcelData, 1);
        console.log('✅ Lote enviado:', response.success);
        console.log(`   📊 Éxitos: ${response.data.successCount}, Errores: ${response.data.errorCount}`);
      } else {
        console.log('🔍 [SIMULACIÓN] Lote sería enviado');
      }
    } catch (error) {
      console.log('❌ Error enviando lote:', error.message);
    }

    // 4. Probar verificación de existencia
    console.log('\n4️⃣ Probando verificación de existencia...');
    try {
      if (isHealthy) {
        const exists = await apiService.checkLicitacionExists('5178-4406-COT25');
        console.log('✅ Verificación de existencia:', exists);
      } else {
        console.log('🔍 [SIMULACIÓN] Verificación de existencia sería ejecutada');
      }
    } catch (error) {
      console.log('❌ Error verificando existencia:', error.message);
    }

    // 5. Probar obtención de estadísticas
    console.log('\n5️⃣ Probando obtención de estadísticas...');
    try {
      if (isHealthy) {
        const stats = await apiService.getApiStats();
        console.log('✅ Estadísticas obtenidas:', stats);
      } else {
        console.log('🔍 [SIMULACIÓN] Estadísticas serían obtenidas');
      }
    } catch (error) {
      console.log('❌ Error obteniendo estadísticas:', error.message);
    }

    console.log('\n🎉 Prueba de integración completada');
    console.log('\n📋 Resumen:');
    console.log(`   🌐 API disponible: ${isHealthy ? 'Sí' : 'No'}`);
    console.log(`   📊 Datos de prueba: ${mockExcelData.length} registros`);
    console.log(`   🔧 Modo: ${isHealthy ? 'Real' : 'Simulación'}`);

  } catch (error) {
    console.error('❌ Error en la prueba de integración:', error);
    process.exit(1);
  }
}

// Ejecutar prueba si el script se ejecuta directamente
if (require.main === module) {
  testApiIntegration();
}

module.exports = { testApiIntegration };
