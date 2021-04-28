// Load the api package
import TonicPow from '../dist/api';

// Set the API key from our local environment
let apiKey = process.env.TONICPOW_API_KEY || ''

;(async () => {
  try {

    // Custom api session token (previous token) (cloud functions)
    //let customApiToken = 'MTU3NzY2NTYyOXxTTGJtSEphWE15dC1DRUhRSzdrekJlYjVVVjM1bURPeTU4ckhsc2p2TjBnUnV0OGJ5NTNEVlhrdExzdmpPY2ZJRGZqMGVra0FjZE00S2NPTkk3WkgwZUc1MkNqanBiOTJ0Si1aN1BxTHE0Z3dYN0ZNLUtxT2VJYjlyRTZsdGd0UUI4NGdscVNSUEZQSnF4QlNxWi1LaUJzaEJkZGVMUkdhX09pN1NUVDQ5Y3hZeWlTV0haaTJDTmJuemUxVV9WU0N2bmNsUTkxNjNreUNOVmsyYTZlNVB3cGEtM3FFamlScHJNQTItZzA3YmpvdGtIQ19IcExIT3RCUEZyREp4SEIxSWZDRUhOUzhTOGxXQTdqRG83Qzh0LWZfRGwtTGJMM2pnUmtlUXZhVjJLWVBFeFVnb2hNNFlicnBqTkx2UnNkWEVnOVFWRWRjVUkxVjRPMXg3LUNaSXVoMHlySUlSWUZafLaGOta8msbLJKJmszMBw2CFTdE_92uG0UZuwQalP70Y'

    //
    // Example: All Options  (these are all optional, use as needed) (example for Firebase Cloud Functions)
    //
    let allOptions = {
      cookieDomain: 'tonicpow.com',
      cookieName: '__session',
      environment: TonicPow.config.environments.Local,
      httpOnly: true,
      maxAge: 173800,
      sameSite: "None",
      secureCookie: true,
      //token: customApiToken,
    }

    //
    // Example: Load TonicPow api, creates a new session
    //
    const tpow = new TonicPow(apiKey, allOptions)
    let response = await tpow.auth();
    console.log(response)

    //
    // Example: Getting a user's cookie
    //
    console.log(tpow.session.userCookie)

    //
    // Example: Create an advertiser profile
    //
    let advertiser = {
      user_id: user.id,
      name: 'Acme User Advertising',
      homepage_url:'https://tonicpow.com',
      icon_url: 'https://tonicpow.com/images/logos/apple-touch-icon.png',
    }
    advertiser = await tpow.createAdvertiserProfile(advertiser)
    console.log('advertiser created', advertiser)

    //
    // Example: Get an advertiser profile
    //
    advertiser = await tpow.getAdvertiserProfile(advertiser.id)
    console.log('advertiser found: '+advertiser.name)

    //
    // Example: Update an advertiser profile
    //
    advertiser.name = 'Acme Advertising'
    advertiser = await tpow.updateAdvertiserProfile(advertiser)
    console.log('updated name: '+advertiser.name)

    //
    // Example: Create a campaign
    //
    const date = new Date()
    date.setDate(date.getDate() + 30)
    let campaign = {
      advertiser_profile_id: advertiser.id,
      currency: 'usd',
      description: 'Earn BSV for sharing things you like.',
      image_url: 'https://i.imgur.com/TbRFiaR.png',
      pay_per_click_rate: 0.01,
      target_url: 'https://offers.tonicpow.com',
      title: 'TonicPow Offers',
      expires_at: date.toISOString(), // Optional expiration date (time.RFC3339)
    }
    campaign = await tpow.createCampaign(campaign)
    console.log('campaign created', campaign)

    //
    // Example: Get a campaign
    //
    campaign = await tpow.getCampaign(campaign.id)
    console.log('campaign found: '+campaign.title)

    //
    // Example: Update a campaign
    //
    campaign.title = 'TonicPow Offers Campaign'
    campaign = await tpow.updateCampaign(campaign)
    console.log('updated title: '+campaign.title)

    //
    // Example: Create a goal (flat rate)
    //
    let goal = {
      campaign_id: campaign.id,
      description: 'Bring leads and get paid!',
      name: 'new-lead-landing-page',
      payout_rate: 0.50,
      payout_type: 'flat',
      title: 'Landing Page Leads'
    }
    goal = await tpow.createGoal(goal)
    console.log('goal created', goal)

    //
    // Example: Get a goal
    //
    goal = await tpow.getGoal(goal.id)
    console.log('goal found: '+goal.title)

    //
    // Example: Update a goal
    //
    goal.title = 'Landing Page Leads Goal'
    goal = await tpow.updateGoal(goal)
    console.log('updated title: '+goal.title)

    //
    // Example: Create a goal (percent based)
    //
    let goalPercent = {
      campaign_id: campaign.id,
      description: 'Get 10% of all action!',
      name: 'all-action',
      payout_rate: 0.10, // 10% of "purchaseAmount"
      payout_type: 'percent',
      title: '10% Commissions'
    }
    goalPercent = await tpow.createGoal(goalPercent)
    console.log('goal created', goalPercent)

    //
    // Example: Create a link
    //
    let link = {
      campaign_id: campaign.id,
      user_id: user.id,
      // custom_short_code: user.first_name + user.id + campaign.id,
    }
    link = await tpow.createLink(link)
    console.log('link created', link.short_code)

    //
    // Example: Get a link
    //
    link = await tpow.getLink(link.id)
    console.log('link found by id: '+link.id)

    //
    // Example: Check a link
    //
    link = await tpow.checkLink(link.short_code)
    console.log('link found by code: '+link.short_code)

    //
    // Example: Get campaign via short code
    //
    campaign = await tpow.getCampaignByShortCode(link.short_code)
    console.log('campaign found: '+campaign.title)

    //
    // Example: Create a link (custom)
    //
    link = {
      campaign_id: campaign.id,
      user_id: user.id,
      custom_short_code: user.first_name + someRandomNumber,
    }
    link = await tpow.createLink(link)
    console.log('link created', link.short_code)

    //
    // Example: List of Get Links by User
    //
    let linkResults = await tpow.listLinksByUserID(user.id)
    //console.log(linkResults)
    console.log('links found: '+linkResults.results)

    //
    // Example: List of campaigns
    //
    let campaignResults = await tpow.listCampaigns('',1,5,'balance','desc')
    //console.log(campaignResults)
    console.log('campaigns found: '+campaignResults.results)

    //
    // Example: Campaigns Feed
    //
    let campaignFeed = await tpow.campaignsFeed()
    //console.log(campaignFeed)
    console.log('campaigns RSS feed found - length: '+campaignFeed.length)

    //
    // Example: Campaign Statistics
    //
    let campaignStats = await tpow.campaignStatistics()
    //console.log(campaignStats)
    console.log('campaigns stats found - active: '+campaignStats.active)

    //
    // Example: List of campaigns (by advertiser)
    //
    campaignResults = await tpow.listCampaignsByAdvertiserProfile(advertiser.id)
    //console.log(campaigns)
    console.log('campaigns by advertiser found: '+campaignResults.results)

    //
    // Example: Get of campaigns by Url
    //
    campaignResults = await tpow.listCampaignsByUrl(campaignResults.campaigns[0].target_url)
    //console.log(campaigns)
    console.log('campaigns found by url: '+campaignResults.results)

    //
    // Example: Create a Visitor Session
    //
    let visitorSession = {
      link_id: link.id,
      custom_dimensions: "any custom data attributes",
    }
    visitorSession = await tpow.createVisitorSession(visitorSession)
    console.log('session created', visitorSession.tncpw_session)

    //
    // Example: Get a Visitor Session
    //
    visitorSession = await tpow.getVisitorSession(visitorSession.tncpw_session)
    console.log('session found: '+visitorSession.tncpw_session)

    //
    // Example: Create a Visitor Session (Full Anti-Bot Options)
    //
    visitorSession = {
      link_id:           link.id,
      custom_dimensions: "any custom data attributes",
      ip_address:        "123.123.123.123",                                // Visitor's IP Address
      referer:           "https://somewebsite.com/page",                   // If there was a referer
      user_agent:        "Mozilla/5.0 Chrome/51.0.2704.64 Safari/537.36",  // Visitor's user agent
    }
    visitorSession = await tpow.createVisitorSession(visitorSession)
    console.log('session created', visitorSession.tncpw_session)

    //
    // Example: Convert a goal (by session)
    //
    //let sessionId = urlParams.get('tncpw_session') // From your application's front-end
    //let conversion = await TonicPow.createConversionByGoalID(goal.id, sessionId, 'my custom attributes')
    //let conversion = await TonicPow.createConversionByGoalID(goal.name, sessionId, 'my custom attributes')
    //console.log('conversion successful', conversion)

    //
    // Example: Convert a goal (by session - from cookie)
    //
    let userHeaderCookie = '__cfduid=dd6545b872516b240cb6185c97c3ab02; _ga=GA1.2.741780225.1580598550; _gid=GA1.2.510252994.1580598550; tncpw_session='+visitorSession.tncpw_session+'\n'
    let conversion = await tpow.createConversionByGoalID(goal.id, userHeaderCookie, 'my custom attributes')
    console.log('conversion successful', conversion)

    //
    // Example: Convert a goal (by user) (delayed)
    //
    conversion = await tpow.createConversionByUserID(1, 1, 'my custom attributes', 0, 10)
    console.log('conversion successful', conversion)

    //
    // Example: Cancel a Delayed Conversion
    //
    conversion = await tpow.cancelConversion(conversion.id,  'not needed anymore')
    console.log('conversion status', conversion.status)

    //
    // Example: Set a custom header
    //
    TonicPow.session.customHeaders = {
      "x-custom-header": "custom-value",
      "x-another-custom-header": "another-value",
    }

    //
    // Example: Get a current rate
    //
    let rate = await tpow.getCurrentRate('usd',0.00)
    console.log('price in satoshis', rate.price_in_satoshis)

  } catch(e){
    console.error(e)
  }
})();
