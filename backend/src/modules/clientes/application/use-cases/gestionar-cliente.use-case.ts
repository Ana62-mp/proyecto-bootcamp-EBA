import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../../../common/errors/app.exception';
import { CLIENTE_REPOSITORY } from '../../domain/interfaces/cliente-repository.port';
import type { ClienteRepositoryPort } from '../../domain/interfaces/cliente-repository.port';
import { ClienteRecord } from '../../domain/types/cliente.types';
import { ClienteInput, normalizarCliente } from '../services/cliente-input.service';

function documentoDuplicado(numero: string): AppException {
  return AppException.conflict(
    'CLIENTE_DUPLICADO',
    `Ya existe un cliente registrado con el documento ${numero}.`,
  );
}

@Injectable()
export class CrearClienteUseCase {
  constructor(@Inject(CLIENTE_REPOSITORY) private readonly clientes: ClienteRepositoryPort) {}

  async execute(input: ClienteInput): Promise<ClienteRecord> {
    const data = normalizarCliente(input);
    if (await this.clientes.existsByDocumento(data.tipoDocumento, data.numeroDocumento)) {
      throw documentoDuplicado(data.numeroDocumento);
    }
    return this.clientes.create(data);
  }
}

@Injectable()
export class ActualizarClienteUseCase {
  constructor(@Inject(CLIENTE_REPOSITORY) private readonly clientes: ClienteRepositoryPort) {}

  /** Actualización parcial: se combinan los datos actuales y se revalida el conjunto. */
  async execute(id: string, cambios: Partial<ClienteInput>): Promise<ClienteRecord> {
    const current = await this.clientes.findById(id);
    if (!current) throw AppException.notFound('CLIENTE_NO_ENCONTRADO', 'Cliente no encontrado.');

    const data = normalizarCliente({
      tipoDocumento: cambios.tipoDocumento ?? current.tipoDocumento,
      numeroDocumento: cambios.numeroDocumento ?? current.numeroDocumento,
      nombres: cambios.nombres !== undefined ? cambios.nombres : current.nombres,
      apellidos: cambios.apellidos !== undefined ? cambios.apellidos : current.apellidos,
      razonSocial: cambios.razonSocial !== undefined ? cambios.razonSocial : current.razonSocial,
      nombreContacto:
        cambios.nombreContacto !== undefined ? cambios.nombreContacto : current.nombreContacto,
      telefono: cambios.telefono ?? current.telefono,
      correo: cambios.correo !== undefined ? cambios.correo : current.correo,
    });

    if (await this.clientes.existsByDocumento(data.tipoDocumento, data.numeroDocumento, id)) {
      throw documentoDuplicado(data.numeroDocumento);
    }
    return this.clientes.update(id, data);
  }
}

@Injectable()
export class CambiarEstadoClienteUseCase {
  constructor(@Inject(CLIENTE_REPOSITORY) private readonly clientes: ClienteRepositoryPort) {}

  async execute(id: string, activo: boolean): Promise<ClienteRecord> {
    const current = await this.clientes.findById(id);
    if (!current) throw AppException.notFound('CLIENTE_NO_ENCONTRADO', 'Cliente no encontrado.');
    if (!activo && (await this.clientes.hasActiveTurn(id))) {
      throw AppException.conflict(
        'CLIENTE_CON_TURNO_ACTIVO',
        'No se puede desactivar este cliente porque tiene un turno activo en el sistema.',
      );
    }
    return this.clientes.update(id, { activo });
  }
}
