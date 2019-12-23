import { IGameType } from '../games-types.library';
import classicGameType from './classic.game-type';
import { CyclesLibrary } from '../cycles.library';

// tslint:disable: max-line-length
export default function(): IGameType {
  const tournamentBaseData: IGameType = {
    id: 'tournament',
    name: {
      fr: `Tournoi de Mara`,
      en: ``,
    },
    description: {
      fr: `Cédez à l'appel de Mara.`,
      en: ``,
    },
    matchmakingMode: 'ranked',
    origins: ['architect', 'healer', 'ignorant', 'surgeon'],
    destinies: ['conjurer', 'hunter', 'sorcerer', 'summoner'],
    availableShieldsPerCycle: 1,
    maxGamesPerCycle: 3,
    players: [
      { x: 3, y: 0 },
      { x: 3, y: 6 },
    ],
    space: {
      minX: 0,
      minY: 0,
      maxX: 6,
      maxY: 6,
    },
    hooks: {},
  };

  const currentCycle = CyclesLibrary.current();
  if (currentCycle) {
    if (currentCycle.id === 'renewal-2020') {
      tournamentBaseData.availableShieldsPerCycle = 0;
      tournamentBaseData.maxGamesPerCycle = 20;
      tournamentBaseData.origins = [];
      tournamentBaseData.destinies = ['hunter'];
      tournamentBaseData.name = {
        fr: `Tournoi du Renouveau`,
        en: ``,
      };
      tournamentBaseData.description = {
        fr: `Un tournoi où tout le monde est à la même enseigne. Mais attention : à la première défaite, vous serez éliminé. Quel sorcier sera le plus valeureux du Cycle du Renouveau 2020 ?`,
        en: ``,
      };
    }
  }

  const tournamentGameType: IGameType = {
    ...classicGameType,
    ...tournamentBaseData,
  };

  return tournamentGameType;
}
