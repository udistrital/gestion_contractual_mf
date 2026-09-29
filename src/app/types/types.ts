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

/** DTO para crear/actualizar un amparo en gestion_contractual_crud (amparos-polizas). */
export interface AmparoPolizaDto {
  id?: number;
  contrato_general_id: number;
  amparo_id: number;
  poliza_id?: number | null;
  tipo_valor_amparo_id?: number;
  suficiencia?: number;
  valor?: number;
  descripcion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo?: boolean;
}

/** Fila de amparos-polizas tal como la devuelve el CRUD (numéricos como string). */
export interface AmparoPoliza {
  id: number;
  contrato_general_id: number;
  poliza_id: number | null;
  amparo_id: number;
  tipo_valor_amparo_id: number;
  suficiencia: string | number;
  valor: string | number | null;
  descripcion: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activo: boolean;
  fecha_creacion?: string;
  fecha_modificacion?: string;
}

/** @deprecated usar AmparoPolizaDto */
export type AmparoResponse = AmparoPolizaDto;

export interface Poliza {
  id: number;
  contrato_general_id: number;
  numero_poliza: string | null;
  entidad_aseguradora_id: number | null;
  descripcion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  fecha_expedicion: string | null;
  fecha_aprobacion: string | null;
  usuario_id?: number | null;
  usuario_legado?: string | null;
  activo: boolean;
  fecha_creacion?: string;
  fecha_modificacion?: string;
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
