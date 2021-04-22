import { isNode } from "browser-or-node";
import Config from './config';
import Session, { extractSessionTokenFromHeader, visitorSessionKey } from './session';
import { createApiClient, checkError } from './api-client';

/**
 * TonicPow JavaScript API class
 */
class TonicPow {
  constructor(apiKey, options = {}) {
    // Set any defaults
    this.session = new Session(options);
    this.config = new Config(apiKey, options);
    this.apiClient = createApiClient(this);
  }

  /**
   * Authenticate against the backend and create a session
   *
   * For more information: https://docs.tonicpow.com/#632ed94a-3afd-4323-af91-bdf307a399d2
   *
   * @returns {Promise}
   */
  async auth() {
    // Fire the auth
    if (!isNode) {
      throw Error('cannot do this request in a web browser');
    }

    if (typeof this.session.customSessionToken === 'string' && this.session.customSessionToken.length > 0) {
      this.session.apiToken = this.session.customSessionToken;
    } else if (this.session.apiToken && this.session.apiToken.length > 0) {
      // Do nothing
    } else {
       await this.apiClient.post(
        '/auth/session',
        {
          api_key: this.config.apiKey
        }
      );
    }

    return { success: this.config.environment + ' api authenticated' };
  }

  /**
   * Initialize a new TonicPow instance and authenticate with the given api key
   *
   * Called like this:
   *   const tonicPow = TonicPow.init(apiKey, options);
   *
   * This is short hand for:
   *   const tonicPow = new TonicPow(apiKey, options);
   *   await tonicPow.auth();
   *
   * @param apiKey
   * @param options
   * @returns {Promise<TonicPow>}
   */
  static async init(apiKey, options = {}) {
    const tonicPow = new TonicPow(apiKey, options);
    await tonicPow.auth();
    return tonicPow;
  }

  /**
   * prolongSession will attempt to prolong a session (either the user or api)
   *
   * For more information: https://docs.tonicpow.com/#632ed94a-3afd-4323-af91-bdf307a399d2
   *
   * @param customSessionToken
   * @returns {Promise}
   */
  async prolongSession(customSessionToken = '') {
    return this.apiClient.get('/auth/session', customSessionToken);
  }

  /**
   * endSession will end the given session token or the api token if none is give
   *
   * For more information: https://docs.tonicpow.com/#1dfeff1e-6c8d-4b32-904e-a19261b1f89e
   *
   * @param customSessionToken
   * @returns {Promise}
   */
  async endSession(customSessionToken = '') {
    await this.apiClient.delete('/auth/session', customSessionToken);
    return { success: 'session ended' };
  }

  /**
   * loginUser will attempt to login a user
   *
   * For more information: https://docs.tonicpow.com/#5cad3e9a-5931-44bf-b110-4c4b74c7a070
   *
   * @param email
   * @param password
   * @returns {Promise}
   */
  async loginUser(email, password) {
    await this.apiClient.post('/users/login', { email: email, password: password }, this.session.apiToken);
    return { success: 'user logged in' };
  }

  /**
   * logoutUser will end the user session, if no session token set it will use the session.userToken
   *
   * For more information: https://docs.tonicpow.com/#39d65294-376a-4366-8f71-a02b08f9abdf
   *
   * @param userSessionToken
   * @returns {Promise}
   */
  async logoutUser(userSessionToken = '') {
    // Missing token or empty token (fall back to the current user session token)
    if (!userSessionToken || userSessionToken.length < 1) {
      if (!this.session.userToken || this.session.userToken.length < 1) {
        throw Error('user session must be set')
      }
      userSessionToken = this.session.userToken
    }
    await this.apiClient.delete('/users/logout', userSessionToken);
    return { success: 'user logged out' };
  }

  /**
   * currentUser will attempt get the profile for the current user or userSessionToken
   *
   * For more information: https://docs.tonicpow.com/#7f6e9b5d-8c7f-4afc-8e07-7aafdd891521
   *
   * @param userSessionToken
   * @returns {Promise}
   */
  async currentUser(userSessionToken = '') {
    // Missing token or empty token (fall back to the current user session token)
    if (!userSessionToken || userSessionToken.length < 1) {
      if (!this.session.userToken || this.session.userToken.length < 1) {
        throw Error('user session must be set')
      }
      userSessionToken = this.session.userToken
    }
    return this.apiClient.get('/users/account', userSessionToken);
  }

