"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_client_1 = require("./api-client");
class ApiMethods {
    constructor(options) {
        if (options) {
            this.options = options;
        }
    }
    getSession(callback) {
        const apiClient = new api_client_1.APIClient(this.options);
        return apiClient.sessions_get(callback);
    }
    triggerConversion(sessionId, conversionGoalId, callback) {
        const apiClient = new api_client_1.APIClient(this.options);
        return apiClient.conversions_trigger(sessionId, conversionGoalId, callback);
    }
}
const defaultOptions = {
    advertiser_public_key: null,
    advertiser_secret_key: null,
    api_url: 'https://api.tonicpow.com',
};
class TonicPow {
    constructor(providedOptions) {
        this.options = Object.assign({}, defaultOptions, providedOptions);
        this.api = new ApiMethods(this.options);
    }
}
exports.default = TonicPow;
function instance(options) {
    const mergedOptions = Object.assign({}, defaultOptions, options);
    return new TonicPow(mergedOptions);
}
exports.instance = instance;
try {
    if (window) {
        window['TonicPow'] = TonicPow;
    }
}
catch (ex) {
    // Window is not defined, must be running in windowless env....
}
