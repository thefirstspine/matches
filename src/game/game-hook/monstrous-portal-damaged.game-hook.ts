import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameCard, IGameAction, IWizard } from '@thefirstspine/types-arena';
import { IHasGameWorkerService } from '../injections.interface';
import { GameWorkerService } from '../game-worker/game-worker.service';
import { TriumphService } from '../../wizard/triumph/triumph.service';

/**
 * This subscriber is executed once a 'card:lifeChanged:damaged:monstrous-portal' event is thrown.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class MonstrousPortalDamagedGameHook implements IGameHook, IHasGameWorkerService {

  constructor(
    private readonly triumphService: TriumphService,
  ) {}

  public gameWorkerService: GameWorkerService;

  async execute(gameInstance: IGameInstance, params: {gameCard: IGameCard, source: IGameCard, lifeChanged: number}): Promise<boolean> {
    if (params.lifeChanged <= -1) {

      // Unlock title "transporter"
      if (params.source.user === params.gameCard.user) {
        await this.triumphService.unlockTriumph(params.gameCard.user, 'transporter');
      }

      const action: IGameAction<any> = await this.gameWorkerService.getWorker('monstrous-portal-effect')
        .create(gameInstance, {user: params.gameCard.user});
      if (
        action.interaction.params.boardCoords.length > 0 &&
        action.interaction.params.handIndexes.length > 0
      ) {
        gameInstance.actions.current.push(action);
      }
    }
    return true;
  }

}