  /**
   * getUser will get a user by ID or email address
   *
   * For more information: https://docs.tonicpow.com/#e6f764a2-5a91-4680-aa5e-03409dd878d8
   *
   * @param userId
   * @param email
   * @returns {Promise}
   */
  async getUser(userId = 0, email = '') {
    let url = '/users/details?'

    if (userId && userId > 0) {
      url += 'id=' + userId
    } else {
      email = email.split('+').join('%2B')
      url += 'email=' + email
    }

    return this.apiClient.get(url);
  }

  /**
   * getUserBalance will first update a given user's balance from the chain and then return the user info
   *
   * For more information: https://docs.tonicpow.com/#8478765b-95b8-47ad-8b86-2db5bce54924
   *
   * @param userId
   * @param lastBalance
   * @returns {Promise}
   */
  async getUserBalance(userId, lastBalance = 0) {
    return this.apiClient.get('/users/balance/' + userId + '?last_balance=' + lastBalance);
  }

  /**
   * getUserReferrals will return all the related referrals to the given user
   *
   * Use either an ID or email to get an existing user
   *
   * For more information: https://docs.tonicpow.com/#fa7ee5a6-c87d-4e01-8ad3-ef6bda39533b
   *
   * @param userId
   * @param email
   * @returns {Promise}
   */
  async getUserReferrals(userId = 0, email = '') {
    let url = '/users/referred?'

    if (userId && userId > 0) {
      url += 'id=' + userId
    } else {
      email = email.split('+').join('%2B')
      url += 'email=' + email
    }

    return this.apiClient.get(url)
  }

  /**
   * listUserReferrals will return a list of active users that have referrals
   *
   * This will return an error if no users are found (404)
   *
   * For more information: https://docs.tonicpow.com/#3fd8e647-abfa-422f-90af-952cccd3be7c
   *
   * @param page
   * @param resultsPerPage
   * @param sortBy
   * @param sortOrder
   * @returns {Promise}
   */
  async listUserReferrals(page = 1, resultsPerPage = 20, sortBy = '', sortOrder = '') {
    return this.apiClient.get(
      '/users/referrals?current_page=' + page
      + '&results_per_page=' + resultsPerPage
      + '&sort_by=' + sortBy
      + '&sort_order=' + sortOrder
    );
  }

  /**
   * createUser will create a new user given the attributes
   *
   * For more information: https://docs.tonicpow.com/#8de84fb5-ba77-42cc-abb0-f3044cc871b6
   *
   * @param user
   * @param referredVisitorSession
   * @param referredUserId
   * @returns {Promise}
   */
  async createUser(user, referredVisitorSession = '', referredUserId = 0) {
    if (referredVisitorSession && referredVisitorSession.length > 0) {
      user[visitorSessionKey] = extractSessionTokenFromHeader(referredVisitorSession, visitorSessionKey);
    }
    if (referredUserId && referredUserId > 0) {
      user['referred_by_user_id'] = referredUserId;
    }
    // Missing email
    if (!user || user.email.length < 1) {
      throw Error('email is required')
    }

    return this.apiClient.post('/users', user);
  }

  /**
   * updateUser will update an existing user
   *
   * For more information: https://docs.tonicpow.com/#7c3c3c3a-f636-469f-a884-449cf6fb35fe
   *
   * @param user
   * @param userSessionToken
   * @returns {Promise}
   */
  async updateUser(user, userSessionToken = '') {
    return this.apiClient.put('/users', user, userSessionToken);
  }

  /**
   * forgotPassword will fire a forgot password request
   *
   * For more information: https://docs.tonicpow.com/#2c33dae4-d6b1-4949-9e84-fb02157ab7cd
   *
   * @param email
   * @returns {Promise}
   */
  async forgotPassword(email) {
    await this.apiClient.post('/users/password/forgot', { email: email });
    return { success: 'forgot password email sent' };
  }

