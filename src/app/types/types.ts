export interface CDPContratoCRUD {
  id?: number;
  numero_cdp_id: number;
  fecha_registro: Date;
  vigencia_cdp: number;
  contrato_general_id: number | null;
}

export interface CDP {
  vigencia: string;
  num_sol_adq: string;
  numero_disponibilidad: string;
  valor_contratacion: number | string;
  nombre_dependencia: string;
  descripcion: string;
  estado: string;
}

export interface EstadoContratoCRUD {
  usuario_id: number;
  estado_parametro_id: number;
  motivo: string;
  fecha_ejecucion_estado: Date;
  contrato_general_id: number;
  fecha_creacion: Date;
}

export interface ContratistaCRUD {
  numero_documento: string,
  tipo_persona_id: number,
  contrato_general_id: number
}

export interface SedeContratoMidResponse {
  Id: number;
  Nombre: string;
}

export interface DependenciaContratoMidResponse {
  id: number;
  nombre: string;
}

export interface ApiResponse<T> {
  Success: boolean;
  Status: number;
  Message: string;
  Data: T;
}
