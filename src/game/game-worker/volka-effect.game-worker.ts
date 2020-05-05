import { IGameWorker } from './game-worker.interface';
import { IGameInstance, IGameAction, IGameCard, ISubActionChoseCardOnBoard } from '../../@shared/arena-shared/game';
import { LogService } from '../../@shared/log-shared/log.service';
import { Injectable } from '@nestjs/common';
import { GameHookService } from '../game-hook/game-hook.service';
import { IHasGameHookService, IHasGameWorkerService } from '../injections.interface';
import { ArenaRoomsService } from '../../rooms/arena-rooms.service';
import { GameWorkerService } from './game-worker.service';
import { ICardCoords } from '../../@shared/rest-shared/card';

/**
 * When Volk'ha dies, the player can chose to replace him elsewhere around him.
 */
@Injectable() // Injectable required here for dependency injection
export class VolkaEffectGameWorker implements IGameWorker, IHasGameHookService, IHasGameWorkerService {

  public gameHookService: GameHookService;
  public gameWorkerService: GameWorkerService;

  readonly type: string = 'volka-effect';

  constructor(
    private readonly logService: LogService,
    private readonly arenaRoomsService: ArenaRoomsService,
  ) {}

  /**
   * @inheritdoc
   */
  public async create(gameInstance: IGameInstance, data: {user: number}): Promise<IGameAction> {
    return {
      createdAt: Date.now(),
      type: this.type,
      name: {
        en: ``,
        fr: `Placer Volk'ha`,
      },
      description: {
        en: ``,
        fr: `Placer Volk'ha autour de vous.`,
      },
      user: data.user as number,
      priority: 3,
      expiresAt: Date.now() + (30 * 1000), // expires in 30 seconds
      subactions: [
        {
          type: 'choseSquareOnBoard',
          description: {
            en: ``,
            fr: `Placer Volk'ha autour de vous`,
          },
          params: {
            boardCoords: this.getBoardCoords(gameInstance, data.user),
          },
        },
      ],
    };
  }

  /**
   * @inheritdoc
   */
  public async refresh(gameInstance: IGameInstance, gameAction: IGameAction): Promise<void> {
    (gameAction.subactions[0] as ISubActionChoseCardOnBoard).params.boardCoords =
      this.getBoardCoords(gameInstance, gameAction.user);
  }

  /**
   * @inheritdoc
   */
  public async execute(gameInstance: IGameInstance, gameAction: IGameAction): Promise<boolean> {
    // Validate response form
    if (
      !gameAction.responses[0] ||
      gameAction.responses[0].boardCoords === undefined
    ) {
      this.logService.warning('Response in a wrong format', gameAction);
      return false;
    }

    // Validate response inputs
    const allowedCoordsOnBoard: string[] = (gameAction.subactions[0] as ISubActionChoseCardOnBoard).params.boardCoords;
    const responseBoardCoords: string = gameAction.responses[0].boardCoords;
    if (!allowedCoordsOnBoard.includes(responseBoardCoords)) {
      this.logService.warning('Not allowed board coords', gameAction);
      return false;
    }

    // Transform coords
    const x: number = parseInt(responseBoardCoords.split('-')[0], 10);
    const y: number = parseInt(responseBoardCoords.split('-')[1], 10);

    // Get the first Volk'ha card in the user's deck & place it on the board to the desired position
    const volkhaCard: IGameCard = gameInstance.cards.find((c) => c.card.id === 'volkha' && c.user === gameAction.user);
    volkhaCard.currentStats = JSON.parse(JSON.stringify(volkhaCard.card.stats));
    volkhaCard.location = 'board';
    volkhaCard.coords = {x, y};

    return true;
  }

  /**
   * Default expires method
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

  /**
   * Get the board coordinates where the spell can be played
   * @param gameInstance
   * @param user
   */
  protected getBoardCoords(gameInstance: IGameInstance, user: number): string[] {
    const boardCoords: string[] = [];
    const player: IGameCard = gameInstance.cards.find((c) => c.card.type === 'player' && c.user === user);
    [
      {x: player.coords.x + 1, y: player.coords.y},
      {x: player.coords.x - 1, y: player.coords.y},
      {x: player.coords.x, y: player.coords.y + 1},
      {x: player.coords.x, y: player.coords.y - 1},
    ].forEach((coords: ICardCoords) => {
      // Skip invalid coords
      if (coords.x < 0 || coords.y < 0) {
        return;
      }
      if (coords.x > 6 || coords.y > 6) {
        return;
      }
      // Skip already taken coords
      const card: IGameCard =
        gameInstance.cards.find((c: IGameCard) => c.location === 'board' && c.coords.x === coords.x && c.coords.y === coords.y);
      if (card) {
        if (card.card.type === 'creature' || card.card.type === 'artifact' || card.card.type === 'player') {
          return;
        }
        if (card.card.id === 'ditch' || card.card.id === 'burden-earth') {
          return;
        }
        return;
      }
      boardCoords.push(`${coords.x}-${coords.y}`);
    });

    return boardCoords;
  }
}
