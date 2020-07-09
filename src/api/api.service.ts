import { Injectable } from '@nestjs/common';
import { ApiError } from './api.error';
import { QueueService } from './../queue/queue.service';
import { GameService } from '../game/game.service';
import { WizzardService } from '../wizard/wizard.service';
import { IGameUser,
         IGameInstance,
         IGameCard,
         IGameAction,
         IApiRespondToActionParams,
         IApiRespondToActionResponse,
         IApiGetUsersResponse,
         IApiRequest,
         IApiGetGameResponse,
         IApiQueueResponse,
         IApiRefreshQueueAskParams,
         IApiJoinQueueParams,
         IApiQuitQueueParams,
         isRespondToActionParams,
         isQuitQueueParams,
         isRefreshAskQueueParams,
         isJoinQueueParams,
         IGameInteraction } from '@thefirstspine/types-arena';

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
  async joinQueue(request: IApiRequest<IApiJoinQueueParams>): Promise<IApiQueueResponse> {
    if (!isJoinQueueParams(request.params)) {
      throw new ApiError('Invalid method parameter(s).', ApiError.CODE_INVALID_PARAMS);
    }

    const queue: IGameUser[] = await this.queueService.join(
      request.params.gameType,
      request.user,
      request.params.destiny,
      request.params.origin,
      request.params.style,
      request.params.cover,
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
  async refreshQueueAsk(request: IApiRequest<IApiRefreshQueueAskParams>): Promise<IApiQueueResponse> {
    if (!isRefreshAskQueueParams(request.params)) {
      throw new ApiError('Invalid method parameter(s).', ApiError.CODE_INVALID_PARAMS);
    }

    const queue: IGameUser[] = await this.queueService.refreshAsk(
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
  async quitQueue(request: IApiRequest<IApiQuitQueueParams>): Promise<IApiQueueResponse> {
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
  async getCurrentGame(request: IApiRequest<undefined>): Promise<IApiGetGameResponse> {
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
  async getGame(request: IApiRequest<undefined>): Promise<IApiGetGameResponse> {
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
      result: gameInstance.result,
      users: gameInstance.users,
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
  async getActions(request: IApiRequest<undefined>): Promise<Array<IGameAction<IGameInteraction>>> {
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

    // Wipe all the actions for a non active game
    if (gameInstance.status !== 'active') {
      throw new ApiError('Non-opened game instance.', ApiError.CODE_INVALID_REQUEST);
    }

    // Get the max priority of the pending actions
    const maxPriority = gameInstance.actions.current.reduce((acc: number, action: IGameAction<IGameInteraction>) => {
      return action.priority > acc ? action.priority : acc;
    }, 0);

    // Get the cards in the board OR in the discard OR in the user's deck OR in the user's hand
    return gameInstance.actions.current.filter(
      (action: IGameAction<IGameInteraction>) => {
        return action.user === request.user && action.priority === maxPriority;
      },
    );
  }

  /**
   * Get users
   * @param request
   * @deprecated
   */
  async getUsers(request: IApiRequest<undefined>): Promise<IApiGetUsersResponse> {
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
          account: this.wizzardService.getOrCreateWizzard(u.user),
          game: u,
        };
      }),
    };
  }

  /**
   * Get users
   * @param request
   */
  async respondToAction(request: IApiRequest<IApiRespondToActionParams>): Promise<IApiRespondToActionResponse> {
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

    // Cannot respond to a non-opened game instance
    if (gameInstance.status !== 'active') {
      throw new ApiError('Non active game instance.', ApiError.CODE_INVALID_REQUEST);
    }

    // Store the response in the instance
    const action: IGameAction<any>|undefined = gameInstance.actions.current.find((a: IGameAction<any>) => {
      return a.type === request.params.actionType &&
        a.user === request.user;
    });
    if (action) {
      action.response = request.params.response;
      return {
        sent: !!action.response,
      };
    }

    // Response not sent
    return {
      sent: false,
    };
  }

  /**
   * Get cards
   * @param request
   */
  async concede(request: IApiRequest<undefined>): Promise<IApiGetGameResponse> {
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

    // Is the user part of this instance?
    if (gameInstance.users.find((u) => u.user === request.user) === undefined) {
      throw new ApiError('Not in a game instance.', ApiError.CODE_INVALID_REQUEST);
    }

    await this.gameService.concedeGame(id, request.user);

    return this.getGame(request);
  }

}
