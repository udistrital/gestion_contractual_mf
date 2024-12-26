export interface ContratoGeneral {
  id: number;
  vigencia: string;
  tipoContratoId: string;
  // tipo_persona: string;
  // numero_contrato: string;
  contratista: any;
  fechaCreacion: string | null;
  // fecha_aprobado: string | null;
  estados: any;
}

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

export interface EstadoContrato {
  contrato_general_id: number;
  usuario_id: number;
  usuario_rol: string;
  estado_parametro_id: number;
  estado_interno_parametro_id: number;
  motivo?: string;
}

export interface ContratistaCRUD {
  id?: string;
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

export interface EspecificacionTecnica {
  id: number;
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
  valorTotal: number;
  contratoGeneralId?: number;
}

export interface DocumentoContrato {
  tipo_documento_id: number;
  documento_id: number;
  documento_enlace: string;
  contrato_general_id: number;
}

export interface ParametroResponse {
  Id: number | string;
  Nombre: string;
  Descripcion?: string;
  CodigoAbreviacion?: string;
  Activo?: boolean;
}

export interface AmparoResponse {
  suficiencia: number;
  amparo_id: number;
  descripcion: string;
}
