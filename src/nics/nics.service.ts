import { networkInterfaces } from 'os';
import * as chalk from 'chalk';
import * as winston from 'winston';

import { resolveSourceIPv4, promisifyPing, promisifyArpTable} from './nics.util';
import { HostStatus, MissingNicError, SourceIPError } from './nics.types';
import { ArpTableError } from '.';

const logger = winston.loggers.get('app-logger');

export const resolveNicNames = (): string[] => {
  const nics = networkInterfaces();
  return Object.keys(nics);
}

export const discoverLanHosts = async (nicName: string): Promise<HostStatus[]> => {
  const nics = networkInterfaces();

  const nameExists = Object.keys(nics).includes(nicName);
  if (!nameExists) {
    const message = chalk.red(
      `There is no network interface with name ${nicName} on the local system.`
    );
    throw new MissingNicError(message);
  }

  const sourceIp = resolveSourceIPv4(nics[nicName]);
  if (!sourceIp) {
    const message = chalk.red(
      `IPv4 address could not be resolved for network interface: ${nicName}`
    );
    throw new SourceIPError(message);
  }

  const pingResults = [];
  let arpTable;
  try {
    arpTable = await promisifyArpTable();
  }
  catch(error) {
    // Error handling happens at top level, exit
    logger.error(error);
    throw new ArpTableError(chalk.red('Error reading the arp table'));
  }

  arpTable.forEach(item => {
    pingResults.push(promisifyPing(sourceIp, item.ip));
  });

  return Promise.all(pingResults);
}
