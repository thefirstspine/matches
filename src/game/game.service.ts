import { Injectable } from '@nestjs/common';
import { shuffle } from '../utils/array.utils';
import { randBetween } from '../utils/maths.utils';
import { WizardService } from '../wizard/wizard.service';
import { IGameInstance, IGameUser, IGameCard, IGameAction, IWizardItem, IGameInteraction } from '@thefirstspine/types-arena';
import { RestService } from '../rest/rest.service';
import { ICard } from '@thefirstspine/types-rest';
import { IGameType, IDeck } from '@thefirstspine/types-rest';
import { ArenaRoomsService } from '../rooms/arena-rooms.service';
import { GameWorkerService } from './game-worker/game-worker.service';
import { GameHookService } from './game-hook/game-hook.service';
import { LogsService } from '@thefirstspine/logs-nest';
import { MessagingService } from '@thefirstspine/messaging-nest';
import { InjectModel } from '@nestjs/mongoose';
import { GameInstance, GameInstanceDocument } from './game-instance.schema';
import { Model } from 'mongoose';

/**
 * Service to manage game instances
 */
@Injectable()
export class GameService {

  public static readonly MAX_CONCURRENT_GAMES: number = 100;

  /**
   * All the game instance stored in the hot memory. A game is in the hot memory
   * when it is considered as 'opened' by the system.
   */
  private gameInstances: {[id: number]: IGameInstance};

  constructor(
    private readonly messagingService: MessagingService,
    private readonly logsService: LogsService,
    private readonly wizardService: WizardService,
    private readonly restService: RestService,
    private readonly arenaRoomsService: ArenaRoomsService,
    private readonly gameWorkerService: GameWorkerService,
    private readonly gameHookService: GameHookService,
    @InjectModel(GameInstance.name) private gameInstanceModel: Model<GameInstanceDocument>,
  ) {
    this.loadPendingGameInstances();
  }

