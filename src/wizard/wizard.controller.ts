import { Controller, Param, Get, NotFoundException, UseGuards, Req, Patch, Body, BadRequestException } from '@nestjs/common';
import { WizzardService } from './wizard.service';
import { PatchWizardDto } from './patch-wizard.dto';
import { IWizard } from '@thefirstspine/types-arena';
import { AuthGuard } from '@thefirstspine/auth-nest';
import { IAvatar } from '@thefirstspine/types-rest';
import { RestService } from '../rest/rest.service';
import { WizzardsStorageService } from '../storage/wizzards.storage.service';

/**
 * Main wizard API to get & edit wizard data.
 */
@Controller('wizard')
export class WizardController {

  constructor(
    private readonly wizardService: WizzardService,
    private readonly wizardStorageService: WizzardsStorageService,
    private readonly restService: RestService,
  ) {}

  /**
   * GET wizard/me endpoint
   * Returns the wizard associated with the current user.
   * This endpoint returns sensible data such as purchases.
   * @param request
   */
  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@Req() request: any): IWizard {
    const wizard: IWizard = this.wizardService.getWizard(request.user, true);
    if (!wizard) {
      return this.wizardService.createWizard(request.user);
    }

    return wizard;
  }

  /**
   * PATCH wizard/me endpoint
   * Edit wizard's data.
   * @param request
   * @param body
   */
  @Patch('me')
  @UseGuards(AuthGuard)
  async patchMe(@Req() request: any, @Body() body: PatchWizardDto): Promise<IWizard> {
    const wizard: IWizard = this.wizardService.getWizard(request.user, true);
    if (!wizard) {
      throw new NotFoundException();
    }

    // Name field
    if (body.name) {
      wizard.name = body.name;
    }

    // Avatar field
    if (body.avatar) {
      const avatar: IAvatar = await this.restService.avatar(body.avatar);
      if (!avatar) {
        throw new BadRequestException();
      }
      wizard.avatar = avatar.id;
    }

    // Title field
    if (body.title) {
      if (!wizard.triumphs.includes(body.title)) {
        throw new BadRequestException();
      }
      wizard.title = body.title;
    }

    // Save the wizard on storage
    this.wizardStorageService.save(wizard);

    return wizard;
  }

  /**
   * GET wizard/:id endpoint
   * Returns a wizard. This method does not return sensible information.
   * @param id
   * @param request
   */
  @Get(':id')
  single(@Param('id') id: number, @Req() request: any): IWizard {
    const wizard: IWizard = this.wizardService.getWizard(id, false);
    if (!wizard) {
      throw new NotFoundException();
    }

    return wizard;
  }

}
