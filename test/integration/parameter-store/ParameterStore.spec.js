'use strict';
const _ = require('lodash');
const chai = require('chai');
const should = chai.should();//eslint-disable-line
const expect = chai.expect;//eslint-disable-line

const TEST_NAME = 'Test Parameter Store Service';
const ParameterStore = require('../../../src/aws/services/ParameterStore');


const pStore = new ParameterStore({region:'us-west-2'});

describe(TEST_NAME, () => {
	before(() => {
		console.log('-------------------------------------------------------');//eslint-disable-line
		console.log('TESTS RUNNING USING:');//eslint-disable-line
		console.log(JSON.stringify(pStore.getLoadedConfig()));//eslint-disable-line
		console.log('-------------------------------------------------------');//eslint-disable-line
	});
	it('should create a parameters and delete them after completion', ()=>{		
		const parameterDefs = {
			'/Integration-Test/param1': 'value-dude',
			'param1': 'val1',
			'param2': 'val2'
		};
		return Promise.resolve()
			.then(()=>{
				return pStore.create(parameterDefs,{Environment:'Integration-Test'});
			})
			.then(()=>{
				return pStore.deleteMultiple(Object.keys(parameterDefs));
			})
			.then((deleteResponse)=>{
				deleteResponse.should.exist;
				deleteResponse.DeletedParameters.should.eql(Object.keys(parameterDefs));
			});
	});
	it.only('should create a whole bunch of parameters get them and then delete them', ()=>{		
		const parameterDefs = {
			'/env/foo/testee0': 'val',
			'/env/foo/testee1': 'val',
			'/env/foo/testee2': 'val',
			'/env/foo/testee3': 'val',
			'/env/foo/testee4': 'val',
			'/env/foo/testee5': 'val',
			'/env/foo/testee6': 'val',
			'/env/foo/testee7': 'val',
			'/env/foo/testee8': 'val',
			'/env/foo/testee9': 'val',
			'/env/foo/testee10': 'val',
			'/env/foo/testee11': 'val',
			'/env/foo/testee12': 'val',
			'/env/foo/testee13': 'val',
			'/env/foo/testee14': 'val',
			'/env/foo/testee15': 'val',
			'/env/foo/testee16': 'val',
			'/env/foo/testee17': 'val',
			'/env/foo/testee18': 'val',
			'/env/foo/testee19': 'val',
			'/env/foo/testee20': 'val',
			'/env/foo/testee21': 'val',
		};
		return Promise.resolve()
			.then(()=>{
				return pStore.create(parameterDefs,{Environment:'foo'});
			})
			.then(()=>{
				return pStore.retrieveAllByPath('/env/foo');
			})
			.then((getResponse)=>{
				getResponse.should.exist;
				_.map(getResponse,'Name').sort().should.eql(Object.keys(parameterDefs).sort());
			})
			// .then(()=>{
			// 	return pStore.retrieve('/env/foo/testee');
			// })
			// .then((getResponse)=>{
			// 	getResponse.should.exist;
			// })
			// .then(()=>{
			// 	return pStore.retrieveMultiple(Object.keys(parameterDefs));
			// })
			// .then((getResponse)=>{
			// 	getResponse.should.exist;
			// })
			.then(()=>{
				return pStore.deleteMultiple(Object.keys(parameterDefs));
			})
			.then((deleteResponse)=>{
				deleteResponse.should.exist;
				deleteResponse.should.eql(Object.keys(parameterDefs));
			});
	});
});