
'use strict';
const chai = require('chai');
const should = chai.should(); // eslint-disable-line 
const expect = chai.expect;

const AwsBase = require('../../src/aws/AwsBase');

const TEST_NAME = 'Test AWS Base';

describe(TEST_NAME, () => {
	it('should NOT normalize a non array or object tags input',() => {
		let awsBase = new AwsBase();
		expect(()=>{
			awsBase.normalizeTags(null);
		}).to.throw(/A tags object was provided of an unknown type/);
		expect(()=>{
			awsBase.normalizeTags(undefined);
		}).to.throw(/A tags object was provided of an unknown type/);
	});
	it('should NOT normalize a tags object',() => {
		let awsBase = new AwsBase();
		expect(()=>{
			awsBase.normalizeTags([{hi:false}]);
		}).to.throw(/A malformed tags object was provided/);
	});
	it('should normalize a tags object that is already normalized',() => {
		let awsBase = new AwsBase();
		let input = [{Key:'tag',Value:'tagValue'},{Key:'tag2',Value:'tagValue2'}];
		let out = awsBase.normalizeTags(input);
		out.should.eql(input);
	});
	it('should normalize a tags object that is already normalized',() => {
		let awsBase = new AwsBase();
		let normalized = [{Key:'tag',Value:'tagValue'},{Key:'tag2',Value:'tagValue2'}];
		let tagsObj = {
			tag: 'tagValue',
			tag2: 'tagValue2'
		};
		let out = awsBase.normalizeTags(tagsObj);
		normalized.should.eql(out);
	});
});