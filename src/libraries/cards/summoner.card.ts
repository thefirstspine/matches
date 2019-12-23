import { ICard } from '../cards.library';

// tslint:disable: max-line-length
const summonerCard: ICard = {
  id: `summoner`,
  text: {
    en: ``,
    fr: ``,
  },
  lore: {
    en: ``,
    fr: `« Il va de soi qu'un invocateur connaît les arcanes de la vie. Qu'en est-il de la mort ? »\n- Un Chasseur`,
  },
  art: 'Maylhine',
  imageUrl: `https://static.thefirstspine.fr/summoner.png`,
  name: {
    en: `Summoner`,
    fr: `Invocateur`,
  },
  stats: {
    bottom: {
      defense: 0,
      strenght: 0,
    },
    left: {
      defense: 1,
      strenght: 1,
    },
    life: 10,
    right: {
      defense: 1,
      strenght: 1,
    },
    top: {
      defense: 1,
      strenght: 1,
    },
  },
  type: 'player',
};

export default summonerCard;
