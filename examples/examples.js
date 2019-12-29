// Load the api package
let TonicPow = require('../lib/api')

// Set the API key from our local environment
let apiKey = process.env.TONICPOW_API_KEY || ''

;(async () => {
  try {
    //
    // Example: Load TonicPow api, creates a new session
    //
    let response = await TonicPow.load(apiKey)
    console.log(response)

    //
    // Example: Prolong a session (optional)
    //
    response = await TonicPow.prolong()
    console.log(response)

    //
    // Example: Login (as a user)
    //
    response = await TonicPow.loginUser("testing88577@tonicpow.com","ExamplePassForNow0!")
    console.log(response, "user session token: ", TonicPow.userSessionToken)

    //
    // Example: Current User (get user details)
    //
    response = await TonicPow.currentUser(TonicPow.userSessionToken)
    console.log(response, "user session token: ", TonicPow.userSessionToken)


  } catch(e){
    console.error(e)
  }
})();