  /**
   * resetPassword will reset a password from a forgotPassword() request
   *
   * For more information: https://docs.tonicpow.com/#370fbeec-adb2-4ed3-82dc-2dffa840e490
   *
   * @param resetToken
   * @param password
   * @param passwordConfirm
   * @returns {Promise}
   */
  async resetPassword(resetToken, password, passwordConfirm) {
    const response = await this.apiClient.putRaw('/users/password/reset', {
      token: resetToken,
      password: password,
      password_confirm: passwordConfirm
    });

    let email = '';
    if (response.headers && response.headers['user-address']) {
      email = response.headers['user-address'];
    }

    return { success: 'password set', email: email };
  }

  /**
   * resendEmailVerification will resend an email to the user
   *
   * Use the userSessionToken if the current user is making the request
   *
   * For more information: https://docs.tonicpow.com/#a12a3eff-491b-4079-99f6-07497b9e4efe
   *
   * @param userId
   * @param userSessionToken
   * @returns {Promise}
   */
  async resendEmailVerification(userId, userSessionToken = '') {
    await this.apiClient.post('/users/verify/email/send', { id: userId }, userSessionToken)
    return { success: 'verification sent' };
  }

  /**
   * completeEmailVerification will complete an email verification with a given token
   *
   * For more information: https://docs.tonicpow.com/#f5081800-a224-4f36-8014-94981f0bd55d
   *
   * @param emailToken
   * @returns {Promise}
   */
  async completeEmailVerification(emailToken) {
    await this.apiClient.put('/users/verify/email', { token: emailToken })
    return { success: 'email verified' };
  }

  /**
   * resendPhoneVerification will resend a phone verification code to the user
   *
   * Use the userSessionToken if the current user is making the request
   *
   * For more information: https://docs.tonicpow.com/#fcc4fe4d-f298-45bd-b51e-a5c107834528
   *
   * @param userId
   * @param userSessionToken
   * @returns {Promise<{success: string}>}
   */
  async resendPhoneVerification(userId, userSessionToken = '') {
    await this.apiClient.post('/users/verify/phone/send', { id: userId }, userSessionToken)
    return { success: 'verification sent' };
  }

  /**
   * completePhoneVerification will complete a phone verification with a given code and number
   *
   * For more information: https://docs.tonicpow.com/#573403c4-b872-475d-ac04-de32a88ecd19
   *
   * @param phone
   * @param phoneCode
   * @returns {Promise}
   */
  async completePhoneVerification(phone, phoneCode) {
    await this.apiClient.put('/users/verify/phone', { phone: phone, phone_code: phoneCode });
    return { success: 'phone verified' };
  }

  /**
   * requestActivation will send a request for activation
   *
   * For more information: https://docs.tonicpow.com/#c3d2f569-dc5e-4885-9701-a58522cb92cf
   *
   * @param userSessionToken
   * @returns {Promise}
   */
  async requestActivation(userSessionToken = '') {
    // Missing token or empty token (fall back to the current user session token)
    if (!userSessionToken || userSessionToken.length < 1) {
      if (!this.session.userToken || this.session.userToken.length < 1) {
        throw Error('user session must be set')
      }
      userSessionToken = this.session.userToken
    }

    await this.apiClient.put('/users/status/request', '', userSessionToken)
    return { success: 'activation requested' };
  }

  /**
   * acceptUser will accept a user (if approval is required for new users)
   *
   * use id or email to select the user
   * reason is optional
   *
   * For more information: https://docs.tonicpow.com/#65c3962d-c309-4ef4-b85f-7ec1f08f031b
   *
   * @param userId
   * @param email
   * @param reason
   * @returns {Promise}
   */
  async acceptUser(userId = 0, email = '', reason = '') {
    await this.apiClient.put('/users/status/accept', { id: userId, email: email, reason: reason })
    return { success: 'user accepted' };
  }

  /**
   * activateUser will activate a user (if all application criteria is met)
   *
   * use id or email to select the user
   *
   * For more information: https://docs.tonicpow.com/#aa499fdf-2492-43ee-99d4-fc9735676431
   *
   * @param userId
   * @param email
   * @returns {Promise}
   */
  async activateUser(userId = 0, email = '') {
    await this.apiClient.put('/users/status/activate', { id: userId, email: email });
    return { success: 'user activated' };
  }

  /**
   * pauseUser will pause a user account (all payouts go to internal address)
   * use id or email to select the user
   *
   * For more information: https://docs.tonicpow.com/#3307310d-86a9-4a5c-84ff-c38c581c77e5
   *
   * @param userId
   * @param reason
   * @param email
   * @returns {Promise}
   */
  async pauseUser(userId = 0, reason = '', email = '') {
    await this.apiClient.put('/users/status/pause', { id: userId, reason: reason, email: email });
    return { success: 'user paused' };
  }

