import { environment } from 'src/environments/environment';

const generarEstado = (
  accion: string,
  confirmacion: string,
  enviado: string
) => ({
  accion,
  confirmacion,
  enviado,
});

// Configuración del rol por estado
export const rolPorEstado: any = {
  [environment.ESTADOS_INTERNOS.BORRADOR]: [
    'ABOGADO_CONTRATACION_RECTOR',
    'ABOGADO_CONTRATACION_IDEXUD',
  ],
  [environment.ESTADOS_INTERNOS.EN_REVISION_JEFE]: [
    'JEFE_CONTRATACION_RECTOR',
    'JEFE_CONTRATACION_IDEXUD',
  ],
  [environment.ESTADOS_INTERNOS.EN_REVISION_ORDENADOR]: ['ORDENADOR_DEL_GASTO'],
  [environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR]: ['ORDENADOR_DEL_GASTO'],
  [environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA]: ['PROVEEDOR'],
};

const textos = {
  JEFE_CONTRATACION: generarEstado(
    'Aprobar y Enviar a Ordenador',
    '¿Está seguro(a) de aprobar y enviar el contrato al ordenador?',
    'El contrato fue enviado al ordenador'
  ),
  ORDENADOR: generarEstado(
    'Firmar y Enviar a Contratista',
    '¿Está seguro(a) de firmar y enviar el contrato al contratista?',
    'El contrato fue enviado al contratista'
  ),
  ORDENADOR_IDEXUD_EN_REVISION: generarEstado(
    'Enviar a Contratista',
    '¿Está seguro(a) de enviar el contrato al contratista?',
    'El contrato fue enviado al contratista'
  ),
  ORDENADOR_IDEXUD_EN_FIRMA: generarEstado(
    'Firmar y Enviar a Abogado(a)',
    '¿Está seguro(a) de firmar y enviar el contrato al abogado(a)?',
    'El contrato fue enviado al abogado(a)'
  ),
  PROVEEDOR: generarEstado(
    'Firmar y Enviar',
    '¿Está seguro(a) de firmar y enviar contrato?',
    'El contrato fue enviado exitosamente'
  ),
};

// Configuración de mensajes por rol y estado
export const textosMensaje: any = {
  [environment.UNIDADES_EJECUTORAS.RECTORIA]: {
    JEFE_CONTRATACION_RECTOR: {
      [environment.ESTADOS_INTERNOS.EN_REVISION_JEFE]: textos.JEFE_CONTRATACION,
    },
    JEFE_CONTRATACION_IDEXUD: {
      [environment.ESTADOS_INTERNOS.EN_REVISION_JEFE]: textos.JEFE_CONTRATACION,
    },
    ORDENADOR_DEL_GASTO: {
      [environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR]: textos.ORDENADOR,
    },
    PROVEEDOR: {
      [environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA]: textos.PROVEEDOR,
    },
  },
  [environment.UNIDADES_EJECUTORAS.IDEXUD]: {
    JEFE_CONTRATACION_RECTOR: {
      [environment.ESTADOS_INTERNOS.EN_REVISION_JEFE]: textos.JEFE_CONTRATACION,
    },
    JEFE_CONTRATACION_IDEXUD: {
      [environment.ESTADOS_INTERNOS.EN_REVISION_JEFE]: textos.JEFE_CONTRATACION,
    },
    ORDENADOR_DEL_GASTO: {
      [environment.ESTADOS_INTERNOS.EN_REVISION_ORDENADOR]:
        textos.ORDENADOR_IDEXUD_EN_REVISION,
      [environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR]:
        textos.ORDENADOR_IDEXUD_EN_FIRMA,
    },
    PROVEEDOR: {
      [environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA]: textos.PROVEEDOR,
    },
  },
};

// Configuración de estados a registrar cuando se apruebe un contrato
export const flujoEstados: any = {
  [environment.UNIDADES_EJECUTORAS.RECTORIA]: {
    [environment.ESTADOS_INTERNOS.EN_REVISION_JEFE]: [
      environment.ESTADOS_INTERNOS.APROBADO_JEFE, //Estado automático
      environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR,
    ],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR]: [
      environment.ESTADOS_INTERNOS.FIRMADO_ORDENADOR, //Estado automático
      environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA,
    ],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA]: [
      environment.ESTADOS_INTERNOS.FIRMADO_CONTRATISTA, //Estado automático
      environment.ESTADOS_INTERNOS.FIRMAS_COMPLETAS,
    ],
  },
  [environment.UNIDADES_EJECUTORAS.IDEXUD]: {
    [environment.ESTADOS_INTERNOS.EN_REVISION_JEFE]: [
      environment.ESTADOS_INTERNOS.APROBADO_JEFE, //Estado automático
      environment.ESTADOS_INTERNOS.EN_REVISION_ORDENADOR,
    ],
    [environment.ESTADOS_INTERNOS.EN_REVISION_ORDENADOR]: [
      environment.ESTADOS_INTERNOS.REVISADO_ORDENADOR, //Estado automático
      environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA,
    ],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA]: [
      environment.ESTADOS_INTERNOS.FIRMADO_CONTRATISTA, //Estado automático
      environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR,
    ],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR]: [
      environment.ESTADOS_INTERNOS.FIRMADO_ORDENADOR, //Estado automático
      environment.ESTADOS_INTERNOS.FIRMAS_COMPLETAS,
    ],
  },
};
