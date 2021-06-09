import { Injectable } from '@nestjs/common';
import { GameService } from '../game/game.service';
import { WizardService } from '../wizard/wizard.service';
import { IGameUser, IGameInstance, IWizardItem, IWizard, IWizardHistoryItem, IQueueInstance, IQueueUser } from '@thefirstspine/types-arena';
import { IGameType } from '@thefirstspine/types-rest';
import { RestService } from '../rest/rest.service';
import { getScore } from '../utils/game.utils';
import { BotsService } from '../bots/bots.service';
import { MessagingService } from '@thefirstspine/messaging-nest';
import { Modifiers } from '../game/modifiers';
import { Themes } from '../game/themes';
import { randBetween } from '../utils/maths.utils';
import fetch from 'node-fetch';
import { CalendarService, ICycle, IEvent } from '../calendar/calendar.service';

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
    private readonly wizardService: WizardService,
    private readonly restService: RestService,
    private readonly botsService: BotsService,
    private readonly calendarService: CalendarService,
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
    this.updateQueueInstancesData();
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
    expirationTimeModifier: number,
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
      expirationTimeModifier,
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
   * Update the instances data based on cycle & day
   */
  async updateQueueInstancesData() {
    const currentCycle: ICycle|null = await this.calendarService.getCurrentCycle();
    if (!currentCycle) {
      // Exit update method on not found cycle
      return;
    }

    // Get the week number
    const weekNumber: number = Math.floor((Date.now() - new Date(currentCycle.datetimeFrom).getTime()) / (1000 * 60 * 60 * 24 * 7));

    const fixedCycleData: {
      [key: string]: {theme: string, modifiers: string[]},
    } = {
      'renewal-2020': {theme: '', modifiers: ['']},
      'great-ancient-2020': {theme: Themes.SPINE_S_CAVE, modifiers: [Modifiers.GREAT_ANCIENTS_EGGS]},
      'treasure-2020': {theme: '', modifiers: ['']},
      'souvenirs-2020': {theme: Themes.FORGOTTEN_CEMETERY, modifiers: [Modifiers.SOUVENIRS_FROM_YOUR_ENEMY]},
      'harvest-2020': {theme: Themes.WASTED_FIELDS, modifiers: [Modifiers.HARVESTING_SOULS]},
      'crowned-souls-2020': {theme: Themes.SACRIFICE_CHURCH, modifiers: [Modifiers.ANNIHILATION_MATTS]},
      'snow-man-2020': {theme: Themes.SNOW_MAN_LAIR, modifiers: [Modifiers.FROZEN_STATUES]},
      'renewal-2021': [
        {theme: Themes.SPINE_S_CAVE, modifiers: [Modifiers.GREAT_ANCIENTS_EGGS, Modifiers.HARVESTING_SOULS]},
        {theme: Themes.FORGOTTEN_CEMETERY, modifiers: [Modifiers.SOUVENIRS_FROM_YOUR_ENEMY, Modifiers.ANNIHILATION_MATTS]},
        {theme: Themes.SNOW_MAN_LAIR, modifiers: [Modifiers.GOLDEN_GALLEONS, Modifiers.FROZEN_STATUES]},
        {theme: Themes.WASTED_FIELDS, modifiers: [Modifiers.GREAT_ANCIENTS_EGGS, Modifiers.HARVESTING_SOULS]},
        {theme: Themes.SACRIFICE_CHURCH, modifiers: [Modifiers.SOUVENIRS_FROM_YOUR_ENEMY, Modifiers.ANNIHILATION_MATTS]},
        {theme: Themes.DEAD_FOREST, modifiers: [Modifiers.GOLDEN_GALLEONS, Modifiers.FROZEN_STATUES]},
      ][weekNumber],
      'absurdal-2021': {theme: Themes.RUINED_LABORATORY, modifiers: [Modifiers.MUTATIONS]},
      'great-ancient-2021': {theme: Themes.SPINE_S_CAVE, modifiers: [Modifiers.GREAT_ANCIENTS_EGGS]},
      'treasure-2021': {theme: Themes.DEAD_FOREST, modifiers: [Modifiers.GOLDEN_GALLEONS]},
      'souvenirs-2021': {theme: Themes.FORGOTTEN_CEMETERY, modifiers: [Modifiers.SOUVENIRS_FROM_YOUR_ENEMY]},
      'fire-2021': {theme: Themes.SPINE_S_CAVE, modifiers: []},
      'harvest-2021': {theme: Themes.WASTED_FIELDS, modifiers: [Modifiers.HARVESTING_SOULS]},
    };

    const fixedDailyData: Array<{theme: string, modifier: string}> = [
      {theme: Themes.SPINE_S_CAVE, modifier: Modifiers.GREAT_ANCIENTS_EGGS},
      {theme: Themes.FORGOTTEN_CEMETERY, modifier: Modifiers.SOUVENIRS_FROM_YOUR_ENEMY},
      {theme: Themes.WASTED_FIELDS, modifier: Modifiers.HARVESTING_SOULS},
      {theme: Themes.SNOW_MAN_LAIR, modifier: Modifiers.FROZEN_STATUES},
    ];

    // Get current events
    const events: IEvent[] = await this.calendarService.getCurrentEvents();
    const eventsString: string[] = events.map((e: IEvent) => e.type);

    this.queueInstances.forEach((instance: IQueueInstance) => {
      if (instance.key === 'immediate') {
        instance.theme = undefined;
        instance.modifiers = [Modifiers.IMMEDIATE];
        if (eventsString.includes('corsairs')) {
          instance.modifiers.push(Modifiers.GOLDEN_GALLEONS);
        }
        if (eventsString.includes('tricks-celebration')) {
          instance.modifiers.push(Modifiers.TRICK_OR_TREAT);
        }
        if (eventsString.includes('triple-shards')) {
          instance.modifiers.push(Modifiers.TRIPLE_SHARDS);
        }
      }
      if (instance.key === 'daily') {
        instance.theme = fixedDailyData[(new Date()).getDay() % fixedDailyData.length].theme;
        instance.modifiers = [
          Modifiers.DAILY,
          fixedDailyData[(new Date()).getDay() % fixedDailyData.length].modifier,
        ];
        if (eventsString.includes('corsairs')) {
          instance.modifiers.push(Modifiers.GOLDEN_GALLEONS);
        }
        if (eventsString.includes('tricks-celebration')) {
          instance.modifiers.push(Modifiers.TRICK_OR_TREAT);
        }
        if (eventsString.includes('triple-shards')) {
          instance.modifiers.push(Modifiers.TRIPLE_SHARDS);
        }
      }
      if (instance.key === 'cycle') {
        instance.theme = fixedCycleData[currentCycle.name].theme;
        instance.modifiers = [
          Modifiers.CYCLE,
          ...fixedCycleData[currentCycle.name].modifiers,
        ];
      }
    });
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
    const wizard: IWizard = await this.wizardService.getOrCreateWizard(user);

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
    // This message is deprecated
    this.messagingService.sendMessage(
      '*',
      'TheFirstSpine:queue',
      {
        event: 'joined',
        gameType,
        queue: queue.users.length,
      },
    );
    this.messagingService.sendMessage(
      '*',
      `TheFirstSpine:queue:${key}:joined`,
      queue);

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

    // Send message
    this.messagingService.sendMessage(
      '*',
      `TheFirstSpine:queue:${key}:joined`,
      queue);

    // Remove the user from the queue
    queue.users = queue.users.filter(u => u.user !== user);
    return queue;
  }

  /**
   * Spawn bots on all game types
   */
  async processBotSpawns() {
    return Promise.all(
      this.queueInstances
        .filter((q) => ['immediate', 'daily', 'cycle'].includes(q.key))
        .map(this.processBotSpawnsFor.bind(this)));
  }

  /**
   * Spawn bots when needed for a particular game type
   * @param queueInstance
   */
  async processBotSpawnsFor(queueInstance: IQueueInstance): Promise<void> {
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

    // Spawn bot only on queue older than 31 seconds
    const timeToMatch = queueInstance.modifiers?.includes(Modifiers.IMMEDIATE) ? 10 : 31;
    if (Date.now() - queueUsers[0].queueEnteredAt < (timeToMatch * 1000)) {
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
    const queueWizzards: IWizard[] = await Promise.all(queueUsers.map(async (u: IGameUser) => {
      return await this.wizardService.getOrCreateWizard(u.user);
    }));

    if (queueUsers.length >= gameType.players.length) {
      // We have to sort the users here in a ranked matchmaking type
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

      // Extract the users needed from the queue
      const queueUsersNeeded: IGameUser[] = queueUsers.splice(0, gameType.players.length);

      // Create a game
      const game: IGameInstance = await this.gameService.createGameInstance(
        gameType.id,
        queueUsersNeeded,
        queueInstance.modifiers ? queueInstance.modifiers : [],
        queueInstance.theme ? queueInstance.theme : Themes.user[randBetween(0, Themes.user.length - 1)],
        queueInstance.expirationTimeModifier ? queueInstance.expirationTimeModifier : 1);

      // Make them quit from the queue
      queueUsersNeeded.forEach((queueUser: IGameUser) => this.quit(queueInstance.key, queueUser.user));

      // Send message
      // This message is deprecated
      this.messagingService.sendMessage(
        queueUsersNeeded.map(e => e.user),
        'TheFirstSpine:game',
        {
          event: 'created',
          gameType,
          gameId: game.id,
        },
      );
      this.messagingService.sendMessage(
        queueUsersNeeded.map(e => e.user),
        'TheFirstSpine:game:created',
        {
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

  /**
   * Get the current events in the website service
   */
  protected async getEvents(): Promise<string[]> {
    try {
      const date = (new Date()).toISOString();
      const result = await fetch(`${process.env.CALENDAR_URL}/events?filter=datetimeFrom||lt||${date}&filter=datetimeTo||gt||${date}`);
      const jsonResult = await result.json();
      return jsonResult ? jsonResult.map((e: any) => e.type) : [];
    } catch (e) {
      return [];
    }
  }

}
