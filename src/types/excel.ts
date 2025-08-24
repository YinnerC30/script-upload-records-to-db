export interface ExcelRow {
  idLicitacion?: string;
  nombre?: string;
  fechaPublicacion?: string | Date;
  fechaCierre?: string | Date;
  organismo?: string;
  unidad?: string;
  montoDisponible?: number | string;
  moneda?: string;
  estado?: string;
  [key: string]: any;
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
