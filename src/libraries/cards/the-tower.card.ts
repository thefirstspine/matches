import { ICard } from '../cards.library';

// tslint:disable: max-line-length
const theTowerCard: ICard = {
  id: `the-tower`,
  text: {
    en: ``,
    fr: ``,
  },
  art: 'Maylhine',
  lore: {
    en: ``,
    fr: `« Une dame de pierre qui protège et punit. »\n- Mara, prophétesse d'Exodia`,
  },
  imageUrl: `https://static.thefirstspine.fr/the-tower.png`,
  name: {
    en: ``,
    fr: `La Tour`,
  },
  stats: {
    bottom: {
      defense: 3,
      strenght: 3,
    },
    left: {
      defense: 1,
      strenght: 3,
    },
    life: 5,
    right: {
      defense: 1,
      strenght: 3,
    },
    top: {
      capacity: 'threat',
      defense: 2,
      strenght: 3,
    },
  },
  type: 'artifact',
};

export default theTowerCard;
