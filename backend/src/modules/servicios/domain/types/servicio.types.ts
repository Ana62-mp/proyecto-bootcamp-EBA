export type TipoLavado = 'LAVADO_SIMPLE' | 'LAVADO_COMPLETO' | 'LAVADO_TAPICERIA' | 'PARAFINADO';

export interface ServicioRecord {
  id: string;
  codigo: TipoLavado;
  nombre: string;
  descripcion: string;
  /** Decimal serializado con dos decimales, p. ej. "10.00". */
  precio: string;
  moneda: string;
  activo: boolean;
}
