import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../../../common/errors/app.exception';
import { Paginated } from '../../../../common/interfaces/paginated.interface';
import { CLIENTE_REPOSITORY } from '../../domain/interfaces/cliente-repository.port';
import type { ClienteRepositoryPort } from '../../domain/interfaces/cliente-repository.port';
import { ClienteFilters, ClienteRecord, TipoDocumento } from '../../domain/types/cliente.types';
import { validarDocumento } from '../../domain/validators/documento.validator';

@Injectable()
export class BuscarClientePorDocumentoUseCase {
  constructor(@Inject(CLIENTE_REPOSITORY) private readonly clientes: ClienteRepositoryPort) {}

  /** Devuelve null si el documento es válido pero no está registrado (cliente nuevo). */
  async execute(tipo: TipoDocumento, numero: string): Promise<ClienteRecord | null> {
    const documento = validarDocumento(tipo, numero);
    if (!documento.isValid) {
      throw AppException.badRequest('INVALID_DOCUMENTO', documento.errorMessage!, [
        { field: 'numeroDocumento', message: documento.errorMessage! },
      ]);
    }
    return this.clientes.findByDocumento(tipo, documento.cleanedValue);
  }
}

@Injectable()
export class ObtenerClienteUseCase {
  constructor(@Inject(CLIENTE_REPOSITORY) private readonly clientes: ClienteRepositoryPort) {}

  async execute(id: string): Promise<ClienteRecord> {
    const cliente = await this.clientes.findById(id);
    if (!cliente) throw AppException.notFound('CLIENTE_NO_ENCONTRADO', 'Cliente no encontrado.');
    return cliente;
  }
}

@Injectable()
export class ListarClientesUseCase {
  constructor(@Inject(CLIENTE_REPOSITORY) private readonly clientes: ClienteRepositoryPort) {}

  execute(
    filters: ClienteFilters,
    page: number,
    pageSize: number,
  ): Promise<Paginated<ClienteRecord>> {
    return this.clientes.list(filters, page, pageSize);
  }
}
