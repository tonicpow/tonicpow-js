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

// Current version for requests from the API
const version = 'v1'

// getOptions is a factory for axios default options
function getOptions (useCustomSessionToken = '') {
  let defaultOptions = { jar: cookieJar, withCredentials: true, headers: {} }
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
  return list[cookieName]
}

// Config for the API instance, environment, url, etc
let config = {

  // List of supported environments for the TonicPow API
  environments: {
    Live: { name: 'live', url: 'https://api.tonicpow.com/' },
    Local: { name: 'local', url: 'http://localhost:3000/' },
    Mock: { name: 'mock', url: 'http://d9116720-5ac6-4c7f-a370-4ea578c63a66.mock.pstmn.io' },
    Staging: { name: 'staging', url: 'https://apistaging.tonicpow.com/' }
  },

  // Our internal API key for creating a new session
  get apiKey () {
    return this._apiKey
  },

  set apiKey (value) {
    if (!value || value.length < 10) {
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

  // This helps generate a cookie for the user
  get userCookie () {
    // Must have a user token
    if (!this.userToken || this.userToken.length === 0) {
      return ''
    }

    // Must have a cookie domain
    if (!this.cookieDomain || this.cookieDomain.length === 0) {
      return ''
    }

    // Build the cookie
    let cookie = this.cookieName + '=' + this.userToken + '; Domain=' + this.cookieDomain + '; Path=/;'
    if (this.maxAge > 0) {
      let d = new Date()
      d.setTime(d.getTime() + 1000 * this.maxAge)
      cookie += ' Expires=' + d.toGMTString() + ';'
      cookie += ' Max-Age=' + this.maxAge + ';'
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
          throw Error(err.message)
        }
      })
      config.headers[internalHeaderKey] = 'set'
    } else if (t.session.apiToken) {
      config.jar.setCookie(apiCookieName + '=' + t.session.apiToken + '; Max-Age=' + t.session.maxAge + '; Path=/; HttpOnly;', config.url, function (err) {
        if (err) {
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
  return tonicAxios.post(t.config.apiUrl + version + '/auth/session', { api_key: t.config.apiKey }, getOptions())
}

// prolongSession will attempt to prolong a session (either the user or api)
//
// For more information: https://docs.tonicpow.com/#632ed94a-3afd-4323-af91-bdf307a399d2
async function prolongSession (t, userSessionToken = '') {
  return tonicAxios.get(t.config.apiUrl + version + '/auth/session', getOptions(userSessionToken))
}

// endSession will end the given session token or the api token if none is given
//
// For more information: https://docs.tonicpow.com/#1dfeff1e-6c8d-4b32-904e-a19261b1f89e
async function endSession (t, userSessionToken = '') {
  return tonicAxios.delete(t.config.apiUrl + version + '/auth/session', getOptions(userSessionToken))
}

// loginUser will attempt to login a user
//
// For more information: https://docs.tonicpow.com/#5cad3e9a-5931-44bf-b110-4c4b74c7a070
async function loginUser (t, email, password) {
  return tonicAxios.post(t.config.apiUrl + version + '/users/login', { email: email, password: password }, getOptions(t.session.apiToken))
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

  return tonicAxios.delete(t.config.apiUrl + version + '/users/logout', getOptions(userSessionToken))
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

  return tonicAxios.get(t.config.apiUrl + version + '/users/account', getOptions(userSessionToken))
}

// getUserBalance will first update a given user's balance from the chain and then return the user info
//
// For more information: https://docs.tonicpow.com/#8478765b-95b8-47ad-8b86-2db5bce54924
async function getUserBalance (t, userId) {
  return tonicAxios.get(t.config.apiUrl + version + '/users/balance/' + userId, getOptions())
}

// getUser will get a user by ID or email address
//
// For more information: https://docs.tonicpow.com/#e6f764a2-5a91-4680-aa5e-03409dd878d8
async function getUser (t, userId = 0, email = '') {
  let url = t.config.apiUrl + version + '/users/details?'

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

  return tonicAxios.post(t.config.apiUrl + version + '/users', user, getOptions())
}

// updateUser will update an existing user
//
// For more information: https://docs.tonicpow.com/#7c3c3c3a-f636-469f-a884-449cf6fb35fe
async function updateUser (t, user, userSessionToken = '') {
  return tonicAxios.put(t.config.apiUrl + version + '/users', user, getOptions(userSessionToken))
}

// forgotPassword will fire a forgot password request
//
// For more information: https://docs.tonicpow.com/#2c33dae4-d6b1-4949-9e84-fb02157ab7cd
async function forgotPassword (t, email) {
  return tonicAxios.post(t.config.apiUrl + version + '/users/password/forgot', { email: email }, getOptions())
}

// resetPassword will reset a password from a forgotPassword() request
//
// For more information: https://docs.tonicpow.com/#370fbeec-adb2-4ed3-82dc-2dffa840e490
async function resetPassword (t, resetToken, password, passwordConfirm) {
  return tonicAxios.put(t.config.apiUrl + version + '/users/password/reset', { token: resetToken, password: password, password_confirm: passwordConfirm }, getOptions())
}

// completeEmailVerification will complete an email verification with a given token
//
// For more information: https://docs.tonicpow.com/#f5081800-a224-4f36-8014-94981f0bd55d
async function completeEmailVerification (t, emailToken) {
  return tonicAxios.put(t.config.apiUrl + version + '/users/verify/email', { token: emailToken }, getOptions())
}

// completePhoneVerification will complete a phone verification with a given code and number
//
// For more information: https://docs.tonicpow.com/#573403c4-b872-475d-ac04-de32a88ecd19
async function completePhoneVerification (t, phone, phoneCode) {
  return tonicAxios.put(t.config.apiUrl + version + '/users/verify/phone', { phone: phone, phone_code: phoneCode }, getOptions())
}

// activateUser will activate a user (if all application criteria is met)
//
// For more information: https://docs.tonicpow.com/#aa499fdf-2492-43ee-99d4-fc9735676431
async function activateUser (t, userId) {
  return tonicAxios.put(t.config.apiUrl + version + '/users/status/activate', { id: userId }, getOptions())
}

// pauseUser will pause a user account (all payouts go to internal address)
//
// For more information: https://docs.tonicpow.com/#3307310d-86a9-4a5c-84ff-c38c581c77e5
async function pauseUser (t, userId, reason) {
  return tonicAxios.put(t.config.apiUrl + version + '/users/status/pause', { id: userId, reason: reason }, getOptions())
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
  return tonicAxios.post(t.config.apiUrl + version + '/advertisers', profile, getOptions(userSessionToken))
}

// getAdvertiserProfile will get an existing advertiser profile
// This will return an error if the profile is not found (404)
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#b3a62d35-7778-4314-9321-01f5266c3b51
async function getAdvertiserProfile (t, profileId, userSessionToken = '') {
  return tonicAxios.get(t.config.apiUrl + version + '/advertisers/details/' + profileId, getOptions(userSessionToken))
}

// updateAdvertiserProfile will update an existing profile
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#0cebd1ff-b1ce-4111-aff6-9d586f632a84
async function updateAdvertiserProfile (t, profile, userSessionToken = '') {
  return tonicAxios.put(t.config.apiUrl + version + '/advertisers', profile, getOptions(userSessionToken))
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
  return tonicAxios.post(t.config.apiUrl + version + '/campaigns', campaign, getOptions(userSessionToken))
}

// getCampaign will get an existing campaign
// This will return an error if the campaign is not found (404)
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#b827446b-be34-4678-b347-33c4f63dbf9e
async function getCampaign (t, campaignId, userSessionToken = '') {
  return tonicAxios.get(t.config.apiUrl + version + '/campaigns/details/' + campaignId, getOptions(userSessionToken))
}

// getCampaignBalance will update the models's balance from the chain
// This will return an error if the campaign is not found (404)
//
// For more information: https://docs.tonicpow.com/#b6c60c63-8ac5-4c74-a4a2-cf3e858e5a8d
async function getCampaignBalance (t, campaignId) {
  return tonicAxios.get(t.config.apiUrl + version + '/campaigns/balance/' + campaignId, getOptions())
}

// updateCampaign will update an existing campaign
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#665eefd6-da42-4ca9-853c-fd8ca1bf66b2
async function updateCampaign (t, campaign, userSessionToken = '') {
  return tonicAxios.put(t.config.apiUrl + version + '/campaigns', campaign, getOptions(userSessionToken))
}

// listCampaigns will return a list of active campaigns
// This will return an error if the campaign is not found (404)
//
// For more information: https://docs.tonicpow.com/#c1b17be6-cb10-48b3-a519-4686961ff41c
async function listCampaigns (t, customSessionToken = '') {
  return tonicAxios.get(t.config.apiUrl + version + '/campaigns/list', getOptions(customSessionToken))
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
  return tonicAxios.post(t.config.apiUrl + version + '/goals', goal, getOptions(userSessionToken))
}

// getGoal will get an existing goal
// This will return an error if the goal is not found (404)
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#48d7bbc8-5d7b-4078-87b7-25f545c3deaf
async function getGoal (t, goalId, userSessionToken = '') {
  return tonicAxios.get(t.config.apiUrl + version + '/goals/details/' + goalId, getOptions(userSessionToken))
}

// updateGoal will update an existing goal
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#395f5b7d-6a5d-49c8-b1ae-abf7f90b42a2
async function updateGoal (t, goal, userSessionToken = '') {
  return tonicAxios.put(t.config.apiUrl + version + '/goals', goal, getOptions(userSessionToken))
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
  return tonicAxios.get(t.config.apiUrl + version + '/conversions/details/' + conversionId, getOptions())
}

// createConversionByGoalID will fire a conversion for a given goal id, if successful it will make a new Conversion
//
// For more information: https://docs.tonicpow.com/#caeffdd5-eaad-4fc8-ac01-8288b50e8e27
async function createConversionByGoalID (t, goalId, tncpwSession, additionalData = '', delayInMinutes = 0) {
  let data = { goal_id: goalId, tncpw_session: tncpwSession, additional_data: additionalData, delay_in_minutes: delayInMinutes }
  return tonicAxios.post(t.config.apiUrl + version + '/conversions', data, getOptions())
}

// createConversionByGoalName will fire a conversion for a given goal name, if successful it will make a new Conversion
//
// For more information: https://docs.tonicpow.com/#d19c9850-3832-45b2-b880-3ef2f3b7dc37
async function createConversionByGoalName (t, goalName, tncpwSession, additionalData = '', delayInMinutes = 0) {
  let data = { name: goalName, tncpw_session: tncpwSession, additional_data: additionalData, delay_in_minutes: delayInMinutes }
  return tonicAxios.post(t.config.apiUrl + version + '/conversions', data, getOptions())
}

// createConversionByUserID will fire a conversion for a given goal and user id, if successful it will make a new Conversion
//
// For more information: https://docs.tonicpow.com/#d724f762-329e-473d-bdc4-aebc19dd9ea8
async function createConversionByUserID (t, goalId, userId, additionalData = '', delayInMinutes = 0) {
  let data = { goal_id: goalId, user_id: userId, additional_data: additionalData, delay_in_minutes: delayInMinutes }
  return tonicAxios.post(t.config.apiUrl + version + '/conversions', data, getOptions())
}

// cancelConversion will cancel an existing conversion (if delay was set and > 1 minute remaining)
//
// For more information: https://docs.tonicpow.com/#e650b083-bbb4-4ff7-9879-c14b1ab3f753
async function cancelConversion (t, conversionId, reason) {
  let data = { id: conversionId, reason: reason }
  return tonicAxios.put(t.config.apiUrl + version + '/conversions/cancel', data, getOptions())
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
  return tonicAxios.post(t.config.apiUrl + version + '/links', link, getOptions(userSessionToken))
}

// getLink will get an existing link
// This will return an error if the link is not found (404)
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#c53add03-303e-4f72-8847-2adfdb992eb3
async function getLink (t, linkId, userSessionToken = '') {
  return tonicAxios.get(t.config.apiUrl + version + '/links/details/' + linkId, getOptions(userSessionToken))
}

// checkLink will check for an existing link with a short_code
// This will return an error if the link is not found (404)
//
// For more information: https://docs.tonicpow.com/#cc9780b7-0d84-4a60-a28f-664b2ecb209b
async function checkLink (t, shortCode) {
  return tonicAxios.get(t.config.apiUrl + version + '/links/check/' + shortCode, getOptions())
}

//
// TonicPow API - Visitor Requests
// =====================================================================================================================
//

// createVisitorSession will make a new session for a visitor (used for goal conversions)
//
// For more information: https://docs.tonicpow.com/#29a93e9b-9726-474c-b25e-92586200a803
async function createVisitorSession (t, visitorSession) {
  return tonicAxios.post(t.config.apiUrl + version + '/visitors/sessions', visitorSession, getOptions())
}

// getVisitorSession will get a visitor session
// This will return an error if the session is not found (404)
//
// For more information: https://docs.tonicpow.com/#cf560448-6dda-42a6-9051-136afabe78e6
async function getVisitorSession (t, tncpwSession) {
  return tonicAxios.get(t.config.apiUrl + version + '/visitors/sessions/details/' + tncpwSession, getOptions())
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
    }

    // Wrap once
    wrapAxios(this)

    // Fire the init
    return new Promise(async (resolve, reject) => {
      try {
        blockBrowser()
        if (session.apiToken || (typeof customSessionToken === 'string' && customSessionToken.length > 0)) {
          this.session.apiToken = customSessionToken
          // await prolongSession(this, this.session.apiToken) (@mrz not needed)
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
  getUserBalance: async function (userId) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await getUserBalance(this, userId)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  createUser: async function (user) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
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
        await resetPassword(this, resetToken, password, passwordConfirm)
        resolve({ success: 'password set' })
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
  activateUser: async function (userId) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await activateUser(this, userId)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  pauseUser: async function (userId, reason) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await pauseUser(this, userId, reason)
        resolve(response.data)
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
  getCampaignBalance: async function (campaignId) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await getCampaignBalance(this, campaignId)
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
  listCampaigns: async function (customSessionToken = '') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        // this.session.userToken = customSessionToken (can't assume its a user)
        // setUserToken(this, userSessionToken)
        let response = await listCampaigns(this, customSessionToken)
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
  createConversionByGoalID: async function (goalId, tncpwSession, additionalData = '', delayInMinutes = 0) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await createConversionByGoalID(this, goalId, tncpwSession, additionalData, delayInMinutes)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  createConversionByGoalName: async function (goalName, tncpwSession, additionalData = '', delayInMinutes = 0) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await createConversionByGoalName(this, goalName, tncpwSession, additionalData, delayInMinutes)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  createConversionByUserID: async function (goalId, userId, additionalData = '', delayInMinutes = 0) {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await createConversionByUserID(this, goalId, userId, additionalData, delayInMinutes)
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
        let response = await getVisitorSession(this, tncpwSession)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  }
}
