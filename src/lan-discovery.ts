import * as dotenv from 'dotenv';
dotenv.config();

import config from './config';

import * as winston from 'winston';
const logger = winston.loggers.add('app-logger', {
  level: config.logLevel,
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console()
  ]
});

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import * as run from './command';
import server from './server';

yargs(hideBin(process.argv))
  // Config for interface listing
  .command(
    'list-interfaces',
    'List network interface names of the local system.',
    () => {},
    () => {
      run.nicNamesCommand();
  })
  // Config for host discovery
  .command(
    'discover <name>',
    'Bind to a network interface on the local system' +
    ' and find reachable hosts on the local network.',
    (yargs) => {
      return yargs
        .positional('name', {
          describe: 'The name of the network interface to bind to.',
          type: 'string'
        });
    },
    async (argv) => {
      if (argv.verbose || argv.v) {
        logger.level = 'debug';
      }
      if (argv.veryVerbose || argv.vv) {
        logger.level = 'silly';
      }
      await run.discoverLanHostsCommand(argv.name);
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with additional logs.'
  })
  .option('veryVerbose', {
    alias: 'vv',
    type: 'boolean',
    description: 'Write all logs to console.'
  })
  // Config for running the server
  .command('serve', 'Start the LAN Discovery app as a server.', () => {}, async (argv) => {
    await server(argv.port);
  })
  .option('port', {
    alias: 'p',
    type: 'number',
    description: 'The port to bind on, default can be set in the .env file',
    default: config.port || 3000
  })
  .help()
  .parse();
