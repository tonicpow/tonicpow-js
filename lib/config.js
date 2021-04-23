// Config for the API instance, environment, url, etc
export default class Config {
  constructor(apiKey, options) {
    // List of supported environments for the TonicPow API
    this.environments = {
      Live: {
        name: 'live',
        url: 'https://api.tonicpow.com/',
      },
      Local: {
        name: 'local',
        url: 'http://localhost:3000/',
      },
      Mock: {
        name: 'mock',
        url: 'http://d9116720-5ac6-4c7f-a370-4ea578c63a66.mock.pstmn.io',
      },
      Staging: {
        name: 'staging',
        url: 'https://api.staging.tonicpow.com/',
      },
    };

    this.apiKey = apiKey;

    // Load any options that are set
    if (options) {
      if (options.hasOwnProperty('environment')) {
        this.environment = options.environment;
      }
    }

    // Default ENV
    if (!this.environment) {
      this.environment = this.environments.Live.name;
    }
  }

  // Our internal API key for creating a new session
  get apiKey() {
    return this._apiKey;
  }

  set apiKey(value) {
    if (!value || value.length < 30) {
      // console.error('invalid api key',value)
      throw Error('invalid api key');
    }
    this._apiKey = value;
  }

  // The current api url that this application is using
  get apiUrl() {
    return this._apiUrl;
  }

  set apiUrl(value) {
    if (
      value !== this.environments.Live.url
      && value !== this.environments.Local.url
      && value !== this.environments.Mock.url
      && value !== this.environments.Staging.url
    ) {
      // console.error('invalid api url', value)
      // this._apiUrl = this.environments.Live.url
      throw Error('invalid api url');
    }
    this._apiUrl = value;
  }

  // The current environment that this application is using
  get environment() {
    return this._environment;
  }

  set environment(value) {
    if (typeof value === 'object') {
      value = value.name;
    } else if (typeof value === 'string') {
      value = value.toLowerCase();
    }
    if (value === this.environments.Local.name) {
      this.apiUrl = this.environments.Local.url;
    } else if (value === this.environments.Staging.name) {
      this.apiUrl = this.environments.Staging.url;
    } else if (value === this.environments.Mock.name) {
      this.apiUrl = this.environments.Mock.url;
    } else if (value === this.environments.Live.name) {
      this.apiUrl = this.environments.Live.url;
    } else {
      // console.error('invalid environment', value)
      // this.apiUrl = this.environments.Live.url
      throw Error('invalid environment');
    }
    this._environment = value;
  }
}
