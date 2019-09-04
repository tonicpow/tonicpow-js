export interface TonicPowClientOptions {
    advertiser_public_key?: string;
    advertiser_secret_key?: string;
    api_url?: string;
}
/**
 * API Client
 */
export declare class APIClient {
    options: TonicPowClientOptions;
    fullUrl: any;
    constructor(options: any);
    /**
     * Resolve a promise and/or invoke a callback
     * @param resolveOrReject Resolve or reject function to call when done
     * @param data Data to pass forward
     * @param callback Invoke an optional callback first
     */
    private callbackAndResolve;
    sessions_get(offerId: string, callback?: Function): Promise<any>;
    conversions_trigger(sessionId: string, offerId: string, conversionGoalId: string, callback?: Function): Promise<any>;
}
