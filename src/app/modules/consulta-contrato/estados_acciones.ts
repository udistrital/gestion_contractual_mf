import { environment } from 'src/environments/environment';

export const accionesPorRolYEstado: {
  [rol: string]: { [estado: string]: string[] };
} = {
  CONTRATISTA: {
    //ABOGADO
    [environment.ESTADOS_INTERNOS.BORRADOR]: [
      'Editar Contrato',
      'Enviar Aprobación Jefe OC',
      'Declinar',
    ],
    [environment.ESTADOS_INTERNOS.EN_REVISION_JEFE]: [
      'Ver Contrato',
      'Motivo de rechazo',
    ],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR]: [
      'Ver Contrato',
      'Motivo de rechazo',
    ],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA]: [
      'Ver Contrato',
      'Motivo de rechazo',
    ],
    [environment.ESTADOS_INTERNOS.RECHAZADO]: [
      'Editar Contrato',
      'Enviar Aprobación Jefe OC',
      'Motivo de rechazo',
      'Declinar',
    ],
    [environment.ESTADOS_INTERNOS.DECLINADO]: [
      'Ver Contrato',
      'Motivo de rechazo',
    ],
  },
  JEFE_DEPENDENCIA: {
    //JEFE OFICINA CONTRATACION
    [environment.ESTADOS_INTERNOS.BORRADOR]: [],
    [environment.ESTADOS_INTERNOS.EN_REVISION_JEFE]: ['Revisar Contrato'],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.RECHAZADO]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.DECLINADO]: ['Ver Documentos'],
  },
  ORDENADOR_DEL_GASTO: {
    //ORDENADOR DEL GASTO
    [environment.ESTADOS_INTERNOS.BORRADOR]: [],
    [environment.ESTADOS_INTERNOS.EN_REVISION_JEFE]: [],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR]: ['Revisar Contrato'],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.RECHAZADO]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.DECLINADO]: ['Ver Documentos'],
  },
  PROVEEDOR: {
    //CONTRATISTA
    [environment.ESTADOS_INTERNOS.BORRADOR]: [],
    [environment.ESTADOS_INTERNOS.EN_REVISION_JEFE]: [],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR]: [],
    [environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA]: ['Revisar Contrato'],
    [environment.ESTADOS_INTERNOS.RECHAZADO]: ['Ver Documentos'],
    [environment.ESTADOS_INTERNOS.DECLINADO]: ['Ver Documentos'],
  },
};
