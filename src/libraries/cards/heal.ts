import { ICard } from '../cards.library';

// tslint:disable: max-line-length
const healCard: ICard = {
  id: `heal`,
  text: {
    en: ``,
    fr: `La {creature}créature{/creature} gagne {life}2{/life} sans excéder la valeur initiale.`,
  },
  lore: {
    en: ``,
    fr: `« Prenez bien votre onguent. »\n- Le guérisseur Argento`,
  },
  imageUrl: `https://static.thefirstspine.fr/heal.png`,
  name: {
    en: ``,
    fr: `Soin`,
  },
  type: 'spell',
  art: 'Maylhine, Teddy Gandon',
};

export default healCard;
