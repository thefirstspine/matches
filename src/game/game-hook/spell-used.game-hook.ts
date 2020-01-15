import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameCard, IGameAction } from 'src/@shared/arena-shared/game';

/**
 * This subscriber is executed once a 'card:spell:used' event is thrown. It wil delete old spells actions.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class SpellUsedGameHook implements IGameHook {

  async execute(gameInstance: IGameInstance, params: any): Promise<boolean> {
    // Get the spells in the hand & delete the associated actions
    // TODO: filter here with an Ether
    gameInstance.cards
      .filter((card: IGameCard) => card.location === 'hand' && card.user === params.gameCard.user && card.card.type === 'spell')
      .forEach((card: IGameCard) => {
        const actions: IGameAction[] = gameInstance.actions.current.filter((a: IGameAction) => a.type === `spell-${card.card.id}`);
        actions.forEach((action: IGameAction) => {
          gameInstance.actions.current = gameInstance.actions.current.filter((a: IGameAction) => a !== action);
          gameInstance.actions.previous.push({
            ...action,
            passedAt: Date.now(),
          });
        });
      });

    return true;
  }

}
