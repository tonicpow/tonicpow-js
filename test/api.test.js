import axios from 'axios';
import {
  describe,
  expect,
  beforeEach,
  afterEach,
  it,
} from '@jest/globals';
jest.mock('axios');
const mockAxios = jest.genMockFromModule('axios')
axios.create.mockImplementation(() => mockAxios);

import TonicPow from '../lib/api';
import { pkgVersion } from '../lib/api-client';

import advertiserData from './data/advertiser.json';
import campaignData from './data/campaign.json';

let tonicPow = '';
const fakeApiKey = '678d769317973b3802a89dc1b0ff3e8d';
const options = {
  'headers': {
    'User-Agent': `tonicpow-js ${pkgVersion}`,
    api_key: fakeApiKey
  },
  withCredentials: true
};

describe('basic tests', function () {
  beforeEach(function () {
    tonicPow = new TonicPow(fakeApiKey);
    jest.clearAllMocks();
  });

  /* it('createAdvertiserProfile', async () => {
    // this only mocks the axios object, but not the Tonic Pow processing or wrappers
    mockAxios.post.mockImplementationOnce(() => Promise.resolve({data: advertiserData.return}));

    // test the api call
    const response = await tonicPow.createAdvertiserProfile(advertiserData.create);
    expect(response).toEqual(advertiserData.return);
    expect(mockAxios.post).toHaveBeenCalledWith(
      `https://api.tonicpow.com/v1/advertisers`,
      advertiserData.create,
      options,
    );
  });
  */

  /*
  it('createAdvertiserProfile ERROR', async () => {
    mockAxios.post.mockImplementationOnce(() => Promise.reject({
      response: {
        data: advertiserData.error
      }
    }));

    await expect(tonicPow.createAdvertiserProfile({})).rejects.toEqual(advertiserData.error);
    expect(mockAxios.post).toHaveBeenCalledWith(
      `https://api.tonicpow.com/v1/advertisers`,
      {},
      options,
    );
  });
  */

  it('getAdvertiserProfile', async () => {
    mockAxios.get.mockImplementationOnce(() => Promise.resolve({data: advertiserData.return}));

    // test the api call
    const response = await tonicPow.getAdvertiserProfile(206);
    expect(response).toEqual(advertiserData.return);
    expect(mockAxios.get).toHaveBeenCalledWith(
      `https://api.tonicpow.com/v1/advertisers/details/206`,
      options,
    );
  });

  it('updateAdvertiserProfile', async () => {
    mockAxios.put.mockImplementationOnce(() => Promise.resolve({data: advertiserData.return}));

    // test the api call
    const response = await tonicPow.updateAdvertiserProfile(advertiserData.update);
    expect(response).toEqual(advertiserData.return);
    expect(mockAxios.put).toHaveBeenCalledWith(
      `https://api.tonicpow.com/v1/advertisers`,
      advertiserData.update,
      options,
    );
  });

  // todo: add other tests here

  it('createCampaign', async () => {
    mockAxios.post.mockImplementationOnce(() => Promise.resolve({data: campaignData.return}));

    // test the api call
    const response = await tonicPow.createCampaign(campaignData.create);
    expect(response).toEqual(campaignData.return);
    expect(mockAxios.post).toHaveBeenCalledWith(
      `https://api.tonicpow.com/v1/campaigns`,
      campaignData.create,
      options,
    );
  });

  it('getCampaign', async () => {
    mockAxios.get.mockImplementationOnce(() => Promise.resolve({data: campaignData.return}));

    // test the api call
    const response = await tonicPow.getCampaign(243);
    expect(response).toEqual(campaignData.return);
    expect(mockAxios.get).toHaveBeenCalledWith(
      `https://api.tonicpow.com/v1/campaigns/details/243`,
      options,
    );
  });
});
