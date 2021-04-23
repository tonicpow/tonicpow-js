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

  test('check visitor session parsing', function () {
    tonicPow.session.visitorSession = 'not-valid';
    expect(tonicPow.session.visitorSession).toBe(null);

    tonicPow.session.visitorSession = 'ebb5e0084ee4e7521d95d915b71d4f546437d197ca06c2a2994ae76053c8598z';
    expect(tonicPow.session.visitorSession).toBe('ebb5e0084ee4e7521d95d915b71d4f546437d197ca06c2a2994ae76053c8598z');

    tonicPow.session.visitorSession = '__cfduid=dd6545b872516b240cb6185c97; _ga=GA1.2.741780225.1580598550; _gid=GA1.2.510252994.1580598550;  tncpw_session=826d23410c230dc1a3c49b0a3b91ed52bc1096fbc6718aafa4809c967c5ac9bc\n';
    expect(tonicPow.session.visitorSession).toBe('826d23410c230dc1a3c49b0a3b91ed52bc1096fbc6718aafa4809c967c5ac9bc');
  });

  test('missing api key', async () => {
    expect(() => {
      const tp = new TonicPow('');
    }).toThrow('invalid api key');
  });
});
