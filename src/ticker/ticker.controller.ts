import { Controller } from '@nestjs/common';
import { TickerService } from './ticker.service';

@Controller('ticker')
export class TickerController {

  static readonly TICKER_DELAY: number = 1000;

  constructor(
    private readonly tickerService: TickerService,
  ) {
    setTimeout(this.tick.bind(this), TickerController.TICKER_DELAY);
  }

  private async tick() {
    await this.tickerService.tick();
    setTimeout(this.tick.bind(this), TickerController.TICKER_DELAY);
  }

}
