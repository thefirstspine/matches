import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameAction, IGameCard } from '@thefirstspine/types-matches';
import { IGameWorker } from '../game-worker/game-worker.interface';
import { IHasGameWorkerService, IHasGameHookService } from '../injections.interface';
import { GameWorkerService } from '../game-worker/game-worker.service';
import { GameHookService } from './game-hook.service';

/**
 * This subscriber is executed once a 'game:phaseChanged:actions' event is thrown. It will generates the actions
 * for the main phase of the turn (called the "actions phase").
 * @param gameInstance
 * @param params
 */
@Injectable()
export class PhaseActionsGameHook implements IGameHook, IHasGameWorkerService, IHasGameHookService {

  public gameWorkerService: GameWorkerService;
  public gameHookService: GameHookService;

  async execute(gameInstance: IGameInstance, params: {user: number}): Promise<boolean> {
    gameInstance.actions.current.push(
      await this.gameWorkerService.getWorker('place-card').create(gameInstance, {user: params.user}),
      await this.gameWorkerService.getWorker('start-confronts').create(gameInstance, {user: params.user}),
      await this.gameWorkerService.getWorker('move-creature').create(gameInstance, {user: params.user}),
    );

    // Get the spells in the hand & create the associated actions
    const promises: Array<Promise<IGameAction<any>>> = [];
    gameInstance.cards.filter((card: IGameCard) => card.location === 'hand' && card.user === params.user && card.card.type === 'spell')
      .forEach((card: IGameCard) => {
        const worker: IGameWorker|undefined = this.gameHookService.gameWorkerService.getWorker(`spell-${card.card.id}`);
        if (worker) {
          promises.push(worker.create(gameInstance, params));
        }
      });

    const actions: Array<IGameAction<any>> = await Promise.all(promises);
    gameInstance.actions.current.push(...actions);
    return true;
  }

}
