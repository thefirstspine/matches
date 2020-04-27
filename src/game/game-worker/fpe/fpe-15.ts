import { IGameWorker } from '../game-worker.interface';
import { IGameInstance, IGameAction, IGameCard, ISubActionMoveCardToDiscard } from '../../../@shared/arena-shared/game';
import { LogService } from '../../../@shared/log-shared/log.service';
import { Injectable } from '@nestjs/common';
import { GameHookService } from '../../game-hook/game-hook.service';
import { IHasGameHookService, IHasGameWorkerService } from '../../injections.interface';
import { ArenaRoomsService } from '../../../rooms/arena-rooms.service';
import { GameWorkerService } from '../game-worker.service';
import { isArray } from 'util';

/**
 * At the beggining of his turn, the player can throw to the discard one or more cards.
 */
@Injectable() // Injectable required here for dependency injection
export class Fpe15GameWorker implements IGameWorker, IHasGameHookService, IHasGameWorkerService {

  public gameHookService: GameHookService;
  public gameWorkerService: GameWorkerService;

  public readonly type: string = 'fpe-15';

  constructor(
    private readonly logService: LogService,
    private readonly arenaRoomsService: ArenaRoomsService,
  ) {}

  /**
   * @inheritdoc
   */
  public async create(gameInstance: IGameInstance, data: {user: number}): Promise<IGameAction> {
    return {
      type: this.type,
      createdAt: Date.now(),
      name: {
        en: ``,
        fr: `Défausser`,
      },
      description: {
        en: ``,
        fr: `Vous pouvez défausser une ou plusieurs cartes.`,
      },
      priority: 10,
      subactions: [
        {
          type: 'moveCardsToDiscard',
          description: {
            en: ``,
            fr: `Défausser une ou plusieurs cartes`,
          },
          params: {
            handIndexes: [0, 1],
            max: 1,
            min: 1,
          },
        },
      ],
      user: data.user,
    };
  }

  /**
   * @inheritdoc
   */
  public async execute(gameInstance: IGameInstance, gameAction: IGameAction): Promise<boolean> {
    // Validate response form
    if (!isArray(gameAction.responses[0])) {
      this.logService.warning('Response in a wrong format', gameAction);
      return false;
    }

    // Validate response inputs
    const allowedHandIndexes: number[] = (gameAction.subactions[0] as ISubActionMoveCardToDiscard).params.handIndexes;
    const responseHandIndexes: number[] = gameAction.responses[0];
    const falseIndex: number[] = responseHandIndexes.filter((i: number) => !allowedHandIndexes.includes(i));
    if (falseIndex.length) {
      this.logService.warning('Not allowed hand index', gameAction);
      return false;
    }

    // Discard the cards
    const cards: IGameCard[] = [];
    gameInstance.cards.filter((c: IGameCard) => c.location === 'hand' && c.user === gameAction.user)
                      .forEach((c: IGameCard, index: number) => {
                        if (responseHandIndexes.includes(index)) {
                          cards.push(c);
                        }
                      });

    await Promise.all(cards.map((c: IGameCard) => {
      c.location = 'discard';
      return this.gameHookService.dispatch(gameInstance, `card:discarded:${c.card.id}`, {gameCard: c});
    }));

    // Pick the new cards
    const currentCards: number = gameInstance.cards.filter(c => c.location === 'hand' && c.user === gameAction.user).length;
    for (let i = currentCards; i < 6; i ++) {
      const card = gameInstance.cards.find(c => c.location === 'deck' && c.user === gameAction.user);
      if (card) {
        card.location = 'hand';
        await this.gameHookService.dispatch(gameInstance, `game:card:picked:${card.card.id}`);
      }
    }

    // Send message to rooms
    const numCards: number = responseHandIndexes.length;
    this.arenaRoomsService.sendMessageForGame(
      gameInstance,
      {
        fr: `Défausse ${numCards} carte${(numCards > 1 ? 's' : '')}`,
        en: ``,
      },
      gameAction.user);

    // Add next the action
    const action: IGameAction = await this.gameWorkerService.getWorker('fpe-17').create(gameInstance, {user: gameAction.user});
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
