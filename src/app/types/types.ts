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
  numero_documento: string;
  tipo_persona_id: number;
  contrato_general_id: number;
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
  valor_unitario: number;
  valor_total: number;
  contrato_general_id?: number;
}

export interface DocumentoContrato {
  contrato_general_id: number;
  tipo_documento_id: number;
  usuario_id: number;
  usuario_rol: string;
  documento_id: number;
  documento_enlace: string;
}

export interface ParametroListResponse {
  Data: ParametroResponse[];
  Message: string;
  Status: string;
  Success: boolean;
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

export interface SimpleItem {
  Id: number;
  Nombre: string;
}

export interface NestedItem {
  LugarHijoId: {
    Id: number;
    Nombre: string;
  };
}

export interface DependenciaItem {
  id: number;
  nombre: string;
}

export interface CDPData {
  vigencia: string;
  numero_necesidad: string;
  estado_necesidad: string;
  numero_disponibilidad: string;
  estadocdp: string;
  nombre_dependencia: string;
  id_necesidad: string;
}

export interface OrdenadorContratoData {
  tercero_id?: number;
  ordenador_argo_id: number;
  ordenador_sikarca_id: number;
  resolucion?: string;
  documento_identidad: string;
  cargo_id: number;
  contrato_general_id: number;
}

export interface CDPItem {
  Id: string;
  Nombre: string;
}

export interface SupervisorResponse {
  Success: boolean;
  Status: number;
  Message: string;
  Data: SupervisorData[];
}

export interface SupervisorData {
  dependencia_supervisor: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  cargo_id: string;
  documento: string;
  cargo: string;
  nombre: string;
  digito_verificacion: string;
  sede_supervisor: string;
}

export interface SupervisorToSave {
  supervisor_id: string;
  sede_legado: string;
  dependencia_legado: string;
  cargo_legado: string;
  cargo_id: string;
  documento: string;
  digito_verificacion: string;
  sede_id: string;
  dependencia_id: string;
  contrato_general_id: number;
}
