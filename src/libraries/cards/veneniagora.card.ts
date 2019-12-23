import { ICard } from '../cards.library';

// tslint:disable: max-line-length
const veneniagoraCard: ICard = {
  id: `veneniagora`,
  text: {
    en: ``,
    fr: ``,
  },
  art: 'Maylhine',
  lore: {
    en: ``,
    fr: `« On l’appelle aussi "Basilic de la Mort". »\n- Enihlyam, illustratrice de la Foi.`,
  },
  imageUrl: `https://static.thefirstspine.fr/veneniagora.png`,
  name: {
    en: ``,
    fr: `Vénéniagora`,
  },
  stats: {
    life: 3,
    bottom: {
      defense: 1,
      strenght: 2,
    },
    left: {
      defense: 1,
      strenght: 2,
    },
    right: {
      defense: 1,
      strenght: 2,
    },
    top: {
      defense: 0,
      strenght: 3,
    },
  },
  type: 'creature',
};

export default veneniagoraCard;
