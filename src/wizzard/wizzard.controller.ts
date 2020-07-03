import { Controller, Get, UseGuards, Req, Post, Param, HttpException } from '@nestjs/common';
import { WizzardService } from '../wizard/wizard.service';
import { WizzardsStorageService } from '../storage/wizzards.storage.service';
import { IWizard } from '@thefirstspine/types-arena';
import { IAvatar } from '@thefirstspine/types-rest';
import { RestService } from '../rest/rest.service';
import { CertificateGuard } from '@thefirstspine/certificate-nest';
import { mergeLootsInItems } from '../utils/game.utils';
import { AuthGuard } from '@thefirstspine/auth-nest';
import { MessagingService } from '@thefirstspine/messaging-nest';

/**
 * Main wizard endpoint
 */
@Controller('wizzard')
export class WizzardController {

  constructor(
    private readonly wizzardService: WizzardService,
    private readonly restService: RestService,
    private readonly wizzardsStorageService: WizzardsStorageService,
    private readonly messagingService: MessagingService,
  ) {}

  /**
   * Get the current wizard
   * @param request
   */
  @Get()
  @UseGuards(AuthGuard)
  async main(@Req() request: any) {
    return this.wizzardService.getWizzard(request.user);
  }

  /**
   * Edit public fields of a wizard
   * @param request
   */
  @Post('edit')
  @UseGuards(AuthGuard)
  async editAvatar(@Req() request: any) {
    // Get account
    const wizzard: IWizard = this.wizzardService.getWizzard(request.user);

    // Get avatar
    const avatar: IAvatar|null = request.body.avatar
      ? await this.restService.avatar(request.body.avatar)
      : null;

    // Edit account
    wizzard.avatar = request.body.avatar && avatar
      ? request.body.avatar
      : wizzard.avatar;
    wizzard.title = request.body.title && wizzard.triumphs.includes(request.body.title)
      ? request.body.title
      : wizzard.title;
    wizzard.name = request.body.name && request.body.name.length >= 5
      ? request.body.name
      : wizzard.name;

    // Cold save account
    this.messagingService.sendMessage([wizzard.id], 'TheFirstSpine:account', wizzard);
    this.wizzardsStorageService.save(wizzard);

    // Return account data
    return wizzard;
  }

  /**
   * Add some rewards to a wizard. This endpoint is private.
   * @param request
   * @param id
   */
  @Post('reward/:id')
  @UseGuards(CertificateGuard)
  async reward(@Req() request: any, @Param('id') id) {
    // Get the parameters
    const name = request.body.name;
    const num = parseInt(request.body.num, 10);

    // Validate parameterts
    if (!name || !num) {
      throw new HttpException('`name` and `num` are required. `num` must be an integer.', 400);
    }

    // Load the wizzard
    const wizard = this.wizzardService.getWizzard(id);

    // Add the loots & save the wizard
    mergeLootsInItems(wizard.items, [{name, num}]);
    this.wizzardsStorageService.save(wizard);
  }

}
