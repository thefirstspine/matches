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
import { IGameInstance, IGameAction, ISubActionPutCardOnBoard } from '../../@shared/arena-shared/game';

describe('Spell ruin', () => {
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
   * TEST ruin SPELL GAME WORKER
   * ======================================================================
   */

  test('ruin on damaged card', async () => {
    // Get base cards
    const ruinCard = await restService.card('ruin');
    const towerCard = await restService.card('the-tower');
    const bansheeCard = await restService.card('banshee');
    expect(ruinCard).toBeDefined();
    expect(towerCard).toBeDefined();
    expect(bansheeCard).toBeDefined();

    // Create game instance
    const gameInstance: IGameInstance = {
      ...getDefaultGameInstance(),
      cards: [],
    };

    // Add the cards
    gameInstance.cards.push({
      id: '',
      card: ruinCard,
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
        life: towerCard.stats.life - 3,
      },
    });
    gameInstance.cards.push({
      id: '',
      card: bansheeCard,
      user: gameInstance.users[0].user,
      location: 'board',
      coords: {
        x: 3,
        y: 2,
      },
      currentStats: {
        ...bansheeCard.stats,
      },
    });

    // Create game action & add it to the instance
    const gameAction: IGameAction = await gameWorkerService.getWorker('spell-ruin').create(gameInstance, {user: gameInstance.users[0].user});
    gameAction.responses = [{handIndex: 0, boardCoords: '3-3'}];
    gameInstance.actions.current.push(gameAction);
    expect(gameAction.subactions.length).toBe(1);
    expect(gameAction.subactions[0].type).toBe('putCardOnBoard');
    expect((gameAction.subactions[0] as ISubActionPutCardOnBoard).params.boardCoords).toBeDefined();
    expect((gameAction.subactions[0] as ISubActionPutCardOnBoard).params.boardCoords.length).toBe(1);
    expect((gameAction.subactions[0] as ISubActionPutCardOnBoard).params.boardCoords[0]).toBe('3-3');
    expect((gameAction.subactions[0] as ISubActionPutCardOnBoard).params.handIndexes).toBeDefined();
    expect((gameAction.subactions[0] as ISubActionPutCardOnBoard).params.handIndexes.length).toBe(1);
    expect((gameAction.subactions[0] as ISubActionPutCardOnBoard).params.handIndexes[0]).toBe(0);

    // Execute
    const result: boolean = await gameWorkerService.getWorker('spell-ruin').execute(
      gameInstance,
      gameAction,
    );

    // Test on result
    expect(result).toBeTruthy();
    expect(gameInstance.cards[1].currentStats).toBeDefined();
    expect(gameInstance.cards[1].currentStats.life).toBe(towerCard.stats.life - 5);
    expect(gameInstance.cards[1].location).toBe('discard');
    expect(gameInstance.cards[0].location).toBe('discard');
  });

  test('ruin on non-damaged card', async () => {
    // Get base cards
    const ruinCard = await restService.card('ruin');
    const towerCard = await restService.card('the-tower');
    const bansheeCard = await restService.card('banshee');
    expect(ruinCard).toBeDefined();
    expect(towerCard).toBeDefined();
    expect(bansheeCard).toBeDefined();

    // Create game instance
    const gameInstance: IGameInstance = {
      ...getDefaultGameInstance(),
      cards: [],
    };

    // Add the cards
    gameInstance.cards.push({
      id: '',
      card: ruinCard,
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
    gameInstance.cards.push({
      id: '',
      card: bansheeCard,
      user: gameInstance.users[0].user,
      location: 'board',
      coords: {
        x: 3,
        y: 2,
      },
      currentStats: {
        ...bansheeCard.stats,
      },
    });

    // Create game action & add it to the instance
    const gameAction: IGameAction = await gameWorkerService.getWorker('spell-ruin').create(gameInstance, {user: gameInstance.users[0].user});
    gameAction.responses = [{handIndex: 0, boardCoords: '3-3'}];
    gameInstance.actions.current.push(gameAction);
    expect(gameAction.subactions.length).toBe(1);
    expect(gameAction.subactions[0].type).toBe('putCardOnBoard');
    expect((gameAction.subactions[0] as ISubActionPutCardOnBoard).params.boardCoords).toBeDefined();
    expect((gameAction.subactions[0] as ISubActionPutCardOnBoard).params.boardCoords.length).toBe(1);
    expect((gameAction.subactions[0] as ISubActionPutCardOnBoard).params.boardCoords[0]).toBe('3-3');
    expect((gameAction.subactions[0] as ISubActionPutCardOnBoard).params.handIndexes).toBeDefined();
    expect((gameAction.subactions[0] as ISubActionPutCardOnBoard).params.handIndexes.length).toBe(1);
    expect((gameAction.subactions[0] as ISubActionPutCardOnBoard).params.handIndexes[0]).toBe(0);

    // Execute
    const result: boolean = await gameWorkerService.getWorker('spell-ruin').execute(
      gameInstance,
      gameAction,
    );

    // Test on result
    expect(result).toBeTruthy();
    expect(gameInstance.cards[1].currentStats).toBeDefined();
    expect(gameInstance.cards[1].currentStats.life).toBe(towerCard.stats.life - 2);
    expect(gameInstance.cards[1].location).toBe('board');
    expect(gameInstance.cards[1].coords).toBeDefined();
    expect(gameInstance.cards[1].coords.x).toBe(3);
    expect(gameInstance.cards[1].coords.y).toBe(3);
    expect(gameInstance.cards[0].location).toBe('discard');
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