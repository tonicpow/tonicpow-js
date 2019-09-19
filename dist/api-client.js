"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const Cookies = require("js-cookie");
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
    sessions_get(callback) {
        return new Promise((resolve, reject) => {
            const val = Cookies.get('advertiser_public_key_cookie_' + this.options.advertiser_public_key);
            if (val && val !== '') {
                this.callbackAndResolve(resolve, val, callback);
            }
            else {
                this.callbackAndResolve(resolve, null, callback);
            }
        });
    }
    conversions_trigger(sessionId, conversionGoalId, callback) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(this.fullUrl + `conversions`, {
                private_guid: this.options.advertiser_secret_key,
                conversion_goal_name: conversionGoalId,
                click_tx_id: sessionId,
            }, {
                headers: {}
            }).then((response) => {
                this.callbackAndResolve(resolve, response.data, callback);
            }).catch((ex) => {
                this.callbackAndResolve(resolve, {
                    code: ex.response.status,
                    message: ex.message ? ex.message : ex.toString()
                }, callback);
            });
            this.callbackAndResolve(resolve, {}, callback);
        });
    }
}
exports.APIClient = APIClient;
