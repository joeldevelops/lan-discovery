import * as chalk from 'chalk';
import * as winston from 'winston';

import * as nics from './nics';
import { discoverLanHosts, writePingResults } from './nics';

const logger = winston.loggers.get('app-logger');

export const nicNamesCommand = (): void => {
  const nicNames = nics.resolveNicNames();
  console.log(chalk.cyan(`Network interfaces on local system:`));
  console.log(chalk.green(`    ${nicNames.join('\n    ')}`));
};

export const discoverLanHostsCommand = async (name: string): Promise<void> => {
  console.log(chalk.cyan('Collecting statuses of hosts on the local network...'));
  try {
    const results = await discoverLanHosts(name);
    writePingResults(results);
  }
  catch (error) {
    if (error.name === 'MissingNicError' || error.name === 'SourceIPError') {
      logger.error(error.message);
    }
    else {
      logger.error(chalk.red('An unexpected error has occurred, please try again.'));
    }
    console.log(chalk.red('Exiting...'));
  }
};