import { Injectable } from '@nestjs/common';
import { shuffle } from '../utils/array.utils';
import { randBetween } from '../utils/maths.utils';
import { GamesStorageService } from '../storage/games.storage.service';
import { GameActionWorker } from './game-action-workers/game-action-worker';
import { MessagingService } from '../messaging/messaging.service';
import { ThrowCardsGameActionWorker } from './game-action-workers/throw-cards.game-action-worker';
import { PlaceCardGameActionWorker } from './game-action-workers/place-card.game-action-worker';
import { StartConfrontsGameActionWorker } from './game-action-workers/start-confronts.game-action-worker';
import { MoveCreatureGameActionWorker } from './game-action-workers/move-creature.game-action-worker';
import { GameEvents } from './game-subscribers/game-events';
import playerDamagedGameSubscriber from './game-subscribers/player-damaged.game-subscriber';
import phaseActionsGameSubscriber from './game-subscribers/phase-actions.game-subscriber';
import { SpellRuinGameActionWorker } from './game-action-workers/spell-ruin.game-action-worker';
import { SpellPutrefactionGameActionWorker } from './game-action-workers/spell-putrefaction.game-action-worker';
import { SpellThunderGameActionWorker } from './game-action-workers/spell-thunder.game-action-worker';
import cardDamagedGameSubscriber from './game-subscribers/card-damaged.game-subscriber';
import spellUsedGameSubscriber from './game-subscribers/spell-used.game-subscriber';
import { SpellHealGameActionWorker } from './game-action-workers/spell-heal.game-action-worker';
import cardHealedGameSubscriber from './game-subscribers/card-healed.game-subscriber';
import { SpellReconstructGameActionWorker } from './game-action-workers/spell-reconstruct.game-action-worker';
import { WizzardService } from '../wizzard/wizzard.service';
import { ConfrontsGameActionWorker } from './game-action-workers/confronts.game-action-worker';
import turnEndedGameSubscriber from './game-subscribers/turn-ended.game-subscriber';
import { LogService } from '../@shared/log-shared/log.service';
import { IGameInstance, IGameUser, IGameCard, IGameAction } from '../@shared/arena-shared/game';
import { IWizzardItem } from '../@shared/arena-shared/wizzard';
import { RestService } from '../rest/rest.service';
import { ICard } from '../@shared/rest-shared/card';
import { IGameType, IDeck } from '../@shared/rest-shared/entities';
import { RoomsService } from '../rooms/rooms.service';
import env from '../@shared/env-shared/env';

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
    private readonly roomService: RoomsService,
  ) {
    // Get base data
    this.gameInstances = {};
    this.nextId = gamesStorageService.getNextId();

    // Register game actions
    GameActionWorker.registerActionWorker(ThrowCardsGameActionWorker.TYPE, new ThrowCardsGameActionWorker(this.logService));
    GameActionWorker.registerActionWorker(PlaceCardGameActionWorker.TYPE, new PlaceCardGameActionWorker(this.logService));
    GameActionWorker.registerActionWorker(MoveCreatureGameActionWorker.TYPE, new MoveCreatureGameActionWorker(this.logService));
    GameActionWorker.registerActionWorker(StartConfrontsGameActionWorker.TYPE, new StartConfrontsGameActionWorker(this.logService));
    GameActionWorker.registerActionWorker(ConfrontsGameActionWorker.TYPE, new ConfrontsGameActionWorker(this.logService));
    GameActionWorker.registerActionWorker(SpellRuinGameActionWorker.TYPE, new SpellRuinGameActionWorker(this.logService));
    GameActionWorker.registerActionWorker(SpellPutrefactionGameActionWorker.TYPE, new SpellPutrefactionGameActionWorker(this.logService));
    GameActionWorker.registerActionWorker(SpellThunderGameActionWorker.TYPE, new SpellThunderGameActionWorker(this.logService));
    GameActionWorker.registerActionWorker(SpellHealGameActionWorker.TYPE, new SpellHealGameActionWorker(this.logService));
    GameActionWorker.registerActionWorker(SpellReconstructGameActionWorker.TYPE, new SpellReconstructGameActionWorker(this.logService));

    // Register game subscribers
    GameEvents.subscribe('game:card:lifeChanged:damaged:hunter', playerDamagedGameSubscriber);
    GameEvents.subscribe('game:card:lifeChanged:damaged:sorcerer', playerDamagedGameSubscriber);
    GameEvents.subscribe('game:card:lifeChanged:damaged:conjurer', playerDamagedGameSubscriber);
    GameEvents.subscribe('game:card:lifeChanged:damaged:summoner', playerDamagedGameSubscriber);
    GameEvents.subscribe('game:card:lifeChanged:damaged', cardDamagedGameSubscriber);
    GameEvents.subscribe('game:card:lifeChanged:healed', cardHealedGameSubscriber);
    GameEvents.subscribe('game:phaseChanged:actions', phaseActionsGameSubscriber);
    GameEvents.subscribe('card:spell:used', spellUsedGameSubscriber);
    GameEvents.subscribe('game:turnEnded', turnEndedGameSubscriber);
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
      const origin: IDeck = decks.find((d: IDeck) => d.id === gameUser.destiny);
      origin.cards.map((card: ICard) => {
        const randomId: number = randBetween(0, Number.MAX_SAFE_INTEGER);
        cards.push({
          user: gameUser.user,
          location: card.type === 'player' ? 'board' : 'deck',
          coords: card.type === 'player' ? gameType.players[index] : undefined,
          card: JSON.parse(JSON.stringify(card)),
          id: `${this.nextId}_${randomId}`,
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
    const action: IGameAction = await GameActionWorker.getActionWorker(ThrowCardsGameActionWorker.TYPE)
      .create(gameInstance, {user: users[firstUserToPlay].user});
    gameInstance.actions.current.push(action);

    // Save it
    this.gameInstances[this.nextId] = gameInstance;
    this.gamesStorageService.save(gameInstance);

    // Create the room in the rooms service
    await this.roomService.createRoom('arena', {
      name: `game-${gameInstance.id}`,
      senders: [{
        displayName: '__system',
        user: env.config.ARENA_ROOMS_USER,
      }],
    });

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
        if (await GameActionWorker.getActionWorker(pendingGameAction.type).execute(gameInstance, pendingGameAction)) {
          // Send to the other players that the action succeed
          this.messagingService.sendMessage(
            '*',
            `${MessagingService.SUBJECT__GAME}:${gameInstance.id}:action`,
            pendingGameAction,
          );
          // Okay, deletes the action
          await GameActionWorker.getActionWorker(pendingGameAction.type).delete(gameInstance, pendingGameAction);
          // Refresh the other ones
          const refreshPromises: Array<Promise<void>> = gameInstance.actions.current.map((action: IGameAction) => {
            return GameActionWorker.getActionWorker(action.type).refresh(gameInstance, action);
          });
          await Promise.all(refreshPromises);
        }
      } catch (e) {
        // tslint:disable-next-line:no-console
        this.logService.error(`Error in process action`, {name: e.name, message: e.message, stack: e.stack});
      }
    }

    // Get the pending game actions with expiration
    const promises: Array<Promise<any>> = gameInstance.actions.current.map(async (gameAction: IGameAction) => {
      try {
        if (gameAction.expiresAt && gameAction.expiresAt < Date.now()) {
          if (await GameActionWorker.getActionWorker(gameAction.type).expires(gameInstance, gameAction)) {
            await GameActionWorker.getActionWorker(gameAction.type).delete(gameInstance, gameAction);
          }
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

}
