import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameAction, ISubActionMoveCardOnBoard } from '../../@shared/arena-shared/game';
import { IHasGameWorkerService } from '../injections.interface';
import { GameWorkerService } from '../game-worker/game-worker.service';

@Injectable()
export class TurnEndedGameHook implements IGameHook, IHasGameWorkerService {

  public gameWorkerService: GameWorkerService;

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

    // Generate the actions of the user
    const action: IGameAction = await this.gameWorkerService.getWorker('throw-cards')
      .create(gameInstance, {user: nextUser});
    gameInstance.actions.current.push(action);
    return true;
  }

}
