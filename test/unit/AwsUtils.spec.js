
'use strict';
const chai = require('chai');
const should = chai.should(); // eslint-disable-line 
const expect = chai.expect;

const AwsUtils = require('../../src/aws/AwsUtils');

const TEST_NAME = 'Test AWS Utils';

describe(TEST_NAME, () => {
	it('should NOT normalize a non array or object tags input',() => {
		expect(()=>{
			AwsUtils.normalizeTags(null);
		}).to.throw(/A tags object was provided of an unknown type/);
		expect(()=>{
			AwsUtils.normalizeTags(undefined);
		}).to.throw(/A tags object was provided of an unknown type/);
	});
	it('should NOT normalize a tags object',() => {
		expect(()=>{
			AwsUtils.normalizeTags([{hi:false}]);
		}).to.throw(/A malformed tags object was provided/);
	});
	it('should normalize a tags object that is already normalized',() => {
		let input = [{Key:'tag',Value:'tagValue'},{Key:'tag2',Value:'tagValue2'}];
		let out = AwsUtils.normalizeTags(input);
		out.should.eql(input);
	});
	it('should normalize a tags object that is already normalized',() => {
		let normalized = [{Key:'tag',Value:'tagValue'},{Key:'tag2',Value:'tagValue2'}];
		let tagsObj = {
			tag: 'tagValue',
			tag2: 'tagValue2'
		};
		let out = AwsUtils.normalizeTags(tagsObj);
		normalized.should.eql(out);
	});
});