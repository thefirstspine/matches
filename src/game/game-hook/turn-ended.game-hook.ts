import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameAction } from '../../@shared/arena-shared/game';
import { GameHookService } from './game-hook.service';
import { IHasGameHookService } from '../injections.interface';

@Injectable()
export class TurnEndedGameHook implements IGameHook, IHasGameHookService {

  public gameHookService: GameHookService;

  async execute(gameInstance: IGameInstance, params: {user: number}): Promise<boolean> {
    // Get the index of the next user
    const foundIndex = gameInstance.users.findIndex((u) => u.user === params.user);
    const nextIndex = foundIndex === gameInstance.users.length - 1 ? 0 : foundIndex + 1;

    // Generate the actions of the user
    const action: IGameAction = await this.gameHookService.gameWorkerService.getWorker('throw-cards')
      .create(gameInstance, {user: gameInstance.users[nextIndex].user});
    gameInstance.actions.current.push(action);
    return true;
  }

}
