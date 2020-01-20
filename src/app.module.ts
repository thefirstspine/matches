import { Module } from '@nestjs/common';
import { ApiController } from './api/api.controller';
import { ApiService } from './api/api.service';
import { GameService } from './game/game.service';
import { QueueService } from './queue/queue.service';
import { TickerController } from './ticker/ticker.controller';
import { TickerService } from './ticker/ticker.service';
import { GamesStorageService } from './storage/games.storage.service';
import { WizzardService } from './wizzard/wizzard.service';
import { WizzardsStorageService } from './storage/wizzards.storage.service';
import { WizzardController } from './wizzard/wizzard.controller';
import { ShopController } from './shop/shop.controller';
import { ShopService } from './shop/shop.service';
import { AuthService } from './@shared/auth-shared/auth.service';
import { LogService } from './@shared/log-shared/log.service';
import { RestService } from './rest/rest.service';
import { RoomsService } from './rooms/rooms.service';
import { ArenaRoomsService } from './rooms/arena-rooms.service';
import { MessagingService } from './@shared/messaging-shared/messaging.service';
import { GameWorkerService } from './game/game-worker/game-worker.service';
import { GameHookService } from './game/game-hook/game-hook.service';
import { BotsService } from './bots/bots.service';

@Module({
  imports: [],
  controllers: [ApiController, TickerController, WizzardController, ShopController],
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
})
export class AppModule {}
