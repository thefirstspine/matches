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

    // Main loop for cards on board
    cardsOnBoard.forEach((c: IGameCard) => {
      // Increase jester's strength
      if (c.card.id === 'jester') {
        c.currentStats.bottom.strength += jesters * 2;
        c.currentStats.left.strength += jesters * 2;
        c.currentStats.right.strength += jesters * 2;
        c.currentStats.top.strength += jesters * 2;
        c.metadata.jesterstrength = jesters * 2;
      }

      // Increase aura
      const sides = [
        {x: c.coords.x + 1, y: c.coords.y},
        {x: c.coords.x - 1, y: c.coords.y},
        {x: c.coords.x, y: c.coords.y + 1},
        {x: c.coords.x, y: c.coords.y - 1},
      ];
      ['right', 'left', 'bottom', 'top'].forEach((side: string, sideIndex: number) => {
        if (c?.currentStats?.[side]?.capacity === 'aura') {
          const position: ICardCoords = sides[sideIndex];
          // Find a card on the board, with the same user to the position
          const cardTarget: IGameCard|undefined = cardsOnBoard.find((cardTargetPotential: IGameCard) => {
            return ['artifact', 'creature'].includes(c.card.type) &&
              c.user === cardTargetPotential.user &&
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
          }
      });
    });

    return true;
  }

}
