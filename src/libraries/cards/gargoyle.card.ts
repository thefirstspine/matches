import { ICard } from '../cards.library';

// tslint:disable: max-line-length
const gargoyleCard: ICard = {
  id: `gargoyle`,
  text: {
    en: ``,
    fr: ``,
  },
  lore: {
    en: ``,
    fr: `« Je vous défie de les franchir. »\n- Olivier-le-fou-droyé.`,
  },
  imageUrl: `https://static.thefirstspine.fr/placeholder.png`,
  name: {
    en: ``,
    fr: `Gargouille`,
  },
  stats: {
    life: 5,
    capacities: ['run'],
    bottom: {
      defense: 2,
      strenght: 1,
    },
    left: {
      defense: 2,
      strenght: 3,
    },
    right: {
      defense: 2,
      strenght: 3,
    },
    top: {
      defense: 2,
      strenght: 3,
      capacity: 'threat',
    },
  },
  type: 'artifact',
};

export default gargoyleCard;