  /**
   * Creates a game instance & store it in the hot memory
   * @param gameTypeId
   * @param users
   */
  async createGameInstance(gameTypeId: string, users: IGameUser[], modifiers: string[], theme: string): Promise<IGameInstance> {
    // Generate a numeric ID to ensure retrocompatibility
    const gameInstanceId = Date.now();

    // Throws an error when max concurrent games is reached
    if (Object.keys(this.gameInstances).length >= GameService.MAX_CONCURRENT_GAMES) {
      throw new Error('Reached max concurrent games.');
    }

    // Create the decks
    const decks: IDeck[] = await this.restService.decks();
    const gameType: IGameType = await this.restService.gameType(gameTypeId);
    const cards: IGameCard[] = [];
    users.forEach((gameUser: IGameUser, index: number) => {
      const decksToMix: string[] = [gameUser.destiny];
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
            id: `${gameInstanceId}_${randomId}`,
            currentStats: card.stats ? JSON.parse(JSON.stringify(card.stats)) : undefined,
            metadata: {},
            card: JSON.parse(JSON.stringify(card)),
          });
        });
      });
    });

    // Add setup cards
    const cardsSetup = Object.keys(gameType.setup).map((coords: string): IGameCard => {
      const randomId: number = randBetween(0, Number.MAX_SAFE_INTEGER);
      const xy = coords.split('-').map((i) => parseInt(i, 10));
      return {
        card: gameType.setup[coords],
        user: 0,
        location: 'board',
        id: `${gameInstanceId}_${randomId}`,
        coords: {
          x: xy[0],
          y: xy[1],
        },
      };
    });
    cards.push(...cardsSetup);

    // Shuffle cards
    const shuffledCards: IGameCard[] = shuffle(cards);

    // Get curse card
    const curseCard: ICard = await this.restService.card('curse-of-mara');

    await Promise.all(users.map(async (gameUser: IGameUser, index: number) => {
      // Add the cursed cards
      const wizzard = await this.wizardService.getOrCreateWizard(gameUser.user);
      const curseItem: IWizardItem|undefined = wizzard.items.find((item: IWizardItem) => item.name === 'curse');
      if (curseItem) {
        for (let i = 0; i < curseItem.num; i ++) {
          const randomId: number = randBetween(0, Number.MAX_SAFE_INTEGER);
          shuffledCards.unshift({
            card: JSON.parse(JSON.stringify(curseCard)),
            user: gameUser.user,
            location: 'deck',
            id: `${gameInstanceId}_${randomId}`,
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
    }));

    // Get the first user
    const firstUserToPlay = randBetween(0, users.length);

    // Create the instance
    const gameInstance: IGameInstance = {
      status: 'active',
      id: gameInstanceId,
      modifiers,
      theme,
      gameTypeId,
      users,
      cards: shuffledCards,
      actions: {
        current: [],
        previous: [],
      },
    };

    // Create the first action
    const action: IGameAction<IGameInteraction> = await this.gameWorkerService.getWorker('throw-cards')
      .create(gameInstance, {user: users[firstUserToPlay].user});
    gameInstance.actions.current.push(action);

    // Save it
    await this.gameInstanceModel.create(gameInstance);
    this.gameInstances[gameInstanceId] = gameInstance;

    // Dispatch event with the created instance
    await this.gameHookService.dispatch(gameInstance, `game:created:${gameTypeId}`, {gameInstance});

    // Create the room in the rooms service
    this.arenaRoomsService.createRoomForGame(gameInstance);

    // Log
    this.logsService.info(`Game ${gameInstance.id} created`, gameInstance);

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
  async getGameInstance(id: number): Promise<IGameInstance|null> {
    // Get instance in hot memory
    const game: IGameInstance|null = this.gameInstances[id] ? this.gameInstances[id] : null;
    if (game) {
      return game;
    }

    // Get instance in cold memory
    const gameInstance: IGameInstance = await this.gameInstanceModel.findOne({id}).exec();
    return gameInstance;
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
  async purgeFromMemory(gameInstance: IGameInstance) {
    // Ensure that the instance is written on the disk
    await this.gameInstanceModel.updateOne({id: gameInstance.id}, gameInstance);
    // Deletes the instance from memory
    if (this.gameInstances[gameInstance.id]) {
      delete this.gameInstances[gameInstance.id];
    }
  }

  async loadPendingGameInstances() {
    // Get the current game instances at launch
    const instances: IGameInstance[] = await this.gameInstanceModel.find({status: 'active'}).exec();
    this.gameInstances = instances.reduce((acc: {[id: number]: IGameInstance}, instance: IGameInstance) => {
      acc[instance.id] = instance;
      return acc;
    }, {});
  }

  /**
   * Loads an instance in the hot memory
   * @param instance
   */
  loadInMemory(instance: IGameInstance) {
    this.gameInstances[instance.id] = instance;
  }

  /**
   * Respond to an action. This response is scopped by game instance, type & user.
   * @param gameInstanceId
   * @param actionType
   * @param user
   * @param response
   */
  async respondToAction(gameInstanceId: number, actionType: string, user: number, response: {[key: string]: any}) {
    // Get game action
    const gameInstance = await this.getGameInstance(gameInstanceId);
    if (!gameInstance) {
      return false;
    }

    // Get action
    const action: IGameAction<any>|undefined = gameInstance.actions.current.find((a: IGameAction<any>) => {
      return a.type === actionType && a.user === user;
    });
    if (!action) {
      return false;
    }

    // Store response
    action.response = response;

    // Save instance
    await this.gameInstanceModel.updateOne({id: gameInstance.id}, gameInstance);

    return true;
  }

  /**
   * Async process actions for a game instance
   * @param gameInstance
   */
  async processActionsFor(gameInstance: IGameInstance): Promise<void> {
    // Game instances should not be played if they are not active
    if (gameInstance.status !== 'active') {
      await this.purgeFromMemory(gameInstance);
      return;
    }

    // A game instance SHOULD have at least one current action
    // Close a game without any action and throw an error, because this is not a normal behavior
    if (gameInstance.actions.current.length === 0) {
      this.logsService.error('Game opened without action', gameInstance);
      gameInstance.status = 'closed';
      await this.purgeFromMemory(gameInstance);
      return;
    }

    // Calculate the JSON hash of the game instance
    const jsonHash: string = JSON.stringify(gameInstance);

    // Get the max priority of the pending actions
    const maxPriority = gameInstance.actions.current.reduce((acc: number, action: IGameAction<IGameInteraction>) => {
      return action.priority > acc ? action.priority : acc;
    }, 0);

    // Treat only max priority action with a response (only one reponse will be treated in an instance per tick)
    const pendingGameAction: IGameAction<IGameInteraction>|undefined =
      gameInstance.actions.current
        .find((action: IGameAction<IGameInteraction>) => action.priority === maxPriority && action.response !== undefined);

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
          const refreshPromises: Array<Promise<void>> = gameInstance.actions.current.map(async (action: IGameAction<IGameInteraction>) => {
              this.gameWorkerService.getWorker(action.type).refresh(gameInstance, action);
              // Dispatch event after each action
              this.gameHookService.dispatch(gameInstance, `action:refreshed:${action.type}`, {user: action.user, action});
              return;
          });
          await Promise.all(refreshPromises);
        } else {
          // Something's wrong, delete the response
          pendingGameAction.response = undefined;
        }
      } catch (e) {
        // tslint:disable-next-line:no-console
        this.logsService.error(`Error in process action`, {name: e.name, message: e.message, stack: e.stack});
      }
    }

    // Get the pending game actions with expiration
    const promises: Array<Promise<any>> = gameInstance.actions.current.map(async (gameAction: IGameAction<IGameInteraction>) => {
      try {
        if (gameAction.expiresAt && gameAction.expiresAt < Date.now() && gameAction.priority === maxPriority) {
          await this.gameWorkerService.getWorker(gameAction.type).expires(gameInstance, gameAction);
          // Dispatch event after each action
          this.gameHookService.dispatch(gameInstance, `action:expired:${gameAction.type}`, {user: gameAction.user, action: gameAction});
        }
      } catch (e) {
        // tslint:disable-next-line:no-console
        this.logsService.error(`Error in expire action`, e);
      }
    });

    // Wait for pending promises
    await Promise.all(promises);

    // Save game instance
    await this.gameInstanceModel.updateOne({id: gameInstance.id}, gameInstance);

    // Exit method when no changes
    if (JSON.stringify(gameInstance) === jsonHash) {
      return;
    }

    // Look for status at the end of this run and purge the game from memory if not opened
    if (gameInstance.status !== 'active') {
      await this.purgeFromMemory(gameInstance);
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

  /**
   * Surrend a game.
   * @param id The ID of the game
   * @param user The user who abandon the game
   */
  async concedeGame(id: number, user: number) {
    // Find the instance
    const instance: IGameInstance|undefined = this.gameInstances[id];
    if (!instance || instance.status !== 'active') {
      return false;
    }

    // Find the user's card
    const userCard = instance.cards.find((card: IGameCard) => {
      return card.card.type === 'player' && card.user === user;
    });
    if (!userCard) {
      return false;
    }

    // Find the opponent's card
    const enemyCard = instance.cards.find((card: IGameCard) => {
      return card.card.type === 'player' && card.user !== user;
    });
    if (!enemyCard) {
      return false;
    }

    const lifeLeft: number = userCard.currentStats.life;
    userCard.currentStats.life = 0;
    await this.gameHookService.dispatch(
      instance,
      `card:lifeChanged:damaged:${userCard.card.id}`,
      {
        gameCard: userCard,
        source: enemyCard,
        lifeChanged: -lifeLeft,
      });

    // Set the status of the game when closed
    instance.status = 'conceded';

  }

}
