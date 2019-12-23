import { IGameType } from '../games-types.library';
import classicGameType from './classic.game-type';

const quickGameType: IGameType = {
  ...classicGameType,
  id: 'quick',
  name: {
    fr: `Partie rapide`,
    en: ``,
  },
  description: {
    fr: `Jouez une partie rapide non classée. Parfait pour découvrir le jeu !`,
    en: ``,
  },
  origins: [],
  destinies: ['conjurer', 'hunter', 'sorcerer', 'summoner'],
  players: [
    { x: 3, y: 1 },
    { x: 3, y: 5 },
  ],
  space: {
    minX: 1,
    minY: 1,
    maxX: 5,
    maxY: 5,
  },
  matchmakingMode: 'asap',
  hooks: {},
};

export default quickGameType;
