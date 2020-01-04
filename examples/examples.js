// Load the api package
let TonicPow = require('../lib/api')

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
      environment: TonicPow.config.environments.Local,
      cookieDomain: 'tonicpow.com',
      cookieName: '__session',
      maxAge: 173800,
      httpOnly: true,
      secureCookie: true,
      //token: customApiToken,
    }

    //
    // Example: Load TonicPow api, creates a new session
    //
    //let response = await TonicPow.init(apiKey)
    let response = await TonicPow.init(apiKey, allOptions)
    console.log(response)

    //
    // Example: Load TonicPow api with existing session token (cloud functions)
    //
    //let response = await TonicPow.init(apiKey, {environment: TonicPow.config.environments.Local, domain: 'tonicpow.com', token: customApiToken})
    //console.log(response)
    //console.log(TonicPow.session.apiToken)

    //
    // Example: Prolong a session (optional)
    //
    response = await TonicPow.prolongSession()
    console.log(response)

    //
    // Example: End a session (optional)
    //
    //response = await TonicPow.endSession()
    //console.log(response)

    //
    // Example: Create a new user
    //
    let someRandomNumber = Math.floor(100000 + Math.random() * 900000)
    let someEmailAddress = 'test+' + someRandomNumber + '@tonicpow.com'
    let someTemporaryPassword = 'ExamplePassForNow' + Math.floor(100000 + Math.random() * 900000)
    let user = await TonicPow.createUser({email:someEmailAddress, password: someTemporaryPassword})
    console.log("user created: " + someEmailAddress)

    //
    // Example: Login (as a user) (creates a user session/token)
    //
    response = await TonicPow.loginUser(someEmailAddress, someTemporaryPassword)
    console.log(response)
    console.log('user session token: ', TonicPow.session.userCookie)

    //
    // Example: Setting a user token from a cookie header (used for Cloud functions)
    //
    let cookieHeader = `Cookie: `+allOptions.cookieName+`=`+TonicPow.session.userToken+`; another_cookie=value; third_cookie=value`
    //let cookieVal = allOptions.cookieName+`=`+TonicPow.session.userToken

    //
    // Example: Current User (get user details)
    //
    user = await TonicPow.currentUser(cookieHeader)
    console.log(user)

    //
    // Example: Getting a user's cookie
    //
    console.log(TonicPow.session.userCookie)

    //
    // Example: Update a user
    //
    user.first_name = 'Jack'
    user = await TonicPow.updateUser(user)
    console.log(user.first_name)

    //
    // Example: Update & get the users balance
    //
    /*user = await TonicPow.getUserBalance(user.id)
    if (user.balance){
      console.log('balance found')
    } else {
      console.log('balance is empty')
    }*/

    //
    // Example: Get a user
    //
    user = await TonicPow.getUser(0,user.email)
    console.log('user found: '+user.email)

    //
    // Example: Activate a user
    //
    //await TonicPow.activateUser(user.id)

    //
    // Example: Create an advertiser profile
    //
    let advertiser = {
      user_id: user.id,
      name: 'Acme User Advertising',
      homepage_url:'https://tonicpow.com',
      icon_url: 'https://tonicpow.com/images/logos/apple-touch-icon.png',
    }
    advertiser = await TonicPow.createAdvertiserProfile(advertiser)
    console.log('advertiser created', advertiser)

    //
    // Example: Get an advertiser profile
    //
    advertiser = await TonicPow.getAdvertiserProfile(advertiser.id)
    console.log('advertiser found: '+advertiser.name)

    //
    // Example: Update an advertiser profile
    //
    advertiser.name = 'Acme Advertising'
    advertiser = await TonicPow.updateAdvertiserProfile(advertiser)
    console.log('updated name: '+advertiser.name)

    //
    // Example: Create a campaign
    //
    let campaign = {
      advertiser_profile_id: advertiser.id,
      currency: 'usd',
      description: 'Earn BSV for sharing things you like.',
      image_url: 'https://i.imgur.com/TbRFiaR.png',
      pay_per_click_rate: 0.01,
      target_url: 'https://offers.tonicpow.com',
      title: 'TonicPow Offers',
    }
    campaign = await TonicPow.createCampaign(campaign)
    console.log('campaign created', campaign)

    //
    // Example: Get a campaign
    //
    campaign = await TonicPow.getCampaign(campaign.id)
    console.log('campaign found: '+campaign.title)

    //
    // Example: Update a campaign
    //
    campaign.title = 'TonicPow Offers Campaign'
    campaign = await TonicPow.updateCampaign(campaign)
    console.log('updated title: '+campaign.title)

    //
    // Example: Create a goal
    //
    let goal = {
      campaign_id: campaign.id,
      description: 'Bring leads and get paid!',
      name: 'new-lead-landing-page',
      payout_rate: 0.50,
      payout_type: 'flat',
      title: 'Landing Page Leads'
    }
    goal = await TonicPow.createGoal(goal)
    console.log('goal created', goal)

    //
    // Example: Get a goal
    //
    goal = await TonicPow.getGoal(goal.id)
    console.log('goal found: '+goal.title)

    //
    // Example: Update a goal
    //
    goal.title = 'Landing Page Leads Goal'
    goal = await TonicPow.updateGoal(goal)
    console.log('updated title: '+goal.title)

    //
    // Example: Convert a goal (by session)
    //
    //let sessionId = urlParams.get('tncpw_session') // From your application's front-end
    //let conversion = await TonicPow.convertGoalWithVisitorSession(goal.id, sessionId, 'my custom attributes')
    //console.log('conversion successful', conversion)

    //
    // Example: Convert a goal (by user)
    //
    //let sessionId = urlParams.get('tncpw_session') // From your application's front-end
    //let conversion = await TonicPow.convertGoalWithUserId(goal.id, user.id, 'my custom attributes')
    //console.log('conversion successful', conversion)

    //
    // Example: Create a link
    //
    let link = {
      campaign_id: campaign.id,
      user_id: user.id,
      // custom_short_code: user.first_name + user.id + campaign.id,
    }
    link = await TonicPow.createLink(link)
    console.log('link created', link.short_code)

    //
    // Example: Get a link
    //
    link = await TonicPow.getLink(link.id)
    console.log('link found by id: '+link.id)

    //
    // Example: Check a link
    //
    link = await TonicPow.checkLink(link.short_code)
    console.log('link found by code: '+link.short_code)

    //
    // Example: List of campaigns
    //
    let campaigns = await TonicPow.listCampaigns()
    //console.log(campaigns)
    console.log('campaigns found: '+campaigns.length)

    //
    // Example: Create a Visitor Session
    //
    let visitorSession = {
      link_id: link.id,
      additional_data: "any custom data attributes",
    }
    visitorSession = await TonicPow.createVisitorSession(visitorSession)
    console.log('session created', visitorSession.tncpw_session)

    //
    // Example: Get a Visitor Session
    //
    visitorSession = await TonicPow.getVisitorSession(visitorSession.tncpw_session)
    console.log('session found: '+visitorSession.tncpw_session)

  } catch(e){
    console.error(e)
  }
})();
