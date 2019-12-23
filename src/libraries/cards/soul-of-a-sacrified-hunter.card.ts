import { ICard } from '../cards.library';

// tslint:disable: max-line-length
const soulOfASacrifiedHunterCard: ICard = {
  id: `soul-of-a-sacrified-hunter`,
  text: {
    en: ``,
    fr: `Cette carte gagne {life}1{/life} pour chaque {creature}créature{/creature} dans votre défausse et {strength}4{/strength} sur tous ses côtés pour chaque {artifact}artefact{/artifact} dans votre défausse lorsqu’elle est posée sur le plateau de jeu.`,
  },
  lore: {
    en: ``,
    fr: ``,
  },
  art: 'Maylhine',
  imageUrl: `https://static.thefirstspine.fr/soul-of-a-sacrified-hunter.png`,
  name: {
    en: ``,
    fr: `Âme d'un Chasseur Sacrifié`,
  },
  stats: {
    life: 0,
    bottom: {
      defense: 1,
      strenght: 0,
    },
    left: {
      defense: 1,
      strenght: 0,
    },
    right: {
      defense: 1,
      strenght: 0,
    },
    top: {
      defense: 1,
      strenght: 0,
    },
  },
  type: 'creature',
};

export default soulOfASacrifiedHunterCard;
