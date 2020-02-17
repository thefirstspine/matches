import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameAction, ISubActionMoveCardOnBoard, IGameCard } from '../../@shared/arena-shared/game';
import { IHasGameWorkerService, IHasGameHookService } from '../injections.interface';
import { GameWorkerService } from '../game-worker/game-worker.service';
import { GameHookService } from './game-hook.service';
import { ArenaRoomsService } from '../../rooms/arena-rooms.service';
import { ICard } from '../../@shared/rest-shared/card';
import { RestService } from '../../rest/rest.service';

@Injectable()
export class TurnEndedGameHook implements IGameHook, IHasGameWorkerService, IHasGameHookService {

  public gameWorkerService: GameWorkerService;
  public gameHookService: GameHookService;

  constructor(
    private readonly arenaRoomsService: ArenaRoomsService,
    private readonly restService: RestService,
  ) {}

  async execute(gameInstance: IGameInstance, params: {user: number}): Promise<boolean> {
    // Send message to rooms
    this.arenaRoomsService.sendMessageForGame(
      gameInstance,
      {
        fr: `Termine son tour`,
        en: ``,
      },
      params.user);

    // Get the next user
    const foundIndex = gameInstance.users.findIndex((u) => u.user === params.user);
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

}
