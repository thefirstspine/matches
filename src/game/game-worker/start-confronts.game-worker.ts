import { IGameWorker } from './game-worker.interface';
import { IGameInstance, IGameAction, ISubActionSelectCoupleOnBoard } from '../../@shared/arena-shared/game';
import { Injectable } from '@nestjs/common';
import { GameWorkerService } from './game-worker.service';
import { GameHookService } from '../game-hook/game-hook.service';
import { IHasGameHookService } from '../injections.interface';
import { ArenaRoomsService } from '../../rooms/arena-rooms.service';

/**
 * Game action to pass the "actions" phase & start the confrontations.
 */
@Injectable() // Injectable required here for dependency injection
export class StartConfrontsGameWorker implements IGameWorker, IHasGameHookService {

  public gameHookService: GameHookService;

  readonly type: string = 'start-confronts';

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
      expiresAt: Date.now() + (90 * 1000), // expires in 90 seconds
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
    const action: IGameAction = await this.gameWorkerService.getWorker('confronts').create(gameInstance, {user: gameAction.user});

    const subactionMove: ISubActionSelectCoupleOnBoard = action.subactions[0] as ISubActionSelectCoupleOnBoard;
    if (subactionMove.params.possibilities.length) {
      // Add the action to the action pool
      gameInstance.actions.current.push(action);
    } else {
      // On empty possibilities, end the turn
      const endTurnAction: IGameAction = await this.gameWorkerService.getWorker('end-turn').create(gameInstance, {user: gameAction.user});
      gameInstance.actions.current.push(endTurnAction);
    }

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
