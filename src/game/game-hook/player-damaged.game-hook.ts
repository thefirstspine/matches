import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameUser, IGameResult, IGameCard } from '@thefirstspine/types-matches';

/**
 * This subscriber is executed once a 'card:lifeChanged:damaged:{player}' event is thrown and look for dead
 * players.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class PlayerDamagedGameHook implements IGameHook {

  constructor(
  ) {}

  async execute(gameInstance: IGameInstance, params: {gameCard: IGameCard, source: IGameCard, lifeChanged: number}): Promise<boolean> {
    if (params.gameCard && params.gameCard.currentStats.life <= 0
       && gameInstance.status === 'active') { // Guard here in case of multiple hook called
      // TODO: In a game instance with more than two player this does NOT work
      // Get the players
      const losers: IGameUser[] = gameInstance.gameUsers.filter((u: IGameUser) => u.user === params.gameCard.user);
      const winners: IGameUser[] = gameInstance.gameUsers.filter((u: IGameUser) => u.user !== params.gameCard.user);

      // Generate results & register history
      const result: IGameResult[] = [];
      await Promise.all(losers.map(async (gameUser: IGameUser) => {
        await this.registerResult(
          false,
          gameUser,
          result);
      }));

      await Promise.all(winners.map(async (gameUser: IGameUser) => {
        await this.registerResult(
          true,
          gameUser,
          result);
      }));

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
   */
  protected async registerResult(
    victory: boolean,
    gameUser: IGameUser,
    result: IGameResult[],
  ) {
    result.push({
      user: gameUser.user,
      result: victory ? 'win' : 'lose',
    });
  }

}
