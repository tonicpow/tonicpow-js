// Load the api wrapper
let TonicPow = require('../lib/api')

// Set the API key from our env
let apiKey = process.env.TONICPOW_API_KEY || ''

// Load the TonicPow api
TonicPow.load(apiKey).then(x => {

  console.log(x)

  // Test prolong
  TonicPow.prolong().then(x => {
    console.log(x)
  }).catch(e=>{
    console.error("prolong error:",e)
  });

}).catch(e=>{
  console.error("load error:",e)
});
