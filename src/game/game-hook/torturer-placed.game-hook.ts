import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameCard } from '../../@shared/arena-shared/game';
import { IHasGameHookService } from '../injections.interface';
import { GameHookService } from './game-hook.service';

/**
 * This subscriber is executed once a 'card:lifeChanged:damaged' event is thrown. It will look for dead
 * cards and place it on the discard.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class TorturerPlacesGameHook implements IGameHook, IHasGameHookService {

  public gameHookService: GameHookService;

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

    // Add strength to the wizard
    wizardCard.currentStats.bottom.strength += 1;
    wizardCard.currentStats.left.strength += 1;
    wizardCard.currentStats.right.strength += 1;
    wizardCard.currentStats.top.strength += 1;

    // Remove life
    wizardCard.currentStats.life -= 1;
    this.gameHookService.dispatch(
      gameInstance,
      `card:lifeChanged:damaged:${wizardCard.card.id}`,
      {gameCard: wizardCard, source: params.gameCard, lifeChanged: -1});

    return true;
  }

}
