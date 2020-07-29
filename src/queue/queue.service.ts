import { Injectable } from '@nestjs/common';
import { GameService } from '../game/game.service';
import { WizzardService } from '../wizard/wizard.service';
import { IGameUser, IGameInstance, IWizardItem, IWizard, IWizardHistoryItem, IQueueInstance, IQueueUser } from '@thefirstspine/types-arena';
import { IGameType } from '@thefirstspine/types-rest';
import { RestService } from '../rest/rest.service';
import { getScore } from '../utils/game.utils';
import { BotsService } from '../bots/bots.service';
import { MessagingService } from '@thefirstspine/messaging-nest';
import { Modifiers } from '../game/modifiers';
import { Themes } from '../game/themes';

/**
 * Service to manage the game queue
 */
@Injectable()
export class QueueService {

  /**
   * Expiration time of a queue ask in seconds
   */
  public static readonly QUEUE__EXPIRATION_TIME: number = 60; // one minute seems a fair waiting time

  /**
   * The games queues
   */
  private queueInstances: IQueueInstance[] = [];

  /**
   * Construtor. Initialize the queue property.
   */
  constructor(
    private readonly messagingService: MessagingService,
    private readonly gameService: GameService,
    private readonly wizzardService: WizzardService,
    private readonly restService: RestService,
    private readonly botsService: BotsService,
  ) {
    // Create base queues instances
    this.queueInstances.push(
      {
        key: 'fpe',
        gameTypeId: 'fpe',
        users: [],
        modifiers: [],
        createdAt: Date.now(),
      },
      {
        key: 'immediate',
        gameTypeId: 'standard',
        users: [],
        modifiers: [Modifiers.IMMEDIATE],
        createdAt: Date.now(),
      },
      {
        key: 'daily',
        gameTypeId: 'standard',
        users: [],
        modifiers: [Modifiers.DAILY],
        createdAt: Date.now(),
      },
      {
        key: 'cycle',
        gameTypeId: 'standard',
        users: [],
        modifiers: [Modifiers.CYCLE],
        createdAt: Date.now(),
      },
    );
  }

  /**
   * Create a queue instance. The created instance will expire in 30 minutes.
   * @param key
   * @param gameTypeId
   */
  async create(
    key: string,
    gameTypeId: string,
    theme: string,
    modifiers: string[],
  ): Promise<IQueueInstance> {
    const gameType: IGameType = await this.restService.gameType(gameTypeId);
    if (!gameType) {
      throw new Error('Cannot find user ID');
    }

    const instance: IQueueInstance = {
      key,
      gameTypeId,
      users: [],
      theme,
      modifiers,
      createdAt: Date.now(),
      expiresAt: Date.now() + (60 * 30 * 1000),
    };

    this.queueInstances.push(instance);

    return instance;
  }

  /**
   * Get a queue instance.
   * @param key
   */
  getQueueInstance(key: string): IQueueInstance|undefined {
    return this.queueInstances.find((q) => q.key === key);
  }

