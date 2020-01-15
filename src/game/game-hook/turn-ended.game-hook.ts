import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameAction } from 'src/@shared/arena-shared/game';
import { GameWorkerService } from '../game-worker/game-worker.service';

@Injectable()
export class TurnEndedGameHook implements IGameHook {

  constructor(
    private readonly gameWorkerService: GameWorkerService,
  ) {}

  async execute(gameInstance: IGameInstance, params: {user: number}): Promise<boolean> {
    // Get the index of the next user
    const foundIndex = gameInstance.users.findIndex((u) => u.user === params.user);
    const nextIndex = foundIndex === gameInstance.users.length - 1 ? 0 : foundIndex + 1;

    // Generate the actions of the user
    const action: IGameAction = await this.gameWorkerService.getWorker('throw-cards')
      .create(gameInstance, {user: gameInstance.users[nextIndex].user});
    gameInstance.actions.current.push(action);
    return true;
  }

}
