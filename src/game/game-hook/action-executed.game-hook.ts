import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameCard, IGameAction, IWizard } from '@thefirstspine/types-arena';
import { ICardCoords } from '@thefirstspine/types-rest';
import { rotateCard } from '../../utils/game.utils';
import { WizzardService } from '../../wizard/wizard.service';
import { WizzardsStorageService } from '../../storage/wizzards.storage.service';

@Injectable()
export class ActionExecutedGameHook implements IGameHook {

  constructor(
    private readonly wizardService: WizzardService,
    private readonly wizzardsStorageService: WizzardsStorageService,
  ) {}

  async execute(gameInstance: IGameInstance, params: {user: number, action: IGameAction<any>}): Promise<boolean> {
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
    if (jesters >= 5) {
      // Unlock the "comic" title
      const wizard: IWizard = this.wizardService.getOrCreateWizzard(params.user);
      if (wizard && !wizard.triumphs.includes('comic')) {
        wizard.triumphs.push('comic');
        this.wizzardsStorageService.save(wizard);
      }
    }

    // Main loop for cards on board
    cardsOnBoard.forEach((gameCard: IGameCard) => {
      // Increase jester's strength
      if (gameCard.card.id === 'jester') {
        gameCard.currentStats.bottom.strength += jesters * 2;
        gameCard.currentStats.left.strength += jesters * 2;
        gameCard.currentStats.right.strength += jesters * 2;
        gameCard.currentStats.top.strength += jesters * 2;
        gameCard.metadata.jesterstrength = jesters * 2;
      }

      // From now, we need rotated card
      const rotatedCard: IGameCard = rotateCard(gameCard, gameInstance);

      // Increase aura
      const sides = [
        {x: rotatedCard.coords.x + 1, y: rotatedCard.coords.y},
        {x: rotatedCard.coords.x - 1, y: rotatedCard.coords.y},
        {x: rotatedCard.coords.x, y: rotatedCard.coords.y + 1},
        {x: rotatedCard.coords.x, y: rotatedCard.coords.y - 1},
      ];
      ['right', 'left', 'bottom', 'top'].forEach((side: string, sideIndex: number) => {
        if (rotatedCard?.currentStats?.[side]?.capacity === 'aura') {
          // Find a card on the board, with the same user to the position
          const position: ICardCoords = sides[sideIndex];
          const cardTarget: IGameCard|undefined = cardsOnBoard.find((cardTargetPotential: IGameCard) => {
            return ['artifact', 'creature', 'player'].includes(cardTargetPotential.card.type) &&
              rotatedCard.user === cardTargetPotential.user &&
              position.x === cardTargetPotential.coords.x &&
              position.y === cardTargetPotential.coords.y;
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
