'use strict';

const awsConfigSingleton = require('../../index').AwsConfigSingleton;

module.exports= awsConfigSingleton.getAwsSdk();