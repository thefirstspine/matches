import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameCard } from '@thefirstspine/types-arena';

/**
 * This subscriber is executed once a 'card:lifeChanged:damaged' event is thrown. It will look for dead
 * cards and place it on the discard.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class CaduceusPlacesGameHook implements IGameHook {

  async execute(gameInstance: IGameInstance, params: {gameCard: IGameCard}): Promise<boolean> {
    // Get the player card of the user
    const user: number = params.gameCard.user;
    const wizardCard: IGameCard|undefined = gameInstance.cards.find((c: IGameCard) => {
      return c.card.type === 'player' && c.user === user;
    });

    // Guard for wizard card existence
    if (!wizardCard) {
      return true;
    }

    // Add life to the wizard
    wizardCard.currentStats.bottom.defense += 1;
    wizardCard.currentStats.left.defense += 1;
    wizardCard.currentStats.right.defense += 1;
    wizardCard.currentStats.top.defense += 1;

    return true;
  }

}
