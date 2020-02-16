import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameCard, IGameAction } from '../../@shared/arena-shared/game';
import { ICardCoords } from 'src/@shared/rest-shared/card';

@Injectable()
export class ActionExecutedGameHook implements IGameHook {

  async execute(gameInstance: IGameInstance, params: {user: number, action: IGameAction}): Promise<boolean> {
    // Get the cards on the board to decrease iterations
    const cardsOnBoard: IGameCard[] = gameInstance.cards.filter((c) => c.location === 'board');

    // Reset all cards stats on the board
    cardsOnBoard.forEach((c: IGameCard) => {
      if (c.metadata?.auraStrenght) {
        c.currentStats.bottom.strenght -= c.metadata.auraStrenght;
        c.currentStats.left.strenght -= c.metadata.auraStrenght;
        c.currentStats.right.strenght -= c.metadata.auraStrenght;
        c.currentStats.top.strenght -= c.metadata.auraStrenght;
        c.metadata.auraStrenght = 0;
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
          cardTarget.currentStats.bottom.strenght += 2;
          cardTarget.currentStats.top.strenght += 2;
          cardTarget.currentStats.right.strenght += 2;
          cardTarget.currentStats.left.strenght += 2;
          cardTarget.metadata.auraStrenght = cardTarget.metadata.auraStrenght ?
            cardTarget.metadata.auraStrenght + 2 :
            2;
        }
      });
    });
    return true;
  }

}