  /**
   * userExists will check if a user exists by email address
   *
   * This will return an error if the user is not found (404)
   *
   * For more information: https://docs.tonicpow.com/#2d8c37d4-c88b-4cec-83ad-fa72b0f41f17
   *
   * @param email
   * @returns {Promise}
   */
  async userExists(email) {
    try {
      const response = await this.apiClient.getRaw('/users/exists?email=' + email);
      response.data['exists'] = true;
      return response.data;
    } catch (e) {
      if (typeof e.response !== 'undefined' && e.response.data.status_code === 404) {
        return { exists: false };
      }
      throw checkError(e);
    }
  }

  /**
   * releaseUserBalance will send the internal balance to the user's payout_address
   *
   * For more information: https://docs.tonicpow.com/#be82b6cb-7fe8-4f03-9b0c-dbade8f2d40f
   *
   * @param userId
   * @param reason
   * @returns {Promise}
   */
  async releaseUserBalance(userId, reason = '') {
    await this.apiClient.put('/users/wallet/release', { id: userId, reason: reason });
    return { success: 'user balance released' };
  }

  /**
   * refundUserBalance will send the internal balance back to the corresponding campaigns
   *
   * Reason field is required
   *
   * For more information: https://docs.tonicpow.com/#c373c7ed-189d-4aa6-88da-c4a58955fd28
   *
   * @param userId
   * @param reason
   * @returns {Promise}
   */
  async refundUserBalance(userId, reason) {
    await this.apiClient.put('/users/wallet/refund', { id: userId, reason: reason });
    return { success: 'user balance refunded' };
  }

  /**
   * createAdvertiserProfile will make a new advertiser profile
   *
   * Use the userSessionToken if making request on behalf of another user
   *
   * For more information: https://docs.tonicpow.com/#153c0b65-2d4c-4972-9aab-f791db05b37b
   *
   * @param profile
   * @param userSessionToken
   * @returns {Promise}
   */
  async createAdvertiserProfile(profile, userSessionToken = '') {
    return this.apiClient.post('/advertisers', profile, userSessionToken);
  }

  /**
   * getAdvertiserProfile will get an existing advertiser profile
   *
   * This will return an error if the profile is not found (404)
   * Use the userSessionToken if making request on behalf of another user
   *
   * For more information: https://docs.tonicpow.com/#b3a62d35-7778-4314-9321-01f5266c3b51
   *
   * @param profileId
   * @param userSessionToken
   * @returns {Promise}
   */
  async getAdvertiserProfile(profileId, userSessionToken = '') {
    return this.apiClient.get('/advertisers/details/' + profileId, userSessionToken)
  }

  /**
   * updateAdvertiserProfile will update an existing profile
   *
   * Use the userSessionToken if making request on behalf of another user
   *
   * For more information: https://docs.tonicpow.com/#0cebd1ff-b1ce-4111-aff6-9d586f632a84
   *
   * @param profile
   * @param userSessionToken
   * @returns {Promise}
   */
  async updateAdvertiserProfile(profile, userSessionToken = '') {
    return this.apiClient.put('/advertisers', profile, userSessionToken);
  }

  /**
   * listCampaignsByAdvertiserProfile will return a list of campaigns
   *
   * This will return an error if the campaign is not found (404)
   *
   * For more information: https://docs.tonicpow.com/#98017e9a-37dd-4810-9483-b6c400572e0c
   *
   * @param profileId
   * @param page
   * @param resultsPerPage
   * @param sortBy
   * @param sortOrder
   * @returns {Promise}
   */
  async listCampaignsByAdvertiserProfile(profileId, page = 1, resultsPerPage = 20, sortBy = '', sortOrder = '') {
    return this.apiClient.get(
      '/advertisers/campaigns/' + profileId
      + '?current_page=' + page
      + '&results_per_page=' + resultsPerPage
      + '&sort_by=' + sortBy
      + '&sort_order=' + sortOrder
    );
  }

