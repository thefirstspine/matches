import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameCard, IGameAction, ISubActionPutCardOnBoard } from '../../@shared/arena-shared/game';
import { IHasGameWorkerService } from '../injections.interface';
import { GameWorkerService } from '../game-worker/game-worker.service';

/**
 * This subscriber is executed once a 'card:lifeChanged:damaged:monstrous-portal' event is thrown.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class MonstrousPortalDamagedGameHook implements IGameHook, IHasGameWorkerService {

  public gameWorkerService: GameWorkerService;

  async execute(gameInstance: IGameInstance, params: {gameCard: IGameCard, source: IGameCard, lifeChanged: number}): Promise<boolean> {
    if (params.lifeChanged <= -1) {
      const action: IGameAction = await this.gameWorkerService.getWorker('monstrous-portal-effect')
        .create(gameInstance, {user: params.gameCard.user});
      if (
        (action.subactions[0] as ISubActionPutCardOnBoard).params.boardCoords.length > 0 ||
        (action.subactions[0] as ISubActionPutCardOnBoard).params.handIndexes.length > 0
      ) {
        gameInstance.actions.current.push(action);
      }
    }
    return true;
  }

}
