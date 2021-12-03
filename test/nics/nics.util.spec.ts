import * as ping from 'ping';
import * as dns from 'dns';
import * as arp from 'arpjs';
import * as chalk from 'chalk';

import * as nicsUtil from '../../src/nics/nics.util';

jest.mock('ping');
jest.mock('dns', () => ({
  promises: {
    reverse: jest.fn()
  }
}));
jest.mock('chalk', () => ({
  cyan: jest.fn(),
  green: jest.fn(),
  yellow: jest.fn(),
  red: jest.fn(),
}));
jest.mock('arpjs', () => ({
  table: jest.fn()
}));

describe('nics.util.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveSourceIPv4', () => {
    test('should take in an array of NetworkInterfaceInfo and return the first IPv4 address', () => {
      const networkInfo = [
        {
          address: '::::',
          family: 'IPv6'
        },
        {
          address: '192.168.1.1',
          family: 'IPv4'
        },
      ]

      const res = nicsUtil.resolveSourceIPv4(networkInfo as any);
      expect(res).toEqual(networkInfo[1].address);
    });

    test('should return null when there is no IPv4 available for this nic', () => {
      const networkInfo = [
        {
          address: '::::',
          family: 'IPv6'
        },
      ];

      const res = nicsUtil.resolveSourceIPv4(networkInfo as any);
      expect(res).toEqual(null);
    });
  });

  describe('promisifyArpTable', () => {
    const testArp = [
      {ip: '0.0.0.0', mac:'::::'}
    ];
    test('should return a list of ip addresses from the arp table', async () => {
      arp.table.mockImplementationOnce((cb) => cb(null, testArp));
      const res = await nicsUtil.promisifyArpTable();

      expect(res).toEqual(testArp);
    });

    test('should reject when an error is present', async () => {
      arp.table.mockImplementationOnce((cb) => (new Error('error')));

      expect (nicsUtil.promisifyArpTable()).rejects.toEqual('error');
    });
  });

  describe('promisifyPing', () => {
    const testSourceIp = '127.0.0.1';
    const testAddress = '192.168.1.2';
    const testHostnamesArray = ['localhost.lan'];
    const testHostname = 'localhost';
    // @ts-ignore
    ping.sys.probe.mockImplementation((address, cb, options) => cb(true));
    // @ts-ignore
    dns.promises.reverse.mockImplementation((address) => Promise.resolve(testHostnamesArray));

    test('should call the wrapped ping method', async () => {
      const res = await nicsUtil.promisifyPing(testSourceIp, testAddress);

      // Get the function arg to match against
      // @ts-ignore
      const codeFunction = ping.sys.probe.mock.calls[0][1];
      expect(ping.sys.probe).toBeCalledWith(
        testAddress,
        codeFunction,
        { sourceAddr: testSourceIp }
      );
    });

    test('should call the dns.reverse method under the default conditions', async () => {
      const res = await nicsUtil.promisifyPing(testSourceIp, testAddress);

      expect(dns.promises.reverse).toBeCalledTimes(1);
    });

    test('should return information on a host under the default conditions', async () => {
      const res = await nicsUtil.promisifyPing(testSourceIp, testAddress);

      expect(res).toEqual({ address: testAddress, alive: true, hostname: testHostname });
    });

    test('should not call the dns.reverse method when checkHostname is false', async () => {
      const res = await nicsUtil.promisifyPing(testSourceIp, testAddress, false);

      expect(dns.promises.reverse).toBeCalledTimes(0);
      expect(res).toEqual({ address: testAddress, alive: true, hostname: null });
    });

    test('should not call the dns.reverse method when host is not alive', async () => {
      // @ts-ignore
      ping.sys.probe.mockImplementationOnce((address, cb, options) => cb(false));

      const res = await nicsUtil.promisifyPing(testSourceIp, testAddress);
  
      expect(dns.promises.reverse).toBeCalledTimes(0);
      expect(res).toEqual({ address: testAddress, alive: false, hostname: null });
    });

    test('should eat errors from dns.reverse and continue with execution', async () => {
      // @ts-ignore
      dns.promises.reverse.mockImplementationOnce((address) => {
        throw new Error('Could not resolve hostname');
      });

      const res = await nicsUtil.promisifyPing(testSourceIp, testAddress);
  
      expect(dns.promises.reverse).toBeCalledTimes(1);
      expect(res).toEqual({ address: testAddress, alive: true, hostname: null });
    });

  });

  describe('writePingResults', () => {
    // Use the chalk mock to test execution flows
    // @ts-ignore
    chalk.cyan.mockImplementation(() => {});
    // @ts-ignore
    chalk.green.mockImplementation(() => {});
    // @ts-ignore
    chalk.yellow.mockImplementation(() => {});
    // @ts-ignore
    chalk.red.mockImplementation(() => {});

    const testPositiveStatus = {
      alive: true,
      address: '127.0.0.1',
      hostname: 'localhost'
    }
    const testNegativeStatus = {
      alive: false,
      address: '127.0.0.1',
      hostname: null,
    }
    const testPartialStatus = {
      alive: true,
      address: '127.0.0.1',
      hostname: null,
    }

    test('should log the host address and hostname', () => {
      nicsUtil.writePingResults([testPositiveStatus]);

      expect(chalk.green).toBeCalledTimes(1);
      expect(chalk.cyan).toBeCalledTimes(1);
    });

    test('should log the host address and a warning when no hostname could be resolved', () => {
      nicsUtil.writePingResults([testPartialStatus]);

      expect(chalk.green).toBeCalledTimes(1);
      expect(chalk.yellow).toBeCalledTimes(1);
    });

    test('should log a message that the host was unreachable', () => {
      nicsUtil.writePingResults([testNegativeStatus]);

      expect(chalk.red).toBeCalledTimes(1);
    });

    test('should log a message that no hosts were reachable on the network', () => {
      nicsUtil.writePingResults([testNegativeStatus]);

      expect(chalk.yellow).toBeCalledTimes(1);
    });
  });
});
