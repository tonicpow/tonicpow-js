// Load axios, cookie jar support, and tough-cookie dependencies
// axiosCookieJarSupport is applying support to axios for cookie jar management
const axios = require('axios').default
const axiosCookieJarSupport = require('axios-cookiejar-support').default
const tough = require('tough-cookie')
axiosCookieJarSupport(axios)
const cookieJar = new tough.CookieJar()

// inBrowser is a flag for detected how this package was loaded
// this is a safety mechanism (todo: this is only needed if it can be run both front/backend versions)
const inBrowser = (typeof window !== 'undefined')
const browserError = 'cannot do this request in a web browser'

// API Urls (based on environment)
const apiUrlLocal = 'http://localhost:3000/'
const apiUrlLive = 'https://api.tonicpow.com/'
const apiUrlStaging = 'https://apistaging.tonicpow.com/'

// Cookie and session names
const cookieName = 'session_token'
const internalHeaderKey = 'x-user-session-token'
const version = 'v1'

// getOptions is a factory for axios default options
function getOptions(useCustomSessionToken) {
  let defaultOptions = { jar: cookieJar, withCredentials: true, headers: {} }
  if (useCustomSessionToken && useCustomSessionToken.length > 0) {
    defaultOptions.headers[internalHeaderKey] = useCustomSessionToken
  }
  return defaultOptions
}

// blockBrowser will block request from firing if loaded in web browser
function blockBrowser(){
  if (inBrowser) {
    throw Error(browserError)
  }
}

// setApiUrl will set the url based on environment
function setApiUrl(environment) {
  if (environment === 'local' || environment === 'development') {
    return apiUrlLocal
  } else if (environment === 'staging') {
    return apiUrlStaging
  }
  return apiUrlLive
}

// This wraps axios for cookie management for API vs User session token
function wrapAxios(t) {
  axios.interceptors.request.use(function (config) {

    // Are we making a request with a custom session token?
    if (typeof config.headers[internalHeaderKey] !== 'undefined') {
      config.jar.setCookie('Cookie='+cookieName+'='+config.headers[internalHeaderKey]+'; Max-Age=172800; Path=/; HttpOnly;',config.url,function (err, cookies) {})
      config.headers[internalHeaderKey] = 'set'
    } else if (t.session.apiCookie) {
      config.jar.setCookie(t.session.apiCookie, config.url,function (err, cookies) {})
    }
    return config
  }, function (e) {
    return Promise.reject(e)
  })

  axios.interceptors.response.use(function (response) {

    // Save the cookie for api or user
    response.config.jar.getCookies(response.config.url, {allPaths: true}, function (err, cookies) {
      if (cookies.length > 0) {
        for (let i = 0; i < cookies.length; i++) {
          if (cookies[i].key === cookieName) {
            if (typeof response.config.headers[internalHeaderKey] === 'undefined') {
              t.session.apiCookie = cookies[i]
              t.session.apiToken = cookies[i].value
            } else {
              t.session.userCookie = cookies[i]
              t.session.userToken = cookies[i].value
            }
            break
          }
        }
      }
    })

    return response
  }, function (e) {
    return Promise.reject(e)
  })
}

