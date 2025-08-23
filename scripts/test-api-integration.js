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
    idLicitacion: 'LIC-001-2024',
    nombre: 'Adquisición de equipos informáticos',
    fechaPublicacion: '2024-01-15',
    fechaCierre: '2024-02-15',
    organismo: 'Ministerio de Tecnología',
    unidad: 'Dirección de Informática',
    montoDisponible: 50000000,
    moneda: 'CLP',
    estado: 'Abierta'
  },
  {
    idLicitacion: 'LIC-002-2024',
    nombre: 'Servicios de mantenimiento de software',
    fechaPublicacion: '2024-01-20',
    fechaCierre: '2024-02-20',
    organismo: 'Ministerio de Tecnología',
    unidad: 'Dirección de Sistemas',
    montoDisponible: 25000000,
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
        const licitacionData = {
          idLicitacion: data.idLicitacion,
          nombre: data.nombre,
          fechaPublicacion: new Date(data.fechaPublicacion).toISOString(),
          fechaCierre: new Date(data.fechaCierre).toISOString(),
          organismo: data.organismo,
          unidad: data.unidad,
          montoDisponible: data.montoDisponible,
          moneda: data.moneda,
          estado: data.estado,
          fileName: 'test-file.xlsx',
          processedAt: new Date().toISOString()
        };

        if (isHealthy) {
          const response = await apiService.sendLicitacion(licitacionData);
          console.log(`✅ Licitación ${data.idLicitacion} enviada:`, response.success);
        } else {
          console.log(`🔍 [SIMULACIÓN] Licitación ${data.idLicitacion} sería enviada`);
        }
      } catch (error) {
        console.log(`❌ Error enviando licitación ${data.idLicitacion}:`, error.message);
      }
    }

    // 3. Probar envío de lote
    console.log('\n3️⃣ Probando envío de lote...');
    try {
      const licitacionesBatch = mockExcelData.map(data => ({
        idLicitacion: data.idLicitacion,
        nombre: data.nombre,
        fechaPublicacion: new Date(data.fechaPublicacion).toISOString(),
        fechaCierre: new Date(data.fechaCierre).toISOString(),
        organismo: data.organismo,
        unidad: data.unidad,
        montoDisponible: data.montoDisponible,
        moneda: data.moneda,
        estado: data.estado,
        fileName: 'test-batch.xlsx',
        processedAt: new Date().toISOString()
      }));

      if (isHealthy) {
        const response = await apiService.sendLicitacionesBatch(licitacionesBatch, 1);
        console.log('✅ Lote enviado:', response.success);
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
        const exists = await apiService.checkLicitacionExists('LIC-001-2024');
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
