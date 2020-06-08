import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameCard, IGameAction } from '@thefirstspine/types-arena';
import { IHasGameWorkerService } from '../injections.interface';
import { GameWorkerService } from '../game-worker/game-worker.service';

/**
 * This subscriber is executed once a 'game:card:destroyed' event is thrown. It will look for dead
 * cards and place it on the discard.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class VolkhaDestroyedGameHook implements IGameHook, IHasGameWorkerService {

  public gameWorkerService: GameWorkerService;

  async execute(gameInstance: IGameInstance, params: {gameCard: IGameCard}): Promise<boolean> {
    // Create a new action
    const action: IGameAction<any> = await this.gameWorkerService.getWorker('volka-effect')
      .create(gameInstance, {user: params.gameCard.user});
    // Add it to the current actions
    if (action.interaction.params.boardCoords.length > 0) {
      gameInstance.actions.current.push(action);
    }
    return true;
  }

}
