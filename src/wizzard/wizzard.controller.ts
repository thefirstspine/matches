import { Controller, Get, UseGuards, Req, Post } from '@nestjs/common';
import { WizzardService } from './wizzard.service';
import { WizzardsStorageService } from '../storage/wizzards.storage.service';
import { AuthGuard } from '../@shared/auth-shared/auth.guard';
import { IWizzard } from '../@shared/arena-shared/wizzard';
import { IAvatar } from '../@shared/rest-shared/entities';
import { RestService } from '../rest/rest.service';
import { MessagingService } from '../@shared/messaging-shared/messaging.service';

@Controller('wizzard')
export class WizzardController {

  constructor(
    private readonly wizzardService: WizzardService,
    private readonly restService: RestService,
    private readonly wizzardsStorageService: WizzardsStorageService,
    private readonly messagingService: MessagingService,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  async main(@Req() request: any) {
    return this.wizzardService.getWizzard(request.user);
  }

  @Post('edit')
  @UseGuards(AuthGuard)
  async editAvatar(@Req() request: any) {
    // Get account
    const wizzard: IWizzard = this.wizzardService.getWizzard(request.user);

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

    // Cold save account
    this.messagingService.sendMessage([wizzard.id], 'TheFirstSpine:account', wizzard);
    this.wizzardsStorageService.save(wizzard);

    // Return account data
    return wizzard;
  }

}
