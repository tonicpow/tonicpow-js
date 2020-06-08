// Load axios, cookie jar support, and tough-cookie dependencies
// axiosCookieJarSupport is applying support to axios for cookie jar management
const axios = require('axios') // .default (@mrz what does this affect?)
const tonicAxios = axios.create()
const axiosCookieJarSupport = require('axios-cookiejar-support').default
const tough = require('tough-cookie')
axiosCookieJarSupport(tonicAxios)
const cookieJar = new tough.CookieJar()

// From API requests (this is the cookie name that the API expects)
const apiCookieName = 'session_token'

// From API session cookie time (seconds) (48 hours)
const defaultMaxAge = 172800

// Used internally for communication from req=>resp in axios
const internalHeaderKey = 'x-user-session-token'

// From the short link service
const visitorSessionKey = 'tncpw_session'

// Current version for requests from the API
const pkgVersion = 'v0.1.74'
const apiVersion = 'v1'

// getOptions is a factory for axios default options
function getOptions (useCustomSessionToken = '') {
  let defaultOptions = { jar: cookieJar, withCredentials: true, headers: { 'User-Agent': 'tonicpow-js ' + pkgVersion } }
  if (useCustomSessionToken && useCustomSessionToken.length > 0) {
    defaultOptions.headers[internalHeaderKey] = useCustomSessionToken
  }
  return defaultOptions
}

// blockBrowser will block request from firing if loaded in web browser
function blockBrowser () {
  if (typeof window !== 'undefined') { throw Error('cannot do this request in a web browser') }
}

// initCheck is an error check if we've loaded
function initCheck (loaded) {
  if (!loaded) { throw Error('init() should be run first') }
}

// extractSessionTokenFromHeader will extract a session token from a cookie header value
//
// Example `cookieHeader` Value: 'Cookie: session_token=this-is-the-session-token-value-getting-extracted; another_cookie=value; third_cookie=value'
// Example `cookieHeader` Value: 'Set-Cookie: session_token=this-is-the-session-token-value-getting-extracted; path="/";'
function extractSessionTokenFromHeader (cookieHeader = '', cookieName = '') {
  // No header? pass what we got back
  if (!cookieHeader || cookieHeader.length < 10) {
    return cookieHeader
  }

  // No cookie name? use the default
  if (!cookieName || cookieName.length < 1) {
    cookieName = apiCookieName
  }

  // Replace any cookie prefixes, break them apart, trim spaces and decode
  let list = {}
  cookieHeader = cookieHeader.split('Set-Cookie:').join('')
  cookieHeader = cookieHeader.split('Cookie:').join('')
  cookieHeader.split(';').forEach(function (cookie) {
    let parts = cookie.split('=')
    list[parts.shift().trim()] = decodeURI(parts.join('='))
  })

  // If the cookie is NOT found, return the original value
  if (typeof list[cookieName] === 'undefined') {
    return cookieHeader
  }

  // Return the extracted value
  return list[cookieName].trim()
}

// Config for the API instance, environment, url, etc
let config = {

  // List of supported environments for the TonicPow API
  environments: {
    Live: { name: 'live', url: 'https://api.tonicpow.com/' },
    Local: { name: 'local', url: 'http://localhost:3000/' },
    Mock: { name: 'mock', url: 'http://d9116720-5ac6-4c7f-a370-4ea578c63a66.mock.pstmn.io' },
    Staging: { name: 'staging', url: 'https://api.staging.tonicpow.com/' }
  },

  // Our internal API key for creating a new session
  get apiKey () {
    return this._apiKey
  },

  set apiKey (value) {
    if (!value || value.length < 30) {
      // console.error('invalid api key',value)
      throw Error('invalid api key')
    }
    this._apiKey = value
  },

  // The current api url that this application is using
  get apiUrl () {
    return this._apiUrl
  },

  set apiUrl (value) {
    if (value !== this.environments.Live.url && value !== this.environments.Local.url && value !== this.environments.Mock.url && value !== this.environments.Staging.url) {
      // console.error('invalid api url', value)
      // this._apiUrl = this.environments.Live.url
      throw Error('invalid api url')
    }
    this._apiUrl = value
  },

  // The current environment that this application is using
  get environment () {
    return this._environment
  },

  set environment (value) {
    if (typeof value === 'object') {
      value = value.name
    } else if (typeof value === 'string') {
      value = value.toLowerCase()
    }
    if (value === this.environments.Local.name) {
      this.apiUrl = this.environments.Local.url
    } else if (value === this.environments.Staging.name) {
      this.apiUrl = this.environments.Staging.url
    } else if (value === this.environments.Mock.name) {
      this.apiUrl = this.environments.Mock.url
    } else if (value === this.environments.Live.name) {
      this.apiUrl = this.environments.Live.url
    } else {
      // console.error('invalid environment', value)
      // this.apiUrl = this.environments.Live.url
      throw Error('invalid environment')
    }
    this._environment = value
  }
}

