# TonicPow JS
Official JS implementation for interacting with the [TonicPow API](https://docs.tonicpow.com)

## Table of Contents
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Documentation](#documentation)
- [Examples](#examples)
- [Code Standards](#code-standards)
- [Usage](#usage)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Getting Started
This will cover using the TonicPow JS to [authenticate](https://docs.tonicpow.com/#632ed94a-3afd-4323-af91-bdf307a399d2) and [trigger a conversion](https://docs.tonicpow.com/#caeffdd5-eaad-4fc8-ac01-8288b50e8e27). 
For this example we assume you have a front-end and back-end application.
If you are familiar with Go, here's an [example in Go](https://github.com/tonicpow/go-tonicpow)

#### Prerequisites
- You have a front-end application to capture the `tncpw_session` query param from the visitor from TonicPow
- You have a back-end server to trigger the conversion (IE: [node](https://nodejs.org/en/))
- You already created a campaign from [TonicPow](https://offers.tonicpow.com/offers/new)
- You have the `api_key` for the campaign or advertiser

#### Setup your project (front-end)
All requests to web applications have the parameter `?tncpw_session=user-session-id` set.
You can use your own implementation for storing the `tncpw_session` and sending it to your back-end.

**Capture The Session**
```javascript
let urlParams = new URLSearchParams(window.location.search)
let session = urlParams.get('tncpw_session') 
```

_(Optional)_ **Save via Cookie Example**
```javascript
setCookie('tncpw_session', session, 60)
``` 

_(Optional)_ **Save via Local Storage Example**
```javascript
localStorage.setItem('tncpw_session', session);
```


#### Install via npm (back-end)
```bash
$ npm install tonicpow-js --save
``` 

And load the module in your code:
```javascript 
let TonicPow = require('tonicpow-js').instance();
TonicPow.load('your-api-key')
```

## Installation (local dev)
```bash
$ npm install
$ npm test
```

## Documentation
More documentation can be found on [TonicPow Docs](https://docs.tonicpow.com)

## Examples
- todo: @mrz

## Code Standards
- Always use the language's best practices!

## Usage
- Back-end package for interacting with the [TonicPow API](https://docs.tonicpow.com)

## Maintainers
[MrZ](https://github.com/mrz1836?affiliate=1mrz) - [Satchmo](https://github.com/rohenaz?affiliate=1satchmo)
                                                                                                                                                           
Support the development of this project and the [TonicPow](https://tonicpow.com/) team 🙏

## Contributing
Feel free to dive in! [Open an issue](https://github.com/tonicpow/tonicpow-js/issues/new) or submit PRs.

There is also a [Golang implementation](https://github.com/tonicpow/go-tonicpow) for this package.

## License
[![License](https://img.shields.io/badge/license-Open%20BSV-brightgreen.svg?style=flat)](/LICENSE)
