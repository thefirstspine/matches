import { ICard } from '../cards.library';

// tslint:disable: max-line-length
const bansheeCard: ICard = {
  id: `banshee`,
  text: {
    en: ``,
    fr: ``,
  },
  lore: {
    en: ``,
    fr: `« Je ne suis que la messagère. »\n- Une banshee.`,
  },
  art: 'Maylhine',
  imageUrl: `https://static.thefirstspine.fr/banshee.png`,
  name: {
    en: ``,
    fr: `Banshee`,
  },
  stats: {
    life: 5,
    bottom: {
      defense: 2,
      strenght: 1,
    },
    left: {
      defense: 0,
      strenght: 4,
    },
    right: {
      defense: 0,
      strenght: 4,
    },
    top: {
      defense: 1,
      strenght: 2,
    },
  },
  type: 'creature',
};

export default bansheeCard;
