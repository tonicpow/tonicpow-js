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
const apiUrlLive = 'https://api.tonicpow.com/'
const apiUrlLocal = 'http://localhost:3000/'
const apiUrlMock = 'http://d9116720-5ac6-4c7f-a370-4ea578c63a66.mock.pstmn.io'
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

// This wraps axios for cookie management for API vs User session token
function wrapAxios(t) {
  axios.interceptors.request.use(function (config) {

    // Are we making a request with a custom session token?
    if (typeof config.headers[internalHeaderKey] !== 'undefined') {
      config.jar.setCookie(cookieName+'='+config.headers[internalHeaderKey]+'; Max-Age=172800; Path=/; HttpOnly;',config.url,function (err, cookies) {})
      config.headers[internalHeaderKey] = 'set'
    } else if (t.session.apiToken) {
      config.jar.setCookie(cookieName+'='+t.session.apiToken+'; Max-Age=172800; Path=/; HttpOnly;',config.url,function (err, cookies) {})
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

            // Set the user cookie if header was set
            if (typeof response.config.headers[internalHeaderKey] !== 'undefined') {

              // If we don't have an api cookie, then this is for the api
              if (t.session.apiToken) {
                t.session.userToken = cookies[i].value
              } else {
                t.session.apiToken = cookies[i].value
              }
            } else {
              t.session.apiToken = cookies[i].value
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
    return cookieHeader
  }
  let list = {}
  cookieHeader = cookieHeader.replace('Cookie:','')
  cookieHeader.split(';').forEach(function( cookie ) {
    let parts = cookie.split('=')
    list[parts.shift().trim()] = decodeURI(parts.join('='))
  })
  if (typeof list[cookieName] === 'undefined'){
    return cookieHeader
  }
  return list[cookieName]
}

// Config for the API instance, environment
let config = {
  get apiKey() {
    return this._apiKey
  },

  set apiKey(value) {
    if(!value || value.length < 10){
      throw Error('invalid api key')
    }
    this._apiKey = value
  },

  get apiUrl() {
    return this._apiUrl
  },

  set apiUrl(value) {
    if(value !== apiUrlLive && value !== apiUrlLocal && value !== apiUrlStaging && value !== apiUrlMock){
      throw Error('invalid api url')
    }
    this._apiUrl = value
  },

  get environment() {
    return this._environment
  },

  set environment(value) {
    if (!value || value.length < 4) {
      throw Error('invalid environment')
    }
    if (value === 'local' || value === 'development') {
      this._apiUrl = apiUrlLocal
    } else if (value === 'staging') {
      this._apiUrl = apiUrlStaging
    } else if (value === 'mock') {
      this._apiUrl = apiUrlMock
    } else if (value === 'live' || value === 'production') {
      this._apiUrl = apiUrlLive
    } else {
      throw Error('invalid environment')
    }
    this._environment = value
  }
}

// Session has our API and User cookies/tokens
let session = {

  get userToken() {
    return this._userToken
  },

  set userToken(value) {
    if (value && (value.indexOf(':') !== -1 || value.indexOf(';') !== -1)){
      value = extractSessionTokenFromHeader(value)
    }
    if (value && value.length > 0) {
      this._userToken = value
    }
  },

  get apiToken() {
    return this._apiToken
  },

  set apiToken(value) {
    if (value && (value.indexOf(':') !== -1 || value.indexOf(';') !== -1)){
      value = extractSessionTokenFromHeader(value)
    }
    if (value && value.length > 0) {
      this._apiToken = value
    }
  }
}

// createSession will attempt to create a new api session
//
// For more information: https://docs.tonicpow.com/#632ed94a-3afd-4323-af91-bdf307a399d2
async function createSession(t) {
  return axios.post(t.config.apiUrl + version + '/auth/session', {api_key: t.config.apiKey}, getOptions())
}

// prolongSession will attempt to prolong a session (either the user or api)
//
// For more information: https://docs.tonicpow.com/#632ed94a-3afd-4323-af91-bdf307a399d2
async function prolongSession(t, userSessionToken) {
  return axios.get(t.config.apiUrl + version + '/auth/session', getOptions(userSessionToken))
}

// endSession will end the given session token or the api token if none is given
//
// For more information: https://docs.tonicpow.com/#1dfeff1e-6c8d-4b32-904e-a19261b1f89e
async function endSession(t, userSessionToken) {
  return axios.delete(t.config.apiUrl + version + '/auth/session', getOptions(userSessionToken))
}

// loginUser will attempt to login a user
//
// For more information: https://docs.tonicpow.com/#5cad3e9a-5931-44bf-b110-4c4b74c7a070
async function loginUser(t, email, password) {
  return axios.post(t.config.apiUrl + version + '/users/login', {email: email, password: password}, getOptions(t.session.apiToken))
}

// logoutUser will end the user session token
//
// For more information: https://docs.tonicpow.com/#39d65294-376a-4366-8f71-a02b08f9abdf
async function logoutUser(t, userSessionToken) {

  // Missing token or empty token
  if (!userSessionToken || userSessionToken.length < 1) {
    throw Error('user session must be set')
  }

  return axios.delete(t.config.apiUrl + version + '/users/logout', getOptions(userSessionToken))
}

// currentUser will attempt get the profile for the current user
//
// For more information: https://docs.tonicpow.com/#7f6e9b5d-8c7f-4afc-8e07-7aafdd891521
async function currentUser(t, userSessionToken) {

  // Missing token or empty token
  if (!userSessionToken || userSessionToken.length < 1) {
    throw Error('user session must be set')
  }

  return axios.get(t.config.apiUrl + version + '/users/account', getOptions(userSessionToken))
}

// getUserBalance will update a given user's balance from the chain
//
// For more information: https://docs.tonicpow.com/#8478765b-95b8-47ad-8b86-2db5bce54924
async function getUserBalance(t, userId) {
  return axios.get(t.config.apiUrl + version + '/users/balance/'+userId, getOptions())
}

// getUser will get a user by ID or email address
//
// For more information: https://docs.tonicpow.com/#e6f764a2-5a91-4680-aa5e-03409dd878d8
async function getUser(t, userId, email) {
  let url = t.config.apiUrl + version + '/users/details?'

  if (userId && userId > 0) {
    url += 'id='+userId
  } else {
    url += 'email='+email
  }

  return axios.get(url, getOptions())
}

// Export the modules / variables / methods
module.exports = {
  config: config,
  loaded: false,
  session: session,
  init: async function(apiKey, environment, customSessionToken){
    config.apiKey = apiKey
    config.environment = environment
    if(!this.loaded){
      wrapAxios(this)
      this.loaded = true
    }
    return new Promise(async(resolve, reject) => {
      try {
        blockBrowser()
        if (session.apiToken || (typeof customSessionToken === 'string' && customSessionToken.length > 0)) {
          this.session.apiToken = customSessionToken
          await prolongSession(this, this.session.apiToken)
        } else {
          await createSession(this)
        }
        resolve({success: 'api loaded'})
      } catch(e){
        if (typeof e.response !== 'undefined') {
          reject(e.response.data)
        }
        reject(e.message)
      }
    })
  },
  initRequired: function (){
    if (!this.loaded) {
      throw Error('init() should be run first')
    }
  },
  prolongSession: async function(customSessionToken){
    return new Promise(async(resolve, reject) => {
      try {
        blockBrowser(this.initRequired())
        await prolongSession(this, extractSessionTokenFromHeader(customSessionToken))
        resolve({success: 'session prolonged'})
      } catch(e){
        if (typeof e.response !== 'undefined') {
          reject(e.response.data)
        }
        reject(e.message)
      }
    })
  },
  endSession: async function(customSessionToken){
    return new Promise(async(resolve, reject) => {
      try {
        blockBrowser(this.initRequired())
        this.session.apiToken = customSessionToken
        await endSession(this, this.session.apiToken)
        resolve({success: 'session ended'})
      } catch(e){
        if (typeof e.response !== 'undefined') {
          reject(e.response.data)
        }
        reject(e.message)
      }
    })
  },
  loginUser: async function(email, password){
    return new Promise(async(resolve, reject) => {
      try {
        blockBrowser(this.initRequired())
        await loginUser(this, email, password)
        resolve({success: 'user logged in'})
      } catch(e){
        if (typeof e.response !== 'undefined') {
          reject(e.response.data)
        }
        reject(e.message)
      }
    })
  },
  logoutUser: async function(userSessionToken){
    return new Promise(async(resolve, reject) => {
      try {
        blockBrowser(this.initRequired())
        this.session.userToken = userSessionToken
        await logoutUser(this, this.session.userToken)
        resolve({success: 'user logged out'})
      } catch(e){
        if (typeof e.response !== 'undefined') {
          reject(e.response.data)
        }
        reject(e.message)
      }
    })
  },
  currentUser: async function(userSessionToken){
    return new Promise(async(resolve, reject) => {
      try {
        blockBrowser(this.initRequired())
        this.session.userToken = userSessionToken
        let response = await currentUser(this, this.session.userToken)
        resolve(response.data)
      } catch(e){
        if (typeof e.response !== 'undefined') {
          reject(e.response.data)
        }
        reject(e.message)
      }
    })
  },
  getUser: async function(userId, email){
    return new Promise(async(resolve, reject) => {
      try {
        blockBrowser(this.initRequired())
        let response = await getUser(this, userId, email)
        resolve(response.data)
      } catch(e){
        if (typeof e.response !== 'undefined') {
          reject(e.response.data)
        }
        reject(e.message)
      }
    })
  },
  getUserBalance: async function(userId){
    return new Promise(async(resolve, reject) => {
      try {
        blockBrowser(this.initRequired())
        let response = await getUserBalance(this, userId)
        resolve(response.data)
      } catch(e){
        if (typeof e.response !== 'undefined') {
          reject(e.response.data)
        }
        reject(e.message)
      }
    })
  },
}
