import { Controller, Get, UseGuards, Req, Post } from '@nestjs/common';
import { WizzardService } from './wizzard.service';
import { WizzardsStorageService } from '../storage/wizzards.storage.service';
import { AuthGuard } from '../@shared/auth-shared/auth.guard';
import { IWizzard } from '../@shared/arena-shared/wizzard';

@Controller('wizzard')
export class WizzardController {

  constructor(
    private readonly wizzardService: WizzardService,
    private readonly wizzardsStorageService: WizzardsStorageService,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  public main(@Req() request: any) {
    return this.wizzardService.getWizzard(request.user);
  }

  @Post('edit')
  @UseGuards(AuthGuard)
  public editAvatar(@Req() request: any) {
    // Get account
    const wizzard: IWizzard = this.wizzardService.getWizzard(request.user);

    // Edit account
    wizzard.avatar = request.body.avatar && AvatarsLibrary.find(request.body.avatar)
      ? request.body.avatar
      : wizzard.avatar;
    wizzard.title = request.body.title && wizzard.triumphs.includes(request.body.title)
      ? request.body.title
      : wizzard.title;

    // Cold save account
    this.wizzardsStorageService.save(wizzard);

    // Return account data
    return wizzard;
  }

}
