import { Injectable } from '@nestjs/common';
import { MessagingService } from '../messaging/messaging.service';
import { GameService } from '../game/game.service';
import { WizzardService } from '../wizzard/wizzard.service';
import { destiny, origin } from '../@shared/rest-shared/base';
import { IGameUser, IGameInstance } from '../@shared/arena-shared/game';
import { IWizzardItem } from '../@shared/arena-shared/wizzard';

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
  private queue: IQueue;

  /**
   * Construtor. Initialize the queue property.
   */
  constructor(
    private readonly messagingService: MessagingService,
    private readonly gameService: GameService,
    private readonly wizzardService: WizzardService,
  ) {
    this.queue = GamesTypesLibrary.all().reduce((acc: IQueue, current: IGameType) => {
      acc[current.id] = [];
      return acc;
    }, {});
  }

  /**
   * Join a queue
   * @param gameTypeId
   * @param user
   * @returns {IGameUser[]}
   */
  join(
    gameTypeId: string,
    user: number,
    destiny: destiny,
    origin: origin|undefined,
    style: string|undefined,
  ): IGameUser[] {
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

    // Check queue availability
    if (!Array.isArray(this.queue[gameTypeId])) {
      throw new Error('Queue not available. Check the game type ID or retry in a few minutes.');
    }

    // Check destiny
    if (!GamesTypesLibrary.find(gameTypeId).destinies.includes(destiny)) {
      throw new Error('Destiny not allowed in that game type.');
    }

    // Check origin
    if (
      (
        GamesTypesLibrary.find(gameTypeId).destinies.length === 0 &&
        origin !== undefined
      ) || (
        GamesTypesLibrary.find(gameTypeId).origins.includes(origin)
      )
    ) {
      throw new Error('Origin not allowed in that game type.');
    }

    // Add the user in the queue
    this.queue[gameTypeId].push({
      user,
      destiny,
      origin,
      style,
      queueExpiresAt: Date.now() + (QueueService.QUEUE__EXPIRATION_TIME * 1000),
    });

    // Send message
    this.messagingService.sendMessage(
      '*',
      MessagingService.SUBJECT__QUEUE,
      {
        event: 'joined',
        gameType: GamesTypesLibrary.find(gameTypeId),
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

  async processFullQueueFor(gameTypeId: string): Promise<void> {
    const gameType = GamesTypesLibrary.find(gameTypeId);
    if (!gameTypeId) {
      return;
    }

    const queueUsers: IGameUser[] = this.getUsersInQueue(gameType.id);
    if (queueUsers.length >= gameType.players.length) {
      // TODO: we have to ran the users here in a ranked matchmaking type
      // Extract the users needed from the queue
      const queueUsersNeeded: IGameUser[] = queueUsers.splice(0, gameType.players.length);
      // Create a game
      const game: IGameInstance = await this.gameService.createGameInstance(gameType.id, queueUsersNeeded);
      // Make them quit from the queue
      queueUsersNeeded.forEach((queueUser: IGameUser) => this.quit(gameType.id, queueUser.user));
      // Send message
      this.messagingService.sendMessage(
        queueUsersNeeded.map(e => e.user),
        MessagingService.SUBJECT__GAME,
        {
          event: 'created',
          gameType,
          gameId: game.id,
        },
      );
    }
  }

  async lookForFullQueues() {
    return Promise.all(Object.keys(this.queue).map(this.processFullQueueFor.bind(this)));
  }

  async processQueueExpirationFor(gameTypeId: string) {
    this.queue[gameTypeId] = this.queue[gameTypeId].filter((queueUser: IQueueUser) => {
      if (queueUser.queueExpiresAt < Date.now()) {
        this.messagingService.sendMessage(
          [queueUser.user],
          MessagingService.SUBJECT__QUEUE,
          {
            event: 'expired',
            gameType: GamesTypesLibrary.find(gameTypeId),
            queue: this.queue[gameTypeId].length,
          },
        );
        return false;
      }
      return true;
    });
  }

  async lookForExpiredQueueAsks() {
    return Promise.all(Object.keys(this.queue).map(this.processQueueExpirationFor.bind(this)));
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
