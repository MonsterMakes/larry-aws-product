
'use strict';
const chai = require('chai');
const should = chai.should(); // eslint-disable-line 
const expect = chai.expect;

const ParameterStore = require('../../src/aws/services/ParameterStore');
const pStore  = new ParameterStore();

const TEST_NAME = 'Test ParameterStore';

describe(TEST_NAME, () => {
	it('should convert an empty params definition',()=>{
		let val = pStore._getAwsParamsFromDefinition();
		val.should.be.empty;
		val = pStore._getAwsParamsFromDefinition(null);
		val.should.be.empty;
		val = pStore._getAwsParamsFromDefinition({});
		val.should.be.empty;
	});
	it('should not convert non string params',()=>{
		expect(()=>{
			pStore._getAwsParamsFromDefinition({
				badParam: 345,
			});
		}).to.throw();
	});
	it('should convert a string only params definition',()=>{
		let val = pStore._getAwsParamsFromDefinition({
			param1: 'dude',
			'nested/param2': '345'
		});
		val.should.not.be.empty;
		val.param1.Type.should.eql('String');
		val.param1.Name.should.eql('param1');
		val.param1.Value.should.eql('dude');
		val.param1.Overwrite.should.eql(true);
		val['nested/param2'].Name.should.eql('nested/param2');
	});
	it('should add tags for all params',()=>{
		let val = pStore._getAwsParamsFromDefinition(
			{
				param1: 'dude',
				'param2': '345'
			},
			{
				Tags: {
					Environment: 'special'
				}
			});
		val.should.not.be.empty;
		val.param1.Tags[0].should.eql({Key:'Environment',Value:'special'});
		val.param2.Tags[0].should.eql({Key:'Environment',Value:'special'});
	});
});