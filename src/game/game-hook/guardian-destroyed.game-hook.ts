import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameCard } from '../../@shared/arena-shared/game';
import { IHasGameHookService } from '../injections.interface';
import { GameHookService } from './game-hook.service';

/**
 * This subscriber is executed once a 'game:card:destroyed:guardian' event is thrown.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class GuardianDestroyedGameHook implements IGameHook, IHasGameHookService {

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

    // Add life to the wizard
    wizardCard.currentStats.life += 2;
    await this.gameHookService.dispatch(gameInstance, `card:lifeChanged:healed:${wizardCard.card.id}`, {gameCard: wizardCard, lifeChanged: 2});

    return true;
  }

}
