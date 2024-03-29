import { DynamicModule, Module } from '@nestjs/common';
import { ApiController } from './api/api.controller';
import { ApiService } from './api/api.service';
import { GameService } from './game/game.service';
import { QueueService } from './queue/queue.service';
import { TickerController } from './ticker/ticker.controller';
import { TickerService } from './ticker/ticker.service';
import { WizardService } from './wizard/wizard.service';
import { ShopController } from './shop/shop.controller';
import { ShopService } from './shop/shop.service';
import { RestService } from './rest/rest.service';
import { RoomsService } from './rooms/rooms.service';
import { ArenaRoomsService } from './rooms/arena-rooms.service';
import { GameWorkerService } from './game/game-worker/game-worker.service';
import { GameHookService } from './game/game-hook/game-hook.service';
import { BotsService } from './bots/bots.service';
import { IndexController } from './index/index.controller';
import { AuthService } from '@thefirstspine/auth-nest';
import { LogsService } from '@thefirstspine/logs-nest';
import { MessagingService } from '@thefirstspine/messaging-nest';
import { WizardController } from './wizard/wizard.controller';
import { QuestService } from './wizard/quest/quest.service';
import { TriumphService } from './wizard/triumph/triumph.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Wizard, WizardSchema } from './wizard/wizard.schema';
import { GameInstance, GameInstanceSchema } from './game/game-instance.schema';
import { CalendarService } from './calendar/calendar.service';

@Module({
  controllers: [ApiController, TickerController, ShopController, IndexController, WizardController],
  providers: [
    ApiService,
    GameService,
    QueueService,
    TickerService,
    WizardService,
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
    QuestService,
    TriumphService,
    CalendarService,
  ],
})
export class AppModule {
  static register(): DynamicModule {
    return {
      module: AppModule,
      imports: [
        MongooseModule.forRoot(`mongodb://${process.env.MONGO_HOST}/${process.env.MONGO_DB}`),
        MongooseModule.forFeature([
          { name: Wizard.name, schema: WizardSchema },
          { name: GameInstance.name, schema: GameInstanceSchema },
        ]),
      ],
    };
  }
}
