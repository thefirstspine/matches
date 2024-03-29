import { Controller, Param, Get, NotFoundException, UseGuards, Req, Patch, Body, BadRequestException, Post, HttpException } from '@nestjs/common';
import { WizardService } from './wizard.service';
import { PatchWizardDto } from './patch-wizard.dto';
import { IWizard, IUserQuest } from '@thefirstspine/types-arena';
import { AuthGuard } from '@thefirstspine/auth-nest';
import { IAvatar } from '@thefirstspine/types-rest';
import { RestService } from '../rest/rest.service';
import { CertificateGuard } from '@thefirstspine/certificate-nest';
import { mergeLootsInItems } from '../utils/game.utils';
import { MessagingService } from '@thefirstspine/messaging-nest';

/**
 * Main wizard API to get & edit wizard data.
 */
@Controller('wizard')
export class WizardController {

  constructor(
    private readonly wizardService: WizardService,
    private readonly restService: RestService,
    private readonly messagingService: MessagingService,
  ) {}

  /**
   * GET wizard/me endpoint
   * Returns the wizard associated with the current user.
   * This endpoint returns sensible data such as purchases.
   * @param request
   */
  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@Req() request: any): Promise<IWizard> {
    const wizard: IWizard = await this.wizardService.getOrCreateWizard(request.user);

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
    const wizard: IWizard = await this.wizardService.getOrCreateWizard(request.user);
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

    // Friends field
    if (body.friends) {
      wizard.friends = body.friends;
    }

    // Quests field
    if (body.quests) {
      // Get the doubles in the request
      body.quests = [...new Set(body.quests)];
      // Get the abandonned quests & remove them from history
      const abandonnedQuests = wizard.quests.filter((q: string) => !body.quests.includes(q));
      wizard.questsProgress = wizard.questsProgress.filter((q: IUserQuest) => !abandonnedQuests.includes(q.id));
      // Get the new quests & add them to the history
      const newQuests = body.quests.filter((q: string) => !wizard.quests.includes(q));
      if (newQuests.length) {
        const currentQuests = await this.restService.quests();
        newQuests.forEach((q: string) => {
          if (q !== currentQuests.daily.id && q !== currentQuests.weekly.id) {
            throw new HttpException('This quest is not authorized.', 400);
          }
          if (q === currentQuests.daily.id) {
            wizard.questsProgress.push({
              ...currentQuests.daily,
              objectiveCurrent: 0,
            });
            this.messagingService.sendMessage([request.user], 'TheFirstSpine:quest:obtain', currentQuests.daily);
          }
          if (q === currentQuests.weekly.id) {
            wizard.questsProgress.push({
              ...currentQuests.weekly,
              objectiveCurrent: 0,
            });
            this.messagingService.sendMessage([request.user], 'TheFirstSpine:quest:obtain', currentQuests.weekly);
          }
        });
      }
      // Test quests length
      if (wizard.questsProgress.length > 4) {
        throw new HttpException('Cannot subcribe to more than 4 quests.', 400);
      }
      // Save the quests
      wizard.quests = body.quests;
    }

    // Save the wizard on storage
    await this.wizardService.saveWizard(wizard);

    return wizard;
  }

  /**
   * GET wizard/:id endpoint
   * Returns a wizard. This method does not return sensible information.
   * @param id
   * @param request
   */
  @Get(':id')
  async single(@Param('id') id: number, @Req() request: any): Promise<IWizard> {
    const wizard: IWizard = await this.wizardService.getOrCreateWizard(id);
    if (!wizard) {
      throw new NotFoundException();
    }

    delete wizard.purchases;

    return wizard;
  }

  /**
   * Add some rewards to a wizard. This endpoint is private.
   * @param request
   * @param id
   */
  @Post(':id/reward')
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
    const wizard = await this.wizardService.getOrCreateWizard(id);

    // Add the loots & save the wizard
    mergeLootsInItems(wizard.items, [{name, num}]);
    this.messagingService.sendMessage([wizard.id], 'TheFirstSpine:loot', [{name, num}]);
    await this.wizardService.saveWizard(wizard);
  }

}
