// Load axios, cookie jar support, and tough-cookie dependencies
// axiosCookieJarSupport is applying support to axios for cookie jar management
const axios = require('axios').default
const axiosCookieJarSupport = require('axios-cookiejar-support').default
const tough = require('tough-cookie')
axiosCookieJarSupport(axios)
const cookieJar = new tough.CookieJar()

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
  if (typeof window !== 'undefined') {
    throw Error('cannot do this request in a web browser')
  }
}

// extractSessionTokenFromHeader will extract a session token from a cookie header value
//
// Example `cookieHeader` Value: 'Cookie: session_token=this-is-the-session-token-value-getting-extracted; another_cookie=value; third_cookie=value'
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

// Config for the API instance, environment, url, etc
let config = {
  environments :{
    Live: {name: 'live', url: 'https://api.tonicpow.com/'},
    Local: {name: 'local', url: 'http://localhost:3000/'},
    Mock: {name: 'mock', url: 'http://d9116720-5ac6-4c7f-a370-4ea578c63a66.mock.pstmn.io'},
    Staging: {name: 'staging', url: 'https://apistaging.tonicpow.com/'},
  },

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
    if(value !== this.environments.Live.url && value !== this.environments.Local.url && value !== this.environments.Mock.url && value !== this.environments.Staging.url){
      throw Error('invalid api url')
    }
    this._apiUrl = value
  },

  get environment() {
    return this._environment
  },

  set environment(value) {
    if (typeof value === 'object'){
      value = value.name
    }
    if (value === this.environments.Local.name) {
      this._apiUrl = this.environments.Local.url
    } else if (value === this.environments.Staging.name) {
      this._apiUrl = this.environments.Staging.url
    } else if (value === this.environments.Mock.name) {
      this._apiUrl = this.environments.Mock.url
    } else if (value === this.environments.Live.name) {
      this._apiUrl = this.environments.Live.url
    } else {
      throw Error('invalid environment')
    }
    this._environment = value
  }
}

// Session has our API session token values
let session = {

  get userToken() {
    return this._userToken
  },

  set userToken(value) {
    // This can handle taking a raw cookie header
    if (value && (value.indexOf(':') !== -1 || value.indexOf(';') !== -1)){
      value = extractSessionTokenFromHeader(value)
    }

    // It will only set the value if it's not empty
    if (value && value.length > 0) {
      if (value !== "delete") { // For safely removing the token
        this._userToken = value
      } else {
        this._userToken = null
      }
    }
  },

  get apiToken() {
    return this._apiToken
  },

  set apiToken(value) {
    // This can handle taking a raw cookie header
    if (value && (value.indexOf(':') !== -1 || value.indexOf(';') !== -1)){
      value = extractSessionTokenFromHeader(value)
    }

    // It will only set the value if it's not empty
    if (value && value.length > 0) {
      if (value !== "delete") { // For safely removing the token
        this._apiToken = value
      } else {
        this._apiToken = null
      }
    }
  }
}

// This wraps axios for cookie management for API vs User session token
function wrapAxios(t) {

  // Skip if already loaded
  if(t.loaded){
    return
  }

  // Modify the request before sending (cookie management)
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

  // Modify the response after sending (cookie management)
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
      } else { // Cookie was removed (endSession, logoutUser)
        if (typeof response.config.headers[internalHeaderKey] !== 'undefined') {
          if (response.config.headers[internalHeaderKey] === t.session.userToken) {
            t.session.userToken = 'delete'
          }
        } else {
          t.session.apiToken = 'delete'
        }
      }
    })

    return response
  }, function (e) {
    return Promise.reject(e)
  })

  // Flag that we loaded the interceptors
  t.loaded = true
}

//
// TonicPow API Requests
// =====================================================================================================================
//

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

// logoutUser will end the user session, if no session token set it will use the session.userToken
//
// For more information: https://docs.tonicpow.com/#39d65294-376a-4366-8f71-a02b08f9abdf
async function logoutUser(t, userSessionToken) {

  // Missing token or empty token
  if (!userSessionToken || userSessionToken.length < 1) {
    throw Error('user session must be set')
  }

  return axios.delete(t.config.apiUrl + version + '/users/logout', getOptions(userSessionToken))
}

// currentUser will attempt get the profile for the current user or userSessionToken
//
// For more information: https://docs.tonicpow.com/#7f6e9b5d-8c7f-4afc-8e07-7aafdd891521
async function currentUser(t, userSessionToken) {

  // Missing token or empty token
  if (!userSessionToken || userSessionToken.length < 1) {
    throw Error('user session must be set')
  }

  return axios.get(t.config.apiUrl + version + '/users/account', getOptions(userSessionToken))
}

// getUserBalance will first update a given user's balance from the chain and then return the user info
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

// createUser will create a new user given the attributes
//
// For more information: https://docs.tonicpow.com/#8de84fb5-ba77-42cc-abb0-f3044cc871b6
async function createUser(t, user) {

  // Missing email
  if (!user || user.email.length < 1) {
    throw Error('email is required')
  }

  return axios.post(t.config.apiUrl + version + '/users', user, getOptions())
}

//
// Export TonicPow JS
// =====================================================================================================================
//

// Export the modules / variables / methods
module.exports = {
  config: config,
  loaded: false,
  session: session,
  init: async function(apiKey, environment, customSessionToken){
    config.apiKey = apiKey
    config.environment = environment
    wrapAxios(this)
    return new Promise(async(resolve, reject) => {
      try {
        blockBrowser()
        if (session.apiToken || (typeof customSessionToken === 'string' && customSessionToken.length > 0)) {
          this.session.apiToken = customSessionToken
          await prolongSession(this, this.session.apiToken)
        } else {
          await createSession(this)
        }
        resolve({success: this.config.environment+' api loaded'})
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
  createUser: async function(user){
    return new Promise(async(resolve, reject) => {
      try {
        blockBrowser(this.initRequired())
        let response = await createUser(this, user)
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