// Session has our API session token values
let session = {

  // Max age of session cookie in seconds
  get maxAge () {
    return this._maxAge
  },

  set maxAge (value) {
    if (typeof value === 'number') {
      if (value < 0) {
        this._maxAge = 0
      } else {
        this._maxAge = Math.floor(value) // ensure it's an integer
      }
    }
  },

  // Cookie name for the session (if different from the default)
  get cookieName () {
    return this._cookieName
  },

  set cookieName (value) {
    if (value && value.length > 1) {
      this._cookieName = value
    }
  },

  // Cookie parameter for http only
  get httpOnly () {
    return this._httpOnly
  },

  set httpOnly (value) {
    if (typeof value === 'boolean') {
      this._httpOnly = value
    }
  },

  // Cookie parameter for http only
  get secureCookie () {
    return this._secureCookie
  },

  set secureCookie (value) {
    if (typeof value === 'boolean') {
      this._secureCookie = value
    }
  },

  // SameSite cookie parameter (strict, lax, or none)
  // From: https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-03
  // Cookies without a SameSite attribute will be treated as SameSite=Lax
  // Cookies with SameSite=None must also specify Secure, meaning they require a secure context
  get sameSite () {
    return this._sameSite
  },

  set sameSite (value) {
    if (value && value.length > 1) {
      value = value.toLowerCase()
      if (value === 'strict') {
        this._sameSite = 'Strict'
      } else if (value === 'lax') {
        this._sameSite = 'Lax'
      } else if (value === 'none') {
        this._sameSite = 'None'
        this._secureCookie = true
      }
    }
  },

  // (Optional) Cookie domain is used for generating cookies for the application developer
  get cookieDomain () {
    return this._cookieDomain
  },

  set cookieDomain (value) {
    if (value && value.length > 1) {
      this._cookieDomain = value
    }
  },

  // The current user session token
  get userToken () {
    return this._userToken
  },

  set userToken (value) {
    // This can handle taking a raw cookie header
    if (value && (value.indexOf(':') !== -1 || value.indexOf(';') !== -1)) {
      value = extractSessionTokenFromHeader(value, this.cookieName)
    }

    // It will only set the value if it's not empty
    if (value && value.length > 0) {
      value = value.split(this.cookieName + '=').join('')
      value = value.split(apiCookieName + '=').join('')
      if (value !== 'delete') { // For safely removing the token
        this._userToken = value
      } else {
        this._userToken = null
      }
    }
  },

  // This is used for the visitor session
  get visitorSession () {
    return this._visitorSession
  },

  set visitorSession (value) {
    // If we are a session token
    if (value && value.length === 64) {
      this._visitorSession = value
    } else {
      // Cookie header not detected or invalid value
      if (value === 'delete' || value.indexOf(visitorSessionKey) === -1) {
        this._visitorSession = null
      } else {
        value = extractSessionTokenFromHeader(value, visitorSessionKey)
        if (value && value.length === 64) {
          this._visitorSession = value
        } else {
          this._visitorSession = null
        }
      }
    }
  },

  // This helps generate a cookie for the user
  get userCookie () {
    // Set the max age
    let maxAge = this.maxAge
    let token = this.userToken

    // Must have a user token (if empty, it's a LOGOUT)
    if (!this.userToken || this.userToken.length === 0) {
      maxAge = -1
      token = ''
    }

    // Must have a cookie domain
    if (!this.cookieDomain || this.cookieDomain.length === 0) {
      return ''
    }

    // Build the cookie
    let cookie = this.cookieName + '=' + token + '; Domain=' + this.cookieDomain + '; Path=/;'
    if (maxAge > 0) {
      let d = new Date()
      d.setTime(d.getTime() + 1000 * maxAge)
      cookie += ' Expires=' + d.toGMTString() + ';'
      cookie += ' Max-Age=' + maxAge + ';'
    } else { // Return an expired cookie
      cookie += ' Expires=Sat, 25 Nov 1995 00:00:00 GMT;'
      cookie += ' Max-Age=-1;'
    }
    if (this.sameSite) {
      cookie += ' SameSite=' + this.sameSite + ';'
    }
    if (this.secureCookie) {
      cookie += ' Secure;'
    }
    if (this.httpOnly) {
      cookie += ' HttpOnly;'
    }
    return cookie
  },

  // The current api session token
  get apiToken () {
    return this._apiToken
  },

  set apiToken (value) {
    // This can handle taking a raw cookie header
    if (value && (value.indexOf(':') !== -1 || value.indexOf(';') !== -1)) {
      value = extractSessionTokenFromHeader(value, this.cookieName)
    }

    // It will only set the value if it's not empty
    if (value && value.length > 0) {
      value = value.split(this.cookieName + '=').join('')
      value = value.split(apiCookieName + '=').join('')
      if (value !== 'delete') { // For safely removing the token
        this._apiToken = value
      } else {
        this._apiToken = null
      }
    }
  }
}

