import { IGameWorker } from './game-worker.interface';
import { IGameInstance, IGameAction, IGameCard, ISubActionMoveCardOnBoard } from '../../@shared/arena-shared/game';
import { Injectable } from '@nestjs/common';
import { GameHookService } from '../game-hook/game-hook.service';
import { IHasGameHookService, IHasGameWorkerService } from '../injections.interface';
import { ArenaRoomsService } from '../../rooms/arena-rooms.service';
import { GameWorkerService } from './game-worker.service';
import { RestService } from '../../rest/rest.service';
import { ICard } from '../../@shared/rest-shared/card';

/**
 * Terminate the turn of the user.
 */
@Injectable() // Injectable required here for dependency injection
export class EndTurnGameWorker implements IGameWorker, IHasGameHookService, IHasGameWorkerService, IHasGameHookService {

  public gameHookService: GameHookService;
  public gameWorkerService: GameWorkerService;

  public readonly type: string = 'end-turn';

  constructor(
    private readonly restService: RestService,
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
        fr: `Terminer le tour`,
      },
      user: data.user as number,
      priority: 1,
      expiresAt: Date.now() + (10 * 1000), // expires in 10 seconds
      subactions: [
        {
          type: 'pass',
          description: {
            en: ``,
            fr: `Terminer le tour`,
          },
          params: {},
        },
      ],
    };
  }

  /**
   * @inheritdoc
   */
  public async execute(gameInstance: IGameInstance, gameAction: IGameAction): Promise<boolean> {
    await this.gameHookService.dispatch(gameInstance, `game:turnEnded`, {user: gameAction.user});
    // Send message to rooms
    this.arenaRoomsService.sendMessageForGame(
      gameInstance,
      {
        fr: `Termine son tour`,
        en: ``,
      },
      gameAction.user);

    // Get the next user
    const foundIndex = gameInstance.users.findIndex((u) => u.user === gameAction.user);
    const nextIndex = foundIndex === gameInstance.users.length - 1 ? 0 : foundIndex + 1;
    const nextUser = gameInstance.users[nextIndex].user;

    // Send message to rooms
    this.arenaRoomsService.sendMessageForGame(
      gameInstance,
      {
        fr: `Commence son tour`,
        en: ``,
      },
      nextUser);

    // Generate "run" & "skip-run" action
    const runAction: IGameAction = await this.gameWorkerService.getWorker('run')
      .create(gameInstance, {user: nextUser});
    if ((runAction.subactions[0] as ISubActionMoveCardOnBoard).params.possibilities.length) {
      // There some cards to move, register this action on the worker
      gameInstance.actions.current.push(runAction);
      // Register a skip too
      const skipRunAction: IGameAction = await this.gameWorkerService.getWorker('skip-run')
        .create(gameInstance, {user: nextUser});
      gameInstance.actions.current.push(skipRunAction);
    }

    const promises: Array<Promise<any>> = [];
    gameInstance.cards.forEach((c: IGameCard) => {
      // Remove the "burden-earth" cards of the next user
      if (c.user === nextUser && c.location === 'board' && c.card.id === 'burden-earth') {
        c.location = 'discard';
        const promise = this.gameHookService.dispatch(gameInstance, `card:discarded:${c.card.id}`, {gameCard: c});
        promises.push(promise);
      }

      // Add strength to "growth" capacity
      if (c.user === nextUser && c.currentStats?.capacities?.includes('grow') && c.location === 'board') {
        c.metadata = c.metadata ? c.metadata : {};
        c.metadata.growBonus = c.metadata.growBonus ? c.metadata.growBonus + 1 : 1;
        if (c.metadata.growBonus <= 5) {
          c.currentStats.bottom.strenght += 2;
          c.currentStats.left.strenght += 2;
          c.currentStats.right.strenght += 2;
          c.currentStats.top.strenght += 2;
        }
      }

      // Replace the "Great Old" cards
      if (c.location === 'board' && c.user === nextUser && c.card.id === 'great-old-egg') {
        const juvenileGreatOldPromise: Promise<ICard> = this.restService.card('juvenile-great-old');
        juvenileGreatOldPromise.then((replacement: ICard) => {
          c.card = replacement;
          c.currentStats = replacement.stats;
        });
        promises.push(juvenileGreatOldPromise);
      }
      if (c.location === 'board' && c.user === nextUser && c.card.id === 'juvenile-great-old') {
        const greatOldPromise: Promise<ICard> = this.restService.card('great-old');
        greatOldPromise.then((replacement: ICard) => {
          c.card = replacement;
          c.currentStats = replacement.stats;
        });
        promises.push(greatOldPromise);
      }
    });

    await Promise.all(promises);

    // Generate the actions of the user
    const action: IGameAction = await this.gameWorkerService.getWorker('throw-cards')
      .create(gameInstance, {user: nextUser});
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
    gameAction.responses = [[]];
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