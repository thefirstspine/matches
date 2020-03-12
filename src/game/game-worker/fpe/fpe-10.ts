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
export class Fpe10GameWorker implements IGameWorker, IHasGameHookService, IHasGameWorkerService {

  public gameHookService: GameHookService;
  public gameWorkerService: GameWorkerService;

  public readonly type: string = 'fpe-10';

  constructor(
    private readonly logService: LogService,
    private readonly arenaRoomsService: ArenaRoomsService,
  ) {}

  /**
   * @inheritdoc
   */
  public async create(gameInstance: IGameInstance, data: {user: number}): Promise<IGameAction> {
    return {
      type: 'fpe-10',
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
            fr: `À la fin de ton tour, tu dois jouer les confrontations.`,
            en: ``,
          },
          params: {
          },
        },
        {
          type: 'accept',
          description: {
            // tslint:disable-next-line: max-line-length
            fr: `Chaque carte dispose de force et de défense sur ses côtés. Lors des confrontations, les points de vie au centre des cartes seront retranchés de la force de leur carte ennemie, moins leur défense.`,
            en: ``,
          },
          params: {
          },
        },
        {
          type: 'accept',
          description: {
            fr: `Habituellement, les artefacts ont une plus grande défense et les créatures une plus grande force.`,
            en: ``,
          },
          params: {
          },
        },
        {
          type: 'accept',
          description: {
            fr: `Sélectionne ton Totem Fumant et fais glisser sur la Banshee pour la détruire.`,
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
    const action: IGameAction = await this.gameWorkerService.getWorker('fpe-11').create(gameInstance, {user: gameAction.user});
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
