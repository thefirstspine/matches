import { IGameHook } from '../game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameAction } from '../../../@shared/arena-shared/game';
import { RestService } from '../../../rest/rest.service';
import { ICard, ICardStat } from '../../../@shared/rest-shared/card';
import { IHasGameWorkerService } from '../../injections.interface';
import { GameWorkerService } from '../../game-worker/game-worker.service';

@Injectable()
export class FpeCreatedGameHook implements IGameHook, IHasGameWorkerService {

  public gameWorkerService: GameWorkerService;

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
    const barbersCard: ICard = await this.restService.card('barbers');
    const veneniagoraCard: ICard = await this.restService.card('veneniagora');
    const deadlyViperCard: ICard = await this.restService.card('deadly-viper');
    const ruinCard: ICard = await this.restService.card('ruin');
    const putrefactionCard: ICard = await this.restService.card('putrefaction');

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
        card: barbersCard,
        user: gameInstance.users[0].user,
        location: 'hand',
        currentStats: JSON.parse(JSON.stringify(barbersCard.stats)),
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
      {
        id: 'fpe_11',
        card: barbersCard,
        user: gameInstance.users[0].user,
        location: 'deck',
        currentStats: JSON.parse(JSON.stringify(barbersCard.stats)),
        metadata: {},
      },
      {
        id: 'fpe_12',
        card: deadlyViperCard,
        user: gameInstance.users[0].user,
        location: 'deck',
        currentStats: JSON.parse(JSON.stringify(deadlyViperCard.stats)),
        metadata: {},
      },
      {
        id: 'fpe_13',
        card: ruinCard,
        user: gameInstance.users[0].user,
        location: 'deck',
        metadata: {},
      },
      {
        id: 'fpe_14',
        card: putrefactionCard,
        user: gameInstance.users[0].user,
        location: 'deck',
        metadata: {},
      },
      {
        id: 'fpe_16',
        card: healCard,
        user: gameInstance.users[0].user,
        location: 'deck',
        metadata: {},
      },
      {
        id: 'fpe_17',
        card: veneniagoraCard,
        user: gameInstance.users[0].user,
        currentStats: JSON.parse(JSON.stringify(veneniagoraCard.stats)),
        location: 'deck',
        metadata: {},
      },
    ];

    // Add the first action
    const action: IGameAction = await this.gameWorkerService.getWorker('fpe-1').create(gameInstance, {user: gameInstance.users[0].user});
    gameInstance.actions.current = [action];

    return true;
  }

}
