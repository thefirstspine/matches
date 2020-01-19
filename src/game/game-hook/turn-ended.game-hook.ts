import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameAction, ISubActionMoveCardOnBoard, IGameCard } from '../../@shared/arena-shared/game';
import { IHasGameWorkerService, IHasGameHookService } from '../injections.interface';
import { GameWorkerService } from '../game-worker/game-worker.service';
import { GameHookService } from './game-hook.service';

@Injectable()
export class TurnEndedGameHook implements IGameHook, IHasGameWorkerService, IHasGameHookService {

  public gameWorkerService: GameWorkerService;
  public gameHookService: GameHookService;

  async execute(gameInstance: IGameInstance, params: {user: number}): Promise<boolean> {
    // Get the next user
    const foundIndex = gameInstance.users.findIndex((u) => u.user === params.user);
    const nextIndex = foundIndex === gameInstance.users.length - 1 ? 0 : foundIndex + 1;
    const nextUser = gameInstance.users[nextIndex].user;

    // Generate "run" & "skip-run" action
    const runAction: IGameAction = await this.gameWorkerService.getWorker('run')
      .create(gameInstance, {user: nextUser});
    if ((runAction.subactions[0] as ISubActionMoveCardOnBoard).params.possibilities.length) {
      // There some cards to move, register this action on the worker
      gameInstance.actions.current.push(runAction);
      // Register a skip too
      const skipRunAction: IGameAction = await this.gameWorkerService.getWorker('skip-run')
        .create(gameInstance, {user: nextUser});
      gameInstance.actions.current.push(skipRunAction);
    }

    // Remove the "burden-earth" cards of the next user
    const promises: Array<Promise<void>> = [];
    gameInstance.cards.forEach((c: IGameCard) => {
      if (c.user === nextUser && c.card.id === 'burden-earth') {
        c.location = 'discard';
        const promise = this.gameHookService.dispatch(gameInstance, `card:discarded:${c.card.id}`, {gameCard: c});
        promises.push(promise);
      }
    });
    await Promise.all(promises);

    // Generate the actions of the user
    const action: IGameAction = await this.gameWorkerService.getWorker('throw-cards')
      .create(gameInstance, {user: nextUser});
    gameInstance.actions.current.push(action);
    return true;
  }

}
