import { Injectable } from '@nestjs/common';
import { ApiError } from './api.error';
import { QueueService } from './../queue/queue.service';
import { GameService } from '../game/game.service';
import { WizzardService } from '../wizzard/wizzard.service';
import { IGameUser, IGameInstance, IGameCard, IGameAction } from '../@shared/arena-shared/game';
import { destiny, origin } from '../@shared/rest-shared/base';
import { IWizzard } from '../@shared/arena-shared/wizzard';

/**
 * All the methods of the API are mapped here. The controller will call that
 * service in order to manage parties.
 */
@Injectable()
export class ApiService {

  constructor(
    private readonly queueService: QueueService,
    private readonly gameService: GameService,
    private readonly wizzardService: WizzardService,
  ) {}

  /**
   * Join a queue in the queue service
   * @param request
   */
  async joinQueue(request: IApiRequest<IJoinQueueParams>): Promise<IQueueResponse> {
    if (!isJoinQueueParams(request.params)) {
      throw new ApiError('Invalid method parameter(s).', ApiError.CODE_INVALID_PARAMS);
    }

    const queue: IGameUser[] = await this.queueService.join(
      request.params.gameType,
      request.user,
      request.params.destiny,
      request.params.origin,
      request.params.style,
    );

    return {
      gameType: request.params.gameType,
      queue,
    };
  }

  /**
   * Join a queue in the queue service
   * @param request
   */
  async refreshQueueAsk(request: IApiRequest<IRefreshQueueAskParams>): Promise<IQueueResponse> {
    if (!isRefreshAskQueueParams(request.params)) {
      throw new ApiError('Invalid method parameter(s).', ApiError.CODE_INVALID_PARAMS);
    }

    const queue: IGameUser[] = this.queueService.refreshAsk(
      request.params.gameType,
      request.user,
    );

    return {
      gameType: request.params.gameType,
      queue,
    };
  }

  /**
   * Quit a queue in the queue service
   * @param request
   */
  async quitQueue(request: IApiRequest<IQuitQueueParams>): Promise<IQueueResponse> {
    if (!isQuitQueueParams(request.params)) {
      throw new ApiError('Invalid method parameter(s).', ApiError.CODE_INVALID_PARAMS);
    }

    const queue: IGameUser[] = this.queueService.quit(request.params.gameType, request.user);

    return {
      gameType: request.params.gameType,
      queue,
    };
  }

  /**
   * Get the current game instance for the player
   * @param request
   */
  async getCurrentGame(request: IApiRequest<undefined>): Promise<IGetGameResponse> {
    const gameInstance: IGameInstance|undefined = this.gameService.getGameInstances().find(
      (g: IGameInstance) => g.users.find((u: IGameUser) => u.user === request.user) !== undefined);

    if (!gameInstance) {
      throw new ApiError('Not opened game instance found.', ApiError.CODE_METHOD_NOT_FOUND);
    }

    // Set ID in the request & call the getGame method
    request.id = gameInstance.id;
    return this.getGame(request);
  }

  /**
   * Get cards
   * @param request
   */
  async getGame(request: IApiRequest<undefined>): Promise<IGetGameResponse> {
    // Get the ID of the game
    const id: number|undefined = request.id;
    if (!id) {
      throw new ApiError('Required ID.', ApiError.CODE_INVALID_REQUEST);
    }

    // Get the game instance
    const gameInstance: IGameInstance|null = this.gameService.getGameInstance(id);
    if (!gameInstance) {
      throw new ApiError('Unknown game instance.', ApiError.CODE_METHOD_NOT_FOUND);
    }

    // Get stats
    const cardsInHand: {[key: number]: number} = {};
    const cardsInDeck: {[key: number]: number} = {};
    gameInstance.cards.forEach((c: IGameCard) => {
      if (c.location === 'hand') {
        cardsInHand[c.user] = cardsInHand[c.user] ? cardsInHand[c.user] + 1 : 1;
      }
      if (c.location === 'deck') {
        cardsInDeck[c.user] = cardsInDeck[c.user] ? cardsInDeck[c.user] + 1 : 1;
      }
    });
    const stats: {
      cardsInHand: {[key: number]: number},
      cardsInDeck: {[key: number]: number},
    } = {
      cardsInHand,
      cardsInDeck,
    };

    return {
      gameType: gameInstance.gameTypeId,
      id: gameInstance.id,
      status: gameInstance.status,
      stats,
    };
  }

  /**
   * Get cards
   * @param request
   */
  async getCards(request: IApiRequest<undefined>): Promise<IGameCard[]> {
    // Get the ID of the game
    const id: number|undefined = request.id;
    if (!id) {
      throw new ApiError('Required ID.', ApiError.CODE_INVALID_REQUEST);
    }

    // Get the game instance
    const gameInstance: IGameInstance|null = this.gameService.getGameInstance(id);
    if (!gameInstance) {
      throw new ApiError('Unknown game instance.', ApiError.CODE_METHOD_NOT_FOUND);
    }

    // Get the cards in the board OR in the discard OR in the user's deck OR in the user's hand
    return gameInstance.cards.filter(
      (card: IGameCard) => {
        return card.location !== 'deck' && (
          card.location === 'board'
          || card.location === 'discard'
          || card.location === 'banned'
          || (card.location === 'hand' && card.user === request.user)
        );
      },
    );
  }

