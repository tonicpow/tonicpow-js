# TonicPow Javascript SDK
https://www.tonicpow.com

TonicPow Javascript SDK

---
## Overview

Interact with the TonicPow API.

---
## Table of Contents
* [Installation and Usage](#installation-and-usage)
* [Prerequisites](#Prerequisites)
* [What's Included in this SDK](#whats-Included-in-this-SDK)
* [Endpoints](#endpoints)
* [Promises vs. Callbacks](#promises-vs-callback)
* [Browser Examples](https://github.com/TonicPow/tonicpow-js/tree/master/lib/examples)
* [Distribution](https://github.com/TonicPow/tonicpow-js/tree/master/dist)
    - [Latest Bundle](https://github.com/TonicPow/tonicpow-js/blob/master/dist/bundle.min.js)
    - [Basic Browser Example](https://github.com/TonicPow/tonicpow-js/blob/master/dist/basic.html)
    - [Typescript Definitions](https://github.com/TonicPow/tonicpow-js/blob/master/dist)
* [Operations](#operations)
    - [getSession](#sessions)
    - [triggerConversion](#conversions)

## Installation and Usage

**Installation**
```sh
npm install tonicpow-js --save
```

**Include**
```javascript
// Node
var tonicpow = require('tonicpow-js').instance();
```

```html
<!-- Browser -->
<script src="dist/bundle.min.js"></script>
<script language="javascript">
    // Use the advertiser_public_key on your backend to fire `getSession`
    var tonicpow = new TonicPow({ advertiser_public_key: 'public guid here use on front-end' });
    // Use the advertiser_secret_key on your backend to fire `triggerConversion`
    var tonicpow = new TonicPow({ advertiser_secret_key: 'private guid here -- use only on backend and not on browser' });
    // Return the session of the user if there was one
    // Otherwise it is null
    var result = await tonicpow.getSession();
    console.log('TonicPow Session', result);
</script>
```

## Prerequisites

- Create an offer at https://offers.tonicpow.com
- Use the 'Private GUID' of an offer as the API key

## What's Included in this SDK

### TonicPow API Interface

Documentation: https://www.tonicpow.com

### Promises vs. Callback

Both `await` and callback styles are supported for all methods.

Example:

```javascript

// Await style with promises
var result = await tonicpow.getSession();

// Callback style
tonicpow.getSession(function(result) {
    console.log('result', result);
});

```

### getSession

*NOTE: Call this from the front-end to obtain the session id to pass to your backend*

Get the session identifier if a user converted through a TonicPow offer shortlink
Set to  `null`  if there is no session. (ie: no-op)

```javascript

var tonicpow = new TonicPow({ advertiser_public_key: 'public guid here use on front-end' });
var result = await tonicpow.getSession();
/*
=> 513014372338f079f005eedc85359e4d96b8440e75beb8c35c4182e0c19a1a12
*/
```

### triggerConversion

*NOTE: Call this from your backend to trigger a conversion*

Trigger a conversion against a Conversion Goal.

```javascript

var tonicpow = new TonicPow({ advertiser_secret_key: 'private guid here -- use only on backend and not on browser' });
var result = await tonicpow.triggerConversion('session id from above', 'signup-conversion');
/*
    {
        conversion_id: 'a13014372338f079f005eedc85359e4096b8440e75beb2c35c4182e0c19a1a87
    }
*/
```

## Build and Test

```
npm run build
npm test
```

-----------


 ## Any questions or ideas?

 We would love to hear from you!
 https://www.TonicPow.com
 https://twitter.com/TonicPow


