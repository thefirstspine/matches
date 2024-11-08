import { Controller, Get } from '@nestjs/common';
import { GameService } from '../game/game.service';

/**
 * Main controller to avoir 404 on home & report status.
 */
@Controller()
export class IndexController {

  constructor (private readonly gameService: GameService) {}

  /**
   * Return empty page with 200 status code.
   * Useful for Letsencrypt.
   */
  @Get('/')
  index() {
    return '';
  }

  /**
   * Simply returns 'ok' for status checking =)
   */
  @Get('/status')
  status() {
    return {
      status: 'ok',
      concurrentMatches: this.gameService.getGameInstances().length,
    };
  }
}
