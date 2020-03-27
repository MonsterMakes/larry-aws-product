'use strict';
const chai = require('chai');
const should = chai.should();//eslint-disable-line
const expect = chai.expect;//eslint-disable-line

const TEST_NAME = 'Test Cloud Formation deployment Service';
const CloudFormation = require('../../../src/aws/services/CloudFormation');
const AwsConfig = require('../../../src/aws/AwsConfigSingleton');

/*
const Executioner = require('larry-executioner').TheExecutioner;
let executioner = new Executioner();

const buildACreateNamedVpcCommands = (name)=>{
	return [
		{
			id: 'createVpc',
			classInstance: vpcClient,
			method: 'create',
			args: [
				'192.168.0.0/28'
			],
			postHook: (commandExecutionDetails)=>{
				commandExecutionDetails.response.Vpc.VpcId.should.exist;
			}
		},
		{
			id: 'nameVpc',
			classInstance: vpcClient,
			method: 'name',
			args: [
				'$createVpc.response.Vpc.VpcId',
				name
			]
		}
	];
};
const createVpcCommands = [
	{
		id: 'createVpc',
		classInstance: vpcClient,
		method: 'create',
		args: [
			'192.168.0.0/28'
		],
		postHook: (commandExecutionDetails)=>{
			commandExecutionDetails.response.Vpc.VpcId.should.exist;
		}
	}
];
const buildATagAVpcCommand = (tagInfo,id='tagVpc')=>{
	return {
		id: id,
		classInstance: vpcClient,
		method: 'tag',
		args: [
			'$createVpc.response.Vpc.VpcId',
			tagInfo
		]
	};
};
const getVpcCommand = {
	id: 'getVpc',
	description: '',
	classInstance: vpcClient,
	method: 'get',
	args: [
		'$createVpc.response.Vpc.VpcId'
	]
};
const tearDownVpcCommands = [
	{
		id: 'deleteVpc',
		classInstance: vpcClient,
		method: 'delete',
		args: [
			'$createVpc.response.Vpc.VpcId'
		],
		postHook: (commandExecutionDetails)=>{
			commandExecutionDetails.response.should.eql({});
		}
	}
]; */

const cloudFormation = new CloudFormation();

describe(TEST_NAME, () => {
	before(() => {
		console.log('-------------------------------------------------------');//eslint-disable-line
		console.log('TESTS RUNNING USING:');//eslint-disable-line
		console.log(AwsConfig.printConnectionDetails());//eslint-disable-line
		console.log('-------------------------------------------------------');//eslint-disable-line
	});
	it('should create a stack and tear it down after completion', ()=>{
		
		// return executioner.execute({
		// 	commands: [
		// 		...createVpcCommands,
		// 		...tearDownVpcCommands
		// 	]
		// });
		return Promise.resolve()
			.then(()=>{
				return cloudFormation.deployTemplateFile(__dirname+'/mocks/simple-vpc.yml','DELETE-ME-CloudFormationSpec-create',[
					{
						ParameterKey: 'EnvironmentName',
						ParameterValue: 'delete-me-cloudformationspec',
					}
				]);
			})
			.then((resp)=>{
				expect(resp).to.exist;
				expect(resp.createResponse).to.exist;
				expect(resp.lastUpdatedStatus).to.exist;
				expect(resp.createResponse.StackId).to.exist;
				resp.lastUpdatedStatus.StackName.should.eql('DELETE-ME-CloudFormationSpec-create');
				resp.lastUpdatedStatus.StackStatus.should.eql('CREATE_COMPLETE');

				return resp.createResponse;
			})
			.then((createResponse)=>{
				let stackId = createResponse.StackId;
				return cloudFormation.teardownStack(stackId);
			})
			.then((resp)=>{
				expect(resp).to.exist;
				expect(resp.deleteResponse).to.exist;
				expect(resp.lastUpdatedStatus).to.exist;
			});
	});
	// after(async () => {
	// 	let allVpcs = await vpcClient.listAll();
	// 	let vpcsToBeDeleted = allVpcs.Vpcs.filter((vpc)=>{
	// 		return vpc.Tags.find((tag)=>{
	// 			if(tag.Key === 'Name' && tag.Value === 'env-test-delete-me'){
	// 				return true;
	// 			}
	// 		});
	// 	});
	// 	let vpcIds = vpcsToBeDeleted.map((vpc)=>{
	// 		return vpc.VpcId;
	// 	});
	// 	if(vpcIds.length){
	// 		console.error(`**** WARNING I FOUND TEST VPCs that will be deleted ****`);
	// 	}
	// 	for(const [index,vpcId] of vpcIds.entries()){
	// 		try{
	// 			await vpcClient.delete(vpcId);
	// 		}
	// 		catch(e){
	// 			console.error(`Failed to delete all the VPCs, deleted ${index} of ${vpcIds.length}.`);
	// 			throw e;
	// 		}
	// 	}
	// });
});