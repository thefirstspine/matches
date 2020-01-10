import { Injectable } from '@nestjs/common';
import { QueueService } from './../queue/queue.service';
import { GameService } from '../game/game.service';
import { ShopService } from '../shop/shop.service';
import { LogService } from '../@shared/log-shared/log.service';

/**
 * The ticker service will handle all the async operations, such as
 * game start, closing stales games, etc.
 */
@Injectable()
export class TickerService {

  protected tickCount: number = 0;

  constructor(
    private readonly queueService: QueueService,
    private readonly gameService: GameService,
    private readonly shopService: ShopService,
    private readonly logService: LogService,
  ) {}

  /**
   * Main ticker method.
   * @param tickNumber
   */
  async tick(): Promise<void> {
    // Increase tick count
    this.tickCount ++;

    // Check expired queue asks every tick
    try {
      await this.queueService.lookForExpiredQueueAsks();
    } catch (e) {
      this.logService.error(`Ticker queue expiration error`, {name: e.name, message: e.message, stack: e.stack});
    }

    // Manages matchmaking every 60 ticks
    if (this.tickCount % 60 === 0) {
      try {
        await this.queueService.processMatchmakings();
      } catch (e) {
        this.logService.error(`Ticker matchmaking error`, {name: e.name, message: e.message, stack: e.stack});
      }
    }

    // Look for pending actions every tock
    try {
      await this.gameService.lookForPendingActions();
    } catch (e) {
      this.logService.error(`Ticker game actions error`, {name: e.name, message: e.message, stack: e.stack});
    }

    // Manages purshases from shop service every tick
    try {
      await this.shopService.lookForCompletePurchases();
    } catch (e) {
      this.logService.error(`Ticker shop purshases error`, {name: e.name, message: e.message, stack: e.stack});
    }
  }

}
