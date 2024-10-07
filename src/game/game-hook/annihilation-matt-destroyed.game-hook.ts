import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameCard } from '@thefirstspine/types-matches';
import { GameAssetsService } from '../../game-assets/game-assets.service';
import { IHasGameHookService } from '../injections.interface';
import { GameHookService } from './game-hook.service';

/**
 * This subscriber is executed once a 'card:destroyed:annihilation-matt' event is thrown.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class AnnihilationMattDestroyedGameHook implements IGameHook, IHasGameHookService {

  public gameHookService: GameHookService;

  public constructor(private readonly restService: GameAssetsService) {}

  async execute(gameInstance: IGameInstance, params: {gameCard: IGameCard, source: IGameCard}): Promise<boolean> {
    // Get the player associate with the source
    const player: IGameCard|undefined = gameInstance.cards.find((c: IGameCard) => c.user === params.source.user && c.card.type === 'player');
    if (player) {
      player.currentStats.life -= 10;
      await this.gameHookService.dispatch(
        gameInstance,
        `card:lifeChanged:damaged:${player.card.type}:${player.card.id}`,
        {gameCard: player, source: params.gameCard, lifeChanged: -10});
    }
    return true;
  }

}
