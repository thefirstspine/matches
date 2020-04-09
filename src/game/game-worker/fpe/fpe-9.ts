import { IGameWorker } from './../game-worker.interface';
import { IGameInstance, IGameAction, ISubActionSelectCoupleOnBoard } from '../../../@shared/arena-shared/game';
import { Injectable } from '@nestjs/common';
import { GameWorkerService } from './../game-worker.service';
import { GameHookService } from '../../game-hook/game-hook.service';
import { IHasGameHookService } from '../../injections.interface';
import { ArenaRoomsService } from '../../../rooms/arena-rooms.service';

/**
 * Game action to pass the "actions" phase & start the confrontations.
 */
@Injectable() // Injectable required here for dependency injection
export class Fpe9GameWorker implements IGameWorker, IHasGameHookService {

  public gameHookService: GameHookService;

  readonly type: string = 'fpe-9';

  constructor(
    private readonly gameWorkerService: GameWorkerService,
    private readonly arenaRoomsService: ArenaRoomsService,
  ) {}

  /**
   * @inheritdoc
   */
  public async create(gameInstance: IGameInstance, data: {user: number}): Promise<IGameAction> {
    return {
      createdAt: Date.now(),
      type: this.type,
      description: {
        en: ``,
        fr: `Passer aux confrontations`,
      },
      user: data.user as number,
      priority: 1,
      subactions: [
        {
          type: 'pass',
          description: {
            en: ``,
            fr: `Passer aux confrontations`,
          },
          params: {
          },
        },
      ],
    };
  }

  /**
   * @inheritdoc
   */
  public async execute(gameInstance: IGameInstance, gameAction: IGameAction): Promise<boolean> {
    // Deletes all the current actions
    gameInstance.actions.current.forEach((currentGameAction: IGameAction) => {
      if (currentGameAction !== gameAction) {
        this.gameWorkerService.getWorker(currentGameAction.type).delete(gameInstance, currentGameAction);
      }
    });

    // Dispatch event
    await this.gameHookService.dispatch(gameInstance, `game:phaseChanged:confonts`);

    // Create the action confront
    const action: IGameAction = await this.gameWorkerService.getWorker('fpe-11').create(gameInstance, {user: gameAction.user});
    gameInstance.actions.current.push(action);

    // Send message to rooms
    this.arenaRoomsService.sendMessageForGame(
      gameInstance,
      {
        fr: `Passe aux confrontations`,
        en: ``,
      },
      gameAction.user);

    return true;
  }

  /**
   * Default refresh method
   * @param gameInstance
   * @param gameAction
   */
  public async refresh(gameInstance: IGameInstance, gameAction: IGameAction): Promise<void> {
    return;
  }

  /**
   * Pass to the confrontations on expiration
   * @param gameInstance
   * @param gameAction
   */
  public async expires(gameInstance: IGameInstance, gameAction: IGameAction): Promise<boolean> {
    gameAction.responses = [{pass: true}];
    return true;
  }

  /**
   * Default delete method
   * @param gameInstance
   * @param gameAction
   */
  public async delete(gameInstance: IGameInstance, gameAction: IGameAction): Promise<void> {
    gameInstance.actions.current = gameInstance.actions.current.filter((gameActionRef: IGameAction) => {
      if (gameActionRef === gameAction) {
        gameInstance.actions.previous.push({
          ...gameAction,
          passedAt: Date.now(),
        });
        return false;
      }
      return true;
    });
  }
}