  /**
   * Join a queue
   * @param key
   * @param user
   * @param destiny
   * @param origin
   * @param style
   * @param cover
   */
  async join(
    key: string,
    user: number,
    destiny: string,
    origin?: string,
    style?: string,
    cover?: string,
  ): Promise<IQueueInstance> {
    // Exit method if user is in a queue
    if (this.isUserInAllQueues(user)) {
      throw new Error('User already in a queue.');
    }

    // Exit method if user is in a game instance
    if (this.gameService.isUserPlaying(user)) {
      throw new Error('User already in a game instance.');
    }

    // Get the wizard to validate data
    const wizard: IWizard = this.wizzardService.getOrCreateWizzard(user);

    // Exit method if user has not the style
    style = style ? style : '';
    if (style !== '' && !wizard.items.find((i: IWizardItem) => i.name === `style-${style}`)) {
      throw new Error('User does not own the style.');
    }

    // Exit method if user has not the cover
    cover = cover ? cover : '';
    if (cover !== '' && !wizard.items.find((i: IWizardItem) => i.name === `cover-${cover}`)) {
      throw new Error('User does not own the cover.');
    }

    // Check queue availability
    const queue: IQueueInstance|undefined = this.queueInstances.find((q) => q.key === key);
    if (!queue) {
      throw new Error('Queue instance not available. Check the key or retry in a few minutes.');
    }

    // Get the game type
    const gameType: IGameType = await this.restService.gameType(queue.gameTypeId);
    if (!gameType) {
      throw new Error('Cannot load game type associated withthe queue.');
    }

    // Check destiny
    if (!gameType.destinies.includes(destiny)) {
      throw new Error('Destiny not allowed in that game type.');
    }

    // Check origin
    if (gameType.origins.length > 0 && !(gameType.origins.includes(origin))) {
      throw new Error('Origin not allowed in that game type.');
    }

    // TODO: guard here to check for max games & shields => will be deleted in a next update

    // Add the user in the queue
    queue.users.push({
      user,
      destiny,
      origin,
      style,
      cover,
      queueExpiresAt: Date.now() + (QueueService.QUEUE__EXPIRATION_TIME * 1000),
      queueEnteredAt: Date.now(),
    });

    // Send message
    this.messagingService.sendMessage(
      '*',
      'TheFirstSpine:queue',
      {
        event: 'joined',
        gameType,
        queue: queue.users.length,
      },
    );

    return queue;
  }

  /**
   * Refresh queue join ask in order to avoid expiration
   * @param key
   * @param user
   */
  async refreshAsk(
    key: string,
    user: number,
  ): Promise<IQueueInstance> {
    // Exit method if user is not in the queue
    if (!this.isUserInQueue(key, user)) {
      throw new Error('User not in the queue.');
    }

    // Check queue availability
    const queue: IQueueInstance|undefined = this.queueInstances.find((q) => q.key === key);
    if (!queue) {
      throw new Error('Queue instance not available. Check the key or retry in a few minutes.');
    }

    const gameType: IGameType = await this.restService.gameType(queue.gameTypeId);
    if (!gameType) {
      throw new Error('Cannot find this game type.');
    }

    // Refresh user queue's expiration date
    queue.users.forEach((queueUser: IQueueUser) => {
      if (queueUser.user === user) {
        queueUser.queueExpiresAt = Date.now() + (QueueService.QUEUE__EXPIRATION_TIME * 1000);
      }
    });

    return queue;
  }

  /**
   * Quit a queue
   * @param key
   * @param user
   * @returns {IQueueInstance}
   */
  quit(
    key: string,
    user: number,
  ): IQueueInstance {
    // Check queue availability
    const queue: IQueueInstance|undefined = this.queueInstances.find((q) => q.key === key);
    if (!queue) {
      throw new Error('Queue instance not available. Check the key or retry in a few minutes.');
    }

    // Remove the user from the queue
    queue.users = queue.users.filter(u => u.user !== user);
    return queue;
  }

  /**
   * Spawn bots on all game types
   */
  async processBotSpawns() {
    return Promise.all(this.queueInstances.map(this.processBotSpawnsFor.bind(this)));
  }

  /**
   * Spawn bots when needed for a particular game type
   * @param queueInstance
   */
  async processBotSpawnsFor(queueInstance: IQueueInstance): Promise<void> {
    // Load game type
    const gameType: IGameType = await this.restService.gameType(queueInstance.gameTypeId);

    // Get users in queue
    const queueUsers: IQueueUser[] = queueInstance.users;

    // On empty queue exit method
    if (queueUsers.length <= 0) {
      return;
    }

    // On queue with more than two users, exit method
    if (queueUsers.length >= 2) {
      return;
    }

    // The matchmaking mode should be on "asap"
    if (gameType.matchmakingMode !== 'asap') {
      return;
    }

    // Spawn bot only on queue older than 31 seconds
    if (Date.now() - queueUsers[0].queueEnteredAt < (31 * 1000)) {
      return;
    }

    // On empty queue and user is waiting for more than 60 seconds, call a bot
    this.botsService.askForABot(queueInstance.key);
  }

