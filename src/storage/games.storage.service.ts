import { StorageService } from './storage.service';
import { Injectable } from '@nestjs/common';
import { IGameInstance } from '@thefirstspine/types-matches';

/**
 * The storage service for the "IGameInstance" objects.
 */
@Injectable()
export class GamesStorageService extends StorageService<IGameInstance> {

  constructor() {
    super('games');
  }

}
