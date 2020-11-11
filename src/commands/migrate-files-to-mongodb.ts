#!/usr/bin/env node
// tslint:disable: no-console

import clear = require('clear');
import chalk = require('chalk');
import program = require('commander');

import * as fs from 'fs';
import * as dotenv from 'dotenv';
import mongoose, { Schema } from 'mongoose';

clear();

program.version('0.0.1')
  .description(`Take files contained in a folder, and put them in MongoDB collection.`)
  .option('-d, --directory <directory>', 'The directory. NO trailing slash.')
  .option('-c, --collection <collection>', 'The collection where to add the files.')
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit(0);
}

if (!program.directory) {
  console.log(chalk.red('Cycle argument is required.'));
  process.exit(1);
}

async function bootstrap() {
  await mongoose.connect(`mongodb://${process.env.MONGO_HOST}/${process.env.MONGO_DB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  });

  // Create Mongoose dirty schema
  const schema = new Schema({id: Number}, { strict: false });
  const Model = mongoose.model(program.collection, schema);

  // Load the files in the directory
  const files = fs.readdirSync(program.directory);
  const promises = files.map(async (file: string) => {
    const fileId = parseInt(file, 10);
    if (fileId && !isNaN(fileId)) {
      const fileData = JSON.parse(fs.readFileSync(`${program.directory}/${fileId}`).toString());
      fileData.id = fileId;
      const data = new Model(fileData);
      const document = await data.save();
      console.log(document.id);
    }
  });
  await Promise.all(promises);
}

dotenv.config();
bootstrap(); // call command