  /**
   * createCampaign will make a new campaign
   *
   * Use the userSessionToken if making request on behalf of another user
   *
   * For more information: https://docs.tonicpow.com/#b67e92bf-a481-44f6-a31d-26e6e0c521b1
   *
   * @param campaign
   * @param userSessionToken
   * @returns {Promise}
   */
  async createCampaign(campaign, userSessionToken = '') {
    return this.apiClient.post('/campaigns', campaign, userSessionToken);
  }

  /**
   * getCampaign will get an existing campaign
   *
   * This will return an error if the campaign is not found (404)
   * Use the userSessionToken if making request on behalf of another user
   *
   * For more information: https://docs.tonicpow.com/#b827446b-be34-4678-b347-33c4f63dbf9e
   *
   * @param campaignId
   * @param userSessionToken
   * @returns {Promise}
   */
  async getCampaign(campaignId, userSessionToken = '') {
    return this.apiClient.get('/campaigns/details/' + campaignId, userSessionToken)
  }

  /**
   * getCampaignByShortCode will get an existing campaign via a short code from a link
   *
   * This will return an error if the campaign is not found (404)
   * Use the userSessionToken if making request on behalf of another user
   *
   * For more information: https://docs.tonicpow.com/#8451b92f-ea74-47aa-8ac1-c96647e2dbfd
   *
   * @param shortCode
   * @param userSessionToken
   * @returns {Promise}
   */
  async getCampaignByShortCode(shortCode, userSessionToken = '') {
    return this.apiClient.get('/campaigns/link/' + shortCode, userSessionToken)
  }

  /**
   * getCampaignBalance will update the model's balance from the chain
   *
   * This will return an error if the campaign is not found (404)
   *
   * For more information: https://docs.tonicpow.com/#b6c60c63-8ac5-4c74-a4a2-cf3e858e5a8d
   *
   * @param campaignId
   * @param lastBalance
   * @returns {Promise}
   */
  async getCampaignBalance(campaignId, lastBalance = 0) {
    return this.apiClient.get('/campaigns/balance/' + campaignId + '?last_balance=' + lastBalance);
  }

  /**
   * updateCampaign will update an existing campaign
   *
   * Use the userSessionToken if making request on behalf of another user
   *
   * For more information: https://docs.tonicpow.com/#665eefd6-da42-4ca9-853c-fd8ca1bf66b2
   *
   * @param campaign
   * @param userSessionToken
   * @returns {Promise}
   */
  async updateCampaign(campaign, userSessionToken = '') {
    return this.apiClient.put('/campaigns', campaign, userSessionToken);
  }

  /**
   * listCampaigns will return a list of active campaigns
   *
   * This will return an error if the campaign is not found (404)
   *
   * For more information: https://docs.tonicpow.com/#c1b17be6-cb10-48b3-a519-4686961ff41c
   *
   * @param customSessionToken
   * @param page
   * @param resultsPerPage
   * @param sortBy
   * @param sortOrder
   * @returns {Promise}
   */
  async listCampaigns(customSessionToken = '', page = 1, resultsPerPage = 20, sortBy = '', sortOrder = '') {
    return this.apiClient.get(
      '/campaigns/list?current_page=' + page
      + '&results_per_page=' + resultsPerPage
      + '&sort_by=' + sortBy
      + '&sort_order='
      + sortOrder,
      customSessionToken
    );
  }

  /**
   * listCampaignsByUrl will return a list of active campaigns
   *
   * This will return an error if the url is not found (404)
   *
   * For more information: https://docs.tonicpow.com/#30a15b69-7912-4e25-ba41-212529fba5ff
   *
   * @param url
   * @param page
   * @param resultsPerPage
   * @param sortBy
   * @param sortOrder
   * @returns {Promise}
   */
  async listCampaignsByUrl(url, page = 1, resultsPerPage = 20, sortBy = '', sortOrder = '') {
    return this.apiClient.get(
      '/campaigns/find?target_url=' + url
      + '&current_page=' + page
      + '&results_per_page=' + resultsPerPage
      + '&sort_by=' + sortBy
      + '&sort_order=' + sortOrder
    );
  }

  /**
   * campaignsFeed will return a feed of active campaigns
   *
   * This will return an error if no campaigns are found (404)
   * Supports: rss, atom, json
   *
   * For more information: https://docs.tonicpow.com/#b3fe69d3-24ba-4c2a-a485-affbb0a738de
   *
   * @param feedType
   * @returns {Promise}
   */
  async campaignsFeed(feedType = 'rss') {
    return this.apiClient.get('/campaigns/feed?feed_type=' + feedType);
  }

