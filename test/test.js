import {
  describe,
  expect,
  beforeEach,
  afterEach,
  test,
} from '@jest/globals';
import TonicPow from '../lib/api';

let tonicPow = '';
const fakeApiKey = '678d769317973b3802a89dc1b0ff3e8d';
describe('basic tests', function () {
  beforeEach(function () {
    tonicPow = new TonicPow(fakeApiKey);
  });

  test('url is set on init', function () {
    expect(tonicPow.config.apiUrl).toBe('https://api.tonicpow.com/');
  });

  test('environment is set on init', function () {
    expect(tonicPow.config.environment).toBe('live');
  });

  test('api is set on init', function () {
    expect(tonicPow.config.apiKey).toBe(fakeApiKey);
  });

  test('check environment names', function () {
    expect(tonicPow.config.environments.Live.name).toBe('live');
    expect(tonicPow.config.environments.Local.name).toBe('local');
    expect(tonicPow.config.environments.Mock.name).toBe('mock');
    expect(tonicPow.config.environments.Staging.name).toBe('staging');
  });

  test('missing api key', async () => {
    expect(() => {
      const tp = new TonicPow('');
    }).toThrow('invalid api key');
  });
});
