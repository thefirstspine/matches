import { IGameInstance } from '../game/game.service';
import { StorageService } from './storage.service';
import { Injectable } from '@nestjs/common';

/**
 * The storage service for the "IGameInstance" objects.
 */
@Injectable()
export class GamesStorageService extends StorageService<IGameInstance> {

  constructor() {
    super('games');
  }

}
