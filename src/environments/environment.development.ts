export const environment = {
  production: false,
  PARAMETROS_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/parametros/v1/',
  UBICACION_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/ubicaciones_crud/v2/',
  PROVEEDORES_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/proveedores_mid/',
  CDPS_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/presupuesto_contractual_mid/',
  CLAUSULAS_PARAGRAFOS_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/clausulas_paragrafos_crud/',
  GESTION_CONTRACTUAL_CRUD_SERVICE: 'http://localhost:3117/',
  GESTION_CONTRACTUAL_MID_SERVICE: 'http://localhost:3119/',
  POLIZAS_CRUD_SERVICE: 'http://localhost:3117/',
  GESTOR_DOCUMENTAL_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/gestor_documental_mid/v1/',
  TIPO_COMPROMISO_ID: '111',
  TIPO_CONTRATO_ID: '112',
  PERFIL_CONTRATISTA_ID: '113',
  TIPOLOGIA_ESPECIFICA_ID: '114',
  MODALIDAD_SELECCION_ID: '115',
  REGIMEN_CONTRATACION_ID: '116',
  PROCEDIMIENTO_ID: '117',
  AMPARO_ID: '118',
  TIPO_CONTROL_ID: '119',
  CLASE_CONTRATISTA_ID: '120',
  VIGENCIA_ID: '121',
  TIPO_MONEDA: '122',
  TIPO_GASTO_ID: '123',
  ORIGEN_RECURSOS_ID: '124',
  ORIGEN_PRESUPUESTO_ID: '125',
  TEMA_GASTO_ID: '126',
  MEDIO_PAGO_ID: '127',
  TIPO_PERSONA_ID: '132',
  ENUMERACION_CLAUSULAS_ID: '135',
  TIPO_ESTADO_ID: '137',

  UNIDAD_EJECUCION_ID: '7',

  ORDEN_ID: '6534',
  CONTRATO_ID: '6535',
  CONVENIO_ID: '6536',

  CONTRATO_PSPAG_ID: '6546',

  PESO_COLOMBIANO_ID: '6634',

  AMPARO_CREC_ID: '6609',
  SUFICIENCIA_SMLV_ID: '6708',
  SUFICIENCIA_PORCENTAJE_ID: '6709',

  ESTADO_CONTRATO_ENEJECUCION: 'EN EJECUCION',
  ESTADO_CONTRATO_SUSCRITO:'SUSCRITO',
  ESTADO_CONTRATO_PORSUSCRIBIR: 'POR SUSCRIBIR',
  ESTADO_CONTRATO_LEGALIZADO: 'LEGALIZADO',

  ESTADO_CONTRATO: {
    SUSCRITO: 6774,
    DECLINADO: 6775,
    POR_SUSCRIBIR: 6773
  },

  ESTADO_INTERNO: {
    BORRADOR: 6799,
  },

  ESTADOS_INTERNOS: {
    BORRADOR: 6799,
    EN_REVISION_JEFE: 6800,
    EN_FIRMA_ORDENADOR: 6801,
    EN_FIRMA_CONTRATISTA: 6802,
    Rechazado: 6803,
    Aprobado: 6804
  },

  TIPO_DOCUMENTO_ID_PARAMETROS: {
    MINUTA: 6805,
    DOCUMENTOS_PRECONTRACTUALES: 6716
  },
  TIPO_DOCUMENTO_ID_GESTOR_DOCUMENTAL: {
    PLANTILLAS_XLSX: 183,	// Plantillas para cargue masivo
    MINUTAS: 174,	// Documentos de minutas
    ACTAS_DE_INICIO: 175,	//Documentos de actas de inicio
    POLIZAS: 176, // Documentos de pólizas y actas de aprobación de pólizas
    DOCUMENTOS_PRECONTRACTUALES: 177 //Documentos precontractuales
  }
};
