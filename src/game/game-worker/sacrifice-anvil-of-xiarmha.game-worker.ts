import { IGameWorker } from './game-worker.interface';
import { IGameInstance, IGameAction, IGameCard, IInteractionChoseCardOnBoard } from '@thefirstspine/types-arena';
import { Injectable } from '@nestjs/common';
import { GameHookService } from '../game-hook/game-hook.service';
import { IHasGameHookService, IHasGameWorkerService } from '../injections.interface';
import { ArenaRoomsService } from '../../rooms/arena-rooms.service';
import { GameWorkerService } from './game-worker.service';
import { LogsService } from '@thefirstspine/logs-nest';
import { randBetween } from '../../utils/maths.utils';

/**
 * Worker for "sacrifice-anvil-of-xiarmha" action.
 */
@Injectable() // Injectable required here for dependency injection
export class SacrificeAnvilOfXiarmhaGameWorker implements IGameWorker, IHasGameHookService, IHasGameWorkerService {

  public gameHookService: GameHookService;
  public gameWorkerService: GameWorkerService;

  readonly type: string = 'sacrifice-anvil-of-xiarmha';

  constructor(
    private readonly logsService: LogsService,
    private readonly arenaRoomsService: ArenaRoomsService,
  ) {}

  /**
   * @inheritdoc
   */
  public async create(gameInstance: IGameInstance, data: {user: number}): Promise<IGameAction<IInteractionChoseCardOnBoard>> {
    return {
      createdAt: Date.now(),
      type: this.type,
      name: {
        en: `Sacrifice an Anvil of Xiarm'ha`,
        fr: `Sacrifier une Enclume de Xiarm'ha`,
      },
      description: {
        en: `Destroye a card`,
        fr: `Détruire une carte`,
      },
      user: data.user as number,
      priority: 2,
      expiresAt: Date.now() + (30 * 1000), // expires in 30 seconds
      interaction: {
        type: 'choseCardOnBoard',
        description: {
          en: `Destroye a card`,
          fr: `Détruire une carte`,
        },
        params: {
          boardCoords: this.getBoardCoords(gameInstance, data.user),
        },
      },
    };
  }

  /**
   * @inheritdoc
   */
  public async refresh(gameInstance: IGameInstance, gameAction: IGameAction<IInteractionChoseCardOnBoard>): Promise<void> {
    gameAction.interaction.params.boardCoords =
      this.getBoardCoords(gameInstance, gameAction.user);
  }

  /**
   * @inheritdoc
   */
  public async execute(gameInstance: IGameInstance, gameAction: IGameAction<IInteractionChoseCardOnBoard>): Promise<boolean> {
    // Validate response form
    if (
      gameAction.response.boardCoords === undefined
    ) {
      this.logsService.warning('Response in a wrong format', gameAction);
      return false;
    }

    // Validate response inputs
    const allowedCoordsOnBoard: string[] = gameAction.interaction.params.boardCoords;
    const responseBoardCoords: string = gameAction.response.boardCoords;
    if (!allowedCoordsOnBoard.includes(responseBoardCoords)) {
      this.logsService.warning('Not allowed board coords', gameAction);
      return false;
    }

    // Transform coords
    const x: number = parseInt(responseBoardCoords.split('-')[0], 10);
    const y: number = parseInt(responseBoardCoords.split('-')[1], 10);

    // Damage the card
    const cardTarget: IGameCard|undefined = gameInstance.cards
      .find((c: IGameCard) => c.location === 'board' && c.coords && c.coords.x === x && c.coords.y === y);
    if (!cardTarget) {
      this.logsService.warning('Target not found', gameAction);
      return false;
    }
    cardTarget.location = 'discard';

    // Get the player card to identify the source
    const playerCard: IGameCard = gameInstance.cards.find((c) => {
      return c.card.type === 'player' && c.user === gameAction.user;
    });

    // Store the defense to increase next
    playerCard.metadata = playerCard.metadata ? playerCard.metadata : {};
    playerCard.metadata.defenseToIncrease = cardTarget.currentStats.life;

    // Dispatch event
    await this.gameHookService.dispatch(gameInstance, `card:destroyed:${cardTarget.card.id}`, {gameCard: cardTarget, source: playerCard});

    // Generate action "sacrifice-anvil-of-xiarmha-effect"
    gameInstance.actions.current.push(
      await this.gameWorkerService.getWorker('sacrifice-anvil-of-xiarmha-effect').create(gameInstance, {user: gameAction.user}));

    // Send message to rooms
    this.arenaRoomsService.sendMessageForGame(
      gameInstance,
      {
        fr: `A sacrifié une Enclume Xiarm'ha`,
        en: `Sacrified an Anvil of Xiarm'ha`,
      },
      gameAction.user);

    return true;
  }

  /**
   * Default expires method
   * @param gameInstance
   * @param gameAction
   */
  public async expires(gameInstance: IGameInstance, gameAction: IGameAction<IInteractionChoseCardOnBoard>): Promise<boolean> {
    const boardCoords: string[] = this.getBoardCoords(gameInstance, gameAction.user);
    gameAction.response = {
      boardCoords: boardCoords[randBetween(0, boardCoords.length - 1)],
    };
    return true;
  }

  /**
   * Default delete method
   * @param gameInstance
   * @param gameAction
   */
  public async delete(gameInstance: IGameInstance, gameAction: IGameAction<IInteractionChoseCardOnBoard>): Promise<void> {
    gameInstance.actions.current = gameInstance.actions.current.filter((gameActionRef: IGameAction<IInteractionChoseCardOnBoard>) => {
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
    // Get the coordinates where the user can place a card
    return gameInstance.cards
      .filter((card: IGameCard) => card.location === 'board' && card.card.id === 'anvil-of-xiarmha' && card.user === user)
      .map((card: IGameCard) => `${card.coords.x}-${card.coords.y}`);
  }
}
