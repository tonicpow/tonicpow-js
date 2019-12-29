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
  if (environment === 'live' || environment === 'production') {
    return apiUrlLive
  } else if (environment === 'staging') {
    return apiUrlStaging
  }
  return apiUrlLocal
}

// This wraps axios for cookie management for API vs User session token
function wrapAxios(t) {
  axios.interceptors.request.use(function (config) {

    // Are we making a request with a custom session token?
    if (typeof config.headers[internalHeaderKey] !== 'undefined') {
      config.jar.setCookie('Cookie='+cookieName+'='+config.headers[internalHeaderKey]+'; Max-Age=172800; Path=/; HttpOnly;',config.url,function (err, cookies) {})
      config.headers[internalHeaderKey] = 'set'
    } else if (t.apiCookie) {
      config.jar.setCookie(t.apiCookie, config.url,function (err, cookies) {})
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
              t.apiCookie = cookies[i]
            } else {
              t.userCookie = cookies[i]
              t.UserSessionToken = cookies[i].value
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
async function loginUser(email, password, apiUrl, apiCookie) {
  blockBrowser()
  return axios.post(apiUrl + version + '/users/login', {email: email, password: password}, getOptions(apiCookie.value))
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
  apiCookie: null,
  apiKey: '',
  apiUrl: '',
  loaded: false,
  userCookie: null,
  UserSessionToken: '',
  isLoaded: function (){
    if (!this.loaded) {
      throw Error('TonicPow.Load() should be run first')
    }
  },
  Load: async function(apiKey, environment){
    this.apiKey = apiKey
    this.apiUrl = setApiUrl(environment)
    if(!this.loaded){
      wrapAxios(this)
      this.loaded = true
    }
    return new Promise(async(resolve, reject) => {
      try {
        await createSession(this.apiKey, this.apiUrl);
        resolve({success: 'session created'})
      } catch(e){
        if (typeof e.response.data !== 'undefined') {
          reject(e.response.data)
        }
        reject(e.message)
      }
    })
  },
  ProlongSession: async function(userSessionToken){
    return new Promise(async(resolve, reject) => {
      try {
        this.isLoaded()
        await prolongSession(userSessionToken, this.apiUrl);
        resolve({success: 'session prolonged'})
      } catch(e){
        if (typeof e.response.data !== 'undefined') {
          reject(e.response.data)
        }
        reject(e.message)
      }
    })
  },
  LoginUser: async function(email, password){
    return new Promise(async(resolve, reject) => {
      try {
        this.isLoaded()
        await loginUser(email, password, this.apiUrl, this.apiCookie);
        resolve({success: 'login success'})
      } catch(e){
        if (typeof e.response.data !== 'undefined') {
          reject(e.response.data)
        }
        reject(e.message)
      }
    })
  },
  CurrentUser: async function(userSessionToken){
    return new Promise(async(resolve, reject) => {
      try {
        this.isLoaded()
        let response = await currentUser(userSessionToken, this.apiUrl)
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
