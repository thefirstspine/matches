import { Controller, Get } from '@nestjs/common';

/**
 * Main controller to avoir 404 on home & report status.
 */
@Controller()
export class IndexController {

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
    return {status: 'ok'};
  }
}
