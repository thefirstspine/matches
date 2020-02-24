import { IGameWorker } from '../game-worker.interface';
import { IGameInstance, IGameAction, IGameCard, ISubActionMoveCardToDiscard } from '../../../@shared/arena-shared/game';
import { isArray } from 'util';
import { LogService } from '../../../@shared/log-shared/log.service';
import { Injectable } from '@nestjs/common';
import { GameHookService } from '../../game-hook/game-hook.service';
import { IHasGameHookService, IHasGameWorkerService } from '../../injections.interface';
import { ArenaRoomsService } from '../../../rooms/arena-rooms.service';
import { GameWorkerService } from '../game-worker.service';

/**
 * At the beggining of his turn, the player can throw to the discard one or more cards.
 */
@Injectable() // Injectable required here for dependency injection
export class Fpe1GameWorker implements IGameWorker, IHasGameHookService, IHasGameWorkerService {

  public gameHookService: GameHookService;
  public gameWorkerService: GameWorkerService;

  public readonly type: string = 'fpe-1';

  constructor(
    private readonly logService: LogService,
    private readonly arenaRoomsService: ArenaRoomsService,
  ) {}

  /**
   * @inheritdoc
   */
  public async create(gameInstance: IGameInstance, data: {user: number}): Promise<IGameAction> {
    return {
      type: 'fpe-1',
      createdAt: Date.now(),
      description: {
        en: '',
        fr: '',
      },
      priority: 10,
      subactions: [
        {
          type: 'accept',
          description: {
            fr: `Oui, c'est cette bataille que tu as perdu. Mais tu aurais pu gagner.`,
            en: ``,
          },
          params: {
          },
        },
        {
          type: 'accept',
          description: {
            fr: `Tu viens de commencer ton tour. Tu peux défausser une carte, et piocher pour avoir 6 cartes en main.`,
            en: ``,
          },
          params: {
          },
        },
        {
          type: 'accept',
          description: {
            fr: `Défausses-toi du Soin, il ne te servira à rien.`,
            en: ``,
          },
          params: {
          },
        },
      ],
      user: gameInstance.users[0].user,
    };
  }

  /**
   * @inheritdoc
   */
  public async execute(gameInstance: IGameInstance, gameAction: IGameAction): Promise<boolean> {
    // Add next the action
    const action: IGameAction = await this.gameWorkerService.getWorker('fpe-2').create(gameInstance, {user: gameAction.user});
    gameInstance.actions.current.push(action);
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
   * On expiration, do not throw cards
   * @param gameInstance
   * @param gameAction
   */
  public async expires(gameInstance: IGameInstance, gameAction: IGameAction): Promise<boolean> {
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
