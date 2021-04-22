<img src=".github/IMAGES/tonicpow-js.png" height="250" alt="TonicPow JS">

> **TonicPow JS** is the official JavaScript implementation for interacting with the [TonicPow API](https://docs.tonicpow.com)

[![last commit](https://img.shields.io/github/last-commit/tonicpow/tonicpow-js.svg?style=flat)](https://github.com/tonicpow/tonicpow-js/commits/master)
[![Release](https://img.shields.io/github/release-pre/tonicpow/tonicpow-js.svg?style=flat)](https://github.com/tonicpow/tonicpow-js/releases)
[![Npm](https://img.shields.io/npm/v/tonicpow-js?style=flat)](https://www.npmjs.com/package/tonicpow-js)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat)](https://github.com/RichardLitt/standard-readme)
[![slack](https://img.shields.io/badge/slack-tonicpow-orange.svg?style=flat)](https://atlantistic.slack.com/app_redirect?channel=tonicpow)

<br/>

## Table of Contents
- [Getting Started](#getting-started)
- [Installation](#install-via-npm)
- [Documentation](#documentation)
- [Examples](#examples)
- [Code Standards](#code-standards)
- [Usage](#usage)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

<br/>

## Getting Started
This is a JavaScript library that has complete coverage for the [TonicPow API](https://docs.tonicpow.com).
Familiar with Go? Here's an [example in Go](https://github.com/tonicpow/go-tonicpow).

#### Prerequisites
- You have a [TonicPow _api_key_](https://docs.tonicpow.com)
- You have a back-end server (IE: [Node](https://nodejs.org/en/), [Go](https://golang.org/), [Firebase Functions](https://firebase.google.com/docs/functions))

## Install via npm
From your project's directory:
```shell script
npm install tonicpow-js
``` 

And load the module in your project:
```javascript 
import TonicPow from 'tonicpow-js'

const api = new TonicPow('your-api-key')
await api.auth();
``` 

View [examples](examples/examples.js) of using this package.
 
#### Features
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
    - [x] [Conversions](https://docs.tonicpow.com/#75c837d5-3336-4d87-a686-d80c6f8938b9)
    - [x] [Links](https://docs.tonicpow.com/#ee74c3ce-b4df-4d57-abf2-ccf3a80e4e1e)
    - [x] [Visitors](https://docs.tonicpow.com/#d0d9055a-0c92-4f55-a370-762d44acf801)
    - [x] [Rates](https://docs.tonicpow.com/#fb00736e-61b9-4ec9-acaf-e3f9bb046c89)

<br/>

## Documentation
This is a JavaScript library for the [TonicPow API](https://docs.tonicpow.com). All methods and models are described in [this documentation](https://docs.tonicpow.com).

### Visitor Sessions (front-end)
Here is the [documentation for visitor sessions](front_end.md) for converting goals.

<details>
<summary><strong><code>Library Deployment</code></strong></summary>
<br/>

[goreleaser](https://github.com/goreleaser/goreleaser) for easy binary or library deployment to Github and can be installed via: `brew install goreleaser`.

The [.goreleaser.yml](.goreleaser.yml) file is used to configure [goreleaser](https://github.com/goreleaser/goreleaser).

Use `make release-snap` to create a snapshot version of the release, and finally `make release` to ship to production.
</details>

<details>
<summary><strong><code>Makefile Commands</code></strong></summary>
<br/>

View all `makefile` commands
```shell script
make help
```

List of all current commands:
```text
audit                Checks for vulnerabilities in dependencies
clean                Remove previous builds and any test cache data
help                 Show this help message
install              Installs the dependencies for the packge
lint                 Runs the standard-js lint tool
outdated             Checks for outdated packages via npm
publish              Will publish the version to npm
release              Full production release (creates release in Github)
release-snap         Test the full release (build binaries)
release-test         Full production test release (everything except deploy)
replace-version      Replaces the version in HTML/JS (pre-deploy)
tag                  Generate a new tag and push (tag version=0.0.0)
tag-remove           Remove a tag if found (tag-remove version=0.0.0)
tag-update           Update an existing tag to current commit (tag-update version=0.0.0)
test                 Will run unit tests
```
</details>

<br/>

## Examples
View [examples](examples/examples.js) of using the package.

<br/>

## Code Standards
Always use the language's best practices!

<br/>

## Usage
Back-end package for interacting with the [TonicPow API](https://docs.tonicpow.com)

View [full demo examples](examples/examples.js) of using the package.

There is also a [Go implementation](https://github.com/tonicpow/go-tonicpow) for this package.

<br/>

## Maintainers
| [<img src="https://github.com/mrz1836.png" height="50" alt="MrZ" />](https://github.com/mrz1836) | [<img src="https://github.com/rohenaz.png" height="50" alt="Satchmo" />](https://github.com/rohenaz) | [<img src="https://github.com/attilaaf.png" height="50" alt="Atilla" />](https://github.com/attilaaf) |
|:---:|:---:|:---:|
| [MrZ](https://github.com/mrz1836) | [Satchmo](https://github.com/rohenaz) | [Atilla](https://github.com/attilaaf) |
                                                                                                                                                           
Support the development of this project and the [TonicPow](https://tonicpow.com/) team 🙏

<br/>

## Contributing
Feel free to dive in! [Open an issue](https://github.com/tonicpow/tonicpow-js/issues/new) or submit PRs.

<br/>

## License
[![License](https://img.shields.io/badge/license-Open%20BSV-brightgreen.svg?style=flat)](/LICENSE)
