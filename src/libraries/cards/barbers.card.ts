import { ICard } from '../cards.library';

// tslint:disable: max-line-length
const barbersCard: ICard = {
  id: `barbers`,
  text: {
    en: ``,
    fr: ``,
  },
  lore: {
    en: ``,
    fr: `« Je vous défie de les franchir. »\n- Olivier-le-fou-droyé.`,
  },
  art: 'Maylhine',
  imageUrl: `https://static.thefirstspine.fr/barbers.png`,
  name: {
    en: ``,
    fr: `Barbelés`,
  },
  stats: {
    life: 1,
    bottom: {
      defense: 1,
      strenght: 1,
    },
    left: {
      defense: 0,
      strenght: 3,
    },
    right: {
      defense: 0,
      strenght: 3,
    },
    top: {
      defense: 0,
      strenght: 4,
    },
  },
  type: 'artifact',
};

export default barbersCard;
