let chai = require('chai');
let expect = chai.expect;
let assert = chai.assert;

let TonicPow = require('../lib/api')

// Set the API key from our local environment
let apiKey = process.env.TONICPOW_API_KEY || ''

describe('basic tests', function() {
  beforeEach(function() {
    TonicPow.loaded = false
  });

  it('loaded should be false', function() {
    assert.equal(TonicPow.loaded, false)
  })

  it('url should be empty', function() {
    assert.equal(TonicPow.config.apiUrl, undefined)
  })

  it('environment should be empty', function() {
    assert.equal(TonicPow.config.environment, undefined)
  })

  it('api key should be empty', function() {
    assert.equal(TonicPow.config.apiKey, undefined)
  })

  it('check environment names', function() {
    assert.equal(TonicPow.config.environments.Live.name, 'live')
    assert.equal(TonicPow.config.environments.Local.name, 'local')
    assert.equal(TonicPow.config.environments.Mock.name, 'mock')
    assert.equal(TonicPow.config.environments.Staging.name, 'staging')
  })

  it('check visitor session parsing', function() {
    TonicPow.session.visitorSession = 'not-valid'
    assert.equal(TonicPow.session.visitorSession, null)

    TonicPow.session.visitorSession = 'ebb5e0084ee4e7521d95d915b71d4f546437d197ca06c2a2994ae76053c8598z'
    assert.equal(TonicPow.session.visitorSession, 'ebb5e0084ee4e7521d95d915b71d4f546437d197ca06c2a2994ae76053c8598z')

    TonicPow.session.visitorSession = '__cfduid=dd6545b872516b240cb6185c97; _ga=GA1.2.741780225.1580598550; _gid=GA1.2.510252994.1580598550;  tncpw_session=826d23410c230dc1a3c49b0a3b91ed52bc1096fbc6718aafa4809c967c5ac9bc\n'
    assert.equal(TonicPow.session.visitorSession, '826d23410c230dc1a3c49b0a3b91ed52bc1096fbc6718aafa4809c967c5ac9bc')
  })

  it('missing api key', async () => {
    try {
      await TonicPow.init('',{environment: TonicPow.config.environments.Local.name})
    } catch (e) {
      expect(e.message).to.equal('invalid api key')
    }
  })

  it('authentication failed', async () => {
    try {
      await TonicPow.init('57d85ad0e7622eff250c9b8619b4de7f',{environment: TonicPow.config.environments.Local.name})
    } catch (e) {
      //todo: flags for unit vs integration teste is needed
      if (e.indexOf("connect ECONNREFUSED") === -1) {
        expect(e.message).to.equal('authentication failed')
      }
    }
  })

  it('invalid environment', async () => {
    try {
      const result = await TonicPow.init('57d85ad0e7622eff250c9b8619b4de7f',{environment: 'bad-env'})
    } catch (e) {
      expect(e.message).to.equal('invalid environment')
    }
  })

  // todo: break apart unit vs integration tests
  // create a tonicpow mock interface
  /*
  it('valid api key', async () => {
    expect(apiKey).to.be.a('string');
    expect(apiKey).to.have.lengthOf.above(10);
    const result = await TonicPow.init(apiKey,{environment: TonicPow.config.environments.Local.name})
    expect(result.success).to.equal('local api loaded')
  })

  it('after init', async () => {
    expect(apiKey).to.be.a('string');
    expect(apiKey).to.have.lengthOf.above(10);
    const result = await TonicPow.init(apiKey,{environment: TonicPow.config.environments.Local.name})
    expect(result.success).to.equal('local api loaded')
    expect(TonicPow.config.apiKey).to.equal(apiKey)
    expect(TonicPow.config.environment).to.equal(TonicPow.config.environments.Local.name)
    expect(TonicPow.session.apiToken).to.be.a('string');
    expect(TonicPow.session.apiToken).to.have.lengthOf.above(10);
    expect(TonicPow.loaded).to.eq(true)
  })*/
})
