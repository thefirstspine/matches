import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameUser, IGameCard, IGameAction, ISubActionChoseCardOnBoard } from '../../@shared/arena-shared/game';
import { MessagingService } from '../../@shared/messaging-shared/messaging.service';
import { GameHookService } from './game-hook.service';
import { ICard } from '../../@shared/rest-shared/card';
import { RestService } from '../../rest/rest.service';
import { randBetween } from '../../utils/maths.utils';
import { IHasGameWorkerService } from '../injections.interface';
import { GameWorkerService } from '../game-worker/game-worker.service';

/**
 * This subscriber is executed once a 'game:card:destroyed' event is thrown. It will look for dead
 * cards and place it on the discard.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class InsanesRunDestroyedGameHook implements IGameHook, IHasGameWorkerService {

  public gameWorkerService: GameWorkerService;

  constructor(
    private readonly messagingService: MessagingService,
    private readonly gameHookService: GameHookService,
    private readonly restService: RestService,
  ) {}

  async execute(gameInstance: IGameInstance, params: {gameCard: IGameCard}): Promise<boolean> {
    // Create a new action
    const action: IGameAction = await this.gameWorkerService.getWorker('insanes-run-effect')
      .create(gameInstance, {user: params.gameCard.user});
    // Add it to the current actions
    if ((action.subactions[0] as ISubActionChoseCardOnBoard).params.boardCoords.length > 0) {
      gameInstance.actions.current.push(action);
    }
    return true;
  }

}
