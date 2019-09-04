"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_client_1 = require("./api-client");
class ApiMethods {
    constructor(options) {
        if (options) {
            this.options = options;
        }
    }
    getSession(offerId, callback) {
        const apiClient = new api_client_1.APIClient(this.options);
        return apiClient.sessions_get(offerId, callback);
    }
    triggerConversion(sessionId, offerId, conversionGoalId, callback) {
        const apiClient = new api_client_1.APIClient(this.options);
        return apiClient.conversions_trigger(sessionId, offerId, conversionGoalId, callback);
    }
}
const defaultOptions = {
    advertiser_id: '',
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
