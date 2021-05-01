// Load the api package
import TonicPow from '../dist/api';

// Set the API key from our local environment
let apiKey = process.env.TONICPOW_API_KEY || ''

;(async () => {
  try {

    //
    // Example: All Options  (these are all optional, use as needed) (example for Firebase Cloud Functions)
    //
    const allOptions = {
      environment: TonicPow.config.environments.Local,
    }

    //
    // Example: Load TonicPow API
    //
    const tpow = new TonicPow(apiKey, allOptions)
    const response = await tpow.auth();
    console.log(response)

    //
    // Example: Get an advertiser profile
    //
    const advertiser = await tpow.getAdvertiserProfile(123)
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
    const rate = await tpow.getCurrentRate('usd',1.00)
    console.log('price in satoshis', rate.price_in_satoshis)

    //
    // Example: Trigger a conversion
    
    // Get the visitor session ( passed from frontend via tonicpow.getSessionId() )
    const tncpwSession = "session-id-goes-here";

    const result = await tpow.createConversionByGoalName(
      "high_score", tncpwSession
    );
    console.log("Conversion result", result);

  } catch(e){
    console.error(e)
  }
})();
