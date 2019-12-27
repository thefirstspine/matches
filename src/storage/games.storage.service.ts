import { StorageService } from './storage.service';
import { Injectable } from '@nestjs/common';
import { IGameInstance } from '../@shared/arena-shared/game';

/**
 * The storage service for the "IGameInstance" objects.
 */
@Injectable()
export class GamesStorageService extends StorageService<IGameInstance> {

  constructor() {
    super('games');
  }

}
