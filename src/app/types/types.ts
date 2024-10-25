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