  /**
   * campaignStatistics will get basic statistics on all campaigns
   *
   * For more information: https://docs.tonicpow.com/#d3108b14-486e-4e27-8176-57ec63cd49f2
   *
   * @returns {Promise}
   */
  async campaignStatistics() {
    return this.apiClient.get('/campaigns/statistics');
  }

  /**
   * createGoal will make a new goal
   * Use the userSessionToken if making request on behalf of another user
   *
   * For more information: https://docs.tonicpow.com/#29a93e9b-9726-474c-b25e-92586200a803
   *
   * @param goal
   * @param userSessionToken
   * @returns {Promise}
   */
  async createGoal(goal, userSessionToken = '') {
    return this.apiClient.post('/goals', goal, userSessionToken);
  }

  /**
   * getGoal will get an existing goal
   * This will return an error if the goal is not found (404)
   * Use the userSessionToken if making request on behalf of another user
   *
   * For more information: https://docs.tonicpow.com/#48d7bbc8-5d7b-4078-87b7-25f545c3deaf
   *
   * @param goalId
   * @param userSessionToken
   * @returns {Promise}
   */
  async getGoal(goalId, userSessionToken = '') {
    return this.apiClient.get('/goals/details/' + goalId, userSessionToken);
  }

  /**
   * updateGoal will update an existing goal
   * Use the userSessionToken if making request on behalf of another user
   *
   * For more information: https://docs.tonicpow.com/#395f5b7d-6a5d-49c8-b1ae-abf7f90b42a2
   *
   * @param goal
   * @param userSessionToken
   * @returns {Promise}
   */
  async updateGoal(goal, userSessionToken = '') {
    return this.apiClient.put('/goals', goal, userSessionToken);
  }

  /**
   * createConversionByGoalID will fire a conversion for a given goal id, if successful it will make a new Conversion
   *
   * For more information: https://docs.tonicpow.com/#caeffdd5-eaad-4fc8-ac01-8288b50e8e27
   *
   * @param goalId
   * @param tncpwSession
   * @param customDimensions
   * @param optionalPurchaseAmount
   * @param delayInMinutes
   * @returns {Promise}
   */
  async createConversionByGoalID(goalId, tncpwSession, customDimensions = '', optionalPurchaseAmount = 0.00, delayInMinutes = 0) {
    const data = {
      goal_id: goalId,
      tncpw_session: tncpwSession,
      custom_dimensions: customDimensions,
      delay_in_minutes: delayInMinutes,
      amount: optionalPurchaseAmount
    };
    return this.apiClient.post('/conversions', data);
  }

  /**
   * createConversionByGoalName will fire a conversion for a given goal name, if successful it will make a new Conversion
   *
   * For more information: https://docs.tonicpow.com/#d19c9850-3832-45b2-b880-3ef2f3b7dc37
   *
   * @param goalName
   * @param tncpwSession
   * @param customDimensions
   * @param optionalPurchaseAmount
   * @param delayInMinutes
   * @returns {Promise}
   */
  async createConversionByGoalName(goalName, tncpwSession, customDimensions = '', optionalPurchaseAmount = 0.00, delayInMinutes = 0) {
    const data = {
      name: goalName,
      tncpw_session: tncpwSession,
      custom_dimensions: customDimensions,
      delay_in_minutes: delayInMinutes,
      amount: optionalPurchaseAmount
    };
    return this.apiClient.post('/conversions', data);
  }

  /**
   * createConversionByUserID will fire a conversion for a given goal and user id, if successful it will make a new Conversion
   *
   * For more information: https://docs.tonicpow.com/#d724f762-329e-473d-bdc4-aebc19dd9ea8
   *
   * @param goalId
   * @param userId
   * @param customDimensions
   * @param optionalPurchaseAmount
   * @param delayInMinutes
   * @returns {Promise}
   */
  async createConversionByUserID(goalId, userId, customDimensions = '', optionalPurchaseAmount = 0.00, delayInMinutes = 0) {
    const data = {
      goal_id: goalId,
      user_id: userId,
      custom_dimensions: customDimensions,
      delay_in_minutes: delayInMinutes,
      amount: optionalPurchaseAmount
    };
    return this.apiClient.post('/conversions', data);
  }

