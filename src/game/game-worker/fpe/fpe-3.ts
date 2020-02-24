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
export class Fpe3GameWorker implements IGameWorker, IHasGameHookService, IHasGameWorkerService {

  public gameHookService: GameHookService;
  public gameWorkerService: GameWorkerService;

  public readonly type: string = 'fpe-3';

  constructor(
    private readonly logService: LogService,
    private readonly arenaRoomsService: ArenaRoomsService,
  ) {}

  /**
   * @inheritdoc
   */
  public async create(gameInstance: IGameInstance, data: {user: number}): Promise<IGameAction> {
    return {
      type: 'fpe-3',
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
            fr: `Le plus important, c'est de te débarrasser de ces créatures qui sont autour de toi.`,
            en: ``,
          },
          params: {
          },
        },
        {
          type: 'accept',
          description: {
            fr: `Les créatures sont en rouges et attaquent à la fin du tour de leur propriétaire.`,
            en: ``,
          },
          params: {
          },
        },
        {
          type: 'accept',
          description: {
            fr: `Les artefacts sont en bleus et n'attaquent pas à la fin du tour.`,
            en: ``,
          },
          params: {
          },
        },
        {
          type: 'accept',
          description: {
            fr: `Les cartes jaunes sont des sorts qui se jouent pendant ton tour.`,
            en: ``,
          },
          params: {
          },
        },
        {
          type: 'accept',
          description: {
            fr: `Après avoir pioché tu peux jouer un sort, placer une carte, et déplacer une créature.`,
            en: ``,
          },
          params: {
          },
        },
        {
          type: 'accept',
          description: {
            fr: `Débarasses-toi du Renard à ta gauche en jouant une Foudre sur lui.`,
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
    const action: IGameAction = await this.gameWorkerService.getWorker('fpe-4').create(gameInstance, {user: gameAction.user});
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
