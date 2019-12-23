import { Injectable } from '@nestjs/common';
import { QueueService } from './../queue/queue.service';
import { GameService } from '../game/game.service';
import { MessagingService } from '../messaging/messaging.service';
import { ShopService } from '../shop/shop.service';
import { LogService } from '../log/log.service';

/**
 * The ticker service will handle all the async operations, such as
 * game start, closing stales games, etc.
 */
@Injectable()
export class TickerService {

  constructor(
    private readonly queueService: QueueService,
    private readonly gameService: GameService,
    private readonly messagingService: MessagingService,
    private readonly shopService: ShopService,
    private readonly logService: LogService,
  ) {}

  async tick(): Promise<void> {
    try {
      await this.checkQueue();
    } catch (e) {
      this.logService.error(`[Ticker] [Error] Ticker queue error`, {name: e.name, message: e.message, stack: e.stack});
    }

    try {
      await this.checkGameActions();
    } catch (e) {
      this.logService.error(`[Ticker] [Error] Ticker game actions error`, {name: e.name, message: e.message, stack: e.stack});
    }

    try {
      await this.checkShopPurchases();
    } catch (e) {
      this.logService.error(`[Ticker] [Error] Ticker shop purshases error`, {name: e.name, message: e.message, stack: e.stack});
    }
  }

  async checkQueue() {
    await this.queueService.lookForExpiredQueueAsks();
    await this.queueService.lookForFullQueues();
  }

  async checkGameActions() {
    await this.gameService.lookForPendingActions();
  }

  async checkShopPurchases() {
    await this.shopService.lookForCompletePurchases();
  }

}
