import { isNode } from 'browser-or-node';
import Config from './config';
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
    this.config = new Config(apiKey, options);
    this.apiClient = createApiClient(this);
  }

  /**
   * getAdvertiserProfile will get an existing advertiser profile
   *
   * This will return an error if the profile is not found (404)
   *
   * For more information: https://docs.tonicpow.com/#b3a62d35-7778-4314-9321-01f5266c3b51
   *
   * @param profileId
   * @returns {Promise}
   */
  async getAdvertiserProfile(profileId) {
    return this.apiClient.get('/advertisers/details/' + profileId);
  }

  /**
   * updateAdvertiserProfile will update an existing profile
   *
   * For more information: https://docs.tonicpow.com/#0cebd1ff-b1ce-4111-aff6-9d586f632a84
   *
   * @param profile
   * @returns {Promise}
   */
  async updateAdvertiserProfile(profile) {
    return this.apiClient.put('/advertisers', profile);
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
   * listAppsByAdvertiserProfile will return a list of apps
   *
   * This will return an error if the campaign is not found (404)
   *
   * For more information: https://docs.tonicpow.com/#9c9fa8dc-3017-402e-8059-136b0eb85c2e
   *
   * @param profileId
   * @param page
   * @param resultsPerPage
   * @param sortBy
   * @param sortOrder
   * @returns {Promise}
   */
  async listAppsByAdvertiserProfile(
    profileId,
    page = 1,
    resultsPerPage = 20,
    sortBy = '',
    sortOrder = '',
  ) {
    return this.apiClient.get(
      '/advertisers/apps/' + profileId
      + '?current_page=' + page
      + '&results_per_page=' + resultsPerPage
      + '&sort_by=' + sortBy
      + '&sort_order=' + sortOrder,
    );
  }

  /**
   * createCampaign will make a new campaign
   *
   * For more information: https://docs.tonicpow.com/#b67e92bf-a481-44f6-a31d-26e6e0c521b1
   *
   * @param campaign
   * @returns {Promise}
   */
  async createCampaign(campaign) {
    return this.apiClient.post('/campaigns', campaign);
  }

  /**
   * getCampaign will get an existing campaign
   *
   * This will return an error if the campaign is not found (404)
   *
   * For more information: https://docs.tonicpow.com/#b827446b-be34-4678-b347-33c4f63dbf9e
   *
   * @param campaignId
   * @returns {Promise}
   */
  async getCampaign(campaignId) {
    return this.apiClient.get('/campaigns/details/?id=' + campaignId);
  }

  /**
   * getCampaignBySlug will get an existing campaign by it's url slug
   *
   * This will return an error if the campaign is not found (404)
   *
   * For more information: https://docs.tonicpow.com/#b827446b-be34-4678-b347-33c4f63dbf9e
   *
   * @param campaignSlug
   * @returns {Promise}
   */
  async getCampaignBySlug(campaignSlug) {
    return this.apiClient.get('/campaigns/details/?slug=' + campaignSlug);
  }

  /**
   * refreshBalance will update the campaigns balance from the chain
   *
   * This will return an error if the campaign is not found (404)
   *
   * For more information: https://docs.tonicpow.com/#b6c60c63-8ac5-4c74-a4a2-cf3e858e5a8d
   *
   * @param campaignId
   * @param lastBalance
   * @returns {Promise}
   */
  async refreshBalance(campaignId, lastBalance = 0) {
    return this.apiClient.get('/campaigns/balance/?id=' + campaignId
      + '?last_balance=' + lastBalance);
  }

  /**
   * updateCampaign will update an existing campaign
   *
   * For more information: https://docs.tonicpow.com/#665eefd6-da42-4ca9-853c-fd8ca1bf66b2
   *
   * @param campaign
   * @returns {Promise}
   */
  async updateCampaign(campaign) {
    return this.apiClient.put('/campaigns', campaign);
  }

  /**
   * listCampaigns will return a list of active campaigns
   *
   * This will return an error if the campaign is not found (404)
   *
   * For more information: https://docs.tonicpow.com/#c1b17be6-cb10-48b3-a519-4686961ff41c
   *
   * @param page
   * @param resultsPerPage
   * @param sortBy
   * @param sortOrder
   * @returns {Promise}
   */
  async listCampaigns(
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
  async listCampaignsByUrl(
    url,
    page = 1,
    resultsPerPage = 20,
    sortBy = '',
    sortOrder = '',
  ) {
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
   * createGoal will make a new goal
   *
   * For more information: https://docs.tonicpow.com/#29a93e9b-9726-474c-b25e-92586200a803
   *
   * @param goal
   * @returns {Promise}
   */
  async createGoal(goal) {
    return this.apiClient.post('/goals', goal);
  }

  /**
   * getGoal will get an existing goal
   * This will return an error if the goal is not found (404)
   *
   * For more information: https://docs.tonicpow.com/#48d7bbc8-5d7b-4078-87b7-25f545c3deaf
   *
   * @param goalId
   * @returns {Promise}
   */
  async getGoal(goalId) {
    return this.apiClient.get('/goals/details/' + goalId);
  }

  /**
   * updateGoal will update an existing goal
   *
   * For more information: https://docs.tonicpow.com/#395f5b7d-6a5d-49c8-b1ae-abf7f90b42a2
   *
   * @param goal
   * @returns {Promise}
   */
  async updateGoal(goal) {
    return this.apiClient.put('/goals', goal);
  }

  /**
   * deleteGoal will delete an existing goal
   *
   * For more information: https://docs.tonicpow.com/#38605b65-72c9-4fc8-87a7-bc644bc89a96
   *
   * @param goal
   * @returns {Promise}
   */
  async deleteGoal(goal) {
    return this.apiClient.delete('/goals?id=' + goal.id);
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
