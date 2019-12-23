import { ICard } from '../cards.library';

// tslint:disable: max-line-length
const conjurerSouvenirCard: ICard = {
  id: `conjurer-souvenir`,
  text: {
    en: ``,
    fr: `Cette carte est une carte de collection ne peut être jouée que pendant le Cycle des Souvenirs.`,
  },
  lore: {
    en: ``,
    fr: `« N/A »\n- Un Illusionniste`,
  },
  imageUrl: `https://static.thefirstspine.fr/conjurer-souvenir.png`,
  name: {
    en: ``,
    fr: `Souvenir d'un Illusionniste`,
  },
  stats: {
    life: 7,
    capacities: ['grow'],
    bottom: {
      defense: 2,
      strenght: 1,
      capacity: 'aura',
    },
    left: {
      defense: 2,
      strenght: 1,
      capacity: 'aura',
    },
    right: {
      defense: 2,
      strenght: 1,
      capacity: 'aura',
    },
    top: {
      defense: 2,
      strenght: 1,
      capacity: 'aura',
    },
  },
  type: 'artifact',
  art: 'Maylhine',
};

export default conjurerSouvenirCard;
