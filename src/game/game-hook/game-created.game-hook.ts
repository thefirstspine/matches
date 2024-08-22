import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance } from '@thefirstspine/types-matches';
import { GameAssetsService } from '../../game-assets/game-assets.service';

@Injectable()
export class GameCreatedGameHook implements IGameHook {

  constructor(
    private readonly restService: GameAssetsService,
  ) {}

  async execute(gameInstance: IGameInstance, params: {gameInstance: IGameInstance}): Promise<boolean> {
    return true;
  }

}
