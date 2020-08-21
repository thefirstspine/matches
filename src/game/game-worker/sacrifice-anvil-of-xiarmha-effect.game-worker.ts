import { IGameWorker } from './game-worker.interface';
import { IGameInstance, IGameAction, IGameCard, IInteractionPutCardOnBoard, IInteractionChoseCardOnBoard } from '@thefirstspine/types-arena';
import { Injectable } from '@nestjs/common';
import { GameHookService } from '../game-hook/game-hook.service';
import { IHasGameHookService } from '../injections.interface';
import { ArenaRoomsService } from '../../rooms/arena-rooms.service';
import { LogsService } from '@thefirstspine/logs-nest';
import { randBetween } from '../../utils/maths.utils';

/**
 * Main worker for "sacrifice-anvil-of-xiarmha-effect" action.
 */
@Injectable() // Injectable required here for dependency injection
export class SacrificeAnvilOfXiarmhaEffectGameWorker implements IGameWorker, IHasGameHookService {

  public gameHookService: GameHookService;

  constructor(
    private readonly logsService: LogsService,
    private readonly arenaRoomsService: ArenaRoomsService,
  ) {}

  readonly type: string = 'sacrifice-anvil-of-xiarmha-effect';

  /**
   * @inheritdoc
   */
  public async create(gameInstance: IGameInstance, data: {user: number}): Promise<IGameAction<IInteractionChoseCardOnBoard>> {
    return {
      createdAt: Date.now(),
      type: this.type,
      name: {
        en: `Increase defense`,
        fr: `Augmenter la défense`,
      },
      description: {
        en: `Increase defense`,
        fr: `Augmenter la défense`,
      },
      user: data.user as number,
      priority: 1,
      interaction: {
        type: 'choseCardOnBoard',
        description: {
          en: `Increase defense`,
          fr: `Augmenter la défense`,
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
  public async refresh(gameInstance: IGameInstance, gameAction: IGameAction<IInteractionPutCardOnBoard>): Promise<void> {
    gameAction.interaction.params.boardCoords = this.getBoardCoords(gameInstance, gameAction.user);
  }

  /**
   * @inheritdoc
   */
  public async execute(gameInstance: IGameInstance, gameAction: IGameAction<IInteractionPutCardOnBoard>): Promise<boolean> {
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

    // Get the defense to increase
    const playerCard: IGameCard = gameInstance.cards.find((c) => {
      return c.card.type === 'player' && c.user === gameAction.user;
    });
    const defense = playerCard.metadata.defenseToIncrease;

    // Transform coords
    const x: number = parseInt(responseBoardCoords.split('-')[0], 10);
    const y: number = parseInt(responseBoardCoords.split('-')[1], 10);

    // Damage the card
    const cardDamaged: IGameCard|undefined = gameInstance.cards
      .find((c: IGameCard) => c.location === 'board' && c.coords && c.coords.x === x && c.coords.y === y);
    if (!cardDamaged) {
      this.logsService.warning('Target not found', gameAction);
      return false;
    }
    cardDamaged.currentStats.bottom.defense += defense;
    cardDamaged.currentStats.top.defense += defense;
    cardDamaged.currentStats.left.defense += defense;
    cardDamaged.currentStats.right.defense += defense;

    // Send message to rooms
    this.arenaRoomsService.sendMessageForGame(
      gameInstance,
      {
        fr: `A augmenter une défense`,
        en: `Increased defense`,
      },
      gameAction.user);

    return true;
  }

  /**
   * Default expires method
   * @param gameInstance
   * @param gameAction
   */
  public async expires(gameInstance: IGameInstance, gameAction: IGameAction<IInteractionPutCardOnBoard>): Promise<boolean> {
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
  public async delete(gameInstance: IGameInstance, gameAction: IGameAction<IInteractionPutCardOnBoard>): Promise<void> {
    gameInstance.actions.current = gameInstance.actions.current.filter((gameActionRef: IGameAction<any>) => {
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
      .filter((card: IGameCard) => card.location === 'board' && card.coords && ['creature', 'artifact'].includes(card.card.type))
      .map((card: IGameCard) => `${card.coords.x}-${card.coords.y}`);
  }

}
