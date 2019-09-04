"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const defaultOptions = {
    api_url: 'https://api.tonicpow.com',
};
/**
 * API Client
 */
class APIClient {
    constructor(options) {
        this.options = defaultOptions;
        this.options = Object.assign({}, this.options, options);
        this.fullUrl = `${this.options.api_url}/`;
    }
    /**
     * Resolve a promise and/or invoke a callback
     * @param resolveOrReject Resolve or reject function to call when done
     * @param data Data to pass forward
     * @param callback Invoke an optional callback first
     */
    callbackAndResolve(resolveOrReject, data, callback) {
        if (callback) {
            callback(data);
        }
        if (resolveOrReject) {
            return resolveOrReject(data);
        }
    }
    sessions_get(offerId, callback) {
        return new Promise((resolve, reject) => {
            const cookies = document['tonicpow_advertiser_cookie'];
            console.log('cookies extracted', cookies, offerId);
            this.callbackAndResolve(resolve, cookies, callback);
        });
    }
    conversions_trigger(sessionId, offerId, conversionGoalId, callback) {
        return new Promise((resolve, reject) => {
            console.log('conversions_trigger', this.options.advertiser_secret_key, sessionId, offerId, conversionGoalId);
            this.callbackAndResolve(resolve, {}, callback);
        });
    }
}
exports.APIClient = APIClient;
