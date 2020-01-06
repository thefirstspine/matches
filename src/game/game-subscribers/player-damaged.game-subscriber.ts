import { IGameInstance, IGameCard, IGameUser, IGameResult } from '../../@shared/arena-shared/game';
import { ILoot } from '../../@shared/rest-shared/entities';
import { WizzardService } from '../../wizzard/wizzard.service';
import { WizzardsStorageService } from '../../storage/wizzards.storage.service';
import { IWizzard } from '../../@shared/arena-shared/wizzard';
import { mergeLootsInItems } from '../../utils/game.utils';

/**
 * This subscriber is executed once a 'game:card:lifeChanged:damaged:{player}' event is thrown and look for dead
 * players.
 * @param gameInstance
 * @param params
 */
export default async function playerDamagedGameSubscriber(gameInstance: IGameInstance, params: {gameCard: IGameCard}) {
  if (params.gameCard && params.gameCard.card.stats.life <= 0) {
    // TODO: Maybe there is a way to have the services here
    const wizzardsStorageService: WizzardsStorageService = new WizzardsStorageService();
    const wizzardService: WizzardService = new WizzardService(wizzardsStorageService);

    // TODO: In a game instance with more than two player this does NOT work
    // Get the players
    const losers: IGameUser[] = gameInstance.users.filter((u: IGameUser) => u.user === params.gameCard.user);
    const winners: IGameUser[] = gameInstance.users.filter((u: IGameUser) => u.user !== params.gameCard.user);

    // Generate results & register history
    const result: IGameResult[] = [];
    losers.forEach((gameUser: IGameUser) => {
      registerResult(
        false,
        gameUser,
        gameInstance,
        result,
        wizzardService,
        wizzardsStorageService);
    });

    winners.forEach((gameUser: IGameUser) => {
      registerResult(
        true,
        gameUser,
        gameInstance,
        result,
        wizzardService,
        wizzardsStorageService);
    });

    // Register result
    gameInstance.result = result;

    // Close the instance
    gameInstance.status = 'ended';
  }
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
function registerResult(
  victory: boolean,
  gameUser: IGameUser,
  gameInstance: IGameInstance,
  result: IGameResult[],
  wizzardService: WizzardService,
  wizzardsStorageService: WizzardsStorageService,
) {
  const loot: ILoot[] = victory ? [
    {name: 'shard', num: 30},
    {name: 'victory-mark', num: 1},
  ] : [
    {name: 'shard', num: 30},
    {name: 'defeat-mark', num: 1},
  ];
  const wizzard: IWizzard = wizzardService.getWizzard(gameUser.user);
  wizzard.history.push({
    gameId: gameInstance.id,
    gameTypeId: gameInstance.gameTypeId,
    victory,
    timestamp: Date.now(),
  });
  mergeLootsInItems(wizzard.items, loot);
  wizzardsStorageService.save(wizzard);
  result.push({
    user: gameUser.user,
    result: 'win',
    loot,
  });
}
