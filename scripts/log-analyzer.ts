import fs from 'fs';
import path from 'path';

interface LogEntry {
  timestamp: string;
  level: string;
  category?: string;
  sessionId?: string;
  message: string;
  operation?: string;
  duration?: number;
  fileName?: string;
  recordsCount?: number;
  totalTime?: number;
  [key: string]: any;
}

interface LogStats {
  totalEntries: number;
  errors: number;
  warnings: number;
  info: number;
  verbose: number;
  performance: LogPerformance[];
  sessions: string[];
  categories: { [key: string]: number };
  averageProcessingTime: number;
  totalRecordsProcessed: number;
  filesProcessed: string[];
  errorDetails: LogError[];
}

interface LogPerformance {
  operation: string;
  duration: number;
  recordsCount?: number;
  fileName?: string;
  timestamp: string;
}

interface LogError {
  message: string;
  error?: string;
  stack?: string;
  fileName?: string;
  timestamp: string;
  sessionId?: string;
}

export class LogAnalyzer {
  private logFile: string;

  constructor(logFile: string = './logs/app.log') {
    this.logFile = logFile;
  }

  async analyze(): Promise<LogStats> {
    if (!fs.existsSync(this.logFile)) {
      throw new Error(`Archivo de log no encontrado: ${this.logFile}`);
    }

    const content = fs.readFileSync(this.logFile, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());

    const stats: LogStats = {
      totalEntries: 0,
      errors: 0,
      warnings: 0,
      info: 0,
      verbose: 0,
      performance: [],
      sessions: [],
      categories: {},
      averageProcessingTime: 0,
      totalRecordsProcessed: 0,
      filesProcessed: [],
      errorDetails: [],
    };

    const processingTimes: number[] = [];

    for (const line of lines) {
      try {
        const entry: LogEntry = JSON.parse(line);
        stats.totalEntries++;

        // Contar por nivel
        switch (entry.level) {
          case 'error':
            stats.errors++;
            // Detalles de errores
            if (entry.error || entry.message.includes('Error')) {
              stats.errorDetails.push({
                message: entry.message,
                error: entry.error,
                stack: entry.stack,
                fileName: entry.fileName,
                timestamp: entry.timestamp,
                sessionId: entry.sessionId,
              });
            }
            break;
          case 'warn':
            stats.warnings++;
            break;
          case 'info':
            stats.info++;
            break;
          case 'verbose':
            stats.verbose++;
            break;
        }

        // Categorías
        if (entry.category) {
          stats.categories[entry.category] =
            (stats.categories[entry.category] || 0) + 1;
        }

        // Sesiones únicas
        if (entry.sessionId && !stats.sessions.includes(entry.sessionId)) {
          stats.sessions.push(entry.sessionId);
        }

        // Métricas de rendimiento
        if (entry.operation && entry.duration) {
          stats.performance.push({
            operation: entry.operation,
            duration: entry.duration,
            recordsCount: entry.recordsCount,
            fileName: entry.fileName,
            timestamp: entry.timestamp,
          });
        }

        // Tiempos de procesamiento total
        if (entry.totalTime) {
          processingTimes.push(entry.totalTime);
        }

        // Registros procesados
        if (entry.recordsCount) {
          stats.totalRecordsProcessed += entry.recordsCount;
        }

        // Archivos procesados
        if (entry.fileName && !stats.filesProcessed.includes(entry.fileName)) {
          stats.filesProcessed.push(entry.fileName);
        }
      } catch (error) {
        console.warn(`Error parsing log line: ${line}`);
      }
    }

    // Calcular tiempo promedio de procesamiento
    if (processingTimes.length > 0) {
      stats.averageProcessingTime =
        processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
    }

    return stats;
  }

