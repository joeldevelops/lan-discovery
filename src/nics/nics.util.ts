import * as chalk from 'chalk';
import * as ping from 'ping';
import * as arp from 'arpjs';
import * as winston from 'winston';
import { promises } from 'dns';
import { NetworkInterfaceInfo } from 'os';

import { ArpHost, HostStatus } from '.';

const logger = winston.loggers.get('app-logger');

export const resolveSourceIPv4 = (nic: NetworkInterfaceInfo[]): string => {
  let sourceIp = null;

  nic.forEach(n => {
    if (n.family === 'IPv4') {
      sourceIp = n.address;
    }
  });

  return sourceIp;
}

export const promisifyArpTable = (): Promise<ArpHost[]> => {
  return new Promise((resolve, reject) => {
    arp.table((error, table) => {
      if (error) {
        reject(error);
      }

      resolve(table);
    });
  });
}

export const promisifyPing = async (
  sourceIp: string,
  address: string,
  checkHostname: boolean = true
): Promise<HostStatus> => {
  return new Promise((resolve, reject) => {
    logger.silly(`Attempting to ping ${address}...`);
    ping.sys.probe(address, async (alive) => {
      if (!alive) {
        logger.silly(chalk.red(`Unable to ping ${address}.`));
      }
      else {
        logger.silly(chalk.green(`Ping of ${address} successful!`));
      }

      let hostname = null;
      if (checkHostname && alive) {
        try {
          const res = await promises.reverse(address);
          hostname = res[0].split('.lan')[0];
        }
        catch (error) {
          logger.debug(`No resolvable hostname for IP ${address}`);
        }
      }

      resolve({
        address,
        alive,
        hostname
      });
    }, { sourceAddr: sourceIp });
  });
}

export const writePingResults = (results: HostStatus[]): void => {
  let anyAlive = false;
  results.forEach(result => {
    if (result.alive) {
      anyAlive = true;
      console.log(chalk.green(`✓ ${result.address}: Address pinged successfully!`));
      if (result.hostname) {
        console.log(chalk.cyan(`    Hostname: ${result.hostname}`));
      }
      else {
        console.log(chalk.yellow(`    Hostname could not be resolved.`));
      }
    }
    else {
      logger.debug(
        chalk.red(`x ${result.address}: Address was unreachable on the local network.`)
      );
    }
  });
  if (!anyAlive) {
    console.log(chalk.yellow(
      'No hosts responded on the local network.' + 
      ' Please check your network settings for host isolation.'
    ));
  }
}