  /**
   * Get actions
   * @param request
   */
  async getActions(request: IApiRequest<undefined>): Promise<IGameAction[]> {
    // Get the ID of the game
    const id: number|undefined = request.id;
    if (!id) {
      throw new ApiError('Required ID.', ApiError.CODE_INVALID_REQUEST);
    }

    // Get the game instance
    const gameInstance: IGameInstance|null = this.gameService.getGameInstance(id);
    if (!gameInstance) {
      throw new ApiError('Unknown game instance.', ApiError.CODE_METHOD_NOT_FOUND);
    }

    // Get the max priority of the pending actions
    const maxPriority = gameInstance.actions.current.reduce((acc: number, action: IGameAction) => {
      return action.priority > acc ? action.priority : acc;
    }, 0);

    // Get the cards in the board OR in the discard OR in the user's deck OR in the user's hand
    return gameInstance.actions.current.filter(
      (action: IGameAction) => {
        return action.user === request.user && action.priority === maxPriority;
      },
    );
  }

  /**
   * Get users
   * @param request
   */
  async getUsers(request: IApiRequest<undefined>): Promise<IGetUsersResponse> {
    // Get the ID of the game
    const id: number|undefined = request.id;
    if (!id) {
      throw new ApiError('Required ID.', ApiError.CODE_INVALID_REQUEST);
    }

    // Get the game instance
    const gameInstance: IGameInstance|null = this.gameService.getGameInstance(id);
    if (!gameInstance) {
      throw new ApiError('Unknown game instance.', ApiError.CODE_METHOD_NOT_FOUND);
    }

    // Get the cards in the board OR in the discard OR in the user's deck OR in the user's hand
    return {
      users: gameInstance.users.map((u: IGameUser) => {
        return {
          account: this.wizzardService.getWizzard(u.user),
          game: u,
        };
      }),
    };
  }

  /**
   * Get users
   * @param request
   */
  async respondToAction(request: IApiRequest<IRespondToActionParams>): Promise<IRespondToActionResponse> {
    if (!isRespondToActionParams(request.params)) {
      throw new ApiError('Invalid method parameter(s).', ApiError.CODE_INVALID_PARAMS);
    }

    // Get the ID of the game
    const id: number|undefined = request.id;
    if (!id) {
      throw new ApiError('Required ID.', ApiError.CODE_INVALID_REQUEST);
    }

    // Get the game instance
    const gameInstance: IGameInstance|null = this.gameService.getGameInstance(id);
    if (!gameInstance) {
      throw new ApiError('Unknown game instance.', ApiError.CODE_METHOD_NOT_FOUND);
    }

    // Store the response in the instance
    const action: IGameAction|undefined = gameInstance.actions.current.find(a => a.type === request.params.actionType);
    if (action) {
      action.responses = request.params.response;
      return {
        sent: true,
      };
    }

    // Response not sent
    return {
      sent: false,
    };
  }

}

/**
 * Represents a request from the API
 */
export interface IApiRequest<T> {
  params: T;
  user: number;
  id?: number;
}

/**
 * Interface representing parameters for the "quitQueue" method
 */
export interface IQuitQueueParams {
  gameType: string;
}

/**
 * Interface representing parameters for the "joinQueue" method
 */
export interface IJoinQueueParams {
  gameType: string;
  destiny: destiny;
  origin: origin|undefined;
  style: string|undefined;
}

export interface IRespondToActionParams {
  response: any;
  actionType: string;
}

/**
 * Interface representing parameters for the "refreshQueueAsk" method
 */
export interface IRefreshQueueAskParams {
  gameType: string;
}

/**
 * Interface representing a queue status response
 */
export interface IQueueResponse {
  gameType: string;
  queue: IGameUser[];
}

/**
 * Interface representing a getGame* response
 */
export interface IGetGameResponse {
  gameType: string;
  id: number;
  status: 'active'|'ended'|'closed';
  stats: {
    cardsInHand: {[key: number]: number},
    cardsInDeck: {[key: number]: number},
  };
}

/**
 * Interface representing a players request response
 */
export interface IGetUsersResponse {
  users: Array<{
    account: IWizzard,
    game: IGameUser,
  }>;
}

export interface IRespondToActionResponse {
  sent: boolean;
}

/**
 * Type guard for ICreateGameParams
 */
export function isJoinQueueParams(toBeDetermined: any): toBeDetermined is IJoinQueueParams {
  return toBeDetermined.gameType && toBeDetermined.destiny;
}

/**
 * Type guard for IQuitQueueParams
 */
export function isQuitQueueParams(toBeDetermined: any): toBeDetermined is IQuitQueueParams {
  return toBeDetermined.gameType;
}

/**
 * Type guard for IQuitQueueParams
 */
export function isRefreshAskQueueParams(toBeDetermined: any): toBeDetermined is IRefreshQueueAskParams {
  return toBeDetermined.gameType;
}

/**
 * Type guard for IRespondToActionParams
 */
export function isRespondToActionParams(toBeDetermined: any): toBeDetermined is IRespondToActionParams {
  return toBeDetermined.response && toBeDetermined.actionType;
}