  generateReport(stats: LogStats): string {
    const report = `
# 📊 Reporte de Logs - ${new Date().toLocaleDateString()}

## 🎯 Estadísticas Generales
- **Total de entradas**: ${stats.totalEntries.toLocaleString()}
- **Errores**: ${stats.errors}
- **Advertencias**: ${stats.warnings}
- **Información**: ${stats.info}
- **Verbose**: ${stats.verbose}
- **Sesiones únicas**: ${stats.sessions.length}
- **Archivos procesados**: ${stats.filesProcessed.length}
- **Total registros procesados**: ${stats.totalRecordsProcessed.toLocaleString()}
- **Tiempo promedio de procesamiento**: ${stats.averageProcessingTime.toFixed(
      2
    )}ms

## 📋 Categorías
${Object.entries(stats.categories)
  .map(([category, count]) => `- **${category}**: ${count} entradas`)
  .join('\n')}

## ⚡ Rendimiento por Operación
${this.generatePerformanceTable(stats.performance)}

## 🚨 Errores Detectados
${
  stats.errorDetails.length > 0
    ? stats.errorDetails
        .slice(0, 5)
        .map(
          (error) =>
            `- **${error.timestamp}**: ${error.message}${
              error.fileName ? ` (${error.fileName})` : ''
            }`
        )
        .join('\n')
    : '- No se detectaron errores'
}
${
  stats.errorDetails.length > 5
    ? `... y ${stats.errorDetails.length - 5} errores más`
    : ''
}

## 📁 Archivos Procesados
${stats.filesProcessed.map((file) => `- ${file}`).join('\n')}

## 🔍 Sesiones Únicas (Últimas 10)
${stats.sessions
  .slice(-10)
  .map((session) => `- ${session}`)
  .join('\n')}
${
  stats.sessions.length > 10
    ? `... y ${stats.sessions.length - 10} sesiones más`
    : ''
}

## 📈 Métricas de Rendimiento
- **Operación más rápida**: ${this.getFastestOperation(stats.performance)}
- **Operación más lenta**: ${this.getSlowestOperation(stats.performance)}
- **Promedio de registros por archivo**: ${
      stats.filesProcessed.length > 0
        ? (stats.totalRecordsProcessed / stats.filesProcessed.length).toFixed(0)
        : 0
    }

---
*Reporte generado automáticamente el ${new Date().toLocaleString()}*
`;

    return report;
  }

  private generatePerformanceTable(performance: LogPerformance[]): string {
    if (performance.length === 0) return '- No hay datos de rendimiento';

    const operationStats = new Map<
      string,
      { count: number; totalTime: number; avgTime: number }
    >();

    performance.forEach((p) => {
      const existing = operationStats.get(p.operation) || {
        count: 0,
        totalTime: 0,
        avgTime: 0,
      };
      existing.count++;
      existing.totalTime += p.duration;
      existing.avgTime = existing.totalTime / existing.count;
      operationStats.set(p.operation, existing);
    });

    const table = Array.from(operationStats.entries())
      .sort((a, b) => b[1].avgTime - a[1].avgTime)
      .map(
        ([operation, stats]) =>
          `- **${operation}**: ${stats.avgTime.toFixed(2)}ms promedio (${
            stats.count
          } ejecuciones)`
      )
      .join('\n');

    return table;
  }

  private getFastestOperation(performance: LogPerformance[]): string {
    if (performance.length === 0) return 'N/A';
    const fastest = performance.reduce((min, p) =>
      p.duration < min.duration ? p : min
    );
    return `${fastest.operation} (${fastest.duration}ms)`;
  }

  private getSlowestOperation(performance: LogPerformance[]): string {
    if (performance.length === 0) return 'N/A';
    const slowest = performance.reduce((max, p) =>
      p.duration > max.duration ? p : max
    );
    return `${slowest.operation} (${slowest.duration}ms)`;
  }

  async saveReport(
    report: string,
    outputFile: string = './logs/report.md'
  ): Promise<void> {
    const dir = path.dirname(outputFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputFile, report);
  }

  // Método para generar reporte JSON
  async saveJsonReport(
    stats: LogStats,
    outputFile: string = './logs/report.json'
  ): Promise<void> {
    const dir = path.dirname(outputFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputFile, JSON.stringify(stats, null, 2));
  }
}

// Uso del analizador
async function main() {
  const analyzer = new LogAnalyzer();

  try {
    console.log('🔍 Analizando logs...');
    const stats = await analyzer.analyze();

    console.log('📊 Generando reporte...');
    const report = analyzer.generateReport(stats);

    console.log('💾 Guardando reportes...');
    await analyzer.saveReport(report);
    await analyzer.saveJsonReport(stats);

    console.log('✅ Reportes generados exitosamente:');
    console.log('   - ./logs/report.md (formato Markdown)');
    console.log('   - ./logs/report.json (formato JSON)');

    // Mostrar resumen en consola
    console.log('\n📈 Resumen:');
    console.log(`   - Total entradas: ${stats.totalEntries}`);
    console.log(`   - Errores: ${stats.errors}`);
    console.log(`   - Archivos procesados: ${stats.filesProcessed.length}`);
    console.log(
      `   - Registros totales: ${stats.totalRecordsProcessed.toLocaleString()}`
    );
    console.log(
      `   - Tiempo promedio: ${stats.averageProcessingTime.toFixed(2)}ms`
    );
  } catch (error) {
    console.error('❌ Error generando reporte:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
