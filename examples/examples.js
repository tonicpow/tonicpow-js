// Load the api package
import TonicPow from '../dist/api';

// Set the API key from our local environment
let apiKey = process.env.TONICPOW_API_KEY || ''

;(async () => {
  try {

    //
    // Example: All Options  (these are all optional, use as needed) (example for Firebase Cloud Functions)
    //
    let allOptions = {
      environment: TonicPow.config.environments.Local,
    }

    //
    // Example: Load TonicPow API
    //
    const tpow = new TonicPow(apiKey, allOptions)
    let response = await tpow.auth();
    console.log(response)

    //
    // Example: Get an advertiser profile
    //
    let advertiser = await tpow.getAdvertiserProfile(123)
    console.log('advertiser found: '+advertiser.name)

    //
    // Example: Update an advertiser profile
    //
    advertiser.name = 'Acme Advertising'
    advertiser = await tpow.updateAdvertiserProfile(advertiser)
    console.log('updated name: '+advertiser.name)

    //
    // Example: Get a current rate
    //
    let rate = await tpow.getCurrentRate('usd',1.00)
    console.log('price in satoshis', rate.price_in_satoshis)

  } catch(e){
    console.error(e)
  }
})();
