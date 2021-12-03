import * as os from 'os';

import { resolveNicNames, discoverLanHosts } from '../../src/nics/nics.service';
import * as nicsUtil from '../../src/nics/nics.util';

jest.mock('../../src/nics/nics.util');

jest.mock('os', () => ({
  networkInterfaces: jest.fn()
}));

describe('nics.service.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const testNics = {
    'en0': [{
      address: '192.168.1.35',
      family: 'IPv4'
    }],
    'lo0': [],
    'eth0': []
  };
  // @ts-ignore
  os.networkInterfaces.mockImplementation(() => testNics);

  describe('resolveNicNames', () => {
    test('should return a list of nics on the local system',() => {
      const res = resolveNicNames();

      expect(res).toEqual(Object.keys(testNics));
    });
  });

  describe('discoverLanHosts', () => {
    const testArpTable = [
      {ip: '192.168.1.2', mac: "::::"},
      {ip: '192.168.1.1', mac: "::::"},
    ];
    const testHostnameLookup = {
      '192.168.1.2': 'hostname2',
      '192.168.1.1': 'hostname1'
    };
    // @ts-ignore
    nicsUtil.resolveSourceIPv4.mockImplementation((nic) => nic[0].address);
    // @ts-ignore
    nicsUtil.promisifyArpTable.mockImplementation(() => Promise.resolve(testArpTable));
    // @ts-ignore
    nicsUtil.promisifyPing.mockImplementation(
      (sourceIp, address) => Promise.resolve({
        address,
        alive: true,
        hostname: testHostnameLookup[address]
      })
    );

    test('should call nics.util to resolve the source IPv4 of the specified nic', async () => {
      await discoverLanHosts('en0');

      expect(nicsUtil.resolveSourceIPv4).toBeCalledTimes(1);
    });

    test('should call nics.util to read the arp table', async () => {
      await discoverLanHosts('en0');

      expect(nicsUtil.promisifyArpTable).toBeCalledTimes(1);
    });

    test('should call nics.util.promisifyPing in a loop to resolve host status', async () => {
      await discoverLanHosts('en0');

      expect(nicsUtil.promisifyPing).toBeCalledTimes(2);
    });

    test('should return a list of hosts that were reachable and alive', async () => {
      const expected = [
        {
          address: testArpTable[0].ip,
          alive: true,
          hostname: testHostnameLookup[testArpTable[0].ip]
        },
        {
          address: testArpTable[1].ip,
          alive: true,
          hostname: testHostnameLookup[testArpTable[1].ip]
        }
      ]

      let res = await discoverLanHosts('en0');

      expect(res).toEqual(expected);
    });

    test('should throw a MissingNicError when network interface cannot be found', async () => {
      // @ts-ignore
      os.networkInterfaces.mockImplementationOnce(() => ({ boggle: [] }));

      let error;
      try {
        await discoverLanHosts('en0');
      }
      catch (e) {
        error = e;
      }

      expect(error.name).toEqual('MissingNicError');
    });

    test('should throw a SourceIPError a "from" ipv4 cannot be found', async () => {
      // @ts-ignore
      nicsUtil.resolveSourceIPv4.mockImplementationOnce(() => null);

      let error;
      try {
        await discoverLanHosts('en0');
      }
      catch (e) {
        error = e;
      }

      expect(error.name).toEqual('SourceIPError');
    });

    test('should throw a ArpTableError when the arp table cannot be read', async () => {
      // @ts-ignore
      nicsUtil.promisifyArpTable.mockImplementationOnce(() => Promise.reject(new Error('error')));

      let error;
      try {
        await discoverLanHosts('en0');
      }
      catch (e) {
        error = e;
      }

      expect(error.name).toEqual('ArpTableError');
    });
  });
});