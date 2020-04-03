import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameCard, IGameAction } from '../../@shared/arena-shared/game';
import { ICardCoords } from '../../@shared/rest-shared/card';

@Injectable()
export class ActionExecutedGameHook implements IGameHook {

  async execute(gameInstance: IGameInstance, params: {user: number, action: IGameAction}): Promise<boolean> {
    // Get the cards on the board to decrease iterations
    const cardsOnBoard: IGameCard[] = gameInstance.cards.filter((c) => c.location === 'board');

    // Reset all cards stats on the board
    cardsOnBoard.forEach((c: IGameCard) => {
      if (c.metadata?.aurastrength) {
        c.currentStats.bottom.strength -= c.metadata.aurastrength;
        c.currentStats.left.strength -= c.metadata.aurastrength;
        c.currentStats.right.strength -= c.metadata.aurastrength;
        c.currentStats.top.strength -= c.metadata.aurastrength;
        c.metadata.aurastrength = 0;
      }
      if (c.metadata?.jesterstrength) {
        c.currentStats.bottom.strength -= c.metadata.jesterstrength;
        c.currentStats.left.strength -= c.metadata.jesterstrength;
        c.currentStats.right.strength -= c.metadata.jesterstrength;
        c.currentStats.top.strength -= c.metadata.jesterstrength;
        c.metadata.jesterstrength = 0;
      }
    });

    // Count the jesters
    const jesters: number = cardsOnBoard.filter((c) => c.card.id === 'jester').length;

    // Increase jester's strength
    cardsOnBoard.forEach((c: IGameCard) => {
      if (c.card.id === 'jester') {
        c.currentStats.bottom.strength += jesters * 2;
        c.currentStats.left.strength += jesters * 2;
        c.currentStats.right.strength += jesters * 2;
        c.currentStats.top.strength += jesters * 2;
        c.metadata.jesterstrength = jesters * 2;
      }
    });

    // Find the cards with aura
    const cardsWithAura: IGameCard[] = cardsOnBoard.filter((c: IGameCard) => {
      return ['top', 'bottom', 'left', 'right'].find((s) => c?.currentStats?.[s]?.capacity === 'aura') !== undefined;
    });

    // Increase stats
    cardsWithAura.forEach((card: IGameCard) => {
      [
        {x: card.coords.x + 1, y: card.coords.y},
        {x: card.coords.x - 1, y: card.coords.y},
        {x: card.coords.x, y: card.coords.y + 1},
        {x: card.coords.x, y: card.coords.y - 1},
      ].forEach((position: ICardCoords) => {
        // Find a card on the board, with the same user to the position
        const cardTarget: IGameCard|undefined = cardsOnBoard.find((c: IGameCard) => {
          return ['artifact', 'creature'].includes(c.card.type) &&
            c.user === card.user &&
            c.coords.x === position.x &&
            c.coords.y === position.y;
        });
        if (cardTarget !== undefined) {
          cardTarget.currentStats.bottom.strength += 2;
          cardTarget.currentStats.top.strength += 2;
          cardTarget.currentStats.right.strength += 2;
          cardTarget.currentStats.left.strength += 2;
          cardTarget.metadata.aurastrength = cardTarget.metadata.aurastrength ?
            cardTarget.metadata.aurastrength + 2 :
            2;
        }
      });
    });

    return true;
  }

}
