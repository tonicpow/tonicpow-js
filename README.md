# TonicPow JS
Official JS implementation for interacting with the [TonicPow API](https://docs.tonicpow.com)

[![last commit](https://img.shields.io/github/last-commit/tonicpow/tonicpow-js.svg?style=flat)](https://github.com/tonicpow/tonicpow-js/commits/master)
[![Release](https://img.shields.io/github/release-pre/tonicpow/tonicpow-js.svg?style=flat)](https://github.com/tonicpow/tonicpow-js/releases)
[![Npm](https://img.shields.io/npm/v/tonicpow-js?style=flat)](https://www.npmjs.com/package/tonicpow-js)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat)](https://github.com/RichardLitt/standard-readme)
[![slack](https://img.shields.io/badge/slack-tonicpow-orange.svg?style=flat)](https://atlantistic.slack.com/app_redirect?channel=tonicpow)

## Table of Contents
- [Getting Started](#getting-started)
- [Installation](#install-via-npm-back-end)
- [Documentation](#documentation)
- [Examples](#examples)
- [Code Standards](#code-standards)
- [Usage](#usage)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Getting Started
This is a JavaScript library that has complete coverage for the [TonicPow API](https://docs.tonicpow.com).
Familiar with Go? Here's an [example in Go](https://github.com/tonicpow/go-tonicpow).

#### Prerequisites
- You have a [TonicPow `api_key`](https://docs.tonicpow.com)
- You have a back-end server (IE: [Node](https://nodejs.org/en/), [Go](https://golang.org/), [Firebase Functions](https://firebase.google.com/docs/functions))

## Install via npm (back-end)
From your project's directory:
```bash
$ npm install tonicpow-js --save
``` 

And load the module in your project:
```javascript 
let TonicPow = require('tonicpow-js');
await TonicPow.init('your-api-key', 'live')
```

View [examples](examples/examples.js) of using the package.    

## Documentation
More overall API documentation can be found on [TonicPow Docs](https://docs.tonicpow.com)

Here as example of session tracking for [goal conversions](front_end.md)

### Features
- [Config & Session](lib/api.js) are completely configurable
- Supports both pure API token context and user token context (run your own site)
- Automatically handles cookies and updating session tokens
- Set tokens using [cookie headers](examples/examples.js), automatically parses cookie values
- Use our [front_end.js](front_end.md) for capturing a visitor session (goal conversions)
- Coverage for the [TonicPow.com API](https://docs.tonicpow.com/)
    - [x] [Authentication](https://docs.tonicpow.com/#632ed94a-3afd-4323-af91-bdf307a399d2)
    - [x] [Users](https://docs.tonicpow.com/#50b3c130-7254-4a05-b312-b14647736e38)
    - [x] [Advertiser Profiles](https://docs.tonicpow.com/#2f9ec542-0f88-4671-b47c-d0ee390af5ea)
    - [x] [Campaigns](https://docs.tonicpow.com/#5aca2fc7-b3c8-445b-aa88-f62a681f8e0c)
    - [x] [Goals](https://docs.tonicpow.com/#316b77ab-4900-4f3d-96a7-e67c00af10ca)
    - [x] [Links](https://docs.tonicpow.com/#ee74c3ce-b4df-4d57-abf2-ccf3a80e4e1e)

## Examples
View [examples](examples/examples.js) of using the package.

## Code Standards
Always use the language's best practices!

## Usage
Back-end package for interacting with the [TonicPow API](https://docs.tonicpow.com)

View [full demo examples](examples/examples.js) of using the package.

## Maintainers
[MrZ](https://github.com/mrz1836) - [Satchmo](https://github.com/rohenaz)
                                                                                                                                                           
Support the development of this project and the [TonicPow](https://tonicpow.com/) team 🙏

## Contributing
Feel free to dive in! [Open an issue](https://github.com/tonicpow/tonicpow-js/issues/new) or submit PRs.

There is also a [Golang implementation](https://github.com/tonicpow/go-tonicpow) for this package.

## License
[![License](https://img.shields.io/badge/license-Open%20BSV-brightgreen.svg?style=flat)](/LICENSE)
