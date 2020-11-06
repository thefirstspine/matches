import { Module } from '@nestjs/common';
import { ApiController } from './api/api.controller';
import { ApiService } from './api/api.service';
import { GameService } from './game/game.service';
import { QueueService } from './queue/queue.service';
import { TickerController } from './ticker/ticker.controller';
import { TickerService } from './ticker/ticker.service';
import { GamesStorageService } from './storage/games.storage.service';
import { WizardService } from './wizard/wizard.service';
import { WizzardsStorageService } from './storage/wizzards.storage.service';
import { ShopController } from './shop/shop.controller';
import { ShopService } from './shop/shop.service';
import { RestService } from './rest/rest.service';
import { RoomsService } from './rooms/rooms.service';
import { ArenaRoomsService } from './rooms/arena-rooms.service';
import { GameWorkerService } from './game/game-worker/game-worker.service';
import { GameHookService } from './game/game-hook/game-hook.service';
import { BotsService } from './bots/bots.service';
import { IndexController } from './index/index.controller';
import { FileSocketModule } from 'nest-filesocket';
import { FileSocketMethodsService } from './file-socket-methods/file-socket-methods.service';
import { AuthService } from '@thefirstspine/auth-nest';
import { LogsService } from '@thefirstspine/logs-nest';
import { MessagingService } from '@thefirstspine/messaging-nest';
import { WizardController } from './wizard/wizard.controller';
import { QuestService } from './wizard/quest/quest.service';
import { TriumphService } from './wizard/triumph/triumph.service';

@Module({
  imports: [
    FileSocketModule.forRoot({
      methodsMap: FileSocketMethodsService.fileSocketMethods,
      socketFile: __dirname + '/../socket',
    }),
  ],
  controllers: [ApiController, TickerController, ShopController, IndexController, WizardController],
  providers: [
    ApiService,
    GameService,
    QueueService,
    TickerService,
    GamesStorageService,
    WizardService,
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
    FileSocketMethodsService,
    QuestService,
    TriumphService,
  ],
})
export class AppModule {}
