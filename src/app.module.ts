import { Module } from '@nestjs/common';
import { ApiController } from './api/api.controller';
import { ApiService } from './api/api.service';
import { GameService } from './game/game.service';
import { QueueService } from './queue/queue.service';
import { TickerController } from './ticker/ticker.controller';
import { TickerService } from './ticker/ticker.service';
import { MessagingService } from './messaging/messaging.service';
import { GamesStorageService } from './storage/games.storage.service';
import { RestController } from './rest/rest.controller';
import { WizzardService } from './wizzard/wizzard.service';
import { WizzardsStorageService } from './storage/wizzards.storage.service';
import { WizzardController } from './wizzard/wizzard.controller';
import { ShopController } from './shop/shop.controller';
import { ShopService } from './shop/shop.service';
import { LogService } from './log/log.service';
import { AuthService } from './@shared/auth-shared/auth.service';

@Module({
  imports: [],
  controllers: [ApiController, TickerController, RestController, WizzardController, ShopController],
  providers: [
    ApiService,
    GameService,
    QueueService,
    TickerService,
    MessagingService,
    GamesStorageService,
    WizzardService,
    WizzardsStorageService,
    ShopService,
    LogService,
    AuthService,
  ],
})
export class AppModule {}
