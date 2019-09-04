'use strict';
var expect = require('chai').expect;
var index = require('../dist/index.js');

const options = {
    // api_url: 'http://localhost:3000',
    api_url: 'https://api.bitindex.network'
};

describe('#api.getSession', () => {
    it('todo', async () => {
        var result = await index.instance(options).api.getSession('inv');
        expect(result).to.eql({
            code: 500,
            message: "Request failed with status code 500"
        });
    });
})
