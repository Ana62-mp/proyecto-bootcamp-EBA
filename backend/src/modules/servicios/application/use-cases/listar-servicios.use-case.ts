import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../../../common/errors/app.exception';
import { RolUsuario } from '../../../../common/interfaces/authenticated-user.interface';
import { SERVICIO_REPOSITORY } from '../../domain/interfaces/servicio-repository.port';
import type { ServicioRepositoryPort } from '../../domain/interfaces/servicio-repository.port';
import { ServicioRecord } from '../../domain/types/servicio.types';

@Injectable()
export class ListarServiciosUseCase {
  constructor(@Inject(SERVICIO_REPOSITORY) private readonly servicios: ServicioRepositoryPort) {}

  /** Solo el administrador ve servicios inactivos. */
  execute(rol: RolUsuario, incluirInactivos: boolean): Promise<ServicioRecord[]> {
    return this.servicios.list(!(rol === 'ADMIN' && incluirInactivos));
  }
}

@Injectable()
export class ObtenerServicioUseCase {
  constructor(@Inject(SERVICIO_REPOSITORY) private readonly servicios: ServicioRepositoryPort) {}

  async execute(id: string, rol: RolUsuario): Promise<ServicioRecord> {
    const servicio = await this.servicios.findById(id);
    if (!servicio || (!servicio.activo && rol !== 'ADMIN')) {
      throw AppException.notFound('SERVICIO_NO_ENCONTRADO', 'El servicio seleccionado no existe.');
    }
    return servicio;
  }
}
