import { environment } from 'src/environments/environment';

export const accionesPorRolYEstado: {
  [rol: string]: { [estado: number]: string[] };
} = {
  ABOGADO_CONTRATACION_RECTOR: {
    //ABOGADO_CONTRATACION_RECTOR
    [environment.ESTADOS_INTERNOS.BORRADOR]: [
      'Editar Contrato',
      'Enviar Aprobación Jefe OC',
      'Declinar',
    ],
    [environment.ESTADOS_INTERNOS.EN_REVISION_JEFE]: [
      'Ver Contrato',
      'Ver Historial',
    ],
    [environment.ESTADOS_INTERNOS.EN_REVISION_ORDENADOR]: [
      'Ver Contrato',
      'Ver Historial',
    ],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR]: [
      'Ver Contrato',
      'Ver Historial',
    ],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA]: [
      'Ver Contrato',
      'Ver Historial',
    ],
    [environment.ESTADOS_INTERNOS.FIRMAS_COMPLETAS]: ['Ver Contrato'],
    [environment.ESTADOS_INTERNOS.RECHAZADO]: [
      'Editar Contrato',
      'Enviar Aprobación Jefe OC',
      'Ver Historial',
      'Declinar',
    ],
    [environment.ESTADOS_INTERNOS.DECLINADO]: ['Ver Contrato', 'Ver Historial'],
  },
  ABOGADO_CONTRATACION_IDEXUD: {
    //ABOGADO_CONTRATACION_IDEXUD
    [environment.ESTADOS_INTERNOS.BORRADOR]: [
      'Editar Contrato',
      'Enviar Aprobación Jefe OC',
      'Declinar',
    ],
    [environment.ESTADOS_INTERNOS.EN_REVISION_JEFE]: [
      'Ver Contrato',
      'Ver Historial',
    ],
    [environment.ESTADOS_INTERNOS.EN_REVISION_ORDENADOR]: [
      'Ver Contrato',
      'Ver Historial',
    ],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR]: [
      'Ver Contrato',
      'Ver Historial',
    ],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA]: [
      'Ver Contrato',
      'Ver Historial',
    ],
    [environment.ESTADOS_INTERNOS.FIRMAS_COMPLETAS]: ['Ver Contrato'],
    [environment.ESTADOS_INTERNOS.RECHAZADO]: [
      'Editar Contrato',
      'Enviar Aprobación Jefe OC',
      'Ver Historial',
      'Declinar',
    ],
    [environment.ESTADOS_INTERNOS.DECLINADO]: ['Ver Contrato', 'Ver Historial'],
  },
  JEFE_CONTRATACION_RECTOR: {
    //JEFE_CONTRATACION_RECTOR
    [environment.ESTADOS_INTERNOS.BORRADOR]: [],
    [environment.ESTADOS_INTERNOS.EN_REVISION_JEFE]: ['Revisar Contrato'],
    [environment.ESTADOS_INTERNOS.EN_REVISION_ORDENADOR]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.FIRMAS_COMPLETAS]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.RECHAZADO]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.DECLINADO]: ['Ver Documentos'],
  },
  JEFE_CONTRATACION_IDEXUD: {
    //JEFE_CONTRATACION_RECTOR
    [environment.ESTADOS_INTERNOS.BORRADOR]: [],
    [environment.ESTADOS_INTERNOS.EN_REVISION_JEFE]: ['Revisar Contrato'],
    [environment.ESTADOS_INTERNOS.EN_REVISION_ORDENADOR]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.FIRMAS_COMPLETAS]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.RECHAZADO]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.DECLINADO]: ['Ver Documentos'],
  },
  ORDENADOR_DEL_GASTO: {
    //ORDENADOR DEL GASTO
    [environment.ESTADOS_INTERNOS.BORRADOR]: [],
    [environment.ESTADOS_INTERNOS.EN_REVISION_JEFE]: [],
    [environment.ESTADOS_INTERNOS.EN_REVISION_ORDENADOR]: ['Revisar Contrato'],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR]: ['Revisar Contrato'],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.FIRMAS_COMPLETAS]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.RECHAZADO]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.DECLINADO]: ['Ver Documentos'],
  },
  PROVEEDOR: {
    //CONTRATISTA
    [environment.ESTADOS_INTERNOS.BORRADOR]: [],
    [environment.ESTADOS_INTERNOS.EN_REVISION_JEFE]: [],
    [environment.ESTADOS_INTERNOS.EN_REVISION_ORDENADOR]: [],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR]: [],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA]: ['Revisar Contrato'],
    [environment.ESTADOS_INTERNOS.FIRMAS_COMPLETAS]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.RECHAZADO]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.DECLINADO]: ['Ver Documentos'],
  },
  ADMIN_ARGO: {},
};
