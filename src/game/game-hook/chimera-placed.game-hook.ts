import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameCard } from '../../@shared/arena-shared/game';

/**
 * This subscriber is executed once an event is thrown.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class ChimeraPlacesGameHook implements IGameHook {

  async execute(gameInstance: IGameInstance, params: {gameCard: IGameCard}): Promise<boolean> {
    let lifeMissing: number = 0;

    // Get cards in the user's discard
    const player: IGameCard|undefined = gameInstance.cards.find((c: IGameCard) => c.user === params.gameCard.user && c.card.type === 'player');
    if (player) {
      lifeMissing = player.card.stats.life - player.currentStats.life;
    }

    // Set card current stats
    params.gameCard.currentStats.bottom.strength += lifeMissing;
    params.gameCard.currentStats.left.strength += lifeMissing;
    params.gameCard.currentStats.right.strength += lifeMissing;
    params.gameCard.currentStats.top.strength += lifeMissing;

    // Act like this is the original stats to avoid bugs in healing
    params.gameCard.card.stats.bottom.strength += lifeMissing;
    params.gameCard.card.stats.left.strength += lifeMissing;
    params.gameCard.card.stats.right.strength += lifeMissing;
    params.gameCard.card.stats.top.strength += lifeMissing;

    return true;
  }

}
