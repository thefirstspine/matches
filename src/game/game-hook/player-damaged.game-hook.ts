import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameUser, IGameResult, IGameCard, IWizard, IWizardHistoryItem } from '@thefirstspine/types-arena';
import { WizzardsStorageService } from '../../storage/wizzards.storage.service';
import { WizzardService } from '../../wizard/wizard.service';
import { ILoot, ICycle } from '@thefirstspine/types-rest';
import { mergeLootsInItems } from '../../utils/game.utils';
import { RestService } from '../../rest/rest.service';
import { LogsService } from '@thefirstspine/logs-nest';
import { MessagingService } from '@thefirstspine/messaging-nest';
import { Modifiers } from '../modifiers';

/**
 * This subscriber is executed once a 'card:lifeChanged:damaged:{player}' event is thrown and look for dead
 * players.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class PlayerDamagedGameHook implements IGameHook {

  constructor(
    private readonly wizzardService: WizzardService,
    private readonly wizzardsStorageService: WizzardsStorageService,
    private readonly restService: RestService,
    private readonly messagingService: MessagingService,
    private readonly logsService: LogsService,
  ) {}

  async execute(gameInstance: IGameInstance, params: {gameCard: IGameCard, source: IGameCard, lifeChanged: number}): Promise<boolean> {
    if (params.gameCard && params.gameCard.currentStats.life <= 0
       && gameInstance.status === 'active') { // Guard here in case of multiple hook called
      // TODO: In a game instance with more than two player this does NOT work
      // Get the players
      const losers: IGameUser[] = gameInstance.users.filter((u: IGameUser) => u.user === params.gameCard.user);
      const winners: IGameUser[] = gameInstance.users.filter((u: IGameUser) => u.user !== params.gameCard.user);

      const gameType = await this.restService.gameType(gameInstance.gameTypeId);

      // Get aditionnal triumphs based on opponents
      const additionalTriumphs: string[] = [];
      if (losers.find((user: IGameUser) => user.user === 933)) {
        additionalTriumphs.push('silentist');
      }
      if (losers.find((user: IGameUser) => user.user === 934)) {
        additionalTriumphs.push('predator');
      }
      if (losers.find((user: IGameUser) => user.user === 935)) {
        additionalTriumphs.push('constructor');
      }
      if (losers.find((user: IGameUser) => user.user === 1141)) {
        additionalTriumphs.push('poacher');
      }

      // Generate results & register history
      const result: IGameResult[] = [];
      losers.forEach((gameUser: IGameUser) => {
        const loots: ILoot[] = [];
        if (gameInstance.modifiers.includes('deprecated')) {
          loots.push(...gameType.loots.defeat);
        }
        /*
        if (cycle.id === 'treasure-2020') {
          loots.push({
            name: 'golden-galleon',
            num: gameInstance.cards
              .filter((c: IGameCard) => c.user === gameUser.user && c.location === 'hand' && c.card.id === 'golden-galleon').length,
          });
        }
        */
        this.registerResult(
          false,
          gameUser,
          gameInstance,
          loots,
          result,
          []);
      });

      winners.forEach((gameUser: IGameUser) => {
        const loots: ILoot[] = [];
        if (gameInstance.modifiers.includes('deprecated')) {
          loots.push(...gameType.loots.victory);
        }
        /*
        if (cycle.id === 'treasure-2020') {
          loots.push({
            name: 'golden-galleon',
            num: gameInstance.cards
              .filter((c: IGameCard) => c.user === gameUser.user && c.location === 'hand' && c.card.id === 'golden-galleon').length,
          });
        }
        */
        this.registerResult(
          true,
          gameUser,
          gameInstance,
          loots,
          result,
          additionalTriumphs);
      });

      // Register result
      gameInstance.result = result;

      // Close the instance
      gameInstance.status = 'ended';
    }

    return true;
  }

  /**
   * Register a result in the game & in the wizzard
   * @param victory
   * @param gameUser
   * @param gameInstance
   * @param result
   * @param wizzardService
   * @param wizzardsStorageService
   */
  protected registerResult(
    victory: boolean,
    gameUser: IGameUser,
    gameInstance: IGameInstance,
    loot: ILoot[],
    result: IGameResult[],
    additionalTriumphs: string[],
  ) {
    // Get wizard's account
    const wizard: IWizard = this.wizzardService.getOrCreateWizzard(gameUser.user);

    if (victory) {
      loot.push({name: 'victory-mark', num: 1});
    } else {
      loot.push({name: 'defeat-mark', num: 1});
    }

    if (gameInstance.modifiers.includes(Modifiers.IMMEDIATE)) {
      if (victory) {
        loot.push({name: 'shard', num: 30});
      } else {
        loot.push({name: 'shard', num: 10});
      }
    }

    if (gameInstance.modifiers.includes(Modifiers.DAILY)) {
      const gamesOfTheDay: IWizardHistoryItem[] = wizard.history.filter((h) => {
        const today: Date = new Date();
        const todayStr: string = today. getFullYear() + '-' + (today. getMonth() + 1) + '-' + (today.getDate());
        const gameDate: Date = new Date(h.timestamp);
        const gameDateStr: string = gameDate. getFullYear() + '-' + (gameDate. getMonth() + 1) + '-' +  (gameDate.getDate());
        return todayStr === gameDateStr;
      });
      const mutiplier: number = gamesOfTheDay.length === 0 ? 2 : 1;
      if (victory) {
        loot.push({name: 'shard', num: 30 * mutiplier});
      } else {
        loot.push({name: 'shard', num: 10 * mutiplier});
      }
    }

    if (gameInstance.modifiers.includes(Modifiers.CYCLE)) {
      if (victory) {
        loot.push({name: 'shard', num: 60});
      }
    }

    if (
      gameInstance.modifiers.includes(Modifiers.CYCLE) &&
      gameInstance.modifiers.includes(Modifiers.GREAT_ANCIENTS_EGGS)
    ) {
      if (victory) {
        loot.push(...[
          {name: 'holo-great-ancient-egg', num: 1},
          {name: 'premium-great-ancient-egg', num: 1},
          {name: 'great-ancient-mark', num: 1},
        ]);
      } else {
        loot.push(...[
          {name: 'holo-great-ancient-egg', num: 1},
          {name: 'great-ancient-mark', num: 1},
        ]);
      }
    }

    if (
      gameInstance.modifiers.includes(Modifiers.CYCLE) &&
      gameInstance.modifiers.includes(Modifiers.SOUVENIRS_FROM_YOUR_ENEMY)
    ) {
      if (victory) {
        loot.push(...[
          {name: 'holo-conjurer-souvenir', num: 1},
          {name: 'holo-summoner-souvenir', num: 1},
          {name: 'holo-sorcerer-souvenir', num: 1},
          {name: 'holo-hunter-souvenir', num: 1},
          {name: 'souvenirs-mark', num: 1},
        ]);
      } else {
        loot.push(...[
          {name: 'holo-conjurer-souvenir', num: 1},
          {name: 'premium-conjurer-souvenir', num: 1},
          {name: 'holo-summoner-souvenir', num: 1},
          {name: 'premium-summoner-souvenir', num: 1},
          {name: 'holo-sorcerer-souvenir', num: 1},
          {name: 'premium-sorcerer-souvenir', num: 1},
          {name: 'holo-hunter-souvenir', num: 1},
          {name: 'premium-hunter-souvenir', num: 1},
          {name: 'souvenirs-mark', num: 1},
        ]);
      }
    }

    // Register data in wizard's history
    const historyItem: IWizardHistoryItem = {
      gameId: gameInstance.id,
      gameTypeId: gameInstance.gameTypeId,
      victory,
      timestamp: Date.now(),
    };
    wizard.history.push(historyItem);
    this.logsService.info(`Register history to user #${gameUser.user}`, historyItem);

    // Add loot
    mergeLootsInItems(wizard.items, loot);

    if (!victory) {
      // Register the triumph "spirit"
      if (!wizard.triumphs.includes('spirit')) {
        wizard.triumphs.push('spirit');
      }
    } else {
      // Register the triumphs for the destiny & the origin
      if (gameUser.destiny && !wizard.triumphs.includes(gameUser.destiny)) {
        wizard.triumphs.push(gameUser.destiny);
      }
      if (gameUser.origin && !wizard.triumphs.includes(gameUser.origin)) {
        wizard.triumphs.push(gameUser.origin);
      }
    }

    // Register triumph for FPE
    if (gameInstance.gameTypeId === 'fpe' && !wizard.triumphs.includes('wizzard')) {
      wizard.triumphs.push('wizzard');
    }

    // Register other triumphs
    additionalTriumphs.forEach((t: string) => {
      if (!wizard.triumphs.includes(t)) {
        wizard.triumphs.push(t);
      }
    });

    // Save wizard
    this.messagingService.sendMessage([wizard.id], 'TheFirstSpine:account', wizard);
    this.wizzardsStorageService.save(wizard);
    this.logsService.info(`Wizard #${gameUser.user} saved`, wizard);

    result.push({
      user: gameUser.user,
      result: victory ? 'win' : 'lose',
      loot,
    });
  }

}