// extractSessionTokenFromHeader will extract a session token from a cookie
function extractSessionTokenFromHeader(cookieHeader) {
  if (!cookieHeader || cookieHeader.length < 10) {
    return ''
  }
  let list = {}
  cookieHeader = cookieHeader.replace('Cookie:','')
  cookieHeader.split(';').forEach(function( cookie ) {
    let parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  if (typeof list[cookieName] === 'undefined'){
    return ''
  }
  return list[cookieName]
}

// Session has our API and User cookies/tokens
let session = {

  get userToken() {
    return this._userToken;
  },

  set userToken(value) {
    if (value && (value.indexOf(':') !== -1 || value.indexOf(';') !== -1)){
      value = extractSessionTokenFromHeader(value)
    }
    this._userToken = value;
  },

  get userCookie() {
    return this._userCookie;
  },

  set userCookie(value) {
    this._userCookie = value;
  },

  get apiToken() {
    return this._apiToken;
  },

  set apiToken(value) {
    if (value && (value.indexOf(':') !== -1 || value.indexOf(';') !== -1)){
      value = extractSessionTokenFromHeader(value)
    }
    this._apiToken = value;
  },

  get apiCookie() {
    return this._apiCookie;
  },

  set apiCookie(value) {
    this._apiCookie = value;
  }
}

// Config for the API instance
let config = {
  get apiKey() {
    return this._apiKey;
  },

  set apiKey(value) {
    if(!value || value.length < 10){
      throw Error('invalid api key')
    }
    this._apiKey = value;
  },

  get apiUrl() {
    return this._apiUrl
  },

  set apiUrl(value) {
    if(value !== apiUrlLive && value !== apiUrlLocal && value !== apiUrlStaging){
      throw Error('invalid api url')
    }
    this._apiUrl = value;
  }
}

// createSession will attempt to create a new api session
//
// For more information: https://docs.tonicpow.com/#632ed94a-3afd-4323-af91-bdf307a399d2
async function createSession(key, apiUrl) {
  blockBrowser()
  return axios.post(apiUrl + version + '/auth/session', {api_key:key}, getOptions())
}

// prolongSession will attempt to prolong a session (either the user or api)
//
// For more information: https://docs.tonicpow.com/#632ed94a-3afd-4323-af91-bdf307a399d2
async function prolongSession(userSessionToken, apiUrl) {
  blockBrowser()
  return axios.get(apiUrl + version + '/auth/session', getOptions(userSessionToken))
}

// loginUser will attempt to login a user
//
// For more information: https://docs.tonicpow.com/#5cad3e9a-5931-44bf-b110-4c4b74c7a070
async function loginUser(email, password, apiUrl, apiToken) {
  blockBrowser()
  return axios.post(apiUrl + version + '/users/login', {email: email, password: password}, getOptions(apiToken))
}

// currentUser will attempt get the profile for the current user
//
// For more information: https://docs.tonicpow.com/#7f6e9b5d-8c7f-4afc-8e07-7aafdd891521
async function currentUser(userSessionToken, apiUrl) {
  blockBrowser()

  // Missing token
  if (!userSessionToken || userSessionToken.length === 0) {
    throw Error('user session must be set')
  }

  return axios.get(apiUrl + version + '/users/account', getOptions(userSessionToken))
}

// Export the modules / variables / methods
module.exports = {
  config: config,
  loaded: false,
  session: session,
  initRequired: function (){
    if (!this.loaded) {
      throw Error('TonicPow.init() should be run first')
    }
  },
  init: async function(apiKey, environment){
    config.apiKey = apiKey
    config.apiUrl = setApiUrl(environment)
    if(!this.loaded){
      wrapAxios(this)
      this.loaded = true
    }
    return new Promise(async(resolve, reject) => {
      try {
        if (session.apiToken) {
          await prolongSession('', config.apiUrl);
          resolve({success: 'session prolonged'})
        } else {
          await createSession(config.apiKey, config.apiUrl);
          resolve({success: 'session created'})
        }
      } catch(e){
        if (typeof e.response.data !== 'undefined') {
          reject(e.response.data)
        }
        reject(e.message)
      }
    })
  },
  prolongSession: async function(userSessionToken){
    return new Promise(async(resolve, reject) => {
      try {
        this.initRequired()
        await prolongSession(userSessionToken, config.apiUrl);
        resolve({success: 'session prolonged'})
      } catch(e){
        if (typeof e.response.data !== 'undefined') {
          reject(e.response.data)
        }
        reject(e.message)
      }
    })
  },
  loginUser: async function(email, password){
    return new Promise(async(resolve, reject) => {
      try {
        this.initRequired()
        await loginUser(email, password, config.apiUrl, this.session.apiToken);
        resolve({success: 'login success'})
      } catch(e){
        if (typeof e.response.data !== 'undefined') {
          reject(e.response.data)
        }
        reject(e.message)
      }
    })
  },
  currentUser: async function(userSessionToken){
    return new Promise(async(resolve, reject) => {
      try {
        this.initRequired()
        let response = await currentUser(userSessionToken, config.apiUrl)
        resolve(response.data)
      } catch(e){
        if (typeof e.response.data !== 'undefined') {
          reject(e.response.data)
        }
        reject(e.message)
      }
    })
  },
}
