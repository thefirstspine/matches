import { ICard } from '../cards.library';

// tslint:disable: max-line-length
const sorcererSouvenirCard: ICard = {
  id: `sorcerer-souvenir`,
  text: {
    en: ``,
    fr: `Cette carte est une carte de collection ne peut être jouée que pendant le Cycle des Souvenirs.`,
  },
  lore: {
    en: ``,
    fr: `« N/A »\n- Un Prestidigitateur`,
  },
  imageUrl: `https://static.thefirstspine.fr/sorcerer-souvenir.png`,
  name: {
    en: ``,
    fr: `Souvenir d'un Prestidigitateur`,
  },
  stats: {
    life: 20,
    capacities: ['death'],
    bottom: {
      defense: 0,
      strenght: 0,
      capacity: 'aura',
    },
    left: {
      defense: 0,
      strenght: 0,
      capacity: 'aura',
    },
    right: {
      defense: 0,
      strenght: 0,
      capacity: 'aura',
    },
    top: {
      defense: 0,
      strenght: 0,
      capacity: 'aura',
    },
  },
  type: 'artifact',
  art: 'Maylhine',
};

export default sorcererSouvenirCard;
