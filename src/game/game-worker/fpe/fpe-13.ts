import { IGameWorker } from '../game-worker.interface';
import { IGameInstance, IGameAction, IGameCard, ISubActionMoveCardToDiscard } from '../../../@shared/arena-shared/game';
import { isArray } from 'util';
import { LogService } from '../../../@shared/log-shared/log.service';
import { Injectable } from '@nestjs/common';
import { GameHookService } from '../../game-hook/game-hook.service';
import { IHasGameHookService, IHasGameWorkerService } from '../../injections.interface';
import { ArenaRoomsService } from '../../../rooms/arena-rooms.service';
import { GameWorkerService } from '../game-worker.service';
import { RestService } from '../../../rest/rest.service';
import { ICard } from 'src/@shared/rest-shared/card';

/**
 * At the beggining of his turn, the player can throw to the discard one or more cards.
 */
@Injectable() // Injectable required here for dependency injection
export class Fpe13GameWorker implements IGameWorker, IHasGameHookService, IHasGameWorkerService {

  public gameHookService: GameHookService;
  public gameWorkerService: GameWorkerService;

  public readonly type: string = 'fpe-13';

  constructor(
    private readonly logService: LogService,
    private readonly arenaRoomsService: ArenaRoomsService,
    private readonly restService: RestService,
  ) {}

  /**
   * @inheritdoc
   */
  public async create(gameInstance: IGameInstance, data: {user: number}): Promise<IGameAction> {
    return {
      type: this.type,
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
            fr: `Il pioche au début de son tour.`,
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
    // Add a barbers in front of the ennemy
    const barbersCard: ICard = await this.restService.card('barbers');
    const barbersGameCard: IGameCard = {
      id: 'fpe_15',
      card: barbersCard,
      user: 0,
      location: 'board',
      coords: { x: 3, y: 5 },
      currentStats: JSON.parse(JSON.stringify(barbersCard.stats)),
      metadata: {},
    };
    gameInstance.cards.push(barbersGameCard);

    // Add next the action
    const action: IGameAction = await this.gameWorkerService.getWorker('fpe-14').create(gameInstance, {user: gameAction.user});
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
