// From API session cookie time (seconds) (48 hours)
const defaultMaxAge = 172800;

// From API requests (this is the cookie name that the API expects)
export const apiCookieName = 'session_token';

// From the short link service
export const visitorSessionKey = 'tncpw_session';

// extractSessionTokenFromHeader will extract a session token from a cookie header value
//
// Example `cookieHeader` Value: 'Cookie: session_token=this-is-the-session-token-value-getting-extracted; another_cookie=value; third_cookie=value'
// Example `cookieHeader` Value: 'Set-Cookie: session_token=this-is-the-session-token-value-getting-extracted; path="/";'
export const extractSessionTokenFromHeader = function (cookieHeader = '', cookieName = '') {
  // No header? pass what we got back
  if (!cookieHeader || cookieHeader.length < 10) {
    return cookieHeader;
  }

  // No cookie name? use the default
  if (!cookieName || cookieName.length < 1) {
    cookieName = apiCookieName;
  }

  // Replace any cookie prefixes, break them apart, trim spaces and decode
  const list = {};
  cookieHeader = cookieHeader.split('Set-Cookie:').join('');
  cookieHeader = cookieHeader.split('Cookie:').join('');
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURI(parts.join('='));
  });

  // If the cookie is NOT found, return the original value
  if (typeof list[cookieName] === 'undefined') {
    return cookieHeader;
  }

  // Return the extracted value
  return list[cookieName].trim();
};

// Session has our API session token values
export default class Session {
  constructor(options) {
    this.cookieName = apiCookieName;
    this.httpOnly = false;
    this.maxAge = defaultMaxAge;
    this.secureCookie = false;
    this.customSessionToken = '';

    if (options.hasOwnProperty('cookieDomain')) {
      this.cookieDomain = options.cookieDomain;
    }
    if (options.hasOwnProperty('cookieName')) {
      this.cookieName = options.cookieName;
    }
    if (options.hasOwnProperty('token')) {
      this.customSessionToken = options.token;
    }
    if (options.hasOwnProperty('maxAge')) {
      this.maxAge = options.maxAge;
    }
    if (options.hasOwnProperty('httpOnly')) {
      this.httpOnly = options.httpOnly;
    }
    if (options.hasOwnProperty('secureCookie')) {
      this.secureCookie = options.secureCookie;
    }
    if (options.hasOwnProperty('sameSite')) {
      this.sameSite = options.sameSite;
    }
  }

  // Max age of session cookie in seconds
  get maxAge() {
    return this._maxAge;
  }

  set maxAge(value) {
    if (typeof value === 'number') {
      if (value < 0) {
        this._maxAge = 0;
      } else {
        this._maxAge = Math.floor(value); // ensure it's an integer
      }
    }
  }

  // Cookie name for the session (if different from the default)
  get cookieName() {
    return this._cookieName;
  }

  set cookieName(value) {
    if (value && value.length > 1) {
      this._cookieName = value;
    }
  }

  // Cookie parameter for http only
  get httpOnly() {
    return this._httpOnly;
  }

  set httpOnly(value) {
    if (typeof value === 'boolean') {
      this._httpOnly = value;
    }
  }

  // Cookie parameter for http only
  get secureCookie() {
    return this._secureCookie;
  }

  set secureCookie(value) {
    if (typeof value === 'boolean') {
      this._secureCookie = value;
    }
  }

  // SameSite cookie parameter (strict, lax, or none)
  // From: https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-03
  // Cookies without a SameSite attribute will be treated as SameSite=Lax
  // Cookies with SameSite=None must also specify Secure, meaning they require a secure context
  get sameSite() {
    return this._sameSite;
  }

  set sameSite(value) {
    if (value && value.length > 1) {
      value = value.toLowerCase();
      if (value === 'strict') {
        this._sameSite = 'Strict';
      } else if (value === 'lax') {
        this._sameSite = 'Lax';
      } else if (value === 'none') {
        this._sameSite = 'None';
        this._secureCookie = true;
      }
    }
  }

  // (Optional) Cookie domain is used for generating cookies for the application developer
  get cookieDomain() {
    return this._cookieDomain;
  }

  set cookieDomain(value) {
    if (value && value.length > 1) {
      this._cookieDomain = value;
    }
  }

  // The current user session token
  get userToken() {
    return this._userToken;
  }

  set userToken(value) {
    // This can handle taking a raw cookie header
    if (value && (value.indexOf(':') !== -1 || value.indexOf(';') !== -1)) {
      value = extractSessionTokenFromHeader(value, this.cookieName);
    }

    // It will only set the value if it's not empty
    if (value && value.length > 0) {
      value = value.split(this.cookieName + '=').join('');
      value = value.split(apiCookieName + '=').join('');
      if (value !== 'delete') { // For safely removing the token
        this._userToken = value;
      } else {
        this._userToken = null;
      }
    }
  }

  // This is used for the visitor session
  get visitorSession() {
    return this._visitorSession;
  }

  set visitorSession(value) {
    // If we are a session token
    if (value && value.length === 64) {
      this._visitorSession = value;
    } else if (value === 'delete' || value.indexOf(visitorSessionKey) === -1) {
      this._visitorSession = null;
    } else {
      value = extractSessionTokenFromHeader(value, visitorSessionKey);
      if (value && value.length === 64) {
        this._visitorSession = value;
      } else {
        this._visitorSession = null;
      }
    }
  }

  // This helps generate a cookie for the user
  get userCookie() {
    // Set the max age
    let { maxAge } = this;
    let token = this.userToken;

    // Must have a user token (if empty, it's a LOGOUT)
    if (!this.userToken || this.userToken.length === 0) {
      maxAge = -1;
      token = '';
    }

    // Must have a cookie domain
    if (!this.cookieDomain || this.cookieDomain.length === 0) {
      return '';
    }

    // Build the cookie
    let cookie = this.cookieName + '=' + token + '; Domain=' + this.cookieDomain + '; Path=/;';
    if (maxAge > 0) {
      const d = new Date();
      d.setTime(d.getTime() + 1000 * maxAge);
      cookie += ' Expires=' + d.toGMTString() + ';';
      cookie += ' Max-Age=' + maxAge + ';';
    } else { // Return an expired cookie
      cookie += ' Expires=Sat, 25 Nov 1995 00:00:00 GMT;';
      cookie += ' Max-Age=-1;';
    }
    if (this.sameSite) {
      cookie += ' SameSite=' + this.sameSite + ';';
    }
    if (this.secureCookie) {
      cookie += ' Secure;';
    }
    if (this.httpOnly) {
      cookie += ' HttpOnly;';
    }
    return cookie;
  }

  // The current api session token
  get apiToken() {
    return this._apiToken;
  }

  set apiToken(value) {
    // This can handle taking a raw cookie header
    if (value && (value.indexOf(':') !== -1 || value.indexOf(';') !== -1)) {
      value = extractSessionTokenFromHeader(value, this.cookieName);
    }

    // It will only set the value if it's not empty
    if (value && value.length > 0) {
      value = value.split(this.cookieName + '=').join('');
      value = value.split(apiCookieName + '=').join('');
      if (value !== 'delete') { // For safely removing the token
        this._apiToken = value;
      } else {
        this._apiToken = null;
      }
    }
  }

  // The current custom headers
  get customHeaders() {
    return this._customHeaders;
  }

  set customHeaders(value) {
    if (value && typeof value === 'object') {
      this._customHeaders = value;
    } else {
      this._customHeaders = null;
    }
  }
}
