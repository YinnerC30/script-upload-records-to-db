const { ExcelProcessor } = require('../dist/services/ExcelProcessor');

async function testImprovedValidations() {
  console.log('🧪 Probando validaciones mejoradas del ExcelProcessor\n');

  const processor = new ExcelProcessor();

  // Datos de prueba con diferentes escenarios
  const testCases = [
    {
      name: '✅ Datos válidos completos',
      data: [{
        idLicitacion: 'LIC-2024-001',
        nombre: 'Licitación de servicios informáticos',
        fechaPublicacion: '2024-01-15',
        fechaCierre: '2024-02-15',
        organismo: 'Ministerio de Tecnología',
        unidad: 'Dirección de Sistemas',
        montoDisponible: 50000.00,
        moneda: 'USD',
        estado: 'Activa'
      }],
      expectedValid: true
    },
    {
      name: '❌ Sin idLicitacion (campo obligatorio)',
      data: [{
        nombre: 'Licitación sin ID',
        organismo: 'Organismo Test',
        unidad: 'Unidad Test'
      }],
      expectedValid: false
    },
    {
      name: '❌ Sin nombre (campo obligatorio)',
      data: [{
        idLicitacion: 'LIC-2024-002',
        organismo: 'Organismo Test',
        unidad: 'Unidad Test'
      }],
      expectedValid: false
    },
    {
      name: '❌ Fechas inválidas',
      data: [{
        idLicitacion: 'LIC-2024-003',
        nombre: 'Licitación con fechas inválidas',
        organismo: 'Organismo Test',
        unidad: 'Unidad Test',
        fechaPublicacion: 'fecha-invalida',
        fechaCierre: 'otra-fecha-invalida'
      }],
      expectedValid: false
    },
    {
      name: '❌ Rango de fechas inválido (cierre antes que publicación)',
      data: [{
        idLicitacion: 'LIC-2024-004',
        nombre: 'Licitación con rango inválido',
        organismo: 'Organismo Test',
        unidad: 'Unidad Test',
        fechaPublicacion: '2024-02-15',
        fechaCierre: '2024-01-15'
      }],
      expectedValid: false
    },
    {
      name: '❌ Monto inválido',
      data: [{
        idLicitacion: 'LIC-2024-005',
        nombre: 'Licitación con monto inválido',
        organismo: 'Organismo Test',
        unidad: 'Unidad Test',
        montoDisponible: 'no-es-numero'
      }],
      expectedValid: false
    },
    {
      name: '❌ Campos que exceden límites de longitud',
      data: [{
        idLicitacion: 'LIC-2024-006',
        nombre: 'A'.repeat(501), // Excede límite de 500
        organismo: 'Organismo Test',
        unidad: 'Unidad Test'
      }],
      expectedValid: false
    },
    {
      name: '✅ Datos mínimos válidos (solo campos obligatorios)',
      data: [{
        idLicitacion: 'LIC-2024-007',
        nombre: 'Licitación mínima',
        organismo: 'Organismo Test',
        unidad: 'Unidad Test'
      }],
      expectedValid: true
    },
    {
      name: '✅ Campos opcionales vacíos',
      data: [{
        idLicitacion: 'LIC-2024-008',
        nombre: 'Licitación con campos opcionales',
        organismo: 'Organismo Test',
        unidad: 'Unidad Test',
        fechaPublicacion: '',
        fechaCierre: '',
        montoDisponible: '',
        moneda: '',
        estado: ''
      }],
      expectedValid: true
    },
    {
      name: '❌ Fila undefined',
      data: [
        {
          idLicitacion: 'LIC-2024-009',
          nombre: 'Licitación válida',
          organismo: 'Organismo Test',
          unidad: 'Unidad Test'
        },
        undefined,
        {
          idLicitacion: 'LIC-2024-010',
          nombre: 'Otra licitación válida',
          organismo: 'Organismo Test 2',
          unidad: 'Unidad Test 2'
        }
      ],
      expectedValid: false
    }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    console.log(`\n${testCase.name}`);
    console.log('─'.repeat(50));
    
    try {
      const isValid = await processor['validateData'](testCase.data);
      const result = isValid === testCase.expectedValid ? '✅ PASÓ' : '❌ FALLÓ';
      
      console.log(`Resultado esperado: ${testCase.expectedValid ? 'Válido' : 'Inválido'}`);
      console.log(`Resultado obtenido: ${isValid ? 'Válido' : 'Inválido'}`);
      console.log(`Estado: ${result}`);
      
      if (isValid === testCase.expectedValid) {
        passedTests++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 RESUMEN: ${passedTests}/${totalTests} tests pasaron`);
  console.log(`Porcentaje de éxito: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ¡Todas las validaciones funcionan correctamente!');
  } else {
    console.log('⚠️  Algunas validaciones necesitan ajustes');
  }
}

// Ejecutar el test
testImprovedValidations().catch(console.error);
