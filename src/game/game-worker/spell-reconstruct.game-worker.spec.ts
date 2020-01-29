import { Test, TestingModule } from '@nestjs/testing';
import { GameWorkerService } from './game-worker.service';
import { MessagingService } from '../../@shared/messaging-shared/messaging.service';
import { ApiService } from '../../api/api.service';
import { GameService } from '../game.service';
import { QueueService } from '../../queue/queue.service';
import { GamesStorageService } from '../../storage/games.storage.service';
import { TickerService } from '../../ticker/ticker.service';
import { WizzardService } from '../../wizzard/wizzard.service';
import { WizzardsStorageService } from '../../storage/wizzards.storage.service';
import { ShopService } from '../../shop/shop.service';
import { AuthService } from '../../@shared/auth-shared/auth.service';
import { RestService } from '../../rest/rest.service';
import { RoomsService } from '../../rooms/rooms.service';
import { ArenaRoomsService } from '../../rooms/arena-rooms.service';
import { GameHookService } from '../game-hook/game-hook.service';
import { BotsService } from '../../bots/bots.service';
import { LogService } from '../../@shared/log-shared/log.service';
import { IGameInstance, IGameAction } from '../../@shared/arena-shared/game';

describe('Spell reconstruct', () => {
  let gameWorkerService: GameWorkerService;
  let restService: RestService;
  let roomsService: RoomsService;

  /**
   * ======================================================================
   * INIT TESTS AND DEPENDENCIES
   * ======================================================================
   */

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiService,
        GameService,
        QueueService,
        TickerService,
        GamesStorageService,
        WizzardService,
        WizzardsStorageService,
        ShopService,
        AuthService,
        {provide: LogService, useValue: new LogService('arena')},
        RestService,
        RoomsService,
        ArenaRoomsService,
        MessagingService,
        GameWorkerService,
        GameHookService,
        BotsService,
      ],
    }).compile();

    gameWorkerService = module.get<GameWorkerService>(GameWorkerService);
    restService = module.get<RestService>(RestService);
    roomsService = module.get<RoomsService>(RoomsService);
  });

  /**
   * ======================================================================
   * TEST SERVICE CREATION
   * ======================================================================
   */

  it('should be defined', () => {
    expect(gameWorkerService).toBeDefined();
    expect(restService).toBeDefined();
    expect(roomsService).toBeDefined();
  });

  /**
   * ======================================================================
   * CREATE ROOM
   * ======================================================================
   */

  test('room creation', async () => {
    try {
      await roomsService.createRoom('arena', {
        name: 'game-0',
        senders: [],
      });
    } catch (e) {
      // Do nothing
    }
  });

  /**
   * ======================================================================
   * TEST RECONSTRUCT SPELL GAME WORKER
   * ======================================================================
   */

  test('reconstruct on damaged card', async () => {
    // Get base cards
    const reconstructCard = await restService.card('reconstruct');
    const towerCard = await restService.card('the-tower');
    expect(reconstructCard).toBeDefined();
    expect(towerCard).toBeDefined();

    // Create game instance
    const gameInstance: IGameInstance = {
      ...getDefaultGameInstance(),
      cards: [],
    };

    // Add the cards
    gameInstance.cards.push({
      id: '',
      card: reconstructCard,
      user: gameInstance.users[0].user,
      location: 'hand',
    });
    gameInstance.cards.push({
      id: '',
      card: towerCard,
      user: gameInstance.users[0].user,
      location: 'board',
      coords: {
        x: 3,
        y: 3,
      },
      currentStats: {
        ...towerCard.stats,
        life: towerCard.stats.life - 4,
      },
    });

    // Create game action & add it to the instance
    const gameAction: IGameAction = await gameWorkerService.getWorker('spell-reconstruct').create(gameInstance, {user: gameInstance.users[0].user});
    gameAction.responses = [{handIndex: 0, boardCoords: '3-3'}];
    gameInstance.actions.current.push(gameAction);

    // Execute
    const result: boolean = await gameWorkerService.getWorker('spell-reconstruct').execute(
      gameInstance,
      gameAction,
    );

    // Test on result
    expect(result).toBeTruthy();
    expect(gameInstance.cards[1].currentStats).toBeDefined();
    expect(gameInstance.cards[1].currentStats.life).toBe(towerCard.stats.life - 2);
  });

  test('reconstruct on non-damaged card', async () => {
    // Get base cards
    const reconstructCard = await restService.card('reconstruct');
    const towerCard = await restService.card('the-tower');
    expect(reconstructCard).toBeDefined();
    expect(towerCard).toBeDefined();

    // Create game instance
    const gameInstance: IGameInstance = {
      ...getDefaultGameInstance(),
      cards: [],
    };

    // Add the cards
    gameInstance.cards.push({
      id: '',
      card: reconstructCard,
      user: gameInstance.users[0].user,
      location: 'hand',
    });
    gameInstance.cards.push({
      id: '',
      card: towerCard,
      user: gameInstance.users[0].user,
      location: 'board',
      coords: {
        x: 3,
        y: 3,
      },
      currentStats: {
        ...towerCard.stats,
      },
    });

    // Create game action & add it to the instance
    const gameAction: IGameAction = await gameWorkerService.getWorker('spell-reconstruct').create(gameInstance, {user: gameInstance.users[0].user});
    gameAction.responses = [{handIndex: 0, boardCoords: '3-3'}];
    gameInstance.actions.current.push(gameAction);

    // Execute
    const result: boolean = await gameWorkerService.getWorker('spell-reconstruct').execute(
      gameInstance,
      gameAction,
    );

    // Test on result
    expect(result).toBeTruthy();
    expect(gameInstance.cards[1].currentStats).toBeDefined();
    expect(gameInstance.cards[1].currentStats.life).toBe(towerCard.stats.life);
  });

  test('reconstruct on card with 1 damage', async () => {
    // Get base cards
    const reconstructCard = await restService.card('reconstruct');
    const towerCard = await restService.card('the-tower');
    expect(reconstructCard).toBeDefined();
    expect(towerCard).toBeDefined();

    // Create game instance
    const gameInstance: IGameInstance = {
      ...getDefaultGameInstance(),
      cards: [],
    };

    // Add the cards
    gameInstance.cards.push({
      id: '',
      card: reconstructCard,
      user: gameInstance.users[0].user,
      location: 'hand',
    });
    gameInstance.cards.push({
      id: '',
      card: towerCard,
      user: gameInstance.users[0].user,
      location: 'board',
      coords: {
        x: 3,
        y: 3,
      },
      currentStats: {
        ...towerCard.stats,
        life: towerCard.stats.life - 1,
      },
    });

    // Create game action & add it to the instance
    const gameAction: IGameAction = await gameWorkerService.getWorker('spell-reconstruct').create(gameInstance, {user: gameInstance.users[0].user});
    gameAction.responses = [{handIndex: 0, boardCoords: '3-3'}];
    gameInstance.actions.current.push(gameAction);

    // Execute
    const result: boolean = await gameWorkerService.getWorker('spell-reconstruct').execute(
      gameInstance,
      gameAction,
    );

    // Test on result
    expect(result).toBeTruthy();
    expect(gameInstance.cards[1].currentStats).toBeDefined();
    expect(gameInstance.cards[1].currentStats.life).toBe(towerCard.stats.life);
  });

});

function getDefaultGameInstance(): IGameInstance {
  return {
    cards: [],
    id: 0,
    gameTypeId: 'testing',
    status: 'active',
    actions: {
      current: [],
      previous: [],
    },
    users: [
      {destiny: 'hunter', user: Number.MAX_SAFE_INTEGER - 1, origin: null, style: ''},
      {destiny: 'hunter', user: Number.MAX_SAFE_INTEGER - 2, origin: null, style: ''},
    ],
  };
}
