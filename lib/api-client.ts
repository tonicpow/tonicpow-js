import axios from 'axios';
import * as Cookies from 'js-cookie';

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

    sessions_get(callback?: Function): Promise<any> {
        return new Promise((resolve, reject) => {
            const val = Cookies.get('advertiser_public_key_cookie_' + this.options.advertiser_public_key);

            if (val && val !== '') {
                this.callbackAndResolve(resolve, val, callback);
            } else {
                this.callbackAndResolve(resolve, null, callback);
            }
        });
    }

    conversions_trigger(sessionId: string, conversionGoalId: string, callback?: Function): Promise<any> {
        return new Promise((resolve, reject) => {
            axios.post(this.fullUrl + `/conversions`, {
                    private_guid: this.options.advertiser_secret_key,
                    conversion_goal_name: conversionGoalId,
                    click_tx_id: sessionId,
                },
                {
                    headers: {}
                }
            ).then((response) => {
                this.callbackAndResolve(resolve, response.data, callback);
            }).catch((ex) => {
                this.callbackAndResolve(resolve, {
                    code: ex.response.status,
                    message: ex.message ? ex.message : ex.toString()
                }, callback)
            })
            this.callbackAndResolve(resolve, {}, callback);
        });
    }
}
