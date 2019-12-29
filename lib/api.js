// axios is the request handler with defaults
const axios = require('axios').default

// axiosCookieJarSupport load the axios cookie jar support with defaults
const axiosCookieJarSupport = require('axios-cookiejar-support').default

// tough is the tough-cookie package
const tough = require('tough-cookie')

// axiosCookieJarSupport is applying support to axios
axiosCookieJarSupport(axios)

// cookieJar is the tough cookie jar
const cookieJar = new tough.CookieJar()

// inBrowser is a flag for detected how this package was loaded
const inBrowser = (typeof window !== 'undefined')

// browserError is an error message for if requested via a web browser
const browserError = 'cannot do this request in a web browser'

// apiEndpoint is the api endpoint
let apiEndpoint = 'http://localhost:3000/'
const cookieName = 'session_token'
const internalHeaderKey = 'x-user-session-token'

// version is the api version
const version = 'v1'

// defaultOptions are defaults for each request
let defaultOptions = { jar: cookieJar, withCredentials: true, headers: {} }

// for session cookie tracking
let apiSessionCookie = null
let userLastSessionCookie = null

// Before the request is made (set cookie if acting as user vs api)
axios.interceptors.request.use(function (config) {

  // Are we making a request with a custom session token?
  if (typeof config.headers[internalHeaderKey] !== 'undefined') {
    config.jar.setCookie('Cookie='+cookieName+'='+config.headers[internalHeaderKey]+'; Max-Age=172800; Path=/; HttpOnly;',config.url,function (err, cookies) {})
    config.headers[internalHeaderKey] = 'set'
  } else if (apiSessionCookie) {
    config.jar.setCookie(apiSessionCookie, config.url,function (err, cookies) {})
  }
  return config
}, function (e) {
  return Promise.reject(e)
})

// After the request is made (store the cookies based on user vs api)
axios.interceptors.response.use(function (response) {

  // Save the cookie for api or user
  response.config.jar.getCookies(response.config.url, {allPaths: true}, function (err, cookies) {
    if (cookies.length > 0) {
      for (let i = 0; i < cookies.length; i++) {
        if (cookies[i].key === cookieName) {
          if (typeof response.config.headers[internalHeaderKey] === 'undefined') {
            apiSessionCookie = cookies[i]
          } else {
            userLastSessionCookie = cookies[i]
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

// createSession will attempt to create a new session
async function createSession(key) {
  if (inBrowser) {
    throw Error(browserError)
  }

  return axios.post(apiEndpoint + version + '/auth/session', {api_key:key}, defaultOptions)
}

// prolongSession will attempt to prolong a current session
async function prolongSession(userSessionToken) {
  if (inBrowser) {
    throw Error(browserError)
  }

  // If we have a token use it
  if (userSessionToken && userSessionToken.length > 0) {
    defaultOptions.headers[internalHeaderKey] = userSessionToken
  }

  return axios.get(apiEndpoint + version + '/auth/session', defaultOptions)
}

// loginUser will attempt to login a user
// on success this will store the session token in userSessionToken
async function loginUser(email, password) {
  if (inBrowser) {
    throw Error(browserError)
  }

  // Previous api session cookie is required
  if (!apiSessionCookie) {
    throw Error('api session must be loaded first')
  }

  // Use the API token as the user token (returning token will be the user token)
  defaultOptions.headers[internalHeaderKey] = apiSessionCookie.value

  return axios.post(apiEndpoint + version + '/users/login', {email: email, password: password}, defaultOptions)
}

// currentUser will attempt get the profile for the current user
async function currentUser(userSessionToken) {
  if (inBrowser) {
    throw Error(browserError)
  }

  // Missing token
  if (!userSessionToken || userSessionToken.length === 0) {
    throw Error('user session must be set')
  }

  // set the header
  defaultOptions.headers[internalHeaderKey] = userSessionToken

  return axios.get(apiEndpoint + version + '/users/account', defaultOptions)
}

// Export the modules / variables / methods
module.exports = {
  apiKey: '',
  userSessionToken: '',
  load: async function(apiKey){
    this.apiKey = apiKey
    return new Promise(async(resolve, reject) => {
      try {
        await createSession(this.apiKey);
        resolve({success: 'session created'})
      } catch(e){
        reject({ error: 'failed creating session: '+e.message })
      }
    })
  },
  prolong: async function(userSessionToken){
    return new Promise(async(resolve, reject) => {
      try {
        await prolongSession(userSessionToken);
        if (userSessionToken && userSessionToken.length > 0) {
          this.userSessionToken = userLastSessionCookie.value
        }
        resolve({success: 'session prolonged'})
      } catch(e){
        reject({ error: 'failed prolonging session: '+e.message })
      }
    })
  },
  loginUser: async function(email, password){
    return new Promise(async(resolve, reject) => {
      try {
        await loginUser(email, password);
        this.userSessionToken = userLastSessionCookie.value
        resolve({success: 'login success'})
      } catch(e){
        reject({ error: 'failed login: '+e.message })
      }
    })
  },
  currentUser: async function(userSessionToken){
    return new Promise(async(resolve, reject) => {
      try {
        let response = await currentUser(userSessionToken)
        this.userSessionToken = userLastSessionCookie.value
        resolve(response.data)
      } catch(e){
        reject({ error: 'failed current user: '+e.message })
      }
    })
  },
}
