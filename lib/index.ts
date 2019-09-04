import { APIClient } from './api-client';

class ApiMethods {
  options;
  constructor(options?: any) {
    if (options) {
      this.options = options;
    }
  }

  getSession(callback?: Function): Promise<any> {
    const apiClient = new APIClient(this.options);
    return apiClient.sessions_get(callback);
  }

  triggerConversion(sessionId: string, conversionGoalId: string, callback?: Function): Promise<any> {
    const apiClient = new APIClient(this.options);
    return apiClient.conversions_trigger(sessionId, conversionGoalId, callback);
  }

}

const defaultOptions: any = {
  advertiser_public_key: null,
  advertiser_secret_key: null,
  api_url: 'https://api.tonicpow.com',
}

export default class TonicPow {
  options;
  api;
  constructor(providedOptions?: any) {
    this.options = Object.assign({}, defaultOptions, providedOptions);
    this.api = new ApiMethods(this.options);
  }
}

export function instance(options?: any): TonicPow {
  const mergedOptions = Object.assign({}, defaultOptions, options);
  return new TonicPow(mergedOptions);
}

try {
  if (window) {
    window['TonicPow'] = TonicPow;
  }
}
catch (ex) {
  // Window is not defined, must be running in windowless env....
}
