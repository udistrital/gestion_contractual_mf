/**
 * Componente de la huella tal como se envía al backend: solo un hash truncado
 * del valor, nunca el valor crudo.
 */
export interface ComponenteHuella {
  hash: string | null;
  duracion_ms: number | null;
  error: boolean;
}

export interface ResultadoHuella {
  huella: string;
  libreria: string;
  version_libreria: string;
  confianza: number | null;
  componentes: Record<string, ComponenteHuella>;
}

/** Cuerpo del POST a gestion_contractual_crud/huellas-navegador. */
export interface HuellaNavegadorPayload {
  huella: string;
  libreria: string;
  version_libreria: string;
  confianza: number | null;
  componentes: Record<string, ComponenteHuella>;
  direccion_ip: string | null;
  user_agent: string;
  usuario_id: number | null;
  usuario_rol: string | null;
  microcliente: string;
  ruta: string;
  /** Fecha ISO 8601 */
  fecha_captura: string;
}

export interface ProveedorHuella {
  readonly nombre: string;
  obtener(): Promise<ResultadoHuella>;
}

export type EstadoHuella =
  | 'inactivo'
  | 'pendiente'
  | 'calculando'
  | 'enviada'
  | 'omitida'
  | 'error';
