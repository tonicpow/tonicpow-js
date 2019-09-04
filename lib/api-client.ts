import axios from 'axios';

export interface TonicPowClientOptions {
    advertiser_public_key?: string;
    advertiser_secret_key?: string;
    api_url?: string;
}

const defaultOptions: TonicPowClientOptions = {
    api_url: 'https://api.tonicpow.com',
}
/**
 * API Client
 */
export class APIClient {
    options = defaultOptions;
    fullUrl;
    constructor(options: any) {
        this.options = Object.assign({}, this.options, options);
        this.fullUrl = `${this.options.api_url}/`;
    }

    /**
     * Resolve a promise and/or invoke a callback
     * @param resolveOrReject Resolve or reject function to call when done
     * @param data Data to pass forward
     * @param callback Invoke an optional callback first
     */
    private callbackAndResolve(resolveOrReject: Function, data: any, callback?: Function) {
        if (callback) {
            callback(data);
        }
        if (resolveOrReject) {
            return resolveOrReject(data);
        }
    }

    sessions_get(offerId: string, callback?: Function): Promise<any> {
        return new Promise((resolve, reject) => {
            const cookies = document['tonicpow_advertiser_cookie'];
            console.log('cookies extracted', cookies, offerId);
            this.callbackAndResolve(resolve, cookies, callback);
        });
    }
    conversions_trigger(sessionId: string, offerId: string, conversionGoalId: string, callback?: Function): Promise<any> {
        return new Promise((resolve, reject) => {
            console.log('conversions_trigger', this.options.advertiser_secret_key, sessionId, offerId, conversionGoalId);
            this.callbackAndResolve(resolve, {}, callback);
        });
    }
}