  /**
   * getConversion will get an existing conversion
   *
   * This will return an error if the goal is not found (404)
   *
   * For more information: https://docs.tonicpow.com/#fce465a1-d8d5-442d-be22-95169170167e
   *
   * @param conversionId
   * @returns {Promise}
   */
  async getConversion(conversionId) {
    return this.apiClient.get('/conversions/details/' + conversionId);
  }

  /**
   * cancelConversion will cancel an existing conversion (if delay was set and > 1 minute remaining)
   *
   * For more information: https://docs.tonicpow.com/#e650b083-bbb4-4ff7-9879-c14b1ab3f753
   *
   * @param conversionId
   * @param reason
   * @returns {Promise}
   */
  async cancelConversion(conversionId, reason) {
    const data = {
      id: conversionId,
      reason: reason
    };
    return this.apiClient.put('/conversions/cancel', data);
  }

  /**
   * createLink will make a new link
   *
   * Use the userSessionToken if making request on behalf of another user
   *
   * For more information: https://docs.tonicpow.com/#154bf9e1-6047-452f-a289-d21f507b0f1
   *
   * @param link
   * @param userSessionToken
   * @returns {Promise}
   */
  async createLink(link, userSessionToken = '') {
    return this.apiClient.post('/links', link, userSessionToken)
  }

  /**
   * getLink will get an existing link
   *
   * This will return an error if the link is not found (404)
   * Use the userSessionToken if making request on behalf of another user
   *
   * For more information: https://docs.tonicpow.com/#c53add03-303e-4f72-8847-2adfdb992eb3
   *
   * @param linkId
   * @param userSessionToken
   * @returns {Promise}
   */
  async getLink(linkId, userSessionToken = '') {
    return this.apiClient.get('/links/details/' + linkId, userSessionToken);
  }

  /**
   * listLinksByUserID will get links associated to the user id
   *
   * This will return an error if the link(s) are not found (404)
   * Use the userSessionToken if making request on behalf of another user
   *
   * For more information: https://docs.tonicpow.com/#23d068f1-4f0e-476a-a802-50b7edccd0b2
   *
   * @param userId
   * @param userSessionToken
   * @param page
   * @param resultsPerPage
   * @returns {Promise}
   */
  async listLinksByUserID(userId, userSessionToken = '', page = 1, resultsPerPage = 20) {
    return this.apiClient.get(
      '/links/user/' + userId
      + '?current_page=' + page
      + '&results_per_page=' + resultsPerPage,
      userSessionToken
    );
  }

  /**
   * checkLink will check for an existing link with a short_code
   *
   * This will return an error if the link is not found (404)
   *
   * For more information: https://docs.tonicpow.com/#cc9780b7-0d84-4a60-a28f-664b2ecb209
   *
   * @param shortCode
   * @returns {Promise}
   */
  async checkLink(shortCode) {
    return this.apiClient.get('/links/check/' + shortCode);
  }

  /**
   * createVisitorSession will make a new session for a visitor (used for goal conversions)
   *
   * For more information: https://docs.tonicpow.com/#29a93e9b-9726-474c-b25e-92586200a803
   *
   * @param visitorSession
   * @returns {Promise}
   */
  async createVisitorSession(visitorSession) {
    return this.apiClient.post('/visitors/sessions', visitorSession);
  }

  /**
   * getVisitorSession will get a visitor session
   *
   * This will return an error if the session is not found (404)
   *
   * For more information: https://docs.tonicpow.com/#cf560448-6dda-42a6-9051-136afabe78e6
   *
   * @param tncpwSession
   * @returns {Promise}
   */
  async getVisitorSession(tncpwSession) {
    return this.apiClient.get('/visitors/sessions/details/' + tncpwSession);
  }

  /**
   * getCurrentRate will get a current rate for the given currency
   *
   * For more information: https://docs.tonicpow.com/#71b8b7fc-317a-4e68-bd2a-5b0da012361c
   *
   * @param currency
   * @param customAmount
   * @returns {Promise}
   */
  async getCurrentRate(currency, customAmount = 0.00) {
    return this.apiClient.get('/rates/' + currency + '?amount=' + customAmount);
  }
}

export default TonicPow;
