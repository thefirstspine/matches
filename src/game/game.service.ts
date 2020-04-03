import { Injectable } from '@nestjs/common';
import { shuffle } from '../utils/array.utils';
import { randBetween } from '../utils/maths.utils';
import { GamesStorageService } from '../storage/games.storage.service';
import { WizzardService } from '../wizzard/wizzard.service';
import { LogService } from '../@shared/log-shared/log.service';
import { IGameInstance, IGameUser, IGameCard, IGameAction } from '../@shared/arena-shared/game';
import { IWizzardItem } from '../@shared/arena-shared/wizzard';
import { RestService } from '../rest/rest.service';
import { ICard } from '../@shared/rest-shared/card';
import { IGameType, IDeck } from '../@shared/rest-shared/entities';
import { ArenaRoomsService } from '../rooms/arena-rooms.service';
import { MessagingService } from '../@shared/messaging-shared/messaging.service';
import { GameWorkerService } from './game-worker/game-worker.service';
import { GameHookService } from './game-hook/game-hook.service';
import { destiny, origin } from '../@shared/rest-shared/base';

/**
 * Service to manage game instances
 */
@Injectable()
export class GameService {

  public static readonly MAX_CONCURRENT_GAMES: number = 10;

  /**
   * All the game instance stored in the hot memory. A game is in the hot memory
   * when it is considered as 'opened' by the system.
   */
  private gameInstances: {[id: number]: IGameInstance};

  /**
   * The next game ID to be generated.
   */
  private nextId: number;

  constructor(
    private readonly gamesStorageService: GamesStorageService,
    private readonly messagingService: MessagingService,
    private readonly logService: LogService,
    private readonly wizzardService: WizzardService,
    private readonly restService: RestService,
    private readonly arenaRoomsService: ArenaRoomsService,
    private readonly gameWorkerService: GameWorkerService,
    private readonly gameHookService: GameHookService,
  ) {
    // Get base data
    this.gameInstances = {};
    this.nextId = gamesStorageService.getNextId();
  }

  /**
   * Creates a game instance & store it in the hot memory
   * @param gameTypeId
   * @param users
   */
  async createGameInstance(gameTypeId: string, users: IGameUser[]): Promise<IGameInstance> {
    // Throws an error when max concurrent games is reached
    if (Object.keys(this.gameInstances).length >= GameService.MAX_CONCURRENT_GAMES) {
      throw new Error('Reached max concurrent games.');
    }

    // Create the decks
    const decks: IDeck[] = await this.restService.decks();
    const gameType: IGameType = await this.restService.gameType(gameTypeId);
    const cards: IGameCard[] = [];
    users.forEach((gameUser: IGameUser, index: number) => {
      const decksToMix: Array<destiny|origin> = [gameUser.destiny];
      if (gameUser.origin) {
        decksToMix.push(gameUser.origin);
      }
      decksToMix.forEach((deckToMix: string) => {
        const deck: IDeck = decks.find((d: IDeck) => d.id === deckToMix);
        deck.cards.forEach((card: ICard) => {
          const randomId: number = randBetween(0, Number.MAX_SAFE_INTEGER);
          cards.push({
            user: gameUser.user,
            location: card.type === 'player' ? 'board' : 'deck',
            coords: card.type === 'player' ? gameType.players[index] : undefined,
            id: `${this.nextId}_${randomId}`,
            currentStats: card.stats ? JSON.parse(JSON.stringify(card.stats)) : undefined,
            metadata: {},
            card: JSON.parse(JSON.stringify(card)),
          });
        });
      });
    });

    // Shuffle cards
    const shuffledCards: IGameCard[] = shuffle(cards);

    // Get curse card
    const curseCard: ICard = await this.restService.card('curse-of-mara');

    users.forEach((gameUser: IGameUser, index: number) => {
      // Add the cursed cards
      const wizzard = this.wizzardService.getWizzard(gameUser.user);
      const curseItem: IWizzardItem|undefined = wizzard.items.find((item: IWizzardItem) => item.name === 'curse');
      if (curseItem) {
        for (let i = 0; i < curseItem.num; i ++) {
          const randomId: number = randBetween(0, Number.MAX_SAFE_INTEGER);
          shuffledCards.unshift({
            card: JSON.parse(JSON.stringify(curseCard)),
            user: gameUser.user,
            location: 'deck',
            id: `${this.nextId}_${randomId}`,
          });
        }
      }

      // Get the first 6 cards in the hand of each player
      let cardsTook: number = 0;
      shuffledCards.forEach((card: IGameCard) => {
        if (gameUser.user === card.user && card.location === 'deck' && cardsTook < 6) {
          card.location = 'hand';
          cardsTook ++;
        }
      });
    });

    // Get the first user
    const firstUserToPlay = randBetween(0, users.length);

    // Create the instance
    const gameInstance: IGameInstance = {
      status: 'active',
      id: this.nextId,
      gameTypeId,
      users,
      cards: shuffledCards,
      actions: {
        current: [],
        previous: [],
      },
    };

    // Create the first action
    const action: IGameAction = await this.gameWorkerService.getWorker('throw-cards')
      .create(gameInstance, {user: users[firstUserToPlay].user});
    gameInstance.actions.current.push(action);

    // Save it
    this.gameInstances[this.nextId] = gameInstance;
    this.gamesStorageService.save(gameInstance);

    // Dispatch event with the created instance
    await this.gameHookService.dispatch(gameInstance, `game:created:${gameTypeId}`, {gameInstance});

    // Create the room in the rooms service
    await this.arenaRoomsService.createRoomForGame(gameInstance);

    // Increase next ID
    this.nextId ++;

    // Log
    this.logService.info(`Game ${gameInstance.id} created`, gameInstance);

    // Return created instance
    return gameInstance;
  }

