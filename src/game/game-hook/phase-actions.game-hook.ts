import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameAction, IGameCard } from 'src/@shared/arena-shared/game';
import { GameWorkerService } from '../game-worker/game-worker.service';
import { IGameWorker } from '../game-worker/game-worker.interface';

/**
 * This subscriber is executed once a 'game:phaseChanged:actions' event is thrown. It will generates the actions
 * for the main phase of the turn (called the "actions phase").
 * @param gameInstance
 * @param params
 */
@Injectable()
export class PhaseActionsGameHook implements IGameHook {

  constructor(
    private readonly gameWorkerService: GameWorkerService,
  ) {}

  async execute(gameInstance: IGameInstance, params: {user: number}): Promise<boolean> {
    gameInstance.actions.current.push(
      await this.gameWorkerService.getWorker('place-card').create(gameInstance, {user: params.user}),
      await this.gameWorkerService.getWorker('start-confronts').create(gameInstance, {user: params.user}),
      await this.gameWorkerService.getWorker('move-creature').create(gameInstance, {user: params.user}),
    );

    // Get the spells in the hand & create the associated actions
    const promises: Array<Promise<IGameAction>> = [];
    gameInstance.cards.filter((card: IGameCard) => card.location === 'hand' && card.user === params.user && card.card.type === 'spell')
      .forEach((card: IGameCard) => {
        const worker: IGameWorker|undefined = this.gameWorkerService.getWorker(`spell-${card.card.id}`);
        if (worker) {
          promises.push(worker.create(gameInstance, params));
        }
      });

    const actions: IGameAction[] = await Promise.all(promises);
    gameInstance.actions.current.push(...actions);
    return true;
  }

}
