// Load axios, cookie jar support, and tough-cookie dependencies
// axiosCookieJarSupport is applying support to axios for cookie jar management
import { apiCookieName } from './session';

const axios = require('axios');
// .default (@mrz what does this affect?)
export const tonicAxios = axios.create();
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');

axiosCookieJarSupport(tonicAxios);
export const cookieJar = new tough.CookieJar();

// Used internally for communication from req=>resp in axios
const internalHeaderKey = 'x-user-session-token';

// Current version for requests from the API
const pkgVersion = 'v0.1.77';
export const apiVersion = 'v1';

// getOptions is a factory for axios default options
export const getOptions = function (t, useCustomSessionToken = '') {
  // Set the default options and headers
  const defaultOptions = {
    jar: cookieJar,
    withCredentials: true,
    headers: {
      'User-Agent': 'tonicpow-js ' + pkgVersion,
    },
  };

  // Detect custom headers
  if (t.session.customHeaders) {
    Object.keys(t.session.customHeaders)
      .forEach((key) => {
        defaultOptions.headers[key] = t.session.customHeaders[key];
      });
  }

  // Set the user session token if set
  if (useCustomSessionToken && useCustomSessionToken.length > 0) {
    defaultOptions.headers[internalHeaderKey] = useCustomSessionToken;
  }

  return defaultOptions;
};

// setUserToken will set the token if found, otherwise return empty token
// This takes a raw value, parses cookies, sets token, and returns a string
const setUserToken = function (t, token) {
  if (token && token.length > 1) {
    t.session.userToken = token;
    return t.session.userToken;
  }
  return '';
};

export const checkError = function (e) {
  if (typeof e.response !== 'undefined') {
    return e.response.data;
  }
  return e.message;
};

// This wraps axios for cookie management for API vs User session token
export const createApiClient = function (t) {
  // Modify the request before sending (cookie management)
  tonicAxios.interceptors.request.use((config) => {
    // Are we making a request with a custom session token?
    if (typeof config.headers[internalHeaderKey] !== 'undefined') {
      const cookie = apiCookieName + '=' + config.headers[internalHeaderKey]
        + '; Max-Age=' + t.session.maxAge
        + '; Path=/; HttpOnly;';
      config.jar.setCookie(cookie, config.url, (err) => {
        if (err) {
          // console.error(err.message)
          throw Error(err.message);
        }
      });
      config.headers[internalHeaderKey] = 'set';
    } else if (t.session.apiToken) {
      const cookie = apiCookieName + '=' + t.session.apiToken
        + '; Max-Age=' + t.session.maxAge
        + '; Path=/; HttpOnly;';
      config.jar.setCookie(cookie, config.url, (err) => {
        if (err) {
          // console.error(err.message)
          throw Error(err.message);
        }
      });
    }

    return config;
  }, (e) => {
    return Promise.reject(e);
  });

  // Modify the response after sending (cookie management)
  tonicAxios.interceptors.response.use((response) => {
    // Clear custom headers
    t.session.customHeaders = null;

    // Save the cookie for api or user
    response.config.jar.getCookies(response.config.url, { allPaths: true }, (err, cookies) => {
      if (err) {
        // console.error(err.message)
        throw Error(err.message);
      }
      if (cookies.length > 0) {
        for (let i = 0; i < cookies.length; i++) {
          if (cookies[i].key === apiCookieName) {
            // Set the user cookie if header was set
            if (typeof response.config.headers[internalHeaderKey] !== 'undefined') {
              // If we don't have an api cookie, then this is for the api
              if (t.session.apiToken) {
                t.session.userToken = cookies[i].value;
              } else {
                t.session.apiToken = cookies[i].value;
              }
            } else {
              t.session.apiToken = cookies[i].value;
            }
            break;
          }
        }
      } else if (typeof response.config.headers[internalHeaderKey] !== 'undefined') {
        const tokenSet = (
          t.session.userToken.length > 0
          && response.config.headers[internalHeaderKey] === t.session.userToken
        );
        if (tokenSet || response.config.headers[internalHeaderKey] === 'set') {
          t.session.userToken = 'delete';
        }
      } else {
        t.session.apiToken = 'delete';
      }
    });
    return response;
  }, (e) => {
    return Promise.reject(e);
  });

  return {
    async post(path, data, sessionToken = '') {
      try {
        sessionToken = setUserToken(t, sessionToken);
        const response = await tonicAxios.post(
          t.config.apiUrl + apiVersion + path,
          data,
          getOptions(t, sessionToken),
        );
        return response && response.data ? response.data : response;
      } catch (e) {
        throw checkError(e);
      }
    },
    async put(path, data, sessionToken = '', rawResponse = false) {
      try {
        sessionToken = setUserToken(t, sessionToken);
        const response = await tonicAxios.put(
          t.config.apiUrl + apiVersion + path,
          data,
          getOptions(t, sessionToken),
        );

        if (rawResponse) {
          return response;
        }
        return response && response.data ? response.data : response;
      } catch (e) {
        throw checkError(e);
      }
    },
    async putRaw(path, data, sessionToken = '') {
      return this.put(path, data, sessionToken, true);
    },
    async get(path, sessionToken = '', rawResponse = false) {
      try {
        sessionToken = setUserToken(t, sessionToken);
        const response = await tonicAxios.get(
          t.config.apiUrl + apiVersion + path,
          getOptions(t, sessionToken),
        );

        if (rawResponse) {
          return response;
        }
        return response && response.data ? response.data : response;
      } catch (e) {
        throw checkError(e);
      }
    },
    async getRaw(path, sessionToken = '') {
      return this.get(path, sessionToken, true);
    },
    async delete(path, sessionToken = '') {
      try {
        sessionToken = setUserToken(t, sessionToken);
        const response = await tonicAxios.delete(
          t.config.apiUrl + apiVersion + path,
          getOptions(t, sessionToken),
        );
        return response && response.data ? response.data : response;
      } catch (e) {
        throw checkError(e);
      }
    },
  };
};
