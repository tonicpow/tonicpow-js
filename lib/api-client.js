const axios = require('axios'); // .default (@mrz what does this affect?)

// Current version for requests from the API
export const pkgVersion = 'v0.2.6';
export const apiVersion = 'v1';

// getOptions is a factory for axios default options
export const getOptions = function (t) {
  return {
    withCredentials: true,
    headers: {
      api_key: t.config.apiKey,
      'User-Agent': 'tonicpow-js ' + pkgVersion,
    },
  };
};

export const checkError = function (e) {
  if (typeof e.response !== 'undefined') {
    return e.response.data;
  }
  return e.message;
};

// This wraps axios for cookie management for API vs User session token
export const createApiClient = function (t) {
  const tonicAxios = axios.create();

  return {
    async post(path, data) {
      try {
        const response = await tonicAxios.post(
          t.config.apiUrl + apiVersion + path,
          data,
          getOptions(t),
        );
        return response && response.data ? response.data : response;
      } catch (e) {
        throw checkError(e);
      }
    },
    async put(path, data, rawResponse = false) {
      try {
        const response = await tonicAxios.put(
          t.config.apiUrl + apiVersion + path,
          data,
          getOptions(t),
        );

        if (rawResponse) {
          return response;
        }
        return response && response.data ? response.data : response;
      } catch (e) {
        throw checkError(e);
      }
    },
    async get(path, rawResponse = false) {
      try {
        const response = await tonicAxios.get(
          t.config.apiUrl + apiVersion + path,
          getOptions(t),
        );

        if (rawResponse) {
          return response;
        }
        return response && response.data ? response.data : response;
      } catch (e) {
        throw checkError(e);
      }
    },
    async delete(path) {
      try {
        const response = await tonicAxios.delete(
          t.config.apiUrl + apiVersion + path,
          getOptions(t),
        );
        return response && response.data ? response.data : response;
      } catch (e) {
        throw checkError(e);
      }
    },
  };
};
