export interface ContratoGeneral {
  id?: number;
  tipo_compromiso_id?: number;
  tipo_contrato_id?: number;
  perfil_contratista_id?: number;
  fecha_suscripcion_estudios?: Date;
  aplica_poliza?: boolean;
  modalidad_seleccion_id?: number;
  tipo_control_id?: number;
  tipologia_especifica_id?: number;
  regimen_contratacion_id?: number;
  procedimiento_id?: number;
  plazo_ejecucion?: number;
  unidad_ejecucion_id?: number;
  tipo_moneda_id?: number;
  valor_pesos?: number;
  tipo_gasto_id?: number;
  origen_recursos_id?: number;
  origen_presupuestos_id?: number;
  tema_gasto_inversion_id?: number;
  valor_contrato_me?: number;
  valor_tasa_cambio?: number;
  medio_pago_id?: number;
  clausula_registro_presupuestal?: boolean;
  modo_pago?: string;
  objeto?: string;
  justificacion?: string;
  actividades?: string;
  condiciones?: string;
  observaciones?: string;
  vigencia?: string;
  consecutivo_elaboracion?: string;
  fecha_inicial?: Date;
  fecha_final?: Date;
  usuario_legado?: string;
  numero_contrato?: string;
  unidad_ejecutora_id: number;
  estados?: any;
  contratista?: any;
}

export interface CDPContratoCRUD {
  id?: number;
  numero_cdp_id: number;
  fecha_registro: Date;
  vigencia_cdp: number;
  contrato_general_id: number | null;
  valor_a_tomar?: number;
}

export interface CDP {
  vigencia: string;
  num_sol_adq: string;
  numero_disponibilidad: string;
  valor_contratacion: number | string;
  nombre_dependencia: string;
  descripcion: string;
  estado: string;
  valor_a_tomar?: number | string;
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
  usuario_id?: number;
  usuario_rol?: string;
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
  Id: number;
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
  ordenador_sicapital_id: number;
  resolucion?: string;
  documento_identidad: string;
  cargo_id: number;
  contrato_general_id?: number;
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
