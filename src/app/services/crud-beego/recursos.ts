import { RecursoBeego } from './crud-beego.service';

/**
 * Recursos del CRUD Beego v2 que usa el MF, con lo que el adaptador necesita
 * para pasar del formato del MF al de Beego.
 */

export const CONTRATO_GENERAL: RecursoBeego = {
  ruta: 'contrato_general',
  alias: {
    fecha_suscripcion_estudios: 'FechaSuscripcionEstudio',
    origen_presupuestos_id: 'OrigenPresupuestoId',
  },
  numericos: ['valor_pesos', 'valor_contrato_me', 'valor_tasa_cambio', 'plazo_ejecucion'],
  booleanos: ['aplica_poliza', 'clausula_registro_presupuestal'],
  // Convenio va en su propio recurso; contratista y estados no son columnas del contrato.
  excluir: ['vigencia_convenio', 'convenio', 'nombre_convenio', 'contratista', 'estados', 'vigencia'],
};

export const CONVENIO: RecursoBeego = {
  ruta: 'convenio',
  relaciones: ['contrato_general_id'],
  numericos: ['vigencia', 'tipo_convenio_id'],
};

export const DISPONIBILIDAD_PRESUPUESTAL: RecursoBeego = {
  ruta: 'disponibilidad_presupuestal',
  relaciones: ['contrato_general_id'],
  alias: { vigencia_cdp: 'VigenciaCdpId' },
  numericos: ['numero_cdp_id', 'vigencia_cdp'],
  // No existe en el modelo v2: hueco documentado en la #390.
  excluir: ['valor_a_tomar'],
};

export const ESTADO_CONTRATO: RecursoBeego = {
  ruta: 'estado_contrato',
  relaciones: ['contrato_general_id'],
  numericos: ['estado_parametro_id', 'estado_interno_parametro_id', 'usuario_id'],
};

export const ESPECIFICACION_TECNICA: RecursoBeego = {
  ruta: 'especificacion_tecnica',
  relaciones: ['contrato_general_id'],
  numericos: ['cantidad', 'valor_unitario', 'valor_total'],
};

export const ORDENADOR_CONTRATO: RecursoBeego = {
  ruta: 'ordenador_contrato',
  relaciones: ['contrato_general_id'],
  numericos: ['ordenador_argo_id', 'ordenador_sicapital_id', 'cargo_id', 'tercero_id'],
};

export const SUPERVISOR_CONTRATO: RecursoBeego = {
  ruta: 'supervisor_contrato',
  relaciones: ['contrato_general_id'],
  numericos: ['supervisor_id', 'documento', 'digito_verificacion', 'cargo_id', 'sede_id', 'dependencia_id'],
};

export const DOCUMENTO_CONTRATO: RecursoBeego = {
  ruta: 'documento_contrato',
  numericos: ['entidad_id', 'tipo_documento_id', 'documento_id', 'usuario_id'],
};

export const AMPARO_POLIZA: RecursoBeego = {
  ruta: 'amparo_poliza',
  relaciones: ['contrato_general_id', 'poliza_id'],
};

/** Valor de EntidadTipo para los documentos de un contrato (documento_contrato es polimórfica). */
export const ENTIDAD_CONTRATO_GENERAL = 'contrato_general';

/** Filtro común: registros activos del contrato. */
export const delContrato = (contratoId: number) => ({ 'ContratoGeneralId.Id': contratoId, Activo: true });

/** El más reciente primero. */
export const RECIENTE_PRIMERO = { sortby: ['FechaCreacion', 'Id'], order: ['desc' as const] };
