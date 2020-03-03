#!/usr/bin/env node
// tslint:disable: no-console

import clear = require('clear');
import chalk = require('chalk');
import program = require('commander');
import { RestService } from '../rest/rest.service';
import { ICycle } from '../@shared/rest-shared/entities';

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

async function bootstrap() {
  // Load cycle
  console.log(chalk.blue(`Loading cycle`));
  const cycle: ICycle = await loadCycle(program.cycle);
  console.log(chalk.blue(`Cycle "${cycle.id}" loaded.`));

  // Load the games between the cycle dates
}

async function loadCycle(id: string): Promise<ICycle> {
  try {
    return restService.cycle(id);
  } catch (e) {
    console.log(chalk.red(`Cannot load cycle "${id}".`));
  }
}

bootstrap(); // call command
