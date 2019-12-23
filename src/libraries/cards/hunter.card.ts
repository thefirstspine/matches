import { ICard } from '../cards.library';

// tslint:disable: max-line-length
const hunterCard: ICard = {
  id: `hunter`,
  text: {
    en: ``,
    fr: ``,
  },
  lore: {
    en: ``,
    fr: `« J'en ai éliminé trois aujourd'hui. Je me sens sale d'avoir utiliser ces pouvoirs abjectes. Je pense que le Sacrifice n'est pas loin. »\n- Un Chasseur`,
  },
  art: 'Maylhine',
  imageUrl: `https://static.thefirstspine.fr/hunter.png`,
  name: {
    en: ``,
    fr: `Chasseur`,
  },
  stats: {
    life: 10,
    bottom: {
      defense: 0,
      strenght: 0,
    },
    left: {
      defense: 1,
      strenght: 1,
    },
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

export default hunterCard;
