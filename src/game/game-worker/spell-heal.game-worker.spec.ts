import { Test, TestingModule } from '@nestjs/testing';
import { GameWorkerService } from './game-worker.service';
import { ApiService } from '../../api/api.service';
import { GameService } from '../game.service';
import { QueueService } from '../../queue/queue.service';
import { GamesStorageService } from '../../storage/games.storage.service';
import { TickerService } from '../../ticker/ticker.service';
import { WizzardService } from '../../wizard/wizard.service';
import { WizzardsStorageService } from '../../storage/wizzards.storage.service';
import { ShopService } from '../../shop/shop.service';
import { RestService } from '../../rest/rest.service';
import { RoomsService } from '../../rooms/rooms.service';
import { ArenaRoomsService } from '../../rooms/arena-rooms.service';
import { GameHookService } from '../game-hook/game-hook.service';
import { BotsService } from '../../bots/bots.service';
import { IGameInstance, IGameAction } from '@thefirstspine/types-arena';
import { AuthService } from '@thefirstspine/auth-nest';
import { LogsService } from '@thefirstspine/logs-nest';
import { MessagingService } from '@thefirstspine/messaging-nest';

describe('Spell heal', () => {
  let gameWorkerService: GameWorkerService;
  let restService: RestService;
  let roomsService: RoomsService;

  /**
   * ======================================================================
   * INIT TESTS AND DEPENDENCIES
   * ======================================================================
   */

  beforeEach(async () => {
    require('dotenv').config();
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
        LogsService,
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
   * TEST HEAL SPELL GAME WORKER
   * ======================================================================
   */

  test('heal on damaged card', async () => {
    // Get base cards
    const healCard = await restService.card('heal');
    const bansheeCard = await restService.card('banshee');
    const towerCard = await restService.card('the-tower');
    expect(healCard).toBeDefined();
    expect(bansheeCard).toBeDefined();
    expect(towerCard).toBeDefined();

    // Create game instance
    const gameInstance: IGameInstance = {
      ...getDefaultGameInstance(),
      cards: [],
    };

    // Add the cards
    gameInstance.cards.push({
      id: '',
      card: healCard,
      user: gameInstance.users[0].user,
      location: 'hand',
    });
    gameInstance.cards.push({
      id: '',
      card: bansheeCard,
      user: gameInstance.users[0].user,
      location: 'board',
      coords: {
        x: 3,
        y: 3,
      },
      currentStats: {
        ...bansheeCard.stats,
        life: bansheeCard.stats.life - 4,
      },
    });
    gameInstance.cards.push({
      id: '',
      card: towerCard,
      user: gameInstance.users[0].user,
      location: 'board',
      coords: {
        x: 3,
        y: 2,
      },
      currentStats: {
        ...towerCard.stats,
      },
    });

    // Create game action & add it to the instance
    const gameAction: IGameAction<any> =
      await gameWorkerService.getWorker('spell-heal').create(gameInstance, {user: gameInstance.users[0].user});
    gameAction.response = {handIndex: 0, boardCoords: '3-3'};
    gameInstance.actions.current.push(gameAction);
    expect(gameAction.interaction.type).toBe('putCardOnBoard');
    expect(gameAction.interaction.params.boardCoords).toBeDefined();
    expect(gameAction.interaction.params.boardCoords.length).toBe(1);
    expect(gameAction.interaction.params.boardCoords[0]).toBe('3-3');
    expect(gameAction.interaction.params.handIndexes).toBeDefined();
    expect(gameAction.interaction.params.handIndexes.length).toBe(1);
    expect(gameAction.interaction.params.handIndexes[0]).toBe(0);

    // Execute
    const result: boolean = await gameWorkerService.getWorker('spell-heal').execute(
      gameInstance,
      gameAction,
    );

    // Test on result
    expect(result).toBeTruthy();
    expect(gameInstance.cards[1].currentStats).toBeDefined();
    expect(gameInstance.cards[1].currentStats.life).toBe(bansheeCard.stats.life - 2);
    expect(gameInstance.cards[1].location).toBe('board');
    expect(gameInstance.cards[1].coords).toBeDefined();
    expect(gameInstance.cards[1].coords.x).toBe(3);
    expect(gameInstance.cards[1].coords.y).toBe(3);
    expect(gameInstance.cards[0].location).toBe('discard');
  });

  test('heal on non-damaged card', async () => {
    // Get base cards
    const healCard = await restService.card('heal');
    const bansheeCard = await restService.card('banshee');
    const towerCard = await restService.card('the-tower');
    expect(healCard).toBeDefined();
    expect(bansheeCard).toBeDefined();
    expect(towerCard).toBeDefined();

    // Create game instance
    const gameInstance: IGameInstance = {
      ...getDefaultGameInstance(),
      cards: [],
    };

    // Add the cards
    gameInstance.cards.push({
      id: '',
      card: healCard,
      user: gameInstance.users[0].user,
      location: 'hand',
    });
    gameInstance.cards.push({
      id: '',
      card: bansheeCard,
      user: gameInstance.users[0].user,
      location: 'board',
      coords: {
        x: 3,
        y: 3,
      },
      currentStats: {
        ...bansheeCard.stats,
      },
    });
    gameInstance.cards.push({
      id: '',
      card: towerCard,
      user: gameInstance.users[0].user,
      location: 'board',
      coords: {
        x: 3,
        y: 2,
      },
      currentStats: {
        ...towerCard.stats,
      },
    });

    // Create game action & add it to the instance
    const gameAction: IGameAction<any> = await gameWorkerService.getWorker('spell-heal').create(gameInstance, {user: gameInstance.users[0].user});
    gameAction.response = {handIndex: 0, boardCoords: '3-3'};
    gameInstance.actions.current.push(gameAction);
    expect(gameAction.interaction.type).toBe('putCardOnBoard');
    expect(gameAction.interaction.params.boardCoords).toBeDefined();
    expect(gameAction.interaction.params.boardCoords.length).toBe(1);
    expect(gameAction.interaction.params.boardCoords[0]).toBe('3-3');
    expect(gameAction.interaction.params.handIndexes).toBeDefined();
    expect(gameAction.interaction.params.handIndexes.length).toBe(1);
    expect(gameAction.interaction.params.handIndexes[0]).toBe(0);

    // Execute
    const result: boolean = await gameWorkerService.getWorker('spell-heal').execute(
      gameInstance,
      gameAction,
    );

    // Test on result
    expect(result).toBeTruthy();
    expect(gameInstance.cards[1].currentStats).toBeDefined();
    expect(gameInstance.cards[1].currentStats.life).toBe(bansheeCard.stats.life);
    expect(gameInstance.cards[1].location).toBe('board');
    expect(gameInstance.cards[1].coords).toBeDefined();
    expect(gameInstance.cards[1].coords.x).toBe(3);
    expect(gameInstance.cards[1].coords.y).toBe(3);
    expect(gameInstance.cards[0].location).toBe('discard');
  });

  test('heal on card with 1 damage', async () => {
    // Get base cards
    const healCard = await restService.card('heal');
    const bansheeCard = await restService.card('banshee');
    const towerCard = await restService.card('the-tower');
    expect(healCard).toBeDefined();
    expect(bansheeCard).toBeDefined();
    expect(towerCard).toBeDefined();

    // Create game instance
    const gameInstance: IGameInstance = {
      ...getDefaultGameInstance(),
      cards: [],
    };

    // Add the cards
    gameInstance.cards.push({
      id: '',
      card: healCard,
      user: gameInstance.users[0].user,
      location: 'hand',
    });
    gameInstance.cards.push({
      id: '',
      card: bansheeCard,
      user: gameInstance.users[0].user,
      location: 'board',
      coords: {
        x: 3,
        y: 3,
      },
      currentStats: {
        ...bansheeCard.stats,
        life: bansheeCard.stats.life - 1,
      },
    });
    gameInstance.cards.push({
      id: '',
      card: towerCard,
      user: gameInstance.users[0].user,
      location: 'board',
      coords: {
        x: 3,
        y: 2,
      },
      currentStats: {
        ...towerCard.stats,
      },
    });

    // Create game action & add it to the instance
    const gameAction: IGameAction<any> = await gameWorkerService.getWorker('spell-heal').create(gameInstance, {user: gameInstance.users[0].user});
    gameAction.response = {handIndex: 0, boardCoords: '3-3'};
    gameInstance.actions.current.push(gameAction);
    expect(gameAction.interaction.type).toBe('putCardOnBoard');
    expect(gameAction.interaction.params.boardCoords).toBeDefined();
    expect(gameAction.interaction.params.boardCoords.length).toBe(1);
    expect(gameAction.interaction.params.boardCoords[0]).toBe('3-3');
    expect(gameAction.interaction.params.handIndexes).toBeDefined();
    expect(gameAction.interaction.params.handIndexes.length).toBe(1);
    expect(gameAction.interaction.params.handIndexes[0]).toBe(0);

    // Execute
    const result: boolean = await gameWorkerService.getWorker('spell-heal').execute(
      gameInstance,
      gameAction,
    );

    // Test on result
    expect(result).toBeTruthy();
    expect(gameInstance.cards[1].currentStats).toBeDefined();
    expect(gameInstance.cards[1].currentStats.life).toBe(bansheeCard.stats.life);
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
      {destiny: 'hunter', user: Number.MAX_SAFE_INTEGER - 1, origin: null, style: '', name: ''},
      {destiny: 'hunter', user: Number.MAX_SAFE_INTEGER - 2, origin: null, style: '', name: ''},
    ],
  };
}
