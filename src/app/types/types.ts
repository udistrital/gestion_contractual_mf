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
  // Modelo v2 (CRUD Beego): contratista y solicitante viven en contrato_general.
  proveedor_numero_documento?: string;
  tipo_persona_id?: number | null;
  clase_proveedor_id?: number | null;
  sede_solicitante_id?: number | null;
  dependencia_solicitante_id?: number | null;
}

/** Consulta de listas del CRUD Beego v2 (query=campo:valor,..., limit, sortby, order). */
export interface ConsultaCrud {
  query: string;
  limit: number;
  sortby?: string;
  order?: string;
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

/** documento_contrato es polimórfico: entidad_tipo + entidad_id (contrato_general, poliza o acta_inicio). */
export interface DocumentoContrato {
  entidad_tipo: 'contrato_general' | 'poliza' | 'acta_inicio';
  entidad_id: number;
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
  ParametroPadreId?: ParametroResponse; 
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
  id?: number;
  supervisor_id: number | null;
  sede_legado: string;
  dependencia_legado: string;
  cargo_legado: string;
  cargo_id: number | null;
  documento: number | null;
  digito_verificacion: number | null;
  sede_id: number | null;
  dependencia_id: number | null;
  contrato_general_id: number;
}

export interface Proveedor {
  id_proveedor: string;
  ciudad_expedicion_documento: string;
  id_ciudad_contacto: string;
  direccion: string;
  numero_documento: string;
  nombre_estado: string;
  numero_cuenta_bancaria: string;
  id_estado: string;
  nombre_completo_proveedor: string;
  ciudad_contacto: string;
  web: string;
  fecha_registro: string;
  correo: string;
  id_entidad_bancaria: string;
  tipo_persona: string;
  tipo_persona_id: number;
  tipo_cuenta_bancaria: string;
  fecha_ultima_modificacion: string;
  contratos: Contrato[];
}

export interface Representante {
  segundo_apellido: string;
  tipo_documento: string;
  ciudad_expedicion_documento: string;
  genero: string;
  numero_documento: string;
  primer_apellido: string;
  segundo_nombre: string;
  digito_verificacion: string;
  id_tipo_documento: string;
  id_ciudad_expedicion_documento: string;
  primer_nombre: string;
  id_proveedor_juridico: string;
}

export interface DatosContratista {
  proveedor: Proveedor;
  representante?: Representante;
  contratos: Contrato[];
}

export interface ProveedorObject {
  tipo: string;
  nombre: string;
  documento: string;
  ciudad_contacto: string;
  direccion: string;
  correo: string;
  lugar_expedicion?: string;
  representante_legal?: string;
  documento_rl?: string;
  lugar_expedicion_rl?: string;
  contratos?: Contrato[];
  ultimoContrato?: {
    tipo: string;
    estado: string;
    numero: string;
    vigencia: string;
  };
}

interface TipoContrato {
  id: string;
  nombre: string;
}

interface ContratoEstado {
  id: string;
  nombre: string;
}

interface Contrato {
  tipo_contrato: TipoContrato;
  estado_contrato: ContratoEstado;
}

export interface ContratistaResponse {
  id: string;
  numero_documento: string;
  tipo_persona_id: number;
  activo: boolean;
  fecha_creacion: string;
  fecha_modificacion: string | null;
  contrato_general_id: number;
}
