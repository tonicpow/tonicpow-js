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

    //let testCookieHeader = `Cookie: session_token=MTU3NzUwMTU0NnxsU2RjVHlXeW1CU0YtMlhUc29XY0NqUjFVZHBnS3l6Njk0eld3bTkxeENsbVVrNzgxRi1LWDFoZUkwQWVqMlhfSEVhQmRXYzlKNU1aMkRJc2FRRGt3Zk1pTU9lSEI4ei1faHlTSmc5YVJkdTRBSFp4OTFFRWdrVmNFbnFaZjFuSGJndEtEN1g2NHZnTWg0Y1pHSmlRR1FWSzlnX3Bpb1A4U3F4WkJBX25DblN2eDlyNDhCNUJWVGM5X1BKZkVWbWZIeFJLN3FxZGhwVERTb1JGSFVVUl94a3h5MGFmaERla0tLenRlRFYzcjlNQ3JNR25ZWURUdGRJeHFKRXBrWEhlQjJfVlpHQlV1dGdWWnpjaURZalQ0Z0Mza0pyZkFsSWRhTWRFdld3bmpYMEJaQlZkblRjQ0twN1lLMXlka1d5X0RxeGQyWjZmTHVvUzU2eS0zcXViVHNRPXxkipD5K3SbLHTzjSqHMbbMkyepq7j6Ht2cqBkHsnJnHw==; name=value; name=value`
    //TonicPow.session.userToken = testCookieHeader

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
