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
      expect(e.message).to.equal('authentication failed')
    }
  })

  it('invalid environment', async () => {
    try {
      const result = await TonicPow.init('57d85ad0e7622eff250c9b8619b4de7f',{environment: 'bad-env'})
    } catch (e) {
      expect(e.message).to.equal('invalid environment')
    }
  })

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
  })
})
