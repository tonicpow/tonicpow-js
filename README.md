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
* [Browser Examples](https://github.com/BitIndex/bitindex-sdk/tree/master/lib/examples)
* [Distribution](https://github.com/BitIndex/bitindex-sdk/tree/master/dist)
    - [Latest Bundle](https://github.com/BitIndex/bitindex-sdk/blob/master/dist/bundle.min.js)
    - [Basic Browser Example](https://github.com/BitIndex/bitindex-sdk/blob/master/dist/basic.html)
    - [Live Browser Example](https://media.bitcoinfiles.org/94dc4e05dc1a1cd87d62e3b1d69b7f0dd15dd7555948849b9ce7e81a9f690993)
    - [Typescript Definitions](https://github.com/BitIndex/bitindex-sdk/blob/master/dist)
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
    // ...
    var tonicpow = new TonicPow({ secret_key: 'private guid here -- use only on backend and not on browser' });
    // Return the session of the user if there was one
    // Otherwise it is null
    var result = await tonicpow.session.get();
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
var result = await tonicpow.session.get();

// Callback style
tonicpow.session.get(function(result) {
    console.log('result', result);
});

```

### getSession

*NOTE: Call this from the front-end to obtain the offer session id to pass to your backend*

Get the session identifier if a user converted through a TonicPow offer shortlink
Set to  `null`  if there is no session. (ie: no-op)

```javascript
var result = await tonicpow.getSession('offerPublic-Guid');
/*
    {
        session_id: '513014372338f079f005eedc85359e4d96b8440e75beb8c35c4182e0c19a1a12
    }
*/
```

### triggerConversion

*NOTE: Call this from your backend to trigger a conversion*

Trigger a conversion against a Conversion Goal.

Only the `conversion_goal_id` and `offer_id` are required.

```javascript

var result = await tonicpow.conversions.trigger({
        conversion_goal_id: 'signup-conversion',
        offer_session_id: '...', // This is passed to your backend from your front end from the `tonicpow.getSession` method
    });
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


