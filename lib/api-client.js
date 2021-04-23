const axios = require('axios'); // .default (@mrz what does this affect?)

export const tonicAxios = axios.create();

// Used internally for communication from req=>resp in axios
const internalHeaderKey = 'x-user-session-token';

// Current version for requests from the API
const pkgVersion = 'v0.1.77';
export const apiVersion = 'v1';

// getOptions is a factory for axios default options
export const getOptions = function (t, useCustomSessionToken = '') {
  // Set the default options and headers
  const defaultOptions = {
    withCredentials: true,
    headers: {
      api_key: t.config.apiKey,
      'User-Agent': 'tonicpow-js ' + pkgVersion,
    },
  };

  // Detect custom headers
  if (t.session.customHeaders) {
    Object.keys(t.session.customHeaders).forEach((key) => {
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