  /**
   * Get wether the user is playing already or not
   * @param user
   */
  isUserPlaying(user: number): boolean {
    return Object.keys(this.gameInstances).filter(
      (g) => {
        return this.gameInstances[g].status === 'active' &&
          this.gameInstances[g].users.filter((u) => u.user === user).length > 0;
      },
    ).length > 0;
  }

  /**
   * Get an instance by id
   * @param user
   */
  getGameInstance(id: number): IGameInstance|null {
    // Get instance in hot memory
    const game: IGameInstance|null = this.gameInstances[id] ? this.gameInstances[id] : null;
    if (game) {
      return game;
    }

    // Get instance in cold memory
    return this.gamesStorageService.get(id);
  }

  /**
   * Get all game instances in hot memory
   */
  getGameInstances(): IGameInstance[] {
    return Object.keys(this.gameInstances).map(
      (gameInstanceId: string) => {
        return this.gameInstances[gameInstanceId];
      },
    );
  }

  /**
   * Purge an instance from the hot memory
   * @param gameInstance
   */
  purgeFromMemory(gameInstance: IGameInstance): void {
    // Ensure that the instance is written on the disk
    this.gamesStorageService.save(gameInstance);
    // Deletes the instance from memory
    if (this.gameInstances[gameInstance.id]) {
      delete this.gameInstances[gameInstance.id];
    }
  }

  /**
   * Loads an instance in the hot memory
   * @param instance
   */
  loadInMemory(instance: IGameInstance) {
    this.gameInstances[instance.id] = instance;
  }

  /**
   * Async process actions for a game instance
   * @param gameInstance
   */
  async processActionsFor(gameInstance: IGameInstance): Promise<void> {
    // Game instances should not be played if they are not active
    if (gameInstance.status !== 'active') {
      this.purgeFromMemory(gameInstance);
      return;
    }

    // A game instance SHOULD have at least one current action
    // Close a game without any action and throw an error, because this is not a normal behavior
    if (gameInstance.actions.current.length === 0) {
      this.logService.error('Game opened without action', gameInstance);
      gameInstance.status = 'closed';
      this.purgeFromMemory(gameInstance);
      return;
    }

    // Calculate the JSON hash of the game instance
    const jsonHash: string = JSON.stringify(gameInstance);

    // Get the max priority of the pending actions
    const maxPriority = gameInstance.actions.current.reduce((acc: number, action: IGameAction) => {
      return action.priority > acc ? action.priority : acc;
    }, 0);

    // Treat only max priority action with a response (only one reponse will be treated in an instance per tick)
    const pendingGameAction: IGameAction|undefined
      = gameInstance.actions.current.find((action: IGameAction) => action.priority === maxPriority && action.responses !== undefined);

    // Executes the game actions when exists
    if (pendingGameAction) {
      try {
        if (await this.gameWorkerService.getWorker(pendingGameAction.type).execute(gameInstance, pendingGameAction)) {
          // Dispatch event after each action
          this.gameHookService
            .dispatch(gameInstance, `action:executed:${pendingGameAction.type}`, {user: pendingGameAction.user, action: pendingGameAction});
          // Send to the other players that the action succeed
          this.messagingService.sendMessage(
            '*',
            `TheFirstSpine:game:${gameInstance.id}:action`,
            pendingGameAction,
          );
          // Okay, deletes the action
          await this.gameWorkerService.getWorker(pendingGameAction.type).delete(gameInstance, pendingGameAction);
          // Dispatch event after each action
          this.gameHookService.dispatch(gameInstance, `action:deleted:${pendingGameAction.type}`, {user: pendingGameAction.user});
          // Refresh the other ones
          const refreshPromises: Array<Promise<void>> = gameInstance.actions.current.map(async (action: IGameAction) => {
              this.gameWorkerService.getWorker(action.type).refresh(gameInstance, action);
              // Dispatch event after each action
              this.gameHookService.dispatch(gameInstance, `action:refreshed:${action.type}`, {user: action.user, action});
              return;
          });
          await Promise.all(refreshPromises);
        } else {
          // Something's wrong, delete the response
          pendingGameAction.responses = undefined;
        }
      } catch (e) {
        // tslint:disable-next-line:no-console
        this.logService.error(`Error in process action`, {name: e.name, message: e.message, stack: e.stack});
      }
    }

    // Get the pending game actions with expiration
    const promises: Array<Promise<any>> = gameInstance.actions.current.map(async (gameAction: IGameAction) => {
      try {
        if (gameAction.expiresAt && gameAction.expiresAt < Date.now() && gameAction.priority === maxPriority) {
          await this.gameWorkerService.getWorker(gameAction.type).expires(gameInstance, gameAction);
          // Dispatch event after each action
          this.gameHookService.dispatch(gameInstance, `action:expired:${gameAction.type}`, {user: gameAction.user, action: gameAction});
        }
      } catch (e) {
        // tslint:disable-next-line:no-console
        this.logService.error(`Error in expire action`, e);
      }
    });
    await Promise.all(promises);

    // Exit method when no changes
    if (JSON.stringify(gameInstance) === jsonHash) {
      return;
    }

    // Save the game instance
    this.gamesStorageService.save(gameInstance);

    // Look for status at the end of this run and purge the game from memory if not opened
    if (gameInstance.status !== 'active') {
      this.purgeFromMemory(gameInstance);
    }
  }

  async lookForPendingActions() {
    // Main loop on the games instances
    return Promise.all(this.getGameInstances().map(this.processActionsFor.bind(this)));
  }

  /**
   * Closes a game
   * @param id
   */
  closeGame(id: number) {
    if (this.gameInstances[id]) {
      this.gameInstances[id].status = 'closed';
    }
  }

}
