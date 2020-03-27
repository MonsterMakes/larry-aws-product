'use strict';
const chai = require('chai');
const should = chai.should(); // eslint-disable-line 
const expect = chai.expect; // eslint-disable-line 

const TEST_NAME = 'Environment spec';
const CLOUD_FORMATION_DIR = __dirname + '/mocks';

const Environment = require('../../../src/lib/environment/Environment');
const InquirerPromptAssertions = require('../../util/InquirerPromptAssertions');

describe(TEST_NAME, () => {
	it.only('should loadEnvironmentParameters from a simple template', () => {
		let env = new Environment(`environment-spec`,'us-west-2',CLOUD_FORMATION_DIR,{cloudFormationTemplatePattern: 'simple-vpc.yml'});
		return env.loadEnvironmentParameters()
			.then((envVals) => {
				envVals.should.exist;
			});
	});
});