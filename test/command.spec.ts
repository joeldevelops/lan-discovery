import * as chalk from 'chalk'
import * as nics from '../src/nics';

jest.mock('chalk', () => ({
  red: jest.fn(),
  cyan: jest.fn(),
  green: jest.fn()
}));
jest.mock('../src/nics');

import * as command from '../src/command';
import { MissingNicError, SourceIPError } from '../src/nics';

describe('command.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('nicNamesCommand', () => {
    test('should call nicsService.resolveNicNames', () => {
      // @ts-ignore
      nics.resolveNicNames.mockImplementationOnce(() => ['test', 'array']);

      command.nicNamesCommand();

      expect(nics.resolveNicNames).toBeCalled();
    });
  });

  describe('lanHostsCommand', () => {
    const testName = 'en0';
    const testResults = [{
      address: "127.0.0.1",
      alive: true,
      hostname: "localhost"
    }];

    // @ts-ignore
    chalk.red.mockImplementation(() => {});

    test('should call nicsService.discoverLanHosts with a supplied name', async () => {
      // @ts-ignore
      nics.discoverLanHosts.mockImplementationOnce(() => testResults);

      await command.discoverLanHostsCommand(testName);

      expect(nics.discoverLanHosts).toBeCalledWith(testName);
    });

    test('should call nicsUtil.writePingResults to log the host results', async () => {
      // @ts-ignore
      nics.discoverLanHosts.mockImplementationOnce(() => testResults);
      // @ts-ignore
      nics.writePingResults.mockImplementationOnce(() => {});

      await command.discoverLanHostsCommand(testName);

      expect(nics.writePingResults).toBeCalledWith(testResults);
    });

    test('should catch the MissingNicError and exit', async () => {
      // @ts-ignore
      nics.discoverLanHosts.mockImplementationOnce(() => {
        throw new MissingNicError('error')
      });

      await command.discoverLanHostsCommand(testName);

      expect(chalk.red).toBeCalledTimes(2);
    });

    test('should catch the SourceIPError and exit', async () => {
      // @ts-ignore
      nics.discoverLanHosts.mockImplementationOnce(() => {
        throw new SourceIPError('error')
      });

      await command.discoverLanHostsCommand(testName);

      expect(chalk.red).toBeCalledTimes(2);
    });

    test('should catch other error types and exit', async () => {
      // @ts-ignore
      nics.discoverLanHosts.mockImplementation(() => {
        throw new Error('error')
      });

      await command.discoverLanHostsCommand(testName);

      expect(chalk.red).toBeCalledTimes(2);
    });
  });
});