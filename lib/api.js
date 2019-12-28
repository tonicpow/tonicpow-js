// axios is the request handler with defaults
const axios = require('axios').default;

// axiosCookieJarSupport load the axios cookie jar support with defaults
const axiosCookieJarSupport = require('axios-cookiejar-support').default;

// tough is the tough-cookie package
const tough = require('tough-cookie');

// axiosCookieJarSupport is applying support to axios
axiosCookieJarSupport(axios);

// cookieJar is the tough cookie jar
const cookieJar = new tough.CookieJar();

// inBrowser is a flag for detected how this package was loaded
let inBrowser = (typeof window !== 'undefined')

// browserError is an error message for if requested via a web browser
let browserError = 'cannot do this request in a web browser'

// apiEndpoint is the api endpoint
let apiEndpoint = "http://localhost:3000/"

// version is the api version
let version = "v1"

// defaultOptions are defaults for each request
let defaultOptions = { jar: cookieJar, withCredentials: true }

// createSession will attempt to create a new session
async function createSession(key) {
  return axios.post(apiEndpoint + version + '/auth/session', {api_key:key}, defaultOptions)
}

// prolongSession will attempt to prolong a current session
async function prolongSession() {
  return axios.get(apiEndpoint + version + '/auth/session', defaultOptions)
}

// Export the modules / variables / methods
module.exports = {
  apiKey: '',
  load: async function(apiKey){
    this.apiKey = apiKey
    return new Promise(async(resolve, reject) => {
      if (inBrowser) {
        reject({ error: browserError })
        return
      }
      try {
        let x = await createSession(this.apiKey);
        resolve({success: "yes"})
      } catch(e){
        console.error(e)
        reject({ error: 'failed creating session' })
      }
    })
  },
  prolong: async function(){
    return new Promise(async(resolve, reject) => {
      if (inBrowser) {
        reject({ error: browserError })
        return
      }
      try {
        let x = await prolongSession();
        resolve({success: "prolong yes"})
      } catch(e){
        console.error(e)
        reject({ error: 'failed prolonging session' })
      }
    })
  }
}
