export interface Amparo {
  suficiencia: number;
  amparo_id: number;
  descripcion: string;

}

export interface ApiResponse<T> {
  Status: string;
  Data: T;
}
