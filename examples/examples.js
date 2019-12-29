// Load the api package
let TonicPow = require('../lib/api')

// Set the API key from our local environment
let apiKey = process.env.TONICPOW_API_KEY || ''

;(async () => {
  try {
    //
    // Example: Load TonicPow api, creates a new session
    //
    let response = await TonicPow.init(apiKey,'local')
    console.log(response)

    //
    // Example: Prolong a session (optional)
    //
    response = await TonicPow.prolongSession()
    console.log(response)

    //
    // Example: Login (as a user)
    //
    response = await TonicPow.loginUser("testing88577@tonicpow.com","ExamplePassForNow0!")
    console.log(response, "user session token: ", TonicPow.session.userToken)

    //
    // Example: Current User (get user details)
    //
    response = await TonicPow.currentUser(TonicPow.session.userToken)
    console.log(response)
    console.log("user session token: ", TonicPow.session.userToken)


  } catch(e){
    console.error(e)
  }
})();
