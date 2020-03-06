#!/usr/bin/env node
// tslint:disable: no-console

import clear = require('clear');
import chalk = require('chalk');
import program = require('commander');
import { RestService } from '../rest/rest.service';
import { ICycle, ILoot } from '../@shared/rest-shared/entities';
import { GamesStorageService } from '../storage/games.storage.service';
import { IGameInstance, IGameResult } from '../@shared/arena-shared/game';
import { WizzardsStorageService } from '../storage/wizzards.storage.service';
import { IWizzard } from '../@shared/arena-shared/wizzard';
import { mergeLootsInItems } from '../utils/game.utils';

clear();

program.version('0.0.1')
  .description(`Reward players during Cycle change`)
  .option('-c, --cycle <cycleId>', 'The Cycle ID')
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit(0);
}

if (!program.cycle) {
  console.log(chalk.red('Cycle argument is required.'));
  process.exit(1);
}

// Create the services
const restService: RestService = new RestService();
const gamesStorageService: GamesStorageService = new GamesStorageService();
const wizzardsStorageService: WizzardsStorageService = new WizzardsStorageService();

async function bootstrap() {
  // Load cycle
  console.log(chalk.blue(`Loading cycle`));
  const cycle: ICycle = await loadCycle(program.cycle);
  console.log(chalk.green(`Cycle "${cycle.id}" loaded.`));

  // Load the games between the cycle dates
  console.log(chalk.blue(`Getting games`));
  const allIds: number[] = gamesStorageService.getIds();
  console.log(chalk.green(`${allIds.length} games found.`));

  // Getting the participating users & the points for each of them
  console.log(chalk.blue(`Gathering points`));
  const from: number = cycle.timestampFrom;
  const to: number = cycle.timestampTo;
  const pointsPerUsers: {[key: string]: number} = {};
  for (const id of allIds) {
    const game: IGameInstance = gamesStorageService.get(id);
    const firstActionTimestamp: number|undefined = game?.actions?.previous?.[0]?.createdAt;
    if (firstActionTimestamp) {
      // All the next actions will be out of the cycle
      if (firstActionTimestamp / 1000 > to) {
        break;
      }
      if (game.gameTypeId === 'tournament' && firstActionTimestamp / 1000 >= from) {
        console.log(chalk.white(`The game #${game.id} is on the cycle.`));
        game?.result?.forEach((result: IGameResult) => {
          pointsPerUsers[result.user] = pointsPerUsers[result.user] ? pointsPerUsers[result.user] : 0;
          if (result.result === 'win') {
            pointsPerUsers[result.user] ++;
            console.log(chalk.white(`The user #${result.user} won the game. Add a point.`));
          }
        });
      }
    }
  }

  // Sort the users
  console.log(chalk.blue('Sort the users'));
  const sortedUsers: string[] = Object.keys(pointsPerUsers).sort((a, b) => pointsPerUsers[a] > pointsPerUsers[b] ? -1 : 1);
  console.log(chalk.white('Sorted users: ' + JSON.stringify(sortedUsers)));

  // Reward the winner
  console.log(chalk.blue('Reward the winner'));
  console.log(chalk.white(JSON.stringify(cycle.rewardsForWinner)));
  const winner: IWizzard = wizzardsStorageService.get(parseInt(sortedUsers[0], 10));
  mergeLootsInItems(winner.items, cycle.rewardsForWinner);
  wizzardsStorageService.save(winner);
  console.log(chalk.green('Winner saved'));

  // Reward all the participants
  console.log(chalk.blue('Reward the participants'));
  console.log(chalk.white(JSON.stringify(cycle.rewardsForPlayers)));
  sortedUsers.forEach((id: string) => {
    const participant: IWizzard = wizzardsStorageService.get(parseInt(id, 10));
    mergeLootsInItems(participant.items, cycle.rewardsForPlayers);
    wizzardsStorageService.save(participant);
    console.log(chalk.green(`Participant ${participant.id} saved`));
  });

  console.log(chalk.green(`All users rewarded. All clear!`));
}

async function loadCycle(id: string): Promise<ICycle> {
  try {
    return await restService.cycle(id);
  } catch (e) {
    console.log(chalk.red(`Cannot load cycle "${id}".`));
    process.exit(1);
  }
}

bootstrap(); // call command
