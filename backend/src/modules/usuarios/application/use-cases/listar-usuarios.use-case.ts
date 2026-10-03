import { Inject, Injectable } from '@nestjs/common';
import { Paginated } from '../../../../common/interfaces/paginated.interface';
import { USUARIO_REPOSITORY } from '../../domain/interfaces/usuario-repository.port';
import type { UsuarioRepositoryPort } from '../../domain/interfaces/usuario-repository.port';
import { UsuarioFilters, UsuarioRecord } from '../../domain/types/usuario.types';

@Injectable()
export class ListarUsuariosUseCase {
  constructor(@Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepositoryPort) {}

  execute(
    filters: UsuarioFilters,
    page: number,
    pageSize: number,
  ): Promise<Paginated<UsuarioRecord>> {
    return this.usuarios.list(filters, page, pageSize);
  }
}
