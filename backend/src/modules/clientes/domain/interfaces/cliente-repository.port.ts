import { Paginated } from '../../../../common/interfaces/paginated.interface';
import { ClienteData, ClienteFilters, ClienteRecord, TipoDocumento } from '../types/cliente.types';

export const CLIENTE_REPOSITORY = Symbol('CLIENTE_REPOSITORY');

export interface ClienteRepositoryPort {
  findById(id: string): Promise<ClienteRecord | null>;
  findByDocumento(tipo: TipoDocumento, numero: string): Promise<ClienteRecord | null>;
  existsByDocumento(tipo: TipoDocumento, numero: string, excludeId?: string): Promise<boolean>;
  list(filters: ClienteFilters, page: number, pageSize: number): Promise<Paginated<ClienteRecord>>;
  /** Lanza conflicto si el documento ya está registrado. */
  create(data: ClienteData): Promise<ClienteRecord>;
  update(id: string, data: Partial<ClienteData> & { activo?: boolean }): Promise<ClienteRecord>;
  hasActiveTurn(clienteId: string): Promise<boolean>;
}
