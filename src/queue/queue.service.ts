import { Injectable } from '@nestjs/common';
import { GameService } from '../game/game.service';
import { WizzardService } from '../wizzard/wizzard.service';
import { destiny, origin } from '../@shared/rest-shared/base';
import { IGameUser, IGameInstance } from '../@shared/arena-shared/game';
import { IWizzardItem, IWizzard, IHistoryItem } from '../@shared/arena-shared/wizzard';
import { IGameType } from '../@shared/rest-shared/entities';
import { RestService } from '../rest/rest.service';
import { getScore } from '../utils/game.utils';
import { MessagingService } from '../@shared/messaging-shared/messaging.service';
import { BotsService } from '../bots/bots.service';

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
  private queue: IQueue = {};

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
  }

  /**
   * Join a queue
   * @param gameTypeId
   * @param user
   * @returns {IGameUser[]}
   */
  async join(
    gameTypeId: string,
    user: number,
    destiny: destiny,
    origin: origin|undefined,
    style: string|undefined,
  ): Promise<IGameUser[]> {
    // Exit method if user is in a queue
    if (this.isUserInAllQueues(user)) {
      throw new Error('User already in a queue.');
    }

    // Exit method if user is in a game instance
    if (this.gameService.isUserPlaying(user)) {
      throw new Error('User already in a game instance.');
    }

    // Exit method if user has not the style
    style = style ? style : '';
    if (style !== '' && !this.wizzardService.getWizzard(user).items.find((i: IWizzardItem) => i.name === `style-${style}`)) {
      throw new Error('User does not own the style.');
    }

    // Load game type
    const gameType: IGameType = await this.restService.gameType(gameTypeId);

    // Check game type availability
    if (!gameType) {
      throw new Error('Queue not available. Check the game type ID or retry in a few minutes.');
    }

    // Check destiny
    if (!gameType.destinies.includes(destiny)) {
      throw new Error('Destiny not allowed in that game type.');
    }

    // Check origin
    if ((gameType.destinies.length === 0 && origin !== undefined) || (gameType.origins.includes(origin))) {
      throw new Error('Origin not allowed in that game type.');
    }

    // TODO: guard here to check for max games & shields

    // Add the user in the queue
    this.queue[gameTypeId] = this.queue[gameTypeId] ? this.queue[gameTypeId] : [];
    this.queue[gameTypeId].push({
      user,
      destiny,
      origin,
      style,
      queueExpiresAt: Date.now() + (QueueService.QUEUE__EXPIRATION_TIME * 1000),
    });

    // On empty queue for quick & classic games, create a bot
    if (gameType.matchmakingMode === 'asap' && this.queue[gameTypeId].length < gameType.players.length) {
      await this.botsService.askForABot(gameTypeId);
    }

    // Send message
    this.messagingService.sendMessage(
      '*',
      'TheFirstSpine:queue',
      {
        event: 'joined',
        gameType,
        queue: this.queue[gameTypeId].length,
      },
    );

    return this.queue[gameTypeId];
  }

  refreshAsk(
    gameTypeId: string,
    user: number,
  ): IGameUser[] {
    // Exit method if user is not in the queue
    if (!this.isUserInQueue(gameTypeId, user)) {
      throw new Error('User not in a the queue.');
    }

    // Check queue availability
    if (!Array.isArray(this.queue[gameTypeId])) {
      throw new Error('Queue not available. Check the game type ID or retry in a few minutes.');
    }

    // Remove the user from the queue
    this.queue[gameTypeId].forEach((queueUser: IQueueUser) => {
      if (queueUser.user === user) {
        queueUser.queueExpiresAt = Date.now() + (QueueService.QUEUE__EXPIRATION_TIME * 1000);
      }
    });
    return this.queue[gameTypeId];
  }

  /**
   * Quit a queue
   * @param gameTypeId
   * @param user
   * @returns {IGameUser[]}
   */
  quit(
    gameTypeId: string,
    user: number,
  ): IGameUser[] {
    // Exit method if user is not in the queue
    if (!this.isUserInQueue(gameTypeId, user)) {
      throw new Error('User not in a the queue.');
    }

    // Check queue availability
    if (!Array.isArray(this.queue[gameTypeId])) {
      throw new Error('Queue not available. Check the game type ID or retry in a few minutes.');
    }

    // Remove the user from the queue
    this.queue[gameTypeId] = this.queue[gameTypeId].filter(u => u.user !== user);
    return this.queue[gameTypeId];
  }

  /**
   * Process matchmackings for all the available game types.
   */
  async processMatchmakings() {
    return Promise.all(Object.keys(this.queue).map(this.processMatchmakingFor.bind(this)));
  }

  /**
   * Process the matchmaking for a given game type
   * @param gameTypeId
   */
  async processMatchmakingFor(gameTypeId: string): Promise<void> {
    // Load game type
    const gameType: IGameType = await this.restService.gameType(gameTypeId);

    // Get users in queue
    const queueUsers: IGameUser[] = this.getUsersInQueue(gameType.id);
    const queueWizzards: IWizzard[] = queueUsers.map((u: IGameUser) => {
      return this.wizzardService.getWizzard(u.user);
    });

    if (queueUsers.length >= gameType.players.length) {
      // We have to sort the users here in a ranked matchmaking type
      if (gameType.matchmakingMode === 'ranked') {
        queueUsers.sort((a: IGameUser, b: IGameUser) => {
          const aIndex: number = queueUsers.findIndex((u) => u === a);
          const aScore: number = getScore(queueWizzards[aIndex].history.filter((h: IHistoryItem) => h.gameTypeId === gameTypeId));
          const bIndex: number = queueUsers.findIndex((u) => u === b);
          const bScore: number = getScore(queueWizzards[bIndex].history.filter((h: IHistoryItem) => h.gameTypeId === gameTypeId));
          if (aScore === bScore) {
            return 0;
          }
          return aScore > bScore ? 1 : -1;
        });
      }
      // Extract the users needed from the queue
      const queueUsersNeeded: IGameUser[] = queueUsers.splice(0, gameType.players.length);
      // Create a game
      const game: IGameInstance = await this.gameService.createGameInstance(gameType.id, queueUsersNeeded);
      // Make them quit from the queue
      queueUsersNeeded.forEach((queueUser: IGameUser) => this.quit(gameType.id, queueUser.user));
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
  async lookForExpiredQueueAsks() {
    return Promise.all(Object.keys(this.queue).map(this.processQueueExpirationFor.bind(this)));
  }

  /**
   * Manages expired queue asks for a given game type.
   * @param gameTypeId
   */
  async processQueueExpirationFor(gameTypeId: string) {
    // Load game type
    const gameType: IGameType = await this.restService.gameType(gameTypeId);

    this.queue[gameTypeId] = this.queue[gameTypeId].filter((queueUser: IQueueUser) => {
      if (queueUser.queueExpiresAt < Date.now()) {
        this.messagingService.sendMessage(
          [queueUser.user],
          'TheFirstSpine:queue',
          {
            event: 'expired',
            gameType,
            queue: this.queue[gameTypeId].length,
          },
        );
        return false;
      }
      return true;
    });
  }

  /**
   * Get if user in a queue
   * @param gameTypeId
   * @param user
   */
  isUserInQueue(gameTypeId: string, user: number): boolean {
    return this.queue[gameTypeId].find(u => u.user === user) !== undefined;
  }

  /**
   * Get if user is in any queue
   * @param user
   */
  isUserInAllQueues(user: number): boolean {
    return Object.keys(this.queue).reduce((acc: boolean, gameTypeId: string) => {
      return acc || this.isUserInQueue(gameTypeId, user);
    }, false);
  }

  /**
   * Get users in a queue
   * @param gameTypeId
   */
  getUsersInQueue(gameTypeId): IGameUser[] {
    // Check queue availability
    if (!Array.isArray(this.queue[gameTypeId])) {
      throw new Error('Queue not available. Check the game type ID or retry in a few minutes.');
    }

    return JSON.parse(JSON.stringify(this.queue[gameTypeId]));
  }

}

/**
 * Represents a queue for a game type
 */
export interface IQueue {
  [key: string]: IQueueUser[];
}

export interface IQueueUser extends IGameUser {
  queueExpiresAt: number;
}
