import { ICard } from '../cards.library';

// tslint:disable: max-line-length
const hunterSouvenirCard: ICard = {
  id: `hunter-souvenir`,
  text: {
    en: ``,
    fr: `Cette carte est une carte de collection ne peut être jouée que pendant le Cycle des Souvenirs.`,
  },
  lore: {
    en: ``,
    fr: `« N/A »\n- Un Chasseur`,
  },
  imageUrl: `https://static.thefirstspine.fr/hunter-souvenir.png`,
  name: {
    en: ``,
    fr: `Souvenir d'un Chasseur`,
  },
  stats: {
    life: 5,
    capacities: ['run'],
    bottom: {
      defense: 1,
      strenght: 2,
      capacity: 'aura',
    },
    left: {
      defense: 1,
      strenght: 2,
      capacity: 'aura',
    },
    right: {
      defense: 1,
      strenght: 2,
      capacity: 'aura',
    },
    top: {
      defense: 1,
      strenght: 2,
      capacity: 'aura',
    },
  },
  type: 'artifact',
  art: 'Maylhine',
};

export default hunterSouvenirCard;