// This wraps axios for cookie management for API vs User session token
function wrapAxios (t) {
  // Skip if already loaded
  if (t.loaded) {
    return
  }

  // Modify the request before sending (cookie management)
  tonicAxios.interceptors.request.use(function (config) {
    // Are we making a request with a custom session token?
    if (typeof config.headers[internalHeaderKey] !== 'undefined') {
      config.jar.setCookie(apiCookieName + '=' + config.headers[internalHeaderKey] + '; Max-Age=' + t.session.maxAge + '; Path=/; HttpOnly;', config.url, function (err) {
        if (err) {
          // console.error(err.message)
          throw Error(err.message)
        }
      })
      config.headers[internalHeaderKey] = 'set'
    } else if (t.session.apiToken) {
      config.jar.setCookie(apiCookieName + '=' + t.session.apiToken + '; Max-Age=' + t.session.maxAge + '; Path=/; HttpOnly;', config.url, function (err) {
        if (err) {
          // console.error(err.message)
          throw Error(err.message)
        }
      })
    }

    return config
  }, function (e) {
    return Promise.reject(e)
  })

  // Modify the response after sending (cookie management)
  tonicAxios.interceptors.response.use(function (response) {
    // Save the cookie for api or user
    response.config.jar.getCookies(response.config.url, { allPaths: true }, function (err, cookies) {
      if (err) {
        // console.error(err.message)
        throw Error(err.message)
      }
      if (cookies.length > 0) {
        for (let i = 0; i < cookies.length; i++) {
          if (cookies[i].key === apiCookieName) {
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
          if ((t.session.userToken.length > 0 && response.config.headers[internalHeaderKey] === t.session.userToken) || response.config.headers[internalHeaderKey] === 'set') {
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

// checkError will check the response error from the api method
// Use the data response if found, otherwise fallback to error message
function checkError (e) {
  if (typeof e.response !== 'undefined') {
    return e.response.data
  }
  return e.message
}

// setUserToken will set the token if found, otherwise return empty token
// This takes a raw value, parses cookies, sets token, and returns a string
function setUserToken (t, token) {
  if (token && token.length > 1) {
    t.session.userToken = token
    return t.session.userToken
  }
  return ''
}

//
// TonicPow API - User Requests
// =====================================================================================================================
//

// createSession will attempt to create a new api session
//
// For more information: https://docs.tonicpow.com/#632ed94a-3afd-4323-af91-bdf307a399d2
async function createSession (t) {
  return tonicAxios.post(t.config.apiUrl + apiVersion + '/auth/session', { api_key: t.config.apiKey }, getOptions())
}

// prolongSession will attempt to prolong a session (either the user or api)
//
// For more information: https://docs.tonicpow.com/#632ed94a-3afd-4323-af91-bdf307a399d2
async function prolongSession (t, customSessionToken = '') {
  return tonicAxios.get(t.config.apiUrl + apiVersion + '/auth/session', getOptions(customSessionToken))
}

// endSession will end the given session token or the api token if none is given
//
// For more information: https://docs.tonicpow.com/#1dfeff1e-6c8d-4b32-904e-a19261b1f89e
async function endSession (t, customSessionToken = '') {
  return tonicAxios.delete(t.config.apiUrl + apiVersion + '/auth/session', getOptions(customSessionToken))
}

// loginUser will attempt to login a user
//
// For more information: https://docs.tonicpow.com/#5cad3e9a-5931-44bf-b110-4c4b74c7a070
async function loginUser (t, email, password) {
  return tonicAxios.post(t.config.apiUrl + apiVersion + '/users/login', { email: email, password: password }, getOptions(t.session.apiToken))
}

// logoutUser will end the user session, if no session token set it will use the session.userToken
//
// For more information: https://docs.tonicpow.com/#39d65294-376a-4366-8f71-a02b08f9abdf
async function logoutUser (t, userSessionToken = '') {
  // Missing token or empty token (fall back to the current user session token)
  if (!userSessionToken || userSessionToken.length < 1) {
    if (!t.session.userToken || t.session.userToken.length < 1) {
      throw Error('user session must be set')
    }
    userSessionToken = t.session.userToken
  }
  return tonicAxios.delete(t.config.apiUrl + apiVersion + '/users/logout', getOptions(userSessionToken))
}

// currentUser will attempt get the profile for the current user or userSessionToken
//
// For more information: https://docs.tonicpow.com/#7f6e9b5d-8c7f-4afc-8e07-7aafdd891521
async function currentUser (t, userSessionToken = '') {
  // Missing token or empty token (fall back to the current user session token)
  if (!userSessionToken || userSessionToken.length < 1) {
    if (!t.session.userToken || t.session.userToken.length < 1) {
      throw Error('user session must be set')
    }
    userSessionToken = t.session.userToken
  }

  return tonicAxios.get(t.config.apiUrl + apiVersion + '/users/account', getOptions(userSessionToken))
}

// getUserBalance will first update a given user's balance from the chain and then return the user info
//
// For more information: https://docs.tonicpow.com/#8478765b-95b8-47ad-8b86-2db5bce54924
async function getUserBalance (t, userId, lastBalance = 0) {
  return tonicAxios.get(t.config.apiUrl + apiVersion + '/users/balance/' + userId + '?last_balance=' + lastBalance, getOptions())
}

// getUser will get a user by ID or email address
//
// For more information: https://docs.tonicpow.com/#e6f764a2-5a91-4680-aa5e-03409dd878d8
async function getUser (t, userId = 0, email = '') {
  let url = t.config.apiUrl + apiVersion + '/users/details?'

  if (userId && userId > 0) {
    url += 'id=' + userId
  } else {
    email = email.split('+').join('%2B')
    url += 'email=' + email
  }

  return tonicAxios.get(url, getOptions())
}

// createUser will create a new user given the attributes
//
// For more information: https://docs.tonicpow.com/#8de84fb5-ba77-42cc-abb0-f3044cc871b6
async function createUser (t, user) {
  // Missing email
  if (!user || user.email.length < 1) {
    throw Error('email is required')
  }

  return tonicAxios.post(t.config.apiUrl + apiVersion + '/users', user, getOptions())
}

// updateUser will update an existing user
//
// For more information: https://docs.tonicpow.com/#7c3c3c3a-f636-469f-a884-449cf6fb35fe
async function updateUser (t, user, userSessionToken = '') {
  return tonicAxios.put(t.config.apiUrl + apiVersion + '/users', user, getOptions(userSessionToken))
}

// forgotPassword will fire a forgot password request
//
// For more information: https://docs.tonicpow.com/#2c33dae4-d6b1-4949-9e84-fb02157ab7cd
async function forgotPassword (t, email) {
  return tonicAxios.post(t.config.apiUrl + apiVersion + '/users/password/forgot', { email: email }, getOptions())
}

// resetPassword will reset a password from a forgotPassword() request
//
// For more information: https://docs.tonicpow.com/#370fbeec-adb2-4ed3-82dc-2dffa840e490
async function resetPassword (t, resetToken, password, passwordConfirm) {
  return tonicAxios.put(t.config.apiUrl + apiVersion + '/users/password/reset', { token: resetToken, password: password, password_confirm: passwordConfirm }, getOptions())
}

// resendEmailVerification will resend an email to the user
// Use the userSessionToken if the current user is making the request
//
// For more information: https://docs.tonicpow.com/#a12a3eff-491b-4079-99f6-07497b9e4efe
async function resendEmailVerification (t, userId, userSessionToken = '') {
  return tonicAxios.post(t.config.apiUrl + apiVersion + '/users/verify/email/send', { id: userId }, getOptions(userSessionToken))
}

// completeEmailVerification will complete an email verification with a given token
//
// For more information: https://docs.tonicpow.com/#f5081800-a224-4f36-8014-94981f0bd55d
async function completeEmailVerification (t, emailToken) {
  return tonicAxios.put(t.config.apiUrl + apiVersion + '/users/verify/email', { token: emailToken }, getOptions())
}

// resendPhoneVerification will resend a phone verification code to the user
// Use the userSessionToken if the current user is making the request
//
// For more information: https://docs.tonicpow.com/#fcc4fe4d-f298-45bd-b51e-a5c107834528
async function resendPhoneVerification (t, userId, userSessionToken = '') {
  return tonicAxios.post(t.config.apiUrl + apiVersion + '/users/verify/phone/send', { id: userId }, getOptions(userSessionToken))
}

// completePhoneVerification will complete a phone verification with a given code and number
//
// For more information: https://docs.tonicpow.com/#573403c4-b872-475d-ac04-de32a88ecd19
async function completePhoneVerification (t, phone, phoneCode) {
  return tonicAxios.put(t.config.apiUrl + apiVersion + '/users/verify/phone', { phone: phone, phone_code: phoneCode }, getOptions())
}

// requestActivation will send a request for activation
//
// For more information: todo: add documentation
async function requestActivation (t, userSessionToken = '') {
  // Missing token or empty token (fall back to the current user session token)
  if (!userSessionToken || userSessionToken.length < 1) {
    if (!t.session.userToken || t.session.userToken.length < 1) {
      throw Error('user session must be set')
    }
    userSessionToken = t.session.userToken
  }

  return tonicAxios.put(t.config.apiUrl + apiVersion + '/users/status/request', '', getOptions(userSessionToken))
}

// acceptUser will accept a user (if approval is required for new users)
// use id or email to select the user
// reason is optional
//
// For more information: https://docs.tonicpow.com/#65c3962d-c309-4ef4-b85f-7ec1f08f031b
async function acceptUser (t, userId = 0, email = '', reason = '') {
  return tonicAxios.put(t.config.apiUrl + apiVersion + '/users/status/accept', { id: userId, email: email, reason: reason }, getOptions())
}

// activateUser will activate a user (if all application criteria is met)
// use id or email to select the user
//
// For more information: https://docs.tonicpow.com/#aa499fdf-2492-43ee-99d4-fc9735676431
async function activateUser (t, userId = 0, email = '') {
  return tonicAxios.put(t.config.apiUrl + apiVersion + '/users/status/activate', { id: userId, email: email }, getOptions())
}

// pauseUser will pause a user account (all payouts go to internal address)
// use id or email to select the user
//
// For more information: https://docs.tonicpow.com/#3307310d-86a9-4a5c-84ff-c38c581c77e5
async function pauseUser (t, userId = 0, reason = '', email = 0) {
  return tonicAxios.put(t.config.apiUrl + apiVersion + '/users/status/pause', { id: userId, reason: reason, email: email }, getOptions())
}

// userExists will check if a user exists by email address
// This will return an error if the user is not found (404)
//
// For more information: https://docs.tonicpow.com/#2d8c37d4-c88b-4cec-83ad-fa72b0f41f17
async function userExists (t, email) {
  return tonicAxios.get(t.config.apiUrl + apiVersion + '/users/exists?email=' + email, getOptions())
}

// releaseUserBalance will send the internal balance to the user's payout_address
//
// For more information: https://docs.tonicpow.com/#be82b6cb-7fe8-4f03-9b0c-dbade8f2d40f
async function releaseUserBalance (t, userId, reason = '') {
  return tonicAxios.put(t.config.apiUrl + apiVersion + '/users/wallet/release', { id: userId, reason: reason }, getOptions())
}

// refundUserBalance will send the internal balance back to the corresponding campaigns
// Reason field is required
//
// For more information: https://docs.tonicpow.com/#c373c7ed-189d-4aa6-88da-c4a58955fd28
async function refundUserBalance (t, userId, reason) {
  return tonicAxios.put(t.config.apiUrl + apiVersion + '/users/wallet/refund', { id: userId, reason: reason }, getOptions())
}

// getUserReferrals will return all the related referrals to the given user
// Use either an ID or email to get an existing user
//
// For more information: https://docs.tonicpow.com/#fa7ee5a6-c87d-4e01-8ad3-ef6bda39533b
async function getUserReferrals (t, userId = 0, email = '') {
  let url = t.config.apiUrl + apiVersion + '/users/referred?'

  if (userId && userId > 0) {
    url += 'id=' + userId
  } else {
    email = email.split('+').join('%2B')
    url += 'email=' + email
  }

  return tonicAxios.get(url, getOptions())
}

// listUserReferrals will return a list of active users that have referrals
// This will return an error if no users are found (404)
//
// For more information: https://docs.tonicpow.com/#3fd8e647-abfa-422f-90af-952cccd3be7c
async function listUserReferrals (t, page = 1, resultsPerPage = 20, sortBy = '', sortOrder = '') {
  return tonicAxios.get(t.config.apiUrl + apiVersion + '/users/referrals?current_page=' + page + '&results_per_page=' + resultsPerPage + '&sort_by=' + sortBy + '&sort_order=' + sortOrder, getOptions())
}

//
// TonicPow API - Advertiser Profile Requests
// =====================================================================================================================
//

// createAdvertiserProfile will make a new advertiser profile
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#153c0b65-2d4c-4972-9aab-f791db05b37b
async function createAdvertiserProfile (t, profile, userSessionToken = '') {
  return tonicAxios.post(t.config.apiUrl + apiVersion + '/advertisers', profile, getOptions(userSessionToken))
}

// getAdvertiserProfile will get an existing advertiser profile
// This will return an error if the profile is not found (404)
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#b3a62d35-7778-4314-9321-01f5266c3b51
async function getAdvertiserProfile (t, profileId, userSessionToken = '') {
  return tonicAxios.get(t.config.apiUrl + apiVersion + '/advertisers/details/' + profileId, getOptions(userSessionToken))
}

// updateAdvertiserProfile will update an existing profile
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#0cebd1ff-b1ce-4111-aff6-9d586f632a84
async function updateAdvertiserProfile (t, profile, userSessionToken = '') {
  return tonicAxios.put(t.config.apiUrl + apiVersion + '/advertisers', profile, getOptions(userSessionToken))
}

// listCampaignsByAdvertiserProfile will return a list of campaigns
// This will return an error if the campaign is not found (404)
//
// For more information: https://docs.tonicpow.com/#98017e9a-37dd-4810-9483-b6c400572e0c
async function listCampaignsByAdvertiserProfile (t, profileId, page = 1, resultsPerPage = 20, sortBy = '', sortOrder = '') {
  return tonicAxios.get(t.config.apiUrl + apiVersion + '/advertisers/campaigns/' + profileId + '?current_page=' + page + '&results_per_page=' + resultsPerPage + '&sort_by=' + sortBy + '&sort_order=' + sortOrder, getOptions())
}

//
// TonicPow API - Campaign Requests
// =====================================================================================================================
//

// createCampaign will make a new campaign
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#b67e92bf-a481-44f6-a31d-26e6e0c521b1
async function createCampaign (t, campaign, userSessionToken = '') {
  return tonicAxios.post(t.config.apiUrl + apiVersion + '/campaigns', campaign, getOptions(userSessionToken))
}

// getCampaign will get an existing campaign
// This will return an error if the campaign is not found (404)
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#b827446b-be34-4678-b347-33c4f63dbf9e
async function getCampaign (t, campaignId, userSessionToken = '') {
  return tonicAxios.get(t.config.apiUrl + apiVersion + '/campaigns/details/' + campaignId, getOptions(userSessionToken))
}

// getCampaignByShortCode will get an existing campaign via a short code from a link
// This will return an error if the campaign is not found (404)
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#8451b92f-ea74-47aa-8ac1-c96647e2dbfd
async function getCampaignByShortCode (t, shortCode, userSessionToken = '') {
  return tonicAxios.get(t.config.apiUrl + apiVersion + '/campaigns/link/' + shortCode, getOptions(userSessionToken))
}

// getCampaignBalance will update the models's balance from the chain
// This will return an error if the campaign is not found (404)
//
// For more information: https://docs.tonicpow.com/#b6c60c63-8ac5-4c74-a4a2-cf3e858e5a8d
async function getCampaignBalance (t, campaignId, lastBalance = 0) {
  return tonicAxios.get(t.config.apiUrl + apiVersion + '/campaigns/balance/' + campaignId + '?last_balance=' + lastBalance, getOptions())
}

// updateCampaign will update an existing campaign
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#665eefd6-da42-4ca9-853c-fd8ca1bf66b2
async function updateCampaign (t, campaign, userSessionToken = '') {
  return tonicAxios.put(t.config.apiUrl + apiVersion + '/campaigns', campaign, getOptions(userSessionToken))
}

// listCampaigns will return a list of active campaigns
// This will return an error if the campaign is not found (404)
//
// For more information: https://docs.tonicpow.com/#c1b17be6-cb10-48b3-a519-4686961ff41c
async function listCampaigns (t, customSessionToken = '', page = 1, resultsPerPage = 20, sortBy = '', sortOrder = '') {
  return tonicAxios.get(t.config.apiUrl + apiVersion + '/campaigns/list?current_page=' + page + '&results_per_page=' + resultsPerPage + '&sort_by=' + sortBy + '&sort_order=' + sortOrder, getOptions(customSessionToken))
}

// listCampaignsByUrl will return a list of active campaigns
// This will return an error if the url is not found (404)
//
// For more information: https://docs.tonicpow.com/#30a15b69-7912-4e25-ba41-212529fba5ff
async function listCampaignsByUrl (t, url, page = 1, resultsPerPage = 20, sortBy = '', sortOrder = '') {
  return tonicAxios.get(t.config.apiUrl + apiVersion + '/campaigns/find?target_url=' + url + '&current_page=' + page + '&results_per_page=' + resultsPerPage + '&sort_by=' + sortBy + '&sort_order=' + sortOrder, getOptions())
}

// campaignsFeed will return a feed of active campaigns
// This will return an error if no campaigns are found (404)
// Supports: rss, atom, json
//
// For more information: https://docs.tonicpow.com/#b3fe69d3-24ba-4c2a-a485-affbb0a738de
async function campaignsFeed (t, feedType = 'rss') {
  return tonicAxios.get(t.config.apiUrl + apiVersion + '/campaigns/feed?feed_type=' + feedType, getOptions())
}

// campaignStatistics will get basic statistics on all campaigns
//
// For more information: https://docs.tonicpow.com/#d3108b14-486e-4e27-8176-57ec63cd49f2
async function campaignStatistics (t) {
  return tonicAxios.get(t.config.apiUrl + apiVersion + '/campaigns/statistics', getOptions())
}

//
// TonicPow API - Goal Requests
// =====================================================================================================================
//

// createGoal will make a new goal
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#29a93e9b-9726-474c-b25e-92586200a803
async function createGoal (t, goal, userSessionToken = '') {
  return tonicAxios.post(t.config.apiUrl + apiVersion + '/goals', goal, getOptions(userSessionToken))
}

// getGoal will get an existing goal
// This will return an error if the goal is not found (404)
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#48d7bbc8-5d7b-4078-87b7-25f545c3deaf
async function getGoal (t, goalId, userSessionToken = '') {
  return tonicAxios.get(t.config.apiUrl + apiVersion + '/goals/details/' + goalId, getOptions(userSessionToken))
}

// updateGoal will update an existing goal
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#395f5b7d-6a5d-49c8-b1ae-abf7f90b42a2
async function updateGoal (t, goal, userSessionToken = '') {
  return tonicAxios.put(t.config.apiUrl + apiVersion + '/goals', goal, getOptions(userSessionToken))
}

//
// TonicPow API - Conversion Requests
// =====================================================================================================================
//

// getConversion will get an existing conversion
// This will return an error if the goal is not found (404)
//
// For more information: https://docs.tonicpow.com/#fce465a1-d8d5-442d-be22-95169170167e
async function getConversion (t, conversionId) {
  return tonicAxios.get(t.config.apiUrl + apiVersion + '/conversions/details/' + conversionId, getOptions())
}

// createConversionByGoalID will fire a conversion for a given goal id, if successful it will make a new Conversion
//
// For more information: https://docs.tonicpow.com/#caeffdd5-eaad-4fc8-ac01-8288b50e8e27
async function createConversionByGoalID (t, goalId, tncpwSession, customDimensions = '', optionalPurchaseAmount = 0.00, delayInMinutes = 0) {
  let data = { goal_id: goalId, tncpw_session: tncpwSession, custom_dimensions: customDimensions, delay_in_minutes: delayInMinutes, amount: optionalPurchaseAmount }
  return tonicAxios.post(t.config.apiUrl + apiVersion + '/conversions', data, getOptions())
}

// createConversionByGoalName will fire a conversion for a given goal name, if successful it will make a new Conversion
//
// For more information: https://docs.tonicpow.com/#d19c9850-3832-45b2-b880-3ef2f3b7dc37
async function createConversionByGoalName (t, goalName, tncpwSession, customDimensions = '', optionalPurchaseAmount = 0.00, delayInMinutes = 0) {
  let data = { name: goalName, tncpw_session: tncpwSession, custom_dimensions: customDimensions, delay_in_minutes: delayInMinutes, amount: optionalPurchaseAmount }
  return tonicAxios.post(t.config.apiUrl + apiVersion + '/conversions', data, getOptions())
}

// createConversionByUserID will fire a conversion for a given goal and user id, if successful it will make a new Conversion
//
// For more information: https://docs.tonicpow.com/#d724f762-329e-473d-bdc4-aebc19dd9ea8
async function createConversionByUserID (t, goalId, userId, customDimensions = '', optionalPurchaseAmount = 0.00, delayInMinutes = 0) {
  let data = { goal_id: goalId, user_id: userId, custom_dimensions: customDimensions, delay_in_minutes: delayInMinutes, amount: optionalPurchaseAmount }
  return tonicAxios.post(t.config.apiUrl + apiVersion + '/conversions', data, getOptions())
}

// cancelConversion will cancel an existing conversion (if delay was set and > 1 minute remaining)
//
// For more information: https://docs.tonicpow.com/#e650b083-bbb4-4ff7-9879-c14b1ab3f753
async function cancelConversion (t, conversionId, reason) {
  let data = { id: conversionId, reason: reason }
  return tonicAxios.put(t.config.apiUrl + apiVersion + '/conversions/cancel', data, getOptions())
}

//
// TonicPow API - Link Requests
// =====================================================================================================================
//

// createLink will make a new link
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#154bf9e1-6047-452f-a289-d21f507b0f1d
async function createLink (t, link, userSessionToken = '') {
  return tonicAxios.post(t.config.apiUrl + apiVersion + '/links', link, getOptions(userSessionToken))
}

// getLink will get an existing link
// This will return an error if the link is not found (404)
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#c53add03-303e-4f72-8847-2adfdb992eb3
async function getLink (t, linkId, userSessionToken = '') {
  return tonicAxios.get(t.config.apiUrl + apiVersion + '/links/details/' + linkId, getOptions(userSessionToken))
}

// listLinksByUserID will get links associated to the user id
// This will return an error if the link(s) are not found (404)
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#23d068f1-4f0e-476a-a802-50b7edccd0b2
async function listLinksByUserID (t, userId, userSessionToken = '', page = 1, resultsPerPage = 20) {
  return tonicAxios.get(t.config.apiUrl + apiVersion + '/links/user/' + userId + '?current_page=' + page + '&results_per_page=' + resultsPerPage, getOptions(userSessionToken))
}

// checkLink will check for an existing link with a short_code
// This will return an error if the link is not found (404)
//
// For more information: https://docs.tonicpow.com/#cc9780b7-0d84-4a60-a28f-664b2ecb209b
async function checkLink (t, shortCode) {
  return tonicAxios.get(t.config.apiUrl + apiVersion + '/links/check/' + shortCode, getOptions())
}

//
// TonicPow API - Visitor Requests
// =====================================================================================================================
//

// createVisitorSession will make a new session for a visitor (used for goal conversions)
//
// For more information: https://docs.tonicpow.com/#29a93e9b-9726-474c-b25e-92586200a803
async function createVisitorSession (t, visitorSession) {
  return tonicAxios.post(t.config.apiUrl + apiVersion + '/visitors/sessions', visitorSession, getOptions())
}

// getVisitorSession will get a visitor session
// This will return an error if the session is not found (404)
//
// For more information: https://docs.tonicpow.com/#cf560448-6dda-42a6-9051-136afabe78e6
async function getVisitorSession (t, tncpwSession) {
  return tonicAxios.get(t.config.apiUrl + apiVersion + '/visitors/sessions/details/' + tncpwSession, getOptions())
}

//
// TonicPow API - Rate Requests
// =====================================================================================================================
//

// getCurrentRate will get a current rate for the given currency
//
// For more information: https://docs.tonicpow.com/#71b8b7fc-317a-4e68-bd2a-5b0da012361c
async function getCurrentRate (t, currency, customAmount = 0.00) {
  return tonicAxios.get(t.config.apiUrl + apiVersion + '/rates/' + currency + '?amount=' + customAmount, getOptions())
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
  init: async function (apiKey, options = {}) {
    // Set the api key (error if not set)
    config.apiKey = apiKey

    // Set any defaults
    session.cookieName = apiCookieName
    session.httpOnly = false
    session.maxAge = defaultMaxAge
    session.secureCookie = false
    let customSessionToken = ''

    // Load any options that are set
    if (options) {
      if (options.hasOwnProperty('environment')) {
        config.environment = options.environment
      }
      if (options.hasOwnProperty('cookieDomain')) {
        session.cookieDomain = options.cookieDomain
      }
      if (options.hasOwnProperty('cookieName')) {
        session.cookieName = options.cookieName
      }
      if (options.hasOwnProperty('token')) {
        customSessionToken = options.token
      }
      if (options.hasOwnProperty('maxAge')) {
        session.maxAge = options.maxAge
      }
      if (options.hasOwnProperty('httpOnly')) {
        session.httpOnly = options.httpOnly
      }
      if (options.hasOwnProperty('secureCookie')) {
        session.secureCookie = options.secureCookie
      }
      if (options.hasOwnProperty('sameSite')) {
        session.sameSite = options.sameSite
      }
    }

    // Default ENV
    if (!config.environment) {
      config.environment = config.environments.Live.name
    }

    // Wrap once
    wrapAxios(this)

    // Fire the init
    return new Promise(async (resolve, reject) => {
      try {
        blockBrowser()
        if (typeof customSessionToken === 'string' && customSessionToken.length > 0) {
          this.session.apiToken = customSessionToken
        } else if (session.apiToken && session.apiToken.length > 0) {
          // Do nothing
        } else {
          await createSession(this)
        }
        resolve({ success: this.config.environment + ' api loaded' })
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  prolongSession: async function (customSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        await prolongSession(this, extractSessionTokenFromHeader(customSessionToken, this.session.cookieName))
        resolve({ success: 'session prolonged' })
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  endSession: async function (customSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        this.session.apiToken = customSessionToken
        await endSession(this, this.session.apiToken)
        if (customSessionToken.length === 0 || customSessionToken === this.session.apiToken) {
          this.session.apiToken = 'delete'
        }
        resolve({ success: 'session ended' })
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  loginUser: async function (email, password) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        await loginUser(this, email, password)
        resolve({ success: 'user logged in' })
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  logoutUser: async function (userSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        await logoutUser(this, setUserToken(this, userSessionToken))
        this.session.userToken = 'delete'
        resolve({ success: 'user logged out' })
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  currentUser: async function (userSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await currentUser(this, setUserToken(this, userSessionToken))
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  getUser: async function (userId = 0, email = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await getUser(this, userId, email)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  getUserBalance: async function (userId, lastBalance = 0) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await getUserBalance(this, userId, lastBalance)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  getUserReferrals: async function (userId = 0, email = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await getUserReferrals(this, userId, email)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  listUserReferrals: async function (page = 1, resultsPerPage = 20, sortBy = '', sortOrder = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await listUserReferrals(this, page, resultsPerPage, sortBy, sortOrder)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  createUser: async function (user, referredVisitorSession = '', referredUserId = 0) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        if (referredVisitorSession && referredVisitorSession.length > 0) {
          user[visitorSessionKey] = extractSessionTokenFromHeader(referredVisitorSession, visitorSessionKey)
        }
        if (referredUserId && referredUserId > 0) {
          user['referred_by_user_id'] = referredUserId
        }
        let response = await createUser(this, user)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  updateUser: async function (user, userSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await updateUser(this, user, setUserToken(this, userSessionToken))
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  forgotPassword: async function (email) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        await forgotPassword(this, email)
        resolve({ success: 'forgot password email sent' })
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  resetPassword: async function (resetToken, password, passwordConfirm) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await resetPassword(this, resetToken, password, passwordConfirm)
        let email = ''
        if (response.headers && response.headers['user-address']) {
          email = response.headers['user-address']
        }
        resolve({ success: 'password set', email: email })
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  resendEmailVerification: async function (userId, userSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        await resendEmailVerification(this, userId, setUserToken(this, userSessionToken))
        resolve({ success: 'verification sent' })
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  completeEmailVerification: async function (emailToken) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        await completeEmailVerification(this, emailToken)
        resolve({ success: 'email verified' })
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  resendPhoneVerification: async function (userId, userSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        await resendPhoneVerification(this, userId, setUserToken(this, userSessionToken))
        resolve({ success: 'verification sent' })
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  completePhoneVerification: async function (phone, phoneCode) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        await completePhoneVerification(this, phone, phoneCode)
        resolve({ success: 'phone verified' })
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  requestActivation: async function (userSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await requestActivation(this, setUserToken(this, userSessionToken))
        resolve({ success: 'activation requested' })
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  acceptUser: async function (userId = 0, email = '', reason = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        await acceptUser(this, userId, email, reason)
        resolve({ success: 'user accepted' })
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  activateUser: async function (userId = 0, email = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        await activateUser(this, userId, email)
        resolve({ success: 'user activated' })
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  pauseUser: async function (userId = 0, reason = '', email = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        await pauseUser(this, userId, reason, email)
        resolve({ success: 'user paused' })
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  userExists: async function (email) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await userExists(this, email)
        response.data['exists'] = true
        resolve(response.data)
      } catch (e) {
        if (typeof e.response !== 'undefined' && e.response.data.code === 404) {
          resolve({ exists: false })
          return
        }
        reject(checkError(e))
      }
    })
  },
  releaseUserBalance: async function (userId, reason = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        await releaseUserBalance(this, userId, reason)
        resolve({ success: 'user balance released' })
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  refundUserBalance: async function (userId, reason) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        await refundUserBalance(this, userId, reason)
        resolve({ success: 'user balance released' })
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  createAdvertiserProfile: async function (profile, userSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await createAdvertiserProfile(this, profile, setUserToken(this, userSessionToken))
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  getAdvertiserProfile: async function (profileId, userSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await getAdvertiserProfile(this, profileId, setUserToken(this, userSessionToken))
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  updateAdvertiserProfile: async function (profile, userSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await updateAdvertiserProfile(this, profile, setUserToken(this, userSessionToken))
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  listCampaignsByAdvertiserProfile: async function (profileId, page = 1, resultsPerPage = 20, sortBy = '', sortOrder = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await listCampaignsByAdvertiserProfile(this, profileId, page, resultsPerPage, sortBy, sortOrder)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  createCampaign: async function (campaign, userSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await createCampaign(this, campaign, setUserToken(this, userSessionToken))
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  getCampaign: async function (campaignId, userSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await getCampaign(this, campaignId, setUserToken(this, userSessionToken))
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  getCampaignByShortCode: async function (shortCode, userSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await getCampaignByShortCode(this, shortCode, setUserToken(this, userSessionToken))
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  getCampaignBalance: async function (campaignId, lastBalance = 0) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await getCampaignBalance(this, campaignId, lastBalance)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  updateCampaign: async function (campaign, userSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await updateCampaign(this, campaign, setUserToken(this, userSessionToken))
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  listCampaigns: async function (customSessionToken = '', page = 1, resultsPerPage = 20, sortBy = '', sortOrder = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        // this.session.userToken = customSessionToken (can't assume its a user)
        // setUserToken(this, userSessionToken)
        let response = await listCampaigns(this, customSessionToken, page, resultsPerPage, sortBy, sortOrder)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  listCampaignsByUrl: async function (url, page = 1, resultsPerPage = 20, sortBy = '', sortOrder = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await listCampaignsByUrl(this, url, page, resultsPerPage, sortBy, sortOrder)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  campaignsFeed: async function (feedType = 'rss') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await campaignsFeed(this, feedType)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  campaignStatistics: async function () {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await campaignStatistics(this)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  createGoal: async function (goal, userSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await createGoal(this, goal, setUserToken(this, userSessionToken))
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  getGoal: async function (goalId, userSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await getGoal(this, goalId, setUserToken(this, userSessionToken))
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  updateGoal: async function (goal, userSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await updateGoal(this, goal, setUserToken(this, userSessionToken))
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  createConversionByGoalID: async function (goalId, tncpwSession, customDimensions = '', optionalPurchaseAmount = 0.00, delayInMinutes = 0) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await createConversionByGoalID(this, goalId, extractSessionTokenFromHeader(tncpwSession, visitorSessionKey), customDimensions, optionalPurchaseAmount, delayInMinutes)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  createConversionByGoalName: async function (goalName, tncpwSession, customDimensions = '', optionalPurchaseAmount = 0.00, delayInMinutes = 0) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await createConversionByGoalName(this, goalName, extractSessionTokenFromHeader(tncpwSession, visitorSessionKey), customDimensions, optionalPurchaseAmount, delayInMinutes)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  createConversionByUserID: async function (goalId, userId, customDimensions = '', optionalPurchaseAmount = 0.00, delayInMinutes = 0) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await createConversionByUserID(this, goalId, userId, customDimensions, optionalPurchaseAmount, delayInMinutes)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  getConversion: async function (conversionId) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await getConversion(this, conversionId)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  cancelConversion: async function (conversionId, reason) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await cancelConversion(this, conversionId, reason)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  createLink: async function (link, userSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await createLink(this, link, setUserToken(this, userSessionToken))
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  getLink: async function (linkId, userSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await getLink(this, linkId, setUserToken(this, userSessionToken))
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  listLinksByUserID: async function (userId, userSessionToken = '', page = 1, resultsPerPage = 20) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await listLinksByUserID(this, userId, setUserToken(this, userSessionToken), page, resultsPerPage)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  checkLink: async function (shortCode) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await checkLink(this, shortCode)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  createVisitorSession: async function (visitorSession) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await createVisitorSession(this, visitorSession)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  getVisitorSession: async function (tncpwSession) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await getVisitorSession(this, extractSessionTokenFromHeader(tncpwSession, visitorSessionKey))
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  getCurrentRate: async function (currency, customAmount = 0.00) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await getCurrentRate(this, currency, customAmount)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  }
}
