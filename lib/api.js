import { isNode } from 'browser-or-node';
import Config from './config';
import Session from './session';
import { createApiClient } from './api-client';

/**
 * TonicPow JavaScript API class
 */
class TonicPow {
  constructor(apiKey, options = {}) {
    if (!isNode) {
      throw new Error('This library only works in node');
    }

    // Set any defaults
    this.session = new Session(options);
    this.config = new Config(apiKey, options);
    this.apiClient = createApiClient(this);
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
    return this.apiClient.get('/advertisers/details/' + profileId, userSessionToken);
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
  async listCampaignsByAdvertiserProfile(
    profileId,
    page = 1,
    resultsPerPage = 20,
    sortBy = '',
    sortOrder = '',
  ) {
    return this.apiClient.get(
      '/advertisers/campaigns/' + profileId
      + '?current_page=' + page
      + '&results_per_page=' + resultsPerPage
      + '&sort_by=' + sortBy
      + '&sort_order=' + sortOrder,
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
    return this.apiClient.get('/campaigns/details/' + campaignId, userSessionToken);
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
    return this.apiClient.get('/campaigns/link/' + shortCode, userSessionToken);
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
  async listCampaigns(
    customSessionToken = '',
    page = 1,
    resultsPerPage = 20,
    sortBy = '',
    sortOrder = '',
  ) {
    return this.apiClient.get(
      '/campaigns/list?current_page=' + page
      + '&results_per_page=' + resultsPerPage
      + '&sort_by=' + sortBy
      + '&sort_order='
      + sortOrder,
      customSessionToken,
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
      + '&sort_order=' + sortOrder,
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
  async createConversionByGoalID(
    goalId,
    tncpwSession,
    customDimensions = '',
    optionalPurchaseAmount = 0.00,
    delayInMinutes = 0,
  ) {
    const data = {
      goal_id: goalId,
      tncpw_session: tncpwSession,
      custom_dimensions: customDimensions,
      delay_in_minutes: delayInMinutes,
      amount: optionalPurchaseAmount,
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
  async createConversionByGoalName(
    goalName,
    tncpwSession,
    customDimensions = '',
    optionalPurchaseAmount = 0.00,
    delayInMinutes = 0,
  ) {
    const data = {
      name: goalName,
      tncpw_session: tncpwSession,
      custom_dimensions: customDimensions,
      delay_in_minutes: delayInMinutes,
      amount: optionalPurchaseAmount,
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
  async createConversionByUserID(
    goalId,
    userId,
    customDimensions = '',
    optionalPurchaseAmount = 0.00,
    delayInMinutes = 0,
  ) {
    const data = {
      goal_id: goalId,
      user_id: userId,
      custom_dimensions: customDimensions,
      delay_in_minutes: delayInMinutes,
      amount: optionalPurchaseAmount,
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
      reason,
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
    return this.apiClient.post('/links', link, userSessionToken);
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
      userSessionToken,
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
