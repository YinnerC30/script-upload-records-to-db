export interface ExcelRow {
  licitacion_id?: string;
  nombre?: string;
  fecha_publicacion?: string | Date;
  fecha_cierre?: string | Date;
  organismo?: string;
  unidad?: string;
  monto_disponible?: number;
  moneda?: string;
  estado?: string;
  estado_convocatoria?: string;
  cotizaciones_enviadas?: string;
}

// Interfaz para manejar registros fallidos
export interface FailedRecord {
  originalRow: ExcelRow;
  licitacionData: LicitacionApiData;
  error: string;
  statusCode?: number;
  rowIndex: number;
}

// Importar LicitacionApiData desde ApiService para evitar dependencias circulares
export interface LicitacionApiData {
  licitacion_id: string;
  nombre: string;
  fecha_publicacion: string;
  fecha_cierre: string;
  organismo: string;
  unidad: string;
  monto_disponible: number;
  moneda: string;
  estado: string;
}
