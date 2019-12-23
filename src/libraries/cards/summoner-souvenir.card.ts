import { ICard } from '../cards.library';

// tslint:disable: max-line-length
const summonerSouvenirCard: ICard = {
  id: `summoner-souvenir`,
  text: {
    en: ``,
    fr: `Cette carte est une carte de collection ne peut être jouée que pendant le Cycle des Souvenirs.`,
  },
  lore: {
    en: ``,
    fr: `« N/A »\n- Un Invocateur`,
  },
  imageUrl: `https://static.thefirstspine.fr/summoner-souvenir.png`,
  name: {
    en: ``,
    fr: `Souvenir d'un Invocateur`,
  },
  stats: {
    life: 4,
    capacities: ['run'],
    bottom: {
      defense: 1,
      strenght: 4,
      capacity: 'aura',
    },
    left: {
      defense: 1,
      strenght: 4,
      capacity: 'aura',
    },
    right: {
      defense: 1,
      strenght: 4,
      capacity: 'aura',
    },
    top: {
      defense: 1,
      strenght: 4,
      capacity: 'aura',
    },
  },
  type: 'artifact',
  art: 'Maylhine',
};

export default summonerSouvenirCard;
