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
function getOptions (useCustomSessionToken='') {
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
function extractSessionTokenFromHeader (cookieHeader='') {
  if (!cookieHeader || cookieHeader.length < 10) {
    return cookieHeader
  }
  let list = {}
  cookieHeader = cookieHeader.replace('Cookie:', '')
  cookieHeader.split(';').forEach(function (cookie) {
    let parts = cookie.split('=')
    list[parts.shift().trim()] = decodeURI(parts.join('='))
  })
  if (typeof list[cookieName] === 'undefined') {
    return cookieHeader
  }
  return list[cookieName]
}

// Config for the API instance, environment, url, etc
let config = {
  environments: {
    Live: { name: 'live', url: 'https://api.tonicpow.com/' },
    Local: { name: 'local', url: 'http://localhost:3000/' },
    Mock: { name: 'mock', url: 'http://d9116720-5ac6-4c7f-a370-4ea578c63a66.mock.pstmn.io' },
    Staging: { name: 'staging', url: 'https://apistaging.tonicpow.com/' }
  },

  get apiKey () {
    return this._apiKey
  },

  set apiKey (value) {
    if (!value || value.length < 10) {
      throw Error('invalid api key')
    }
    this._apiKey = value
  },

  get apiUrl () {
    return this._apiUrl
  },

  set apiUrl (value) {
    if (value !== this.environments.Live.url && value !== this.environments.Local.url && value !== this.environments.Mock.url && value !== this.environments.Staging.url) {
      throw Error('invalid api url')
    }
    this._apiUrl = value
  },

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

  get userToken () {
    return this._userToken
  },

  set userToken (value) {
    // This can handle taking a raw cookie header
    if (value && (value.indexOf(':') !== -1 || value.indexOf(';') !== -1)) {
      value = extractSessionTokenFromHeader(value)
    }

    // It will only set the value if it's not empty
    if (value && value.length > 0) {
      if (value !== 'delete') { // For safely removing the token
        this._userToken = value
      } else {
        this._userToken = null
      }
    }
  },

  get apiToken () {
    return this._apiToken
  },

  set apiToken (value) {
    // This can handle taking a raw cookie header
    if (value && (value.indexOf(':') !== -1 || value.indexOf(';') !== -1)) {
      value = extractSessionTokenFromHeader(value)
    }

    // It will only set the value if it's not empty
    if (value && value.length > 0) {
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
  axios.interceptors.request.use(function (config) {
    // Are we making a request with a custom session token?
    if (typeof config.headers[internalHeaderKey] !== 'undefined') {
      config.jar.setCookie(cookieName + '=' + config.headers[internalHeaderKey] + '; Max-Age=172800; Path=/; HttpOnly;', config.url, function (err, cookies) {
        if (err) {
          throw Error(err.message)
        }
      })
      config.headers[internalHeaderKey] = 'set'
    } else if (t.session.apiToken) {
      config.jar.setCookie(cookieName + '=' + t.session.apiToken + '; Max-Age=172800; Path=/; HttpOnly;', config.url, function (err, cookies) {
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
  axios.interceptors.response.use(function (response) {
    // Save the cookie for api or user
    response.config.jar.getCookies(response.config.url, { allPaths: true }, function (err, cookies) {
      if (err) {
        throw Error(err.message)
      }
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

// checkError will check the response error from the api method
// Use the data response if found, otherwise fallback to error message
function checkError (e) {
  if (typeof e.response !== 'undefined') {
    return e.response.data
  }
  return e.message
}

//
// TonicPow API - User Requests
// =====================================================================================================================
//

// createSession will attempt to create a new api session
//
// For more information: https://docs.tonicpow.com/#632ed94a-3afd-4323-af91-bdf307a399d2
async function createSession (t) {
  return axios.post(t.config.apiUrl + version + '/auth/session', { api_key: t.config.apiKey }, getOptions())
}

// prolongSession will attempt to prolong a session (either the user or api)
//
// For more information: https://docs.tonicpow.com/#632ed94a-3afd-4323-af91-bdf307a399d2
async function prolongSession (t, userSessionToken='') {
  return axios.get(t.config.apiUrl + version + '/auth/session', getOptions(userSessionToken))
}

// endSession will end the given session token or the api token if none is given
//
// For more information: https://docs.tonicpow.com/#1dfeff1e-6c8d-4b32-904e-a19261b1f89e
async function endSession (t, userSessionToken='') {
  return axios.delete(t.config.apiUrl + version + '/auth/session', getOptions(userSessionToken))
}

// loginUser will attempt to login a user
//
// For more information: https://docs.tonicpow.com/#5cad3e9a-5931-44bf-b110-4c4b74c7a070
async function loginUser (t, email, password) {
  return axios.post(t.config.apiUrl + version + '/users/login', { email: email, password: password }, getOptions(t.session.apiToken))
}

// logoutUser will end the user session, if no session token set it will use the session.userToken
//
// For more information: https://docs.tonicpow.com/#39d65294-376a-4366-8f71-a02b08f9abdf
async function logoutUser (t, userSessionToken='') {
  // Missing token or empty token
  if (!userSessionToken || userSessionToken.length < 1) {
    throw Error('user session must be set')
  }

  return axios.delete(t.config.apiUrl + version + '/users/logout', getOptions(userSessionToken))
}

// currentUser will attempt get the profile for the current user or userSessionToken
//
// For more information: https://docs.tonicpow.com/#7f6e9b5d-8c7f-4afc-8e07-7aafdd891521
async function currentUser (t, userSessionToken='') {
  // Missing token or empty token
  if (!userSessionToken || userSessionToken.length < 1) {
    throw Error('user session must be set')
  }

  return axios.get(t.config.apiUrl + version + '/users/account', getOptions(userSessionToken))
}

// getUserBalance will first update a given user's balance from the chain and then return the user info
//
// For more information: https://docs.tonicpow.com/#8478765b-95b8-47ad-8b86-2db5bce54924
async function getUserBalance (t, userId) {
  return axios.get(t.config.apiUrl + version + '/users/balance/' + userId, getOptions())
}

// getUser will get a user by ID or email address
//
// For more information: https://docs.tonicpow.com/#e6f764a2-5a91-4680-aa5e-03409dd878d8
async function getUser (t, userId, email) {
  let url = t.config.apiUrl + version + '/users/details?'

  if (userId && userId > 0) {
    url += 'id=' + userId
  } else {
    url += 'email=' + email
  }

  return axios.get(url, getOptions())
}

// createUser will create a new user given the attributes
//
// For more information: https://docs.tonicpow.com/#8de84fb5-ba77-42cc-abb0-f3044cc871b6
async function createUser (t, user) {
  // Missing email
  if (!user || user.email.length < 1) {
    throw Error('email is required')
  }

  return axios.post(t.config.apiUrl + version + '/users', user, getOptions())
}

// updateUser will update an existing user
//
// For more information: https://docs.tonicpow.com/#7c3c3c3a-f636-469f-a884-449cf6fb35fe
async function updateUser (t, user, userSessionToken='') {
  return axios.put(t.config.apiUrl + version + '/users', user, getOptions(userSessionToken))
}

// forgotPassword will fire a forgot password request
//
// For more information: https://docs.tonicpow.com/#2c33dae4-d6b1-4949-9e84-fb02157ab7cd
async function forgotPassword (t, email) {
  return axios.post(t.config.apiUrl + version + '/users/password/forgot', { email: email }, getOptions())
}

// resetPassword will reset a password from a forgotPassword() request
//
// For more information: https://docs.tonicpow.com/#370fbeec-adb2-4ed3-82dc-2dffa840e490
async function resetPassword (t, resetToken, password, passwordConfirm) {
  return axios.put(t.config.apiUrl + version + '/users/password/reset', { token: resetToken, password: password, password_confirm: passwordConfirm }, getOptions())
}

// completeEmailVerification will complete an email verification with a given token
//
// For more information: https://docs.tonicpow.com/#f5081800-a224-4f36-8014-94981f0bd55d
async function completeEmailVerification (t, emailToken) {
  return axios.put(t.config.apiUrl + version + '/users/verify/email', { token: emailToken }, getOptions())
}

// completePhoneVerification will complete a phone verification with a given code and number
//
// For more information: https://docs.tonicpow.com/#573403c4-b872-475d-ac04-de32a88ecd19
async function completePhoneVerification (t, phone, phoneCode) {
  return axios.put(t.config.apiUrl + version + '/users/verify/phone', { phone: phone, phone_code: phoneCode }, getOptions())
}

//
// TonicPow API - Advertiser Profile Requests
// =====================================================================================================================
//

// createAdvertiserProfile will make a new advertiser profile
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#153c0b65-2d4c-4972-9aab-f791db05b37b
async function createAdvertiserProfile (t, profile, userSessionToken='') {
  return axios.post(t.config.apiUrl + version + '/advertisers', profile, getOptions(userSessionToken))
}

// getAdvertiserProfile will get an existing advertiser profile
// This will return an error if the profile is not found (404)
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#b3a62d35-7778-4314-9321-01f5266c3b51
async function getAdvertiserProfile (t, profileId, userSessionToken='') {
  return axios.get(t.config.apiUrl + version + '/advertisers/details/' + profileId, getOptions(userSessionToken))
}

// updateAdvertiserProfile will update an existing profile
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#0cebd1ff-b1ce-4111-aff6-9d586f632a84
async function updateAdvertiserProfile (t, profile, userSessionToken='') {
  return axios.put(t.config.apiUrl + version + '/advertisers', profile, getOptions(userSessionToken))
}

//
// TonicPow API - Campaign Requests
// =====================================================================================================================
//

// createCampaign will make a new campaign
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#b67e92bf-a481-44f6-a31d-26e6e0c521b1
async function createCampaign (t, campaign, userSessionToken='') {
  return axios.post(t.config.apiUrl + version + '/campaigns', campaign, getOptions(userSessionToken))
}

// getCampaign will get an existing campaign
// This will return an error if the campaign is not found (404)
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#b827446b-be34-4678-b347-33c4f63dbf9e
async function getCampaign (t, campaignId, userSessionToken='') {
  return axios.get(t.config.apiUrl + version + '/campaigns/details/' + campaignId, getOptions(userSessionToken))
}

// getCampaignBalance will update the models's balance from the chain
//
// For more information: https://docs.tonicpow.com/#b6c60c63-8ac5-4c74-a4a2-cf3e858e5a8d
async function getCampaignBalance (t, campaignId) {
  return axios.get(t.config.apiUrl + version + '/campaigns/balance/' + campaignId, getOptions())
}

// updateCampaign will update an existing campaign
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#665eefd6-da42-4ca9-853c-fd8ca1bf66b2
async function updateCampaign (t, campaign, userSessionToken='') {
  return axios.put(t.config.apiUrl + version + '/campaigns', campaign, getOptions(userSessionToken))
}

// listCampaigns will return a list of active campaigns
//
// For more information: https://docs.tonicpow.com/#c1b17be6-cb10-48b3-a519-4686961ff41c
async function listCampaigns (t, customSessionToken='') {
  return axios.get(t.config.apiUrl + version + '/campaigns/list', getOptions(customSessionToken))
}

//
// TonicPow API - Goal Requests
// =====================================================================================================================
//

// createGoal will make a new goal
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#29a93e9b-9726-474c-b25e-92586200a803
async function createGoal (t, goal, userSessionToken='') {
  return axios.post(t.config.apiUrl + version + '/goals', goal, getOptions(userSessionToken))
}

// getGoal will get an existing goal
// This will return an error if the goal is not found (404)
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#48d7bbc8-5d7b-4078-87b7-25f545c3deaf
async function getGoal (t, goalId, userSessionToken='') {
  return axios.get(t.config.apiUrl + version + '/goals/details/' + goalId, getOptions(userSessionToken))
}

// updateGoal will update an existing goal
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#395f5b7d-6a5d-49c8-b1ae-abf7f90b42a2
async function updateGoal (t, goal, userSessionToken='') {
  return axios.put(t.config.apiUrl + version + '/goals', goal, getOptions(userSessionToken))
}

// convertGoal will fire a conversion for a given goal, if successful it will make a new Conversion
//
// For more information: https://docs.tonicpow.com/#caeffdd5-eaad-4fc8-ac01-8288b50e8e27
async function convertGoal (t, goalName, visitorSessionId, additionalData='', customUserId='') {
  let data = { name: goalName, visitor_session_id: visitorSessionId, additional_data: additionalData, user_id: customUserId }
  return axios.post(t.config.apiUrl + version + '/goals/convert', data, getOptions())
}

//
// TonicPow API - Link Requests
// =====================================================================================================================
//

// createLink will make a new link
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#154bf9e1-6047-452f-a289-d21f507b0f1d
async function createLink (t, link, userSessionToken='') {
  return axios.post(t.config.apiUrl + version + '/links', link, getOptions(userSessionToken))
}

// getLink will get an existing link
// This will return an error if the link is not found (404)
// Use the userSessionToken if making request on behalf of another user
//
// For more information: https://docs.tonicpow.com/#c53add03-303e-4f72-8847-2adfdb992eb3
async function getLink (t, linkId, userSessionToken='') {
  return axios.get(t.config.apiUrl + version + '/links/details/' + linkId, getOptions(userSessionToken))
}

// checkLink will check for an existing link with a short_code
// This will return an error if the link is not found (404)
//
// For more information: https://docs.tonicpow.com/#cc9780b7-0d84-4a60-a28f-664b2ecb209b
async function checkLink (t, shortCode) {
  return axios.get(t.config.apiUrl + version + '/links/check/' + shortCode, getOptions())
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
  init: async function (apiKey, environment, customSessionToken='') {
    config.apiKey = apiKey
    config.environment = environment
    wrapAxios(this)
    return new Promise(async (resolve, reject) => {
      try {
        blockBrowser()
        if (session.apiToken || (typeof customSessionToken === 'string' && customSessionToken.length > 0)) {
          this.session.apiToken = customSessionToken
          //await prolongSession(this, this.session.apiToken)
        } else {
          await createSession(this)
        }
        resolve({ success: this.config.environment + ' api loaded' })
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  prolongSession: async function (customSessionToken='') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        await prolongSession(this, extractSessionTokenFromHeader(customSessionToken))
        resolve({ success: 'session prolonged' })
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  endSession: async function (customSessionToken='') {
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
  logoutUser: async function (userSessionToken='') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        this.session.userToken = userSessionToken
        await logoutUser(this, this.session.userToken)
        resolve({ success: 'user logged out' })
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  currentUser: async function (userSessionToken='') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        this.session.userToken = userSessionToken
        let response = await currentUser(this, this.session.userToken)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  getUser: async function (userId=0, email='') {
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
  updateUser: async function (user, userSessionToken='') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await updateUser(this, user, userSessionToken)
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
  createAdvertiserProfile: async function (profile, userSessionToken='') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await createAdvertiserProfile(this, profile, userSessionToken)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  getAdvertiserProfile: async function (profileId, userSessionToken='') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await getAdvertiserProfile(this, profileId, userSessionToken)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  updateAdvertiserProfile: async function (profile, userSessionToken='') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await updateAdvertiserProfile(this, profile, userSessionToken)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  createCampaign: async function (campaign, userSessionToken='') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await createCampaign(this, campaign, userSessionToken)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  getCampaign: async function (campaignId, userSessionToken='') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await getCampaign(this, campaignId, userSessionToken)
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
  updateCampaign: async function (campaign, userSessionToken='') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await updateCampaign(this, campaign, userSessionToken)
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
        let response = await listCampaigns(this, customSessionToken)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  createGoal: async function (goal, userSessionToken='') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await createGoal(this, goal, userSessionToken)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  getGoal: async function (goalId, userSessionToken='') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await getGoal(this, goalId, userSessionToken)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  updateGoal: async function (goal, userSessionToken='') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await updateGoal(this, goal, userSessionToken)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  convertGoal: async function (goalName, visitorSessionId, additionalData='', customUserId='') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await convertGoal(this, goalName, visitorSessionId, additionalData, customUserId)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  createLink: async function (link, userSessionToken='') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await createLink(this, link, userSessionToken)
        resolve(response.data)
      } catch (e) {
        reject(checkError(e))
      }
    })
  },
  getLink: async function (linkId, userSessionToken='') {
    return new Promise(async (resolve, reject) => {
      try {
        initCheck(this.loaded)
        let response = await getLink(this, linkId, userSessionToken)
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
  }
}
