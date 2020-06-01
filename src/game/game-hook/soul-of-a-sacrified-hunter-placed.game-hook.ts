import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameCard } from '../../@shared/arena-shared/game';

/**
 * This subscriber is executed once a 'card:lifeChanged:damaged' event is thrown. It will look for dead
 * cards and place it on the discard.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class SoulOfASacrifiedHunterPlacesGameHook implements IGameHook {

  async execute(gameInstance: IGameInstance, params: {gameCard: IGameCard}): Promise<boolean> {
    let life: number = 0;
    let str: number = 0;

    // Get cards in the user's discard
    gameInstance.cards.forEach((c: IGameCard) => {
      if (c.user === params.gameCard.user && c.location === 'discard') {
        if (c.card.type === 'artifact') {
          str ++;
        }
        if (c.card.type === 'creature') {
          life ++;
        }
      }
    });

    // Set card current stats
    params.gameCard.currentStats.life += life;
    params.gameCard.currentStats.bottom.strength += str;
    params.gameCard.currentStats.left.strength += str;
    params.gameCard.currentStats.right.strength += str;
    params.gameCard.currentStats.top.strength += str;

    // Act like this is the original stats to avoid bugs in healing
    params.gameCard.card.stats.life += life;
    params.gameCard.card.stats.bottom.strength += str;
    params.gameCard.card.stats.left.strength += str;
    params.gameCard.card.stats.right.strength += str;
    params.gameCard.card.stats.top.strength += str;

    return true;
  }

}
