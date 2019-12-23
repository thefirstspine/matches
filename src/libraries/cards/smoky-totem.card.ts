import { ICard } from '../cards.library';

// tslint:disable: max-line-length
const smokyTotemCard: ICard = {
  id: `smoky-totem`,
  text: {
    en: ``,
    fr: ``,
  },
  lore: {
    en: ``,
    fr: `« Brûlez. BRÛLEZ ! »\n- Volk’ha, fils de Mara lors de la bataille contre le Royaume aux Neuf Déserts.`,
  },
  art: 'Maylhine',
  imageUrl: `https://static.thefirstspine.fr/smoky-totem.png`,
  name: {
    en: ``,
    fr: `Totem fûmant`,
  },
  stats: {
    life: 4,
    capacities: ['burdenEarth'],
    bottom: {
      defense: 8,
      strenght: 2,
      capacity: 'threat',
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
      defense: 1,
      strenght: 2,
    },
  },
  type: 'artifact',
};

export default smokyTotemCard;
