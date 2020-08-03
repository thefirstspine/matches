#!/usr/bin/env node
// tslint:disable: no-console

import clear = require('clear');
import chalk = require('chalk');
import program = require('commander');

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

async function bootstrap() {
  // Load cycle
  console.log(chalk.red(`This command is not used anymore.`));
}

bootstrap(); // call command
