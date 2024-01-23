import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance } from '@thefirstspine/types-matches';
import { RestService } from '../../rest/rest.service';

@Injectable()
export class GameCreatedGameHook implements IGameHook {

  constructor(
    private readonly restService: RestService,
  ) {}

  async execute(gameInstance: IGameInstance, params: {gameInstance: IGameInstance}): Promise<boolean> {
    return true;
  }

}