  /**
   * Process matchmackings for all the available game types.
   */
  async processMatchmakings() {
    return Promise.all(this.queueInstances.map(this.processMatchmakingFor.bind(this)));
  }

  /**
   * Process the matchmaking for a given game type
   * @param queueInstance
   */
  async processMatchmakingFor(queueInstance: IQueueInstance): Promise<void> {
    // Load game type
    const gameType: IGameType = await this.restService.gameType(queueInstance.gameTypeId);

    // Get users in queue
    const queueUsers: IQueueUser[] = queueInstance.users;
    const queueWizzards: IWizard[] = queueUsers.map((u: IGameUser) => {
      return this.wizzardService.getOrCreateWizzard(u.user);
    });

    if (queueUsers.length >= gameType.players.length) {
      // We have to sort the users here in a ranked matchmaking type
      if (gameType.matchmakingMode === 'ranked') {
        queueUsers.sort((a: IGameUser, b: IGameUser) => {
          const aIndex: number = queueUsers.findIndex((u) => u === a);
          const aScore: number = getScore(queueWizzards[aIndex].history.filter((h: IWizardHistoryItem) => h.gameTypeId === queueInstance.gameTypeId));
          const bIndex: number = queueUsers.findIndex((u) => u === b);
          const bScore: number = getScore(queueWizzards[bIndex].history.filter((h: IWizardHistoryItem) => h.gameTypeId === queueInstance.gameTypeId));
          if (aScore === bScore) {
            return 0;
          }
          return aScore > bScore ? 1 : -1;
        });
      }
      // Extract the users needed from the queue
      const queueUsersNeeded: IGameUser[] = queueUsers.splice(0, gameType.players.length);
      // Create a game
      const game: IGameInstance = await this.gameService.createGameInstance(
        gameType.id,
        queueUsersNeeded,
        queueInstance.modifiers ? queueInstance.modifiers : [],
        queueInstance.theme ? queueInstance.theme : Themes.DEAD_FOREST);
      // Make them quit from the queue
      queueUsersNeeded.forEach((queueUser: IGameUser) => this.quit(queueInstance.key, queueUser.user));
      // Send message
      this.messagingService.sendMessage(
        queueUsersNeeded.map(e => e.user),
        'TheFirstSpine:game',
        {
          event: 'created',
          gameType,
          gameId: game.id,
        },
      );
    }
  }

  /**
   * Looks for expired queue asks. A queue ask is expired when the delay of QUEUE__EXPIRATION_TIME
   * is passed.
   */
  async processExpiredQueueAsks() {
    return Promise.all(this.queueInstances.map(this.processExpiredQueueAsksFor.bind(this)));
  }

  /**
   * Manages expired queue asks for a given game type.
   * @param queueInstance
   */
  async processExpiredQueueAsksFor(queueInstance: IQueueInstance) {
    // Load game type
    const gameType: IGameType = await this.restService.gameType(queueInstance.gameTypeId);

    queueInstance.users = queueInstance.users.filter((queueUser: IQueueUser) => {
      if (queueUser.queueExpiresAt < Date.now()) {
        this.messagingService.sendMessage(
          [queueUser.user],
          'TheFirstSpine:queue',
          {
            event: 'expired',
            gameType,
            queue: queueInstance.users.length,
          },
        );
        return false;
      }
      return true;
    });
  }

  /**
   * Looks for expired queues.
   */
  async processExpiredQueues() {
    this.queueInstances = this.queueInstances.filter((queueInstance: IQueueInstance) => {
      return queueInstance.expiresAt === undefined || queueInstance.expiresAt > Date.now();
    });
  }

  /**
   * Get if user in a queue
   * @param key
   * @param user
   */
  isUserInQueue(key: string, user: number): boolean {
    return !!this.queueInstances.find((q) => q.key === key)?.users.find(u => u.user === user);
  }

  /**
   * Get if user is in any queue
   * @param user
   */
  isUserInAllQueues(user: number): boolean {
    return this.queueInstances.reduce((acc: boolean, queueInstance: IQueueInstance) => {
      return acc || this.isUserInQueue(queueInstance.key, user);
    }, false);
  }

}
