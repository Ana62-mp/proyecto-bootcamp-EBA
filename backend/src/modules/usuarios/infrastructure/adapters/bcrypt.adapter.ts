import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { HasherPort } from '../../domain/interfaces/hasher.port';

@Injectable()
export class BcryptAdapter implements HasherPort {
  private readonly SALT_ROUNDS = 10;

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.SALT_ROUNDS);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
