import { destiny, ICardCoords, origin, ILocalized } from './generic.library';
import quickGameType from './games-types/quick.game-type';
import classicGameType from './games-types/classic.game-type';
import { IGameInstance } from '../game/game.service';
import tournamentGameType from './games-types/tournament.game-type';

export class GamesTypesLibrary {

  static all(): IGameType[] {
    const ret: IGameType[] = [
      quickGameType,
    ];
    ret.push(classicGameType());
    ret.push(tournamentGameType());
    return ret;
  }

  static find(id: string): IGameType|undefined {
    return this.all().find(e => e.id === id);
  }

  static callHook(id: string, hook: string, gameInstance: IGameInstance) {
    return this.find(id) &&
      this.find(id).hooks &&
      this.find(id).hooks[hook] &&
      this.find(id).hooks[hook](gameInstance);
  }

}

export interface IGameType {
  id: string;
  name: ILocalized;
  description: ILocalized;
  players: ICardCoords[];
  destinies: destiny[];
  origins: origin[];
  space: {
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
  };
  matchmakingMode: 'asap'|'ranked';
  hooks: {
    initialize?: CallableFunction,
  };
  availableShieldsPerCycle?: number;
  maxGamesPerCycle?: number;
}
