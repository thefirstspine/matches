import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameUser } from '../../@shared/arena-shared/game';
import { RestService } from '../../rest/rest.service';
import { ICycle } from '../../@shared/rest-shared/entities';
import { ICard, ICardStat } from '../../@shared/rest-shared/card';
import { randBetween } from '../../utils/maths.utils';
import { shuffle } from '../../utils/array.utils';

@Injectable()
export class FpeCreatedGameHook implements IGameHook {

  constructor(
    private readonly restService: RestService,
  ) {}

  async execute(gameInstance: IGameInstance, params: {gameInstance: IGameInstance}): Promise<boolean> {
    // Get the cards
    const applicantCard: ICard = await this.restService.card('applicant');
    const foxCard: ICard = await this.restService.card('the-fox');
    const smokyTotemCard: ICard = await this.restService.card('smoky-totem');
    const thunderCard: ICard = await this.restService.card('thunder');
    const healCard: ICard = await this.restService.card('heal');
    const bansheeCard: ICard = await this.restService.card('banshee');
    const theTowerCard: ICard = await this.restService.card('the-tower');
    const summonerCard: ICard = await this.restService.card('summoner');

    // Add an opponent
    gameInstance.users.push({
      destiny: 'summoner',
      origin: null,
      user: 0,
      style: '',
    });

    // Damaged Banshee stats
    const damagedBasheeStats: ICardStat = JSON.parse(JSON.stringify(bansheeCard.stats));
    damagedBasheeStats.life -= 2;
    const damagedSummonerStats: ICardStat = JSON.parse(JSON.stringify(summonerCard.stats));
    damagedSummonerStats.life -= 8;

    // Rewrite all the cards
    gameInstance.cards = [
      {
        id: 'fpe_1',
        card: applicantCard,
        user: gameInstance.users[0].user,
        location: 'board',
        coords: { x: 3, y: 0 },
        currentStats: JSON.parse(JSON.stringify(applicantCard.stats)),
        metadata: {},
      },
      {
        id: 'fpe_2',
        card: foxCard,
        user: gameInstance.users[0].user,
        location: 'hand',
        currentStats: JSON.parse(JSON.stringify(foxCard.stats)),
        metadata: {},
      },
      {
        id: 'fpe_3',
        card: smokyTotemCard,
        user: gameInstance.users[0].user,
        location: 'hand',
        currentStats: JSON.parse(JSON.stringify(smokyTotemCard.stats)),
        metadata: {},
      },
      {
        id: 'fpe_4',
        card: thunderCard,
        user: gameInstance.users[0].user,
        location: 'hand',
        metadata: {},
      },
      {
        id: 'fpe_5',
        card: healCard,
        user: gameInstance.users[0].user,
        location: 'hand',
        metadata: {},
      },
      {
        id: 'fpe_6',
        card: foxCard,
        user: 0,
        location: 'board',
        coords: { x: 4, y: 0 },
        currentStats: JSON.parse(JSON.stringify(foxCard.stats)),
        metadata: {},
      },
      {
        id: 'fpe_7',
        card: bansheeCard,
        user: 0,
        location: 'board',
        coords: { x: 2, y: 0 },
        currentStats: JSON.parse(JSON.stringify(bansheeCard.stats)),
        metadata: {},
      },
      {
        id: 'fpe_8',
        card: theTowerCard,
        user: gameInstance.users[0].user,
        location: 'board',
        coords: { x: 3, y: 1 },
        currentStats: JSON.parse(JSON.stringify(theTowerCard.stats)),
        metadata: {},
      },
      {
        id: 'fpe_9',
        card: bansheeCard,
        user: gameInstance.users[0].user,
        location: 'board',
        coords: { x: 3, y: 3 },
        currentStats: damagedBasheeStats,
        metadata: {},
      },
      {
        id: 'fpe_10',
        card: summonerCard,
        user: 0,
        location: 'board',
        coords: { x: 3, y: 6 },
        currentStats: damagedSummonerStats,
        metadata: {},
      },
    ];

    // Add the first action
    gameInstance.actions.current = [
      {
        type: 'fpe-1',
        createdAt: Date.now() / 1000,
        description: {
          en: '',
          fr: '',
        },
        priority: 10,
        subactions: [
          {
            type: 'accept',
            description: {
              fr: `Oui, c'est cette bataille que tu as perdu. Mais tu aurais pu gagner.`,
              en: ``,
            },
            params: {
            },
          },
          {
            type: 'accept',
            description: {
              fr: `Tu viens de commencer ton tour. Tu peux défausser une carte, et piocher pour avoir 6 cartes en main.`,
              en: ``,
            },
            params: {
            },
          },
          {
            type: 'accept',
            description: {
              fr: `Défausses-toi du Soin, il ne te servira à rien.`,
              en: ``,
            },
            params: {
            },
          },
        ],
        user: gameInstance.users[0].user,
      },
    ];

    return true;
  }

